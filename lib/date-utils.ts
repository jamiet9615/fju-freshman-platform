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

function startOfDay(d: Date | string): number {
  let dateObj: Date
  if (typeof d === 'string') {
    // 將 "2026-09-01" 替換斜線避免 UTC 時區偏差
    dateObj = new Date(d.replace(/-/g, '/'))
  } else {
    dateObj = d
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date() // 若無效日期則給予今日預設值，防止 NaN
  }
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime()
}

export function computeGantt(task: GanttTask, now: Date = new Date()): GanttComputed {
  const today = startOfDay(now)
  const start = startOfDay(task.start)
  const end = startOfDay(task.end)

  const daysUntilStart = Math.max(0, Math.round((start - today) / DAY))
  const daysLeft = Math.round((end - today) / DAY)
  const total = Math.max(1, Math.round((end - start) / DAY))

  // Not started yet
  if (today < start) {
    return {
      status: 'upcoming',
      progress: 0,
      daysLeft: isNaN(daysLeft) ? 0 : daysLeft,
      daysUntilStart: isNaN(daysUntilStart) ? 0 : daysUntilStart,
      statusLabel: `${daysUntilStart} 天後開始`,
      colorVar: 'var(--color-status-active)',
    }
  }

  // Ended
  if (today > end) {
    return {
      status: 'ended',
      progress: 100,
      daysLeft: isNaN(daysLeft) ? 0 : daysLeft,
      daysUntilStart: 0,
      statusLabel: '已結束',
      colorVar: 'var(--color-muted-foreground)',
    }
  }

  // In window
  const elapsed = Math.round((today - start) / DAY)
  const progressCalc = Math.round((elapsed / total) * 100)
  const progress = isNaN(progressCalc) ? 0 : Math.min(100, Math.max(4, progressCalc))

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
    daysLeft: isNaN(daysLeft) ? 0 : daysLeft,
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
