'use client'

import { useEffect, useState } from 'react'
import { CheckSquare } from 'lucide-react'
import type { TodoItem } from '@/lib/types'

const STORAGE_KEY = 'fju-freshman-todos'

export function TodoList({ todos }: { todos: TodoItem[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)

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
            <li key={todo.id}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 text-sm transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(todo.id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
                />
                <span
                  className={
                    isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                  }
                >
                  {todo.text}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
