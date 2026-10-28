import { describe, expect, it } from 'vitest'
import {
  getTotalUnread,
  getUnreadCount,
  isMessageSeenByPeer,
} from './chat'
import type { ChatMessage, ChatThread } from '@/types'

const thread: ChatThread = {
  id: 'chat-1',
  vendorId: 'v1',
  customerLabel: 'Demo Customer',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:05:00.000Z',
  lastMessagePreview: 'Hi',
  customerLastReadAt: '2026-01-01T10:00:00.000Z',
  vendorLastReadAt: '2026-01-01T10:05:00.000Z',
}

const messages: ChatMessage[] = [
  {
    id: 'm1',
    threadId: 'chat-1',
    sender: 'customer',
    body: 'Hello',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'm2',
    threadId: 'chat-1',
    sender: 'vendor',
    body: 'Hi!',
    createdAt: '2026-01-01T10:05:00.000Z',
  },
]

describe('chat unread / seen', () => {
  it('counts unread for customer', () => {
    expect(getUnreadCount(thread, messages, 'customer')).toBe(1)
    expect(getUnreadCount(thread, messages, 'vendor')).toBe(0)
  })

  it('sums total unread', () => {
    expect(getTotalUnread([thread], messages, 'customer')).toBe(1)
  })

  it('marks own message as seen when peer has read', () => {
    expect(isMessageSeenByPeer(messages[0], thread, 'customer')).toBe(true)
    expect(isMessageSeenByPeer(messages[1], thread, 'vendor')).toBe(false)
  })
})
