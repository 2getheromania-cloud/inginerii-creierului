'use client'
import { cn, getSliderColor } from '@/lib/utils'
import { SLIDER_LABELS } from '@/lib/program'
import type { DailySliders } from '@/lib/types'

interface SliderGroupProps {
  sliders: DailySliders
  onChange: (sliders: DailySliders) => void
}

export default function SliderGroup({ sliders, onChange }: SliderGroupProps) {
  function update(key: keyof DailySliders, value: number) {
    onChange({ ...sliders, [key]: value })
  }

  return (
    <div className="space-y-4">
      {(Object.keys(SLIDER_LABELS) as (keyof DailySliders)[]).map(key => {
        const value = sliders[key] ?? 5
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">{SLIDER_LABELS[key]}</label>
              <span className={cn('text-sm font-bold', getSliderColor(value))}>
                {value}/10
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-4">1</span>
              <input
                type="range"
                min={1} max={10} step={1}
                value={value}
                onChange={e => update(key, Number(e.target.value))}
                className="flex-1 h-2 rounded-full accent-brand-600 cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-4 text-right">10</span>
            </div>
            {/* Pip indicators */}
            <div className="flex justify-between mt-0.5 px-6">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full',
                    i + 1 <= value ? 'bg-brand-500' : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
