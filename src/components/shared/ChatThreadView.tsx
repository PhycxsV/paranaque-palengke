import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CheckCheck, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { isMessageSeenByPeer } from '@/lib/chat'
import { cn, formatDateTime } from '@/lib/utils'
import type { ChatMessage, ChatSender, ChatThread } from '@/types'

interface ChatThreadViewProps {
  thread: ChatThread
  messages: ChatMessage[]
  selfSender: ChatSender
  peerLabel: string
  selfLabel: string
  onSend: (body: string) => { ok: boolean; message?: string }
  disabled?: boolean
  disabledHint?: string
}

export function ChatThreadView({
  thread,
  messages,
  selfSender,
  peerLabel,
  selfLabel,
  onSend,
  disabled,
  disabledHint,
}: ChatThreadViewProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled) return
    const result = onSend(draft)
    if (!result.ok) {
      setError(result.message ?? 'Unable to send.')
      return
    }
    setDraft('')
    setError(null)
  }

  return (
    <div className="flex h-[min(70vh,560px)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            No messages yet. Say hello to start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender === selfSender
            const seen = mine && isMessageSeenByPeer(msg, thread, selfSender)
            return (
              <div
                key={msg.id}
                className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  {mine ? selfLabel : peerLabel}
                </span>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    mine
                      ? 'rounded-br-md bg-primary text-white'
                      : 'rounded-bl-md bg-primary-50 text-primary-deep',
                  )}
                >
                  {msg.body}
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] text-muted',
                    mine && 'flex-row-reverse',
                  )}
                >
                  {formatDateTime(msg.createdAt)}
                  {mine ? (
                    <span
                      className="inline-flex items-center"
                      title={seen ? 'Seen' : 'Sent'}
                      aria-label={seen ? 'Seen' : 'Sent'}
                    >
                      {seen ? (
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </span>
                  ) : null}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-warm-white/60 p-3"
      >
        {disabled ? (
          <p className="mb-2 text-xs text-muted">
            {disabledHint ?? 'Messaging is unavailable.'}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            disabled={disabled}
            className="min-h-[2.75rem] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={disabled || !draft.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
      </form>
    </div>
  )
}
