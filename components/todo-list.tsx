'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Trash2, Plus } from 'lucide-react'
import type { TodoItem } from '@/lib/types'

const STORAGE_KEY = 'fju-freshman-todos'

export function TodoList({
  todos,
  isAdmin = false,
  onAdd,
  onDelete,
}: {
  todos: TodoItem[]
  isAdmin?: boolean
  onAdd?: (text: string) => void
  onDelete?: (id: string) => void
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)
  const [newText, setNewText] = useState('')

  // Load saved progress once on mount (per-browser persistence).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setChecked(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
    } catch {
      /* ignore */
    }
  }, [checked, hydrated])

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleAdd = () => {
    if (!newText.trim() || !onAdd) return
    onAdd(newText.trim())
    setNewText('')
  }

  const doneCount = todos.filter((t) => checked[t.id]).length
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="新生必做清單">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CheckSquare className="size-3.5" aria-hidden />
        </span>
        <h2 className="text-base font-bold text-primary">新生必做清單</h2>
      </div>
      <p className="mb-3 font-mono text-[0.7rem] text-muted-foreground">
        完成 {doneCount}/{todos.length}（{percent}%）· 進度自動存於本機
      </p>

      <ul className="flex flex-col gap-1">
        {todos.map((todo) => {
          const isDone = !!checked[todo.id]
          return (
            <li key={todo.id} className="flex items-center gap-1">
              <label className="flex flex-1 cursor-pointer items-start gap-2.5 rounded-md p-1.5 text-sm transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(todo.id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
                />
                <span className={isDone ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {todo.text}
                </span>
              </label>
              {isAdmin && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(todo.id)}
                  aria-label={`刪除「${todo.text}」`}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {isAdmin && onAdd && (
        <div className="mt-3 flex flex-col gap-2 border-t border-dashed border-border pt-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) handleAdd()
            }}
            placeholder="新增必做項目內容…"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            新增必做項目
          </button>
        </div>
      )}
    </section>
  )
}
