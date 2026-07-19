import { FreshmanApp } from '@/components/freshman-app'
import { readSchedule } from '@/lib/schedule-store'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const schedule = await readSchedule()
  return <FreshmanApp initialSchedule={schedule} />
}
