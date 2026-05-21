'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayISO, calcCompletionPct, formatDate } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_RECIPE_LINKS, DEFAULT_CHECKS, DEFAULT_SLIDERS } from '@/lib/program'
import MealSection from './MealSection'
import SliderGroup from './SliderGroup'
import SymptomsEditor from './SymptomsEditor'
import type { DailyReport, DailyChecks, DailySliders, Symptom, MealChecks, SnackChecks, Profile, ProgramPhase } from '@/lib/types'

interface Props {
  profile: Profile
  existingReport: DailyReport | null
  streak: number
  userId: string
  allowBackfill?: boolean
  appStartDate?: string | null
}

const PHASE_MESSAGES: Record<ProgramPhase, string> = {
  'Detox 21':  `Excelent! Focusul tău de mâine: hidratare maximă și rețeta de supă vegetală. Corpul tău se curăță!`,
  'Tranziție': `Bravo! Ești în faza de tranziție — sistemul tău digestiv se adaptează. Mâine: introdu treptat alimentele din Faza 1.`,
  'Faza 1':    `Fantastic! Microbiomul tău prinde viață. Mâine: nu uita probioticele înainte de masă și verifică rețetele săptămânii.`,
  'Faza 2':    `Extraordinar! Ești la jumătatea programului. Mâine: concentrează-te pe diversitatea alimentară și fermentate.`,
  'Faza 3':    `Superb! Programul tiroidian lucrează pentru tine. Mâine: suplimentele de tiroidă dimineața și expunere la soare 10 minute.`,
  'Faza 4':    `Incredibil! Ești în faza finală. Mâine: menține fereastra de post și hidratează-te bine.`,
}

export default function DailyChecklistForm({ profile, existingReport, streak, userId, allowBackfill, appStartDate }: Props) {
  const today = todayISO()
  const phase = getPhaseFromWeek(profile.week)
  const recipeLink = PHASE_RECIPE_LINKS[phase]
  const supabase = createClient()

  const [selectedDate, setSelectedDate] = useState(today)
  const [checks, setChecks] = useState<DailyChecks>(
    existingReport?.checks ?? (DEFAULT_CHECKS as DailyChecks)
  )
  const [sliders, setSliders] = useState<DailySliders>(
    existingReport?.sliders ?? DEFAULT_SLIDERS
  )
  const [symptoms, setSymptoms] = useState<Symptom[]>(
    existingReport?.symptoms ?? []
  )
  const [note, setNote] = useState<string>(existingReport?.note ?? '')
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existingReport)
  const [loadingDate, setLoadingDate] = useState(false)
  const [error, setError] = useState('')

  async function handleDateChange(date: string) {
    setSelectedDate(date)
    setSaved(false)
    setShowConfirm(false)
    setError('')

    if (date === today) {
      setChecks(existingReport?.checks ?? DEFAULT_CHECKS as DailyChecks)
      setSliders(existingReport?.sliders ?? DEFAULT_SLIDERS)
      setSymptoms(existingReport?.symptoms ?? [])
      setNote(existingReport?.note ?? '')
      setSaved(!!existingReport)
      return
    }

    setLoadingDate(true)
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    setLoadingDate(false)
    setChecks((data?.checks as DailyChecks) ?? DEFAULT_CHECKS as DailyChecks)
    setSliders((data?.sliders as DailySliders) ?? DEFAULT_SLIDERS)
    setSymptoms((data?.symptoms as Symptom[]) ?? [])
    setNote((data?.note as string) ?? '')
    setSaved(!!data)
  }

  const completionPct = calcCompletionPct(checks as unknown as Record<string, unknown>)

  const updateMeal = useCallback((meal: keyof DailyChecks, val: MealChecks | SnackChecks) => {
    setChecks(prev => ({ ...prev, [meal]: val }))
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('daily_reports')
      .upsert({
        user_id: userId,
        date: selectedDate,
        checks,
        sliders,
        symptoms,
        note: note || null,
        saved_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setShowConfirm(true)
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 py-12">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Ziua {formatDate(today)} completată!</h2>
        <div className="card max-w-md w-full text-left">
          <p className="text-gray-700 leading-relaxed">{PHASE_MESSAGES[phase]}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-2xl px-6 py-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-brand-700 text-lg">{streak} {streak === 1 ? 'zi' : 'zile'} consecutiv</p>
              <p className="text-xs text-brand-500">
                {streak >= 30 ? '🏆 30 zile — legendă!' : streak >= 21 ? '🥇 21 zile — incredibil!' : streak >= 14 ? '🥈 14 zile — excelent!' : streak >= 7 ? '🥉 7 zile — bravo!' : 'Continuă!'}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <a href="/istoric" className="btn-secondary">Vezi progresul</a>
          <a href="/dashboard" className="btn-primary">Înapoi la dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Backfill date selector */}
      {allowBackfill && appStartDate && (
        <div className="card flex flex-wrap items-center gap-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Completezi pentru:</label>
            <input
              type="date"
              min={appStartDate}
              max={today}
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              disabled={loadingDate}
              className="input w-auto text-sm py-1.5"
            />
            {loadingDate && <span className="text-xs text-gray-400">Se încarcă...</span>}
          </div>
          {selectedDate !== today && (
            <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              Completare retroactivă
            </span>
          )}
          {selectedDate !== today && (
            <button
              type="button"
              onClick={() => handleDateChange(today)}
              className="text-xs text-brand-600 hover:underline"
            >
              ← Înapoi la azi
            </button>
          )}
        </div>
      )}

      {/* Header progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Raport zilnic — {formatDate(selectedDate)}</h2>
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

      {/* Notița zilei */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Notița zilei</h3>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder="Cum te-ai simțit azi? Ce ai observat?"
          value={note}
          onChange={e => { setNote(e.target.value); setSaved(false) }}
        />
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
