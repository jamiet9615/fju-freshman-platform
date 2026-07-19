import { NextResponse } from 'next/server'
import { readSchedule, writeSchedule } from '@/lib/schedule-store'
import type { ScheduleData } from '@/lib/types'

const ADMIN_PASSWORD = '1150912'

export async function GET() {
  try {
    const data = await readSchedule()
    return NextResponse.json(data)
  } catch (err) {
    console.log('[v0] schedule GET error:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password, gantt, todos } = body as {
      password?: string
      gantt?: ScheduleData['gantt']
      todos?: ScheduleData['todos']
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密碼錯誤，無權限修改。' }, { status: 401 })
    }

    const current = await readSchedule()
    const updated: ScheduleData = {
      ...current,
      gantt: gantt ?? current.gantt,
      todos: todos ?? current.todos,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    }

    await writeSchedule(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.log('[v0] schedule POST error:', (err as Error).message)
    return NextResponse.json(
      { error: '寫入失敗（正式環境檔案系統唯讀，請參考 DEPLOY.md）。' },
      { status: 500 },
    )
  }
}
