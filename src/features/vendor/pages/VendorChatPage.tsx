import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, CheckCheck, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ChatThreadView } from '@/components/shared/ChatThreadView'
import { EmptyState } from '@/components/shared/EmptyState'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { getUnreadCount, isMessageSeenByPeer } from '@/lib/chat'
import { useChatStore } from '@/stores/chat-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import { cn, formatDateTime } from '@/lib/utils'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function VendorChatPage() {
  const navigate = useNavigate()
  const { threadId } = useParams<{ threadId?: string }>()
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )

  const allThreads = useChatStore((s) => s.threads)
  const allMessages = useChatStore((s) => s.messages)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const markThreadRead = useChatStore((s) => s.markThreadRead)

  const threads = useMemo(
    () =>
      allThreads
        .filter((t) => t.vendorId === activeVendorId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [allThreads, activeVendorId],
  )
  const activeThread = threadId
    ? allThreads.find((t) => t.id === threadId)
    : undefined
  const messages = useMemo(
    () =>
      threadId
        ? allMessages
            .filter((m) => m.threadId === threadId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        : [],
    [allMessages, threadId],
  )

  useEffect(() => {
    if (!threadId) return
    const thread = useChatStore.getState().threads.find((t) => t.id === threadId)
    if (!thread || thread.vendorId !== activeVendorId) return
    markThreadRead(threadId, 'vendor')
  }, [threadId, activeVendorId, allMessages.length, markThreadRead])

  if (!vendor) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Vendor not found"
        description="Select an active vendor from the sidebar."
      />
    )
  }

  if (threadId && activeThread && activeThread.vendorId === activeVendorId) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PortalHeader
          eyebrow="Customer chat"
          title={activeThread.customerLabel}
          description={`Conversation with a customer of ${vendor.name}`}
          back={{ to: '/vendor/chat', label: 'All chats' }}
        />
        <ChatThreadView
          thread={activeThread}
          messages={messages}
          selfSender="vendor"
          selfLabel={vendor.name}
          peerLabel={activeThread.customerLabel}
          onSend={(body) => {
            const result = sendMessage({
              threadId: activeThread.id,
              sender: 'vendor',
              body,
            })
            if (!result.ok) {
              toast.error(result.message)
              return { ok: false, message: result.message }
            }
            return { ok: true }
          }}
        />
      </div>
    )
  }

  if (threadId) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Conversation not found"
        description="This chat belongs to another store or was reset."
        actionLabel="Back to chats"
        onAction={() => navigate('/vendor/chat')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Vendor portal"
        title="Chat"
        description={`Customer messages for ${vendor.name}`}
      />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No customer chats yet"
          description="When a customer messages your store, the thread will show up here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          {threads.map((thread) => {
            const unread = getUnreadCount(thread, allMessages, 'vendor')
            const lastMsg = [...allMessages]
              .filter((m) => m.threadId === thread.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
            const lastIsMine = lastMsg?.sender === 'vendor'
            const lastSeen =
              lastMsg && lastIsMine
                ? isMessageSeenByPeer(lastMsg, thread, 'vendor')
                : false

            return (
              <li key={thread.id}>
                <Link
                  to={`/vendor/chat/${thread.id}`}
                  className={cn(
                    'flex items-center gap-4 p-4 transition hover:bg-primary-50/60 sm:p-5',
                    unread > 0 && 'bg-lime-50/60',
                  )}
                >
                  <div className="relative shrink-0">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-bay font-display text-base font-bold text-white">
                      {initials(thread.customerLabel) || '?'}
                    </span>
                    {unread > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-deep ring-2 ring-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-primary-deep',
                          unread > 0 ? 'font-extrabold' : 'font-bold',
                        )}
                      >
                        {thread.customerLabel}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {formatDateTime(thread.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {lastIsMine ? (
                        lastSeen ? (
                          <CheckCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <Check className="h-3.5 w-3.5 shrink-0 text-muted" />
                        )
                      ) : null}
                      <p
                        className={cn(
                          'truncate text-sm',
                          unread > 0
                            ? 'font-bold text-primary-deep'
                            : 'text-muted',
                        )}
                      >
                        {thread.lastMessagePreview || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
