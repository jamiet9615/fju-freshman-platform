'use client'

import { useState } from 'react'
import { X, Lock, Sparkles, Save, Loader2, ShieldCheck } from 'lucide-react'
import type { ScheduleData } from '@/lib/types'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  schedule: ScheduleData
  onUpdated: (data: ScheduleData) => void
  onAuthed?: () => void
}

export function AdminModal({ open, onClose, schedule, onUpdated, onAuthed }: AdminModalProps) {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [draftGantt, setDraftGantt] = useState(schedule.gantt)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  if (!open) return null

  // 🔽 新增/修改：登出處理函數（清空密碼與狀態）
  const handleLogout = () => {
    setAuthed(false)
    setPassword('')
    localStorage.removeItem('adminToken')
    window.location.reload() // 強制刷頁重置狀態
  }
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side gate for UX; server re-verifies on every write.
    if (password === '1150912') {
      setAuthed(true)
      setAuthError('')
      setDraftGantt(schedule.gantt)
      onAuthed?.()
    } else {
      setAuthError('密碼錯誤，請重新輸入。')
    }
  }

  const updateDate = (id: string, field: 'start' | 'end', value: string) => {
    setDraftGantt((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, gantt: draftGantt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '儲存失敗')
      onUpdated(data)
      setMessage({ type: 'ok', text: '時程已更新並儲存。' })
    } catch (err) {
      setMessage({ type: 'err', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const handleAiSync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI Agent 執行失敗')
      onUpdated(data.schedule)
      setDraftGantt(data.schedule.gantt)
      setMessage({ type: 'ok', text: `AI 對時完成：${data.summary}` })
    } catch (err) {
      setMessage({ type: 'err', text: (err as Error).message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="管理員後台"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
            {authed ? <ShieldCheck className="size-5" /> : <Lock className="size-5" />}
            {authed ? '接班管理員控制台' : '管理員登入'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {!authed ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              輸入今年度驗證密碼以修改網站時程與啟動 AI 對時。
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入管理密碼"
              autoFocus
              className="rounded-lg border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              登入
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {/* AI agent trigger */}
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-bold text-foreground">AI Agent 自動對時</h3>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                人機協同：點擊後才會抓取「新生專區」與「行事曆」並用 Gemini 擷取最新時程，避免背景長時間耗算力。
              </p>
              <button
                type="button"
                onClick={handleAiSync}
                disabled={syncing || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {syncing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {syncing ? '對時中…' : '啟動 AI Agent 自動對時'}
              </button>
            </div>

            {/* Manual date editing */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-foreground">手動調整時程截止日</h3>
              {draftGantt.map((g) => (
                <div key={g.id} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-sm font-bold text-foreground">{g.label}</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      開始
                      <input
                        type="date"
                        value={g.start}
                        onChange={(e) => updateDate(g.id, 'start', e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      截止
                      <input
                        type="date"
                        value={g.end}
                        onChange={(e) => updateDate(g.id, 'end', e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || syncing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                儲存時程
              </button>
            </div>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === 'ok'
                    ? 'bg-status-safe/10 text-status-safe'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
