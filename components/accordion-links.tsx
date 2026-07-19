'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, Trash2, Save, Plus } from 'lucide-react'
import type { LinkCard } from '@/lib/links'

function Card({
  card,
  open,
  onToggle,
  isAdmin,
  onUpdateCard,
  onDeleteCard,
}: {
  card: LinkCard
  open: boolean
  onToggle: () => void
  isAdmin: boolean
  onUpdateCard: (id: string, patch: Partial<Pick<LinkCard, 'title' | 'description'>>) => void
  onDeleteCard: (id: string) => void
}) {
  const [draftTitle, setDraftTitle] = useState(card.title)
  const [draftDescription, setDraftDescription] = useState(card.description)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onUpdateCard(card.id, { title: draftTitle, description: draftDescription })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Admin edit mode: title + description become editable fields.
  if (isAdmin) {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
              {card.tag}
            </span>
            <button
              type="button"
              onClick={() => onDeleteCard(card.id)}
              aria-label={`刪除卡片 ${card.title}`}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-3.5" aria-hidden />
              刪除卡片
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            標題
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-base font-bold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            介紹文字
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={3}
              className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {card.buttons.map((btn) => (
              <a
                key={btn.url}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:brightness-95"
              >
                {btn.label}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Save className="size-4" aria-hidden />
            {saved ? '已儲存' : '儲存'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <h3 className="text-base font-bold text-primary sm:text-lg">{card.title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {card.tag}
          </span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-5 pb-5 pt-4">
            <p className="leading-relaxed text-foreground/80">{card.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {card.buttons.map((btn) => (
                <a
                  key={btn.url}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:brightness-95"
                >
                  {btn.label}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AccordionLinks({
  cards,
  isAdmin = false,
  onUpdateCard,
  onAddCard,
  onDeleteCard,
}: {
  cards: LinkCard[]
  isAdmin?: boolean
  onUpdateCard?: (id: string, patch: Partial<Pick<LinkCard, 'title' | 'description'>>) => void
  onAddCard?: () => void
  onDeleteCard?: (id: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(cards[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-3">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          open={openId === card.id}
          onToggle={() => setOpenId((prev) => (prev === card.id ? null : card.id))}
          isAdmin={isAdmin}
          onUpdateCard={onUpdateCard ?? (() => {})}
          onDeleteCard={onDeleteCard ?? (() => {})}
        />
      ))}

      {isAdmin && onAddCard && (
        <button
          type="button"
          onClick={onAddCard}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-6 text-base font-bold text-primary transition-colors hover:border-primary hover:bg-primary/10"
        >
          <Plus className="size-5" aria-hidden />
          新增卡片
        </button>
      )}
    </div>
  )
}
