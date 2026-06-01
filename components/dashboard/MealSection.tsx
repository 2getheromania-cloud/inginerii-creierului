'use client'
import { cn } from '@/lib/utils'
import type { MealChecks, SnackChecks } from '@/lib/types'
import { RECIPE_GROUPS } from '@/lib/recipes'

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
    onChange({ ...(checks as unknown as Record<string, unknown>), [key]: !(checks as unknown as Record<string, boolean>)[key] } as unknown as MealChecks | SnackChecks)
  }

  function updateString(key: string, value: string) {
    onChange({ ...(checks as unknown as Record<string, unknown>), [key]: value } as unknown as MealChecks | SnackChecks)
  }

  const total = items.length
  const done = items.filter(i => (checks as unknown as Record<string, boolean>)[i.key]).length

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
          const checked = !!(checks as unknown as Record<string, boolean>)[item.key]

          if (item.key === 'recipe') {
            const mealChecks = checks as MealChecks
            return (
              <div key={item.key} className={cn('px-4 py-3 transition-colors', checked ? 'bg-brand-50' : 'bg-white')}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.key)}
                    className="mt-0.5 w-4 h-4 accent-brand-600 rounded cursor-pointer flex-shrink-0"
                  />
                  <p className={cn('text-sm font-medium', checked ? 'text-brand-700 line-through' : 'text-gray-700')}>
                    {item.label}
                  </p>
                </label>
                {checked && (
                  <div className="mt-3 ml-7 space-y-2">
                    <select
                      value={mealChecks.recipe_name ?? ''}
                      onChange={e => updateString('recipe_name', e.target.value)}
                      className="input text-sm py-1.5 w-full"
                    >
                      <option value="">-- Alege rețeta --</option>
                      {RECIPE_GROUPS.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.items.map(recipeName => (
                            <option key={recipeName} value={recipeName}>{recipeName}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <textarea
                      value={mealChecks.recipe_note ?? ''}
                      onChange={e => updateString('recipe_note', e.target.value)}
                      placeholder="Ce ai modificat sau de ce ai ales altceva? (opțional)"
                      className="input text-sm py-1.5 resize-none min-h-[60px] w-full"
                    />
                  </div>
                )}
              </div>
            )
          }

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
