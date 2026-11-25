import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CheckCheck, ImagePlus, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { isMessageSeenByPeer } from '@/lib/chat'
import { cn, formatDateTime } from '@/lib/utils'
import type { ChatMessage, ChatSender, ChatThread } from '@/types'

export type ChatSendInput = {
  body: string
  imageFile?: File | null
}

interface ChatThreadViewProps {
  thread: ChatThread
  messages: ChatMessage[]
  selfSender: ChatSender
  peerLabel: string
  selfLabel: string
  onSend: (
    input: ChatSendInput,
  ) =>
    | { ok: boolean; message?: string }
    | Promise<{ ok: boolean; message?: string }>
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const clearImage = () => {
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSend = Boolean(draft.trim() || imageFile)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (disabled || sending || !canSend) return
    setSending(true)
    const result = await onSend({ body: draft, imageFile })
    setSending(false)
    if (!result.ok) {
      setError(result.message ?? 'Unable to send.')
      return
    }
    setDraft('')
    clearImage()
    setError(null)
  }

  return (
    <div className="flex h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-primary-50/60 to-warm-white px-4 py-5">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            No messages yet. Say hello to start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender === selfSender
            const seen = mine && isMessageSeenByPeer(msg, thread, selfSender)
            const showBody = msg.body && msg.body !== '[Photo]'
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
                    'max-w-[85%] overflow-hidden rounded-2xl text-sm leading-relaxed',
                    mine
                      ? 'rounded-br-md bg-primary text-white shadow-sm shadow-primary/20'
                      : 'rounded-bl-md border border-border bg-white text-ink shadow-sm',
                  )}
                >
                  {msg.imageUrl ? (
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={msg.imageUrl}
                        alt={showBody ? msg.body : 'Chat photo'}
                        className="max-h-64 w-full object-cover"
                      />
                    </a>
                  ) : null}
                  {showBody ? (
                    <p className={cn('px-3.5 py-2', msg.imageUrl && 'pt-2')}>{msg.body}</p>
                  ) : !msg.imageUrl ? (
                    <p className="px-3.5 py-2">{msg.body}</p>
                  ) : null}
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
        className="border-t border-border bg-surface p-3"
      >
        {disabled ? (
          <p className="mb-2 text-xs text-muted">
            {disabledHint ?? 'Messaging is unavailable.'}
          </p>
        ) : null}
        {imagePreview ? (
          <div className="mb-2 flex items-start gap-2">
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img
                src={imagePreview}
                alt="Selected"
                className="h-20 w-20 object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={disabled || sending}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (!file) {
                clearImage()
                return
              }
              if (file.size > 5 * 1024 * 1024) {
                setError('Photo must be 5 MB or smaller.')
                clearImage()
                return
              }
              setError(null)
              setImageFile(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || sending}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach photo"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={imageFile ? 'Add a caption (optional)...' : 'Type a message...'}
            rows={2}
            disabled={disabled || sending}
            className="min-h-[2.75rem] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={disabled || sending || !canSend}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
      </form>
    </div>
  )
}
