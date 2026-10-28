import type { ChatMessage, ChatThread } from '@/types'

const t1 = '2026-10-28T02:10:00.000Z'
const t2 = '2026-10-28T02:12:00.000Z'
const t3 = '2026-10-28T03:05:00.000Z'
const t4 = '2026-10-28T03:08:00.000Z'

export const seedChatThreads: ChatThread[] = [
  {
    id: 'chat-aling-nena-demo',
    vendorId: 'vendor-aling-nena',
    customerLabel: 'Demo Customer',
    createdAt: t1,
    updatedAt: t2,
    lastMessagePreview: 'Oo, may stock pa po ng sitaw. Salamat!',
    // Customer has not opened the vendor reply yet → 1 unread
    customerLastReadAt: t1,
    vendorLastReadAt: t2,
  },
  {
    id: 'chat-kuya-ben-demo',
    vendorId: 'vendor-kuya-ben',
    customerLabel: 'Demo Customer',
    createdAt: t3,
    updatedAt: t4,
    lastMessagePreview: 'Bangus available until cut-off, pre-order okay.',
    customerLastReadAt: t3,
    vendorLastReadAt: t4,
  },
]

export const seedChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    threadId: 'chat-aling-nena-demo',
    sender: 'customer',
    body: 'Good morning po! May sitaw pa ba kayo ngayon?',
    createdAt: t1,
  },
  {
    id: 'msg-2',
    threadId: 'chat-aling-nena-demo',
    sender: 'vendor',
    body: 'Oo, may stock pa po ng sitaw. Salamat!',
    createdAt: t2,
  },
  {
    id: 'msg-3',
    threadId: 'chat-kuya-ben-demo',
    sender: 'customer',
    body: 'Pwede po ba mag-preorder ng bangus para bukas?',
    createdAt: t3,
  },
  {
    id: 'msg-4',
    threadId: 'chat-kuya-ben-demo',
    sender: 'vendor',
    body: 'Bangus available until cut-off, pre-order okay.',
    createdAt: t4,
  },
]
