import { NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { readSchedule, writeSchedule } from '@/lib/schedule-store'
import type { ScheduleData } from '@/lib/types'

const ADMIN_PASSWORD = '1150912'

// Human-in-the-loop: only crawls when an admin explicitly triggers it.
const SOURCES = [
  { name: '輔大新生專區', url: 'https://fjcuadm.fju.edu.tw/speed.php?id=2' },
  { name: '學校行事曆', url: 'http://www.secretariat.fju.edu.tw/article.jsp?articleID=8' },
]

// Strip tags / scripts and collapse whitespace so we send lean text to the model.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
}

const syncSchema = z.object({
  gantt: z
    .array(
      z.object({
        id: z.enum(['course-selection', 'profile', 'tuition']),
        label: z.string(),
        start: z.string().describe('開始日期，格式 YYYY-MM-DD'),
        end: z.string().describe('截止日期，格式 YYYY-MM-DD'),
      }),
    )
    .describe('三個核心時程：選課時間、基本資料填寫、學雜費繳納'),
  todos: z
    .array(z.object({ text: z.string() }))
    .describe('新生近期必做事項，每項為一句簡短說明'),
  summary: z.string().describe('本次更新的重點摘要，一到兩句話'),
})

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string }
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密碼錯誤，無權限啟動 AI Agent。' }, { status: 401 })
    }

    // 1) Crawl the source pages (low-cost, only on demand)
    const documents: string[] = []
    for (const source of SOURCES) {
      try {
        const res = await fetch(source.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (FJU-Freshman-Agent)' },
          cache: 'no-store',
        })
        const html = await res.text()
        documents.push(`# 來源：${source.name} (${source.url})\n${htmlToText(html)}`)
      } catch (e) {
        console.log('[v0] crawl failed:', source.url, (e as Error).message)
        documents.push(`# 來源：${source.name}（抓取失敗）`)
      }
    }

    const current = await readSchedule()
    const thisYear = new Date().getFullYear()

    // 2) Feed to Gemini and extract structured schedule
    const { output } = await generateText({
      model: 'google/gemini-2.5-flash',
      output: Output.object({ schema: syncSchema }),
      system:
        '你是一位輔仁大學的學務分析專家。你的任務是從提供的官方網頁純文字中，' +
        `精確抓出最新學年度（約 ${thisYear} 年）新生的重要時程與必做事項。` +
        '只根據文本內容判斷；若某項時程在文本中找不到明確日期，' +
        '請沿用提供的現有資料，切勿捏造。所有日期一律輸出 YYYY-MM-DD 格式。',
      prompt:
        `以下是目前網頁上的現有時程（作為找不到新資料時的預設值）：\n` +
        `${JSON.stringify({ gantt: current.gantt, todos: current.todos }, null, 2)}\n\n` +
        `以下是爬取到的官方網頁內容，請據此更新選課時間、基本資料填寫、學雜費繳納三項時程，` +
        `並整理新生近期必做事項：\n\n${documents.join('\n\n---\n\n')}`,
    })

    // 3) Merge and persist
    const updated: ScheduleData = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'ai-agent',
      gantt: output.gantt.map((g) => ({
        id: g.id,
        label: g.label,
        start: g.start,
        end: g.end,
      })),
      todos: output.todos.map((t, i) => ({
        id: `ai-${i}-${Date.now().toString(36)}`,
        text: t.text,
      })),
    }

    await writeSchedule(updated)
    return NextResponse.json({ schedule: updated, summary: output.summary })
  } catch (err) {
    console.log('[v0] ai-sync error:', (err as Error).message)
    return NextResponse.json(
      { error: `AI Agent 執行失敗：${(err as Error).message}` },
      { status: 500 },
    )
  }
}
