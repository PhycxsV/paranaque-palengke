import type { ChatMessage, ChatSender, ChatThread } from '@/types'

export function getLastReadAt(thread: ChatThread, reader: ChatSender): string {
  return reader === 'customer'
    ? (thread.customerLastReadAt ?? '')
    : (thread.vendorLastReadAt ?? '')
}

/** Unread messages for this reader (messages from the other party after last read). */
export function getUnreadCount(
  thread: ChatThread,
  messages: ChatMessage[],
  reader: ChatSender,
): number {
  const lastRead = getLastReadAt(thread, reader)
  return messages.filter(
    (m) =>
      m.threadId === thread.id &&
      m.sender !== reader &&
      m.createdAt > lastRead,
  ).length
}

export function getTotalUnread(
  threads: ChatThread[],
  messages: ChatMessage[],
  reader: ChatSender,
  vendorId?: string,
): number {
  const scoped =
    vendorId === undefined
      ? threads
      : threads.filter((t) => t.vendorId === vendorId)
  return scoped.reduce(
    (sum, thread) => sum + getUnreadCount(thread, messages, reader),
    0,
  )
}

/** Own message is "seen" when the peer has read at/after it. */
export function isMessageSeenByPeer(
  message: ChatMessage,
  thread: ChatThread,
  selfSender: ChatSender,
): boolean {
  if (message.sender !== selfSender) return false
  const peer: ChatSender = selfSender === 'customer' ? 'vendor' : 'customer'
  const peerRead = getLastReadAt(thread, peer)
  return peerRead >= message.createdAt
}
