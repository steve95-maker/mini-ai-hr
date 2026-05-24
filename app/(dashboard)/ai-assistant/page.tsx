'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

const suggestedPrompts = [
  'Show me all active employees',
  'Create an employee named Sara Khan. Email sara@example.com. Job title UX Researcher. Department Design. Location Malmö.',
  "Update John Doe's department to Product and job title to Product Engineer",
  'Generate an employee summary for John Doe',
  'Deactivate John Doe',
]

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load sessions list
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions')
      const data = await res.json()
      if (data.sessions) {
        setSessions(data.sessions)
        return data.sessions as ChatSession[]
      }
    } catch {
      // ignore
    }
    return [] as ChatSession[]
  }, [])

  // Load messages for a specific session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch {
      // ignore
    }
  }, [])

  // On mount: load sessions, pick the most recent one
  useEffect(() => {
    async function init() {
      const list = await loadSessions()
      if (list.length > 0) {
        setActiveSessionId(list[0].id)
        await loadMessages(list[0].id)
      }
      setLoadingSessions(false)
    }
    init()
  }, [loadSessions, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(messageText?: string) {
    const text = messageText ?? input
    if (!text.trim() || loading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sessionId: activeSessionId }),
      })

      const data = await response.json()

      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId)
      }

      if (data.message) {
        setMessages([...newMessages, { role: 'assistant', content: data.message }])
      } else if (data.error) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `Error: ${data.error}` },
        ])
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: 'No response received.' },
        ])
      }

      // Refresh sessions list (title may have been updated)
      await loadSessions()
      router.refresh()
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function startNewChat() {
    setActiveSessionId(null)
    setMessages([])
  }

  async function switchSession(sessionId: string) {
    if (sessionId === activeSessionId) return
    setActiveSessionId(sessionId)
    setMessages([])
    await loadMessages(sessionId)
  }

  async function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this chat? This cannot be undone.')) return

    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' })
      const remaining = sessions.filter((s) => s.id !== sessionId)
      setSessions(remaining)
      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id)
          await loadMessages(remaining[0].id)
        } else {
          setActiveSessionId(null)
          setMessages([])
        }
      }
    } catch {
      alert('Failed to delete. Please try again.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Sessions Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex flex-col">
        <button
          onClick={startNewChat}
          className="w-full px-3 py-2 mb-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
          {loadingSessions ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              Loading...
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              No chats yet
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`group flex items-center justify-between gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                  session.id === activeSessionId
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span
                  className={`flex-1 min-w-0 truncate text-sm ${
                    session.id === activeSessionId
                      ? 'text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  title={session.title}
                >
                  {session.title}
                </span>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            🤖 AI HR Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage employees using natural language. Create, view, update, deactivate, and generate summaries.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          {messages.length === 0 ? (
            <div className="py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Try one of these example prompts:
              </p>
              <div className="space-y-2 max-w-lg mx-auto">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    disabled={loading}
                    className="block w-full text-left px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    <span className="text-blue-500 mr-2">→</span>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-sm">🤖</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">HR</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about employees..."
            disabled={loading}
            className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-white focus:outline-none disabled:opacity-50 text-sm py-1"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}