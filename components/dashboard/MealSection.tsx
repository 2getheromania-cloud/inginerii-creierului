'use client'
import { cn } from '@/lib/utils'
import type { MealChecks, SnackChecks } from '@/lib/types'

interface MealSectionProps {
  title: string
  icon: string
  isSnack?: boolean
  checks: MealChecks | SnackChecks
  recipeLink?: string
  onChange: (checks: MealChecks | SnackChecks) => void
}

const MEAL_ITEMS: { key: keyof MealChecks; label: string; detail: string }[] = [
  { key: 'protein',     label: 'Proteină 120–180g',               detail: 'carne, pește, ouă, leguminoase' },
  { key: 'vegetables',  label: 'Legume fără amidon (1–2 porții)', detail: 'broccoli, spanac, dovlecel, ardei' },
  { key: 'fats',        label: 'Grăsimi sănătoase (1–2 porții)',  detail: 'avocado, nuci, ulei de măsline' },
  { key: 'water',       label: 'Cel puțin 250ml apă',             detail: 'înainte sau în timpul mesei' },
  { key: 'supplements', label: 'Suplimente luate',                detail: 'conform protocolului tău' },
  { key: 'recipe',      label: 'Am mâncat din rețeta recomandată', detail: '' },
]

const SNACK_ITEMS: { key: keyof SnackChecks; label: string }[] = [
  { key: 'protein',    label: 'Proteină ~30g' },
  { key: 'vegetables', label: 'Legume' },
  { key: 'fats',       label: 'Grăsimi sănătoase' },
  { key: 'fruits',     label: 'Fructe low-sugar' },
]

export default function MealSection({ title, icon, isSnack = false, checks, recipeLink, onChange }: MealSectionProps) {
  const items = isSnack ? SNACK_ITEMS : MEAL_ITEMS

  function toggle(key: string) {
    onChange({ ...checks, [key]: !(checks as Record<string, unknown>)[key] } as MealChecks | SnackChecks)
  }

  const total = items.length
  const done = items.filter(i => (checks as Record<string, unknown>)[i.key]).length

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            done === total ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
          )}>
            {done}/{total}
          </span>
          {!isSnack && recipeLink && (
            <a
              href={recipeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline"
            >
              Rețete →
            </a>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {items.map(item => {
          const checked = !!(checks as Record<string, unknown>)[item.key]
          return (
            <label
              key={item.key}
              className={cn(
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                checked ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.key)}
                className="mt-0.5 w-4 h-4 accent-brand-600 rounded cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', checked ? 'text-brand-700 line-through' : 'text-gray-700')}>
                  {item.label}
                </p>
                {'detail' in item && item.detail && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
