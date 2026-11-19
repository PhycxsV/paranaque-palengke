import { apiFetchAll, apiRequest } from './client'
import {
  mapChatMessage,
  mapChatThread,
  type StrapiChatMessage,
  type StrapiChatThread,
} from './mappers'
import type { ChatMessage, ChatSender, ChatThread } from '@/types'

export async function fetchChatThreads(): Promise<ChatThread[]> {
  const rows = await apiFetchAll<StrapiChatThread>('/chat-threads', {
    query: {
      'populate[vendor]': 'true',
      'sort[0]': 'updatedAt:desc',
    },
  })
  return rows.map(mapChatThread)
}

export async function fetchChatMessages(threadId?: string): Promise<ChatMessage[]> {
  const rows = await apiFetchAll<StrapiChatMessage>('/chat-messages', {
    query: {
      'populate[thread]': 'true',
      'sort[0]': 'createdAt:asc',
      ...(threadId
        ? { 'filters[thread][documentId][$eq]': threadId }
        : {}),
    },
  })
  return rows.map(mapChatMessage)
}

export async function createChatThread(vendorId: string): Promise<ChatThread> {
  const payload = await apiRequest<{ data: StrapiChatThread }>('/chat-threads', {
    method: 'POST',
    body: { data: { vendor: vendorId } },
    query: { 'populate[vendor]': 'true' },
  })
  return mapChatThread(payload.data)
}

export async function sendChatMessage(
  threadId: string,
  body: string,
): Promise<ChatMessage> {
  const payload = await apiRequest<{ data: StrapiChatMessage }>('/chat-messages', {
    method: 'POST',
    body: {
      data: {
        thread: threadId,
        body: body.trim(),
      },
    },
    query: { 'populate[thread]': 'true' },
  })
  return mapChatMessage(payload.data)
}

export async function markChatThreadRead(
  threadId: string,
  reader: ChatSender,
): Promise<ChatThread> {
  const now = new Date().toISOString()
  const data =
    reader === 'customer'
      ? { customerLastReadAt: now }
      : { vendorLastReadAt: now }

  const payload = await apiRequest<{ data: StrapiChatThread }>(
    `/chat-threads/${threadId}`,
    {
      method: 'PUT',
      body: { data },
      query: { 'populate[vendor]': 'true' },
    },
  )
  return mapChatThread(payload.data)
}
