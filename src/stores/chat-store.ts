import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedChatMessages, seedChatThreads } from '@/data/chats'
import {
  createChatThread,
  isApiConfigured,
  markChatThreadRead,
  sendChatMessage,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { ChatMessage, ChatSender, ChatThread } from '@/types'

const DEMO_CUSTOMER_LABEL = 'Demo Customer'

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
      threads: isApiConfigured()
        ? []
        : structuredClone(seedChatThreads).map(withReadDefaults),
      messages: isApiConfigured() ? [] : structuredClone(seedChatMessages),
      getOrCreateThread: async (vendorId, customerLabel = DEMO_CUSTOMER_LABEL) => {
        const label = customerLabel.trim() || DEMO_CUSTOMER_LABEL
        const existing = get().threads.find(
          (t) => t.vendorId === vendorId && t.customerLabel === label,
        )
        if (existing) return withReadDefaults(existing)

        if (isApiConfigured()) {
          const thread = await createChatThread(vendorId)
          set({ threads: [thread, ...get().threads.map(withReadDefaults)] })
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
      sendMessage: async ({ threadId, sender, body }) => {
        const trimmed = body.trim()
        if (!trimmed) {
          return { ok: false, message: 'Message cannot be empty.' }
        }
        const thread = get().threads.find((t) => t.id === threadId)
        if (!thread) {
          return { ok: false, message: 'Conversation not found.' }
        }

        if (isApiConfigured()) {
          try {
            const message = await sendChatMessage(threadId, trimmed)
            const now = message.createdAt
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
      resetChats: () =>
        set({
          threads: isApiConfigured()
            ? []
            : structuredClone(seedChatThreads).map(withReadDefaults),
          messages: isApiConfigured() ? [] : structuredClone(seedChatMessages),
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-chats-v2`,
      merge: (persisted, current) => {
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
