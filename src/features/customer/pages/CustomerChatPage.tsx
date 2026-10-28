import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, CheckCheck, MessageCircle, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChatThreadView } from '@/components/shared/ChatThreadView'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import { getUnreadCount, isMessageSeenByPeer } from '@/lib/chat'
import { useChatStore } from '@/stores/chat-store'
import { useVendorStore } from '@/stores/vendor-store'
import { cn, formatDateTime } from '@/lib/utils'

export default function CustomerChatPage() {
  const navigate = useNavigate()
  const { threadId } = useParams<{ threadId?: string }>()
  const [searchParams] = useSearchParams()
  const vendorParam = searchParams.get('vendor')

  const vendors = useVendorStore((s) => s.vendors)
  const allThreads = useChatStore((s) => s.threads)
  const allMessages = useChatStore((s) => s.messages)
  const getOrCreateThread = useChatStore((s) => s.getOrCreateThread)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const markThreadRead = useChatStore((s) => s.markThreadRead)

  const threads = useMemo(
    () => [...allThreads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [allThreads],
  )

  useEffect(() => {
    if (!vendorParam || threadId) return
    const vendor = vendors.find((v) => v.id === vendorParam)
    if (!vendor) return
    const thread = getOrCreateThread(vendor.id)
    navigate(`/customer/chat/${thread.id}`, { replace: true })
  }, [vendorParam, threadId, vendors, getOrCreateThread, navigate])

  useEffect(() => {
    if (!threadId) return
    if (!useChatStore.getState().threads.some((t) => t.id === threadId)) return
    markThreadRead(threadId, 'customer')
  }, [threadId, allMessages.length, markThreadRead])

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
  const activeVendor = activeThread
    ? vendors.find((v) => v.id === activeThread.vendorId)
    : undefined

  if (threadId && activeThread && activeVendor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/customer/chat">
            <ArrowLeft className="h-4 w-4" />
            All chats
          </Link>
        </Button>
        <div className="mb-4 flex items-center gap-3">
          <ProductImage
            src={activeVendor.imageUrl}
            alt={activeVendor.name}
            className="h-12 w-12 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold text-primary-deep">
              {activeVendor.name}
            </h1>
            <p className="text-xs text-muted">{activeVendor.location}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
            <Link to={`/customer/stores/${activeVendor.id}`}>
              <Store className="h-4 w-4" />
              Store
            </Link>
          </Button>
        </div>
        <ChatThreadView
          thread={activeThread}
          messages={messages}
          selfSender="customer"
          selfLabel="You"
          peerLabel={activeVendor.name}
          onSend={(body) => {
            const result = sendMessage({
              threadId: activeThread.id,
              sender: 'customer',
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

  if (threadId && !activeThread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={MessageCircle}
          title="Conversation not found"
          description="This chat may have been cleared with demo data reset."
          actionLabel="Back to chats"
          onAction={() => navigate('/customer/chat')}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-primary-deep">Chat</h1>
      <p className="mt-1 text-sm text-muted">
        Message vendors about stock, cut-off, or pickup.
      </p>

      {threads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Open a vendor store and tap Message vendor to start chatting."
            actionLabel="Browse vendors"
            onAction={() => navigate('/customer')}
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          {threads.map((thread) => {
            const vendor = vendors.find((v) => v.id === thread.vendorId)
            if (!vendor) return null
            const unread = getUnreadCount(thread, allMessages, 'customer')
            const lastMsg = [...allMessages]
              .filter((m) => m.threadId === thread.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
            const lastIsMine = lastMsg?.sender === 'customer'
            const lastSeen =
              lastMsg && lastIsMine
                ? isMessageSeenByPeer(lastMsg, thread, 'customer')
                : false

            return (
              <li key={thread.id}>
                <Link
                  to={`/customer/chat/${thread.id}`}
                  className="flex gap-3 p-4 transition hover:bg-primary-50/50"
                >
                  <div className="relative shrink-0">
                    <ProductImage
                      src={vendor.imageUrl}
                      alt={vendor.name}
                      className="h-12 w-12 rounded-lg"
                    />
                    {unread > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-primary-deep',
                          unread > 0 ? 'font-extrabold' : 'font-semibold',
                        )}
                      >
                        {vendor.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted">
                        {formatDateTime(thread.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
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
