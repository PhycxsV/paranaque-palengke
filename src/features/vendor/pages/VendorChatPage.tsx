import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CheckCheck, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChatThreadView } from '@/components/shared/ChatThreadView'
import { EmptyState } from '@/components/shared/EmptyState'
import { getUnreadCount, isMessageSeenByPeer } from '@/lib/chat'
import { useChatStore } from '@/stores/chat-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import { cn, formatDateTime } from '@/lib/utils'

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
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/vendor/chat">
            <ArrowLeft className="h-4 w-4" />
            All chats
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">
            {activeThread.customerLabel}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Chat with customer · {vendor.name}
          </p>
        </div>
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
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">Chat</h1>
        <p className="mt-1 text-sm text-muted">
          Customer messages for {vendor.name}
        </p>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No customer chats yet"
          description="When a customer messages your store, the thread will show up here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
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
                  className="flex gap-3 p-4 transition hover:bg-primary-50/50"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-primary-deep',
                          unread > 0 ? 'font-extrabold' : 'font-semibold',
                        )}
                      >
                        {thread.customerLabel}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {unread > 0 ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-muted">
                          {formatDateTime(thread.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
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
