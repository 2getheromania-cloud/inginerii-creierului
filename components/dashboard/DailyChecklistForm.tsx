'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayISO, calcCompletionPct, formatDate } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_RECIPE_LINKS, DEFAULT_CHECKS, DEFAULT_SLIDERS } from '@/lib/program'
import MealSection from './MealSection'
import SliderGroup from './SliderGroup'
import SymptomsEditor from './SymptomsEditor'
import type { DailyReport, DailyChecks, DailySliders, Symptom, MealChecks, SnackChecks, Profile } from '@/lib/types'

interface Props {
  profile: Profile
  existingReport: DailyReport | null
}

export default function DailyChecklistForm({ profile, existingReport }: Props) {
  const today = todayISO()
  const phase = getPhaseFromWeek(profile.week)
  const recipeLink = PHASE_RECIPE_LINKS[phase]
  const supabase = createClient()

  const [checks, setChecks] = useState<DailyChecks>(
    existingReport?.checks ?? (DEFAULT_CHECKS as DailyChecks)
  )
  const [sliders, setSliders] = useState<DailySliders>(
    existingReport?.sliders ?? DEFAULT_SLIDERS
  )
  const [symptoms, setSymptoms] = useState<Symptom[]>(
    existingReport?.symptoms ?? []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existingReport)
  const [error, setError] = useState('')

  const completionPct = calcCompletionPct(checks as unknown as Record<string, unknown>)

  const updateMeal = useCallback((meal: keyof DailyChecks, val: MealChecks | SnackChecks) => {
    setChecks(prev => ({ ...prev, [meal]: val }))
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sesiunea a expirat.'); setSaving(false); return }

    const payload = {
      user_id: user.id,
      date: today,
      checks,
      sliders,
      symptoms,
      saved_at: new Date().toISOString(),
    }

    const { error: err } = await supabase
      .from('daily_reports')
      .upsert(payload, { onConflict: 'user_id,date' })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      {/* Header progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Raport zilnic — {formatDate(today)}</h2>
            <p className="text-sm text-gray-500">Faza curentă: <span className="font-medium text-brand-700">{phase}</span> · Săptămâna {profile.week}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600">{completionPct}%</div>
            <div className="text-xs text-gray-400">completat</div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Mese principale */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Mese principale</h3>
        <div className="space-y-3">
          <MealSection title="Mic dejun"  icon="🌅" checks={checks.breakfast} recipeLink={recipeLink} onChange={v => updateMeal('breakfast', v)} />
          <MealSection title="Prânz"      icon="☀️" checks={checks.lunch}     recipeLink={recipeLink} onChange={v => updateMeal('lunch',     v)} />
          <MealSection title="Cină"       icon="🌙" checks={checks.dinner}    recipeLink={recipeLink} onChange={v => updateMeal('dinner',    v)} />
        </div>
      </div>

      {/* Gustări */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Gustări (opțional)</h3>
        <div className="space-y-3">
          <MealSection title="Gustare 1" icon="🍎" isSnack checks={checks.snack1 ?? { protein: false, vegetables: false, fats: false, fruits: false }} onChange={v => updateMeal('snack1', v)} />
          <MealSection title="Gustare 2" icon="🥜" isSnack checks={checks.snack2 ?? { protein: false, vegetables: false, fats: false, fruits: false }} onChange={v => updateMeal('snack2', v)} />
        </div>
      </div>

      {/* Activități */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Activități zilnice</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { key: 'movement' as const,   label: 'Mișcare / exerciții', icon: '🏃' },
            { key: 'meditation' as const, label: 'Meditație',           icon: '🧘' },
          ].map(({ key, label, icon }) => (
            <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checks[key] ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                checked={!!checks[key]}
                onChange={() => { setChecks(prev => ({ ...prev, [key]: !prev[key] })); setSaved(false) }}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-sm font-medium text-gray-700">{icon} {label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Pași totali</label>
            <input
              type="number"
              min={0}
              className="input"
              value={checks.steps || ''}
              onChange={e => { setChecks(prev => ({ ...prev, steps: Number(e.target.value) })); setSaved(false) }}
              placeholder="ex: 8500"
            />
          </div>
          <div>
            <label className="label">Apă totală (ml)</label>
            <input
              type="number"
              min={0}
              step={50}
              className="input"
              value={checks.total_water_ml || ''}
              onChange={e => { setChecks(prev => ({ ...prev, total_water_ml: Number(e.target.value) })); setSaved(false) }}
              placeholder="ex: 2000"
            />
          </div>
        </div>
      </div>

      {/* Indicatori */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Indicatori zilnici</h3>
        <SliderGroup sliders={sliders} onChange={s => { setSliders(s); setSaved(false) }} />
      </div>

      {/* Simptome */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Simptome</h3>
        <SymptomsEditor symptoms={symptoms} onChange={s => { setSymptoms(s); setSaved(false) }} />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 text-base py-3"
        >
          {saving ? 'Se salvează...' : saved ? 'Salvat ✓' : 'Salvează raportul'}
        </button>
        {saved && !saving && (
          <span className="text-sm text-brand-600 font-medium">Raport salvat cu succes!</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
