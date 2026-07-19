'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ShieldUser, GraduationCap } from 'lucide-react'
import type { ScheduleData } from '@/lib/types'
import { AccordionLinks } from './accordion-links'
import { GanttSchedule } from './gantt-schedule'
import { TodoList } from './todo-list'
import { AdminModal } from './admin-modal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FreshmanApp({ initialSchedule }: { initialSchedule: ScheduleData }) {
  const { data: schedule, mutate } = useSWR<ScheduleData>('/api/schedule', fetcher, {
    fallbackData: initialSchedule,
    revalidateOnFocus: false,
  })
  const [adminOpen, setAdminOpen] = useState(false)

  const current = schedule ?? initialSchedule
  const lastUpdated = new Date(current.updatedAt)

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
            <p className="text-sm text-muted-foreground">點擊下方卡片查看詳細介紹與重要連結</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-primary/30 bg-card px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground sm:self-auto"
        >
          <ShieldUser className="size-4" aria-hidden />
          管理員登入
        </button>
      </header>

      {/* Layout */}
      <div className="mx-auto grid max-w-[1100px] gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <AccordionLinks />
        </div>
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:h-fit">
          <GanttSchedule tasks={current.gantt} />
          <TodoList todos={current.todos} />
          <p className="px-1 font-mono text-[0.7rem] text-muted-foreground">
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
        onUpdated={(data) => mutate(data, { revalidate: false })}
      />
    </main>
  )
}
