import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { SenderAggregate } from '@/core/aggregate/senders'
import { SenderRow } from './SenderRow'

/** Rough row height. The virtualiser measures the real one, this only seeds the scrollbar. */
const ESTIMATED_ROW = 86

export function SenderList({
  senders,
  selected,
  onToggle,
}: {
  senders: readonly SenderAggregate[]
  selected: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // React Compiler cannot memoize around the functions TanStack Virtual returns,
  // so it skips this component. That costs nothing here: a virtual list
  // re-renders on scroll by design, which is the work memoization would avoid.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: senders.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW,
    overscan: 8,
  })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const sender = senders[item.index]
          if (!sender) return null

          return (
            <div
              key={sender.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${String(item.start)}px)` }}
            >
              <SenderRow sender={sender} selected={selected.has(sender.key)} onToggle={onToggle} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
