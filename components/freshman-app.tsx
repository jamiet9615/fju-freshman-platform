'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ShieldUser, GraduationCap, LogOut } from 'lucide-react'
import type { ScheduleData, GanttTask, TodoItem } from '@/lib/types'
import { LINK_CARDS, type LinkCard } from '@/lib/links'
import { AccordionLinks } from './accordion-links'
import { GanttSchedule } from './gantt-schedule'
import { TodoList } from './todo-list'
import { AdminModal } from './admin-modal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LS_GANTT = 'fju-gantt-items'
const LS_TODOS = 'fju-todo-items'
const LS_CARDS = 'fju-link-cards'

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function FreshmanApp({ initialSchedule }: { initialSchedule: ScheduleData }) {
  const { data: schedule, mutate } = useSWR<ScheduleData>('/api/schedule', fetcher, {
    fallbackData: initialSchedule,
    revalidateOnFocus: false,
  })
  const [adminOpen, setAdminOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const current = schedule ?? initialSchedule
  const lastUpdated = new Date(current.updatedAt)

  // Editable state persisted to localStorage. Seeded from server/static data.
  const [gantt, setGantt] = useState<GanttTask[]>(current.gantt)
  const [todos, setTodos] = useState<TodoItem[]>(current.todos)
  const [cards, setCards] = useState<LinkCard[]>(LINK_CARDS)
  const [hydrated, setHydrated] = useState(false)

  // Load saved edits once on mount (per-browser persistence).
  useEffect(() => {
    try {
      const g = localStorage.getItem(LS_GANTT)
      if (g) setGantt(JSON.parse(g))
      const t = localStorage.getItem(LS_TODOS)
      if (t) setTodos(JSON.parse(t))
      //const c = localStorage.getItem(LS_CARDS)
      //if (c) setCards(JSON.parse(c))
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(LS_GANTT, JSON.stringify(gantt))
    } catch {
      /* ignore */
    }
  }, [gantt, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(LS_TODOS, JSON.stringify(todos))
    } catch {
      /* ignore */
    }
  }, [todos, hydrated])

  useEffect(() => {
    try {
      // 刪除瀏覽器快取，確保正常模式與所有人都能同步 lib/links.ts 的最新修改
      localStorage.removeItem(LS_CARDS)
    } catch {
      /* ignore */
    }
  }, [])

  // Gantt handlers
  const addGantt = (label: string, start: string, end: string) =>
    setGantt((prev) => [...prev, { id: newId(), label, start, end }])
  const deleteGantt = (id: string) => setGantt((prev) => prev.filter((g) => g.id !== id))
  const updateGantt = (id: string, updatedTask: Partial<GanttTask>) =>
  setGantt((prev) => prev.map((g) => (g.id === id ? { ...g, ...updatedTask } : g)))

  // Todo handlers
  const addTodo = (text: string) => setTodos((prev) => [...prev, { id: newId(), text }])
  const deleteTodo = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id))

  // Card handlers
  const updateCard = (id: string, patch: Partial<Pick<LinkCard, 'title' | 'tag' | 'description' | 'buttons'>>) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const addCard = () =>
    setCards((prev) => [
      ...prev,
      {
        id: newId(),
        title: '新卡片標題',
        tag: '自訂',
        description: '在這裡輸入卡片的介紹文字。',
        buttons: [],
      },
    ])
  const deleteCard = (id: string) => setCards((prev) => prev.filter((c) => c.id !== id))

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="mx-auto mb-8 flex max-w-[1100px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-black text-primary sm:text-2xl text-balance">
              輔大新生全攻略捷徑
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? '管理員模式：可即時新增、編輯與刪除內容' : '點擊下方卡片查看詳細介紹與重要連結'}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
              <ShieldUser className="size-4" aria-hidden />
              管理員模式
            </span>
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" aria-hidden />
              登出
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-primary/30 bg-card px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground sm:self-auto"
          >
            <ShieldUser className="size-4" aria-hidden />
            管理員登入
          </button>
        )}
      </header>

      {/* Layout */}
      <div className="mx-auto grid max-w-[1100px] gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <AccordionLinks
            cards={cards}
            isAdmin={isAdmin}
            onUpdateCard={updateCard}
            onAddCard={addCard}
            onDeleteCard={deleteCard}
          />
        </div>
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:h-fit">
          <GanttSchedule tasks={gantt} isAdmin={isAdmin} onAdd={addGantt} onDelete={deleteGantt} onUpdate={updateGantt}/>
          <TodoList todos={todos} isAdmin={isAdmin} onAdd={addTodo} onDelete={deleteTodo} />
          <p className="px-1 font-mono text-[0.7rem] text-muted-foreground" suppressHydrationWarning>
            資料更新：{lastUpdated.toLocaleDateString('zh-TW')}
            {current.updatedBy === 'ai-agent'
              ? '（AI Agent）'
              : current.updatedBy === 'admin'
                ? '（管理員）'
                : ''}
          </p>
        </aside>
      </div>

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        schedule={current}
        onAuthed={() => setIsAdmin(true)}
        onUpdated={(data) => {
          mutate(data, { revalidate: false })
          setGantt(data.gantt)
        }}
      />
    </main>
  )
}
