export interface GanttTask {
  id: string
  label: string
  /** ISO date string, e.g. "2025-09-01" */
  start: string
  /** ISO date string, e.g. "2025-09-15" */
  end: string
}

export interface TodoItem {
  id: string
  text: string
}

export interface ScheduleData {
  /** ISO timestamp of the last update (admin or AI agent) */
  updatedAt: string
  /** Who performed the last update: "seed" | "admin" | "ai-agent" */
  updatedBy: string
  gantt: GanttTask[]
  todos: TodoItem[]
}
