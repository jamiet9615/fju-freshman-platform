'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { LINK_CARDS } from '@/lib/links'

function Card({
  card,
  open,
  onToggle,
}: {
  card: (typeof LINK_CARDS)[number]
  open: boolean
  onToggle: () => void
}) {
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

export function AccordionLinks() {
  const [openId, setOpenId] = useState<string | null>(LINK_CARDS[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-3">
      {LINK_CARDS.map((card) => (
        <Card
          key={card.id}
          card={card}
          open={openId === card.id}
          onToggle={() => setOpenId((prev) => (prev === card.id ? null : card.id))}
        />
      ))}
    </div>
  )
}
