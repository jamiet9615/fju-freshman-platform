'use client'

import { useEffect, useState } from 'react'
import { Zap, Plus, X } from 'lucide-react'
import type { GanttTask } from '@/lib/types'
import { computeGantt, formatRange } from '@/lib/date-utils'

function GanttRow({
  task,
  isAdmin,
  onDelete,
}: {
  task: GanttTask
  isAdmin: boolean
  onDelete: (id: string) => void
}) {
  // Recompute against a live "now" so bars shift as days pass.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const c = computeGantt(task, now ?? new Date(task.start))
  const isUrgent = c.status === 'danger' || c.status === 'warn'

  return (
    <li className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">{task.label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] text-muted-foreground">{formatRange(task)}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label={`刪除 ${task.label}`}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[0.7rem] font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="size-3" aria-hidden />
              刪除
            </button>
          )}
        </div>
      </div>

      {/* progress track */}
      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-border/70"
        role="progressbar"
        aria-valuenow={c.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${task.label} 進度`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${isUrgent ? 'animate-pulse' : ''}`}
          style={{ width: `${c.progress}%`, backgroundColor: c.colorVar }}
        />
        {/* tech-style tick marks */}
        <div className="pointer-events-none absolute inset-0 flex justify-between px-[6%] opacity-30">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-full w-px bg-background" />
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 font-mono text-[0.7rem] font-bold"
          style={{ color: c.colorVar }}
        >
          {isUrgent && <Zap className="size-3" aria-hidden />}
          {c.statusLabel}
        </span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">{c.progress}%</span>
      </div>
    </li>
  )
}

export function GanttSchedule({
  tasks,
  isAdmin = false,
  onAdd,
  onDelete,
}: {
  tasks: GanttTask[]
  isAdmin?: boolean
  onAdd?: (label: string, start: string, end: string) => void
  onDelete?: (id: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const resetForm = () => {
    setLabel('')
    setStart('')
    setEnd('')
  }

  const submit = () => {
    if (!label.trim() || !start || !end || !onAdd) return
    onAdd(label.trim(), start, end)
    resetForm()
    setFormOpen(false)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="任務時程管制">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-3.5" aria-hidden />
          </span>
          <h2 className="text-base font-bold text-primary">任務時程管制</h2>
        </div>
        {isAdmin && onAdd && (
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="size-3.5" aria-hidden />
            新增時程
          </button>
        )}
      </div>

      {isAdmin && onAdd && formOpen && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-muted/40 p-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="任務名稱"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
              開始日期
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
              結束日期
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              確認新增
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setFormOpen(false)
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {tasks.map((t) => (
          <GanttRow key={t.id} task={t} isAdmin={isAdmin} onDelete={onDelete ?? (() => {})} />
        ))}
      </ul>
    </section>
  )
}
