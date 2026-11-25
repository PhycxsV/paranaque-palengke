import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import {
  createChatThread,
  isApiConfigured,
  markChatThreadRead,
  sendChatImageMessage,
  sendChatMessage,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { ChatMessage, ChatSender, ChatThread } from '@/types'

const DEFAULT_CUSTOMER_LABEL = 'Customer'

function withReadDefaults(thread: ChatThread): ChatThread {
  return {
    ...thread,
    customerLastReadAt: thread.customerLastReadAt ?? '',
    vendorLastReadAt: thread.vendorLastReadAt ?? '',
  }
}

interface ChatState {
  threads: ChatThread[]
  messages: ChatMessage[]
  getOrCreateThread: (
    vendorId: string,
    customerLabel?: string,
  ) => Promise<ChatThread>
  sendMessage: (input: {
    threadId: string
    sender: ChatSender
    body: string
    imageFile?: File | null
  }) => Promise<{ ok: true; message: ChatMessage } | { ok: false; message: string }>
  markThreadRead: (threadId: string, reader: ChatSender) => Promise<void>
  getThreadById: (threadId: string) => ChatThread | undefined
  getThreadsByVendor: (vendorId: string) => ChatThread[]
  getThreadsForCustomer: () => ChatThread[]
  getMessagesByThread: (threadId: string) => ChatMessage[]
  resetChats: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      messages: [],
      getOrCreateThread: async (vendorId, customerLabel = DEFAULT_CUSTOMER_LABEL) => {
        const label = customerLabel.trim() || DEFAULT_CUSTOMER_LABEL
        // API threads are scoped to the signed-in customer, so match by store only.
        const existing = get().threads.find((t) =>
          isApiConfigured()
            ? t.vendorId === vendorId
            : t.vendorId === vendorId && t.customerLabel === label,
        )
        if (existing) return withReadDefaults(existing)

        if (isApiConfigured()) {
          const thread = await createChatThread(vendorId)
          const others = get().threads.filter((t) => t.id !== thread.id)
          set({ threads: [thread, ...others.map(withReadDefaults)] })
          return thread
        }

        const now = new Date().toISOString()
        const thread: ChatThread = {
          id: generateId('CHAT'),
          vendorId,
          customerLabel: label,
          createdAt: now,
          updatedAt: now,
          lastMessagePreview: '',
          customerLastReadAt: now,
          vendorLastReadAt: '',
        }
        set({ threads: [thread, ...get().threads.map(withReadDefaults)] })
        return thread
      },
      sendMessage: async ({ threadId, sender, body, imageFile }) => {
        const trimmed = body.trim()
        if (!trimmed && !imageFile) {
          return { ok: false, message: 'Message cannot be empty.' }
        }
        const thread = get().threads.find((t) => t.id === threadId)
        if (!thread) {
          return { ok: false, message: 'Conversation not found.' }
        }

        if (isApiConfigured()) {
          try {
            const message = imageFile
              ? await sendChatImageMessage(threadId, imageFile, trimmed)
              : await sendChatMessage(threadId, trimmed)
            const preview = message.body || (imageFile ? '[Photo]' : '')
            const now = message.createdAt
            set({
              messages: [...get().messages, message],
              threads: get().threads.map((t) => {
                if (t.id !== threadId) return withReadDefaults(t)
                return {
                  ...withReadDefaults(t),
                  updatedAt: now,
                  lastMessagePreview:
                    preview.length > 80 ? `${preview.slice(0, 77)}...` : preview,
                  ...(sender === 'customer'
                    ? { customerLastReadAt: now }
                    : { vendorLastReadAt: now }),
                }
              }),
            })
            return { ok: true, message }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to send message.',
            }
          }
        }

        if (imageFile) {
          return {
            ok: false,
            message: 'Photo chat needs the live API connection.',
          }
        }

        const now = new Date().toISOString()
        const message: ChatMessage = {
          id: generateId('MSG'),
          threadId,
          sender,
          body: trimmed,
          createdAt: now,
        }

        set({
          messages: [...get().messages, message],
          threads: get().threads.map((t) => {
            if (t.id !== threadId) return withReadDefaults(t)
            return {
              ...withReadDefaults(t),
              updatedAt: now,
              lastMessagePreview:
                trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed,
              ...(sender === 'customer'
                ? { customerLastReadAt: now }
                : { vendorLastReadAt: now }),
            }
          }),
        })
        return { ok: true, message }
      },
      markThreadRead: async (threadId, reader) => {
        if (isApiConfigured()) {
          try {
            const thread = await markChatThreadRead(threadId, reader)
            set({
              threads: get().threads.map((t) =>
                t.id === threadId ? withReadDefaults(thread) : withReadDefaults(t),
              ),
            })
            return
          } catch {
          }
        }
        const now = new Date().toISOString()
        set({
          threads: get().threads.map((t) => {
            if (t.id !== threadId) return withReadDefaults(t)
            return {
              ...withReadDefaults(t),
              ...(reader === 'customer'
                ? { customerLastReadAt: now }
                : { vendorLastReadAt: now }),
            }
          }),
        })
      },
      getThreadById: (threadId) => {
        const thread = get().threads.find((t) => t.id === threadId)
        return thread ? withReadDefaults(thread) : undefined
      },
      getThreadsByVendor: (vendorId) =>
        get()
          .threads.filter((t) => t.vendorId === vendorId)
          .map(withReadDefaults)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      getThreadsForCustomer: () =>
        get()
          .threads.map(withReadDefaults)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      getMessagesByThread: (threadId) =>
        get()
          .messages.filter((m) => m.threadId === threadId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      resetChats: () => set({ threads: [], messages: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-chats-v3`,
      partialize: (state) =>
        isApiConfigured()
          ? {}
          : { threads: state.threads, messages: state.messages },
      merge: (persisted, current) => {
        if (isApiConfigured()) return current
        const p = persisted as Partial<ChatState> | undefined
        return {
          ...current,
          ...p,
          threads: (p?.threads ?? current.threads).map(withReadDefaults),
          messages: p?.messages ?? current.messages,
        }
      },
    },
  ),
)
