'use client'

import { useEffect, useState } from 'react'
import { Zap, Plus, X, Pencil, Save, Clock } from 'lucide-react'
import type { GanttTask } from '@/lib/types'
import { computeGantt, formatRange } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

function GanttRow({
  task,
  isAdmin,
  onDelete,
  onUpdate,
}: {
  task: GanttTask
  isAdmin: boolean
  onDelete: (id: string) => void
  onUpdate?: (id: string, updatedTask: Partial<GanttTask>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(task.label)
  const [draftStart, setDraftStart] = useState(task.start)
  const [draftEnd, setDraftEnd] = useState(task.end)

  // Recompute against a live "now" so bars shift as days pass.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const c = computeGantt(task, now ?? new Date(task.start))
  const isUrgent = c.status === 'danger' || c.status === 'warn'

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(task.id, {
        label: draftLabel,
        start: draftStart,
        end: draftEnd,
      })
    }
    setIsEditing(false)
  }

  // 🔽 編輯模式 UI
  if (isEditing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground">任務名稱</label>
          <input
            type="text"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="例如: 選課時間"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <label className="flex-1 text-xs text-muted-foreground">
            開始日期
            <input
              type="date"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex-1 text-xs text-muted-foreground">
            結束日期
            <input
              type="date"
              value={draftEnd}
              onChange={(e) => setDraftEnd(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Save className="size-3.5" />
            儲存修改
          </button>
        </div>
      </li>
    )
  }

  // 🔽 顯示模式 UI (保持原本樣式)
  return (
    <li className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">
          {task.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {formatRange(task)}
          </span>
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label={`編輯 ${task.label}`}
                className="inline-flex items-center gap-1 rounded-md bg-accent/50 px-1.5 py-0.5 text-[0.7rem] font-bold text-accent-foreground transition-colors hover:bg-accent"
              >
                <Pencil className="size-3" aria-hidden />
                編輯
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                aria-label={`刪除 ${task.label}`}
                className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[0.7rem] font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-3" aria-hidden />
                刪除
              </button>
            </div>
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
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-300',
            {
              'bg-primary': c.status === 'fine',
              'bg-amber-500': c.status === 'warn',
              'bg-destructive': c.status === 'danger',
              'bg-muted-foreground/40': c.status === 'future',
            }
          )}
          style={{ width: `${c.progress}%` }}
        />
        {c.status === 'future' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[0.65rem] font-black text-muted-foreground/70">
              UPCOMING
            </span>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className={cn('font-bold', isUrgent && 'text-destructive')}>
          {c.label}
        </span>
        <span className="font-bold text-foreground">
          {c.progress} %
        </span>
      </div>
    </li>
  )
}

export function GanttSchedule({
  tasks,
  isAdmin,
  onAdd,
  onDelete,
  onUpdate, // 👈 記得在解構中加入 onUpdate
}: {
  tasks: GanttTask[]
  isAdmin: boolean
  onAdd?: (task: Omit<GanttTask, 'id'>) => void
  onDelete?: (id: string) => void
  onUpdate?: (id: string, updatedTask: Partial<GanttTask>) => void // 👈 定義型別
}) {
  const [newLabel, setNewLabel] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (onAdd && newLabel && newStart && newEnd) {
      onAdd({ label: newLabel, start: newStart, end: newEnd })
      setNewLabel('')
      setNewStart('')
      setNewEnd('')
    }
  }

  return (
    <section id="gantt" className="relative space-y-4 rounded-xl bg-background p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-primary" />
          <h3 className="text-base font-black text-foreground">任務時程管制</h3>
        </div>
      </div>

      {isAdmin && onAdd && (
        <form onSubmit={handleAdd} className="rounded-lg border-2 border-dashed border-border p-3 space-y-3 bg-muted/20">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground">新增任務名稱</label>
            <input
              type="text"
              placeholder="例如: 全人課程志願填選"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-bold text-foreground placeholder:font-normal"
            />
          </div>
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-muted-foreground">
              開始日期
              <input
                type="date"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </label>
            <label className="flex-1 text-xs text-muted-foreground">
              結束日期
              <input
                type="date"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90"
          >
            <Plus className="size-4" />
            新增時程任務
          </button>
        </form>
      )}

      {/* 自動排序與渲染列表 */}
      {(() => {
        const now = new Date()
        const sortedTasks = [...tasks].sort((a, b) => {
          const aStart = new Date(a.start)
          const aEnd = new Date(a.end)
          const bStart = new Date(b.start)
          const bEnd = new Date(b.end)

          const aOngoing = now >= aStart && now <= aEnd
          const bOngoing = now >= bStart && now <= bEnd

          // 1. 進行中排最前面
          if (aOngoing && !bOngoing) return -1
          if (!aOngoing && bOngoing) return 1

          // 2. 都在進行中：越早結束的排越前面
          if (aOngoing && bOngoing) {
            return aEnd.getTime() - bEnd.getTime()
          }

          // 3. 尚未開始或已結束：依開始時間排序（越近越靠前）
          return aStart.getTime() - bStart.getTime()
        })

        return (
          <ul className="flex flex-col gap-2.5">
            {sortedTasks.map((t) => (
              <GanttRow
                key={t.id}
                task={t}
                isAdmin={isAdmin}
                onDelete={onDelete ?? (() => {})}
                onUpdate={onUpdate} // 👈 將主元件的 onUpdate 傳給子元件
              />
            ))}
          </ul>
        )
      })()}
    </section>
  )
}
