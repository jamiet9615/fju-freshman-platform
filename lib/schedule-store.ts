import { promises as fs } from 'fs'
import path from 'path'
import type { ScheduleData } from './types'

const DATA_PATH = path.join(process.cwd(), 'data', 'schedule.json')

export async function readSchedule(): Promise<ScheduleData> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8')
  return JSON.parse(raw) as ScheduleData
}

/**
 * Writes the schedule back to data/schedule.json.
 * Works locally / in the v0 sandbox. On a read-only serverless
 * filesystem (production Vercel) this will throw — see DEPLOY.md
 * for the GitHub Actions / commit-based flow.
 */
export async function writeSchedule(data: ScheduleData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
