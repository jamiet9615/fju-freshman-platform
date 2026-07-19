import type { GanttTask } from './types'

export type GanttStatus = 'upcoming' | 'safe' | 'active' | 'warn' | 'danger' | 'ended'

export interface GanttComputed {
  status: GanttStatus
  /** 0-100 progress through the window */
  progress: number
  /** whole days remaining until end (can be negative if ended) */
  daysLeft: number
  /** whole days until the window opens (0 if already open) */
  daysUntilStart: number
  statusLabel: string
  /** CSS var color key */
  colorVar: string
}

const DAY = 1000 * 60 * 60 * 24

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function computeGantt(task: GanttTask, now: Date = new Date()): GanttComputed {
  const today = startOfDay(now)
  const start = startOfDay(new Date(task.start))
  const end = startOfDay(new Date(task.end))

  const daysUntilStart = Math.max(0, Math.round((start - today) / DAY))
  const daysLeft = Math.round((end - today) / DAY)
  const total = Math.max(1, Math.round((end - start) / DAY))

  // Not started yet
  if (today < start) {
    return {
      status: 'upcoming',
      progress: 0,
      daysLeft,
      daysUntilStart,
      statusLabel: `${daysUntilStart} 天後開始`,
      colorVar: 'var(--color-status-active)',
    }
  }

  // Ended
  if (today > end) {
    return {
      status: 'ended',
      progress: 100,
      daysLeft,
      daysUntilStart: 0,
      statusLabel: '已結束',
      colorVar: 'var(--color-muted-foreground)',
    }
  }

  // In window
  const elapsed = Math.round((today - start) / DAY)
  const progress = Math.min(100, Math.max(4, Math.round((elapsed / total) * 100)))

  let status: GanttStatus = 'active'
  let colorVar = 'var(--color-status-active)'
  if (daysLeft <= 2) {
    status = 'danger'
    colorVar = 'var(--color-status-danger)'
  } else if (daysLeft <= 6) {
    status = 'warn'
    colorVar = 'var(--color-status-warn)'
  } else {
    status = 'safe'
    colorVar = 'var(--color-status-safe)'
  }

  return {
    status,
    progress,
    daysLeft,
    daysUntilStart: 0,
    statusLabel: `剩 ${daysLeft} 天`,
    colorVar,
  }
}

export function formatRange(task: GanttTask): string {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
  return `${fmt(task.start)} – ${fmt(task.end)}`
}
