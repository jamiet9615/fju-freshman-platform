'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import type { GanttTask } from '@/lib/types'
import { computeGantt, formatRange } from '@/lib/date-utils'

function GanttRow({ task }: { task: GanttTask }) {
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
        <span className="font-mono text-[0.7rem] text-muted-foreground">{formatRange(task)}</span>
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

export function GanttSchedule({ tasks }: { tasks: GanttTask[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="任務時程管制">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap className="size-3.5" aria-hidden />
        </span>
        <h2 className="text-base font-bold text-primary">任務時程管制</h2>
      </div>
      <ul className="flex flex-col gap-2.5">
        {tasks.map((t) => (
          <GanttRow key={t.id} task={t} />
        ))}
      </ul>
    </section>
  )
}
