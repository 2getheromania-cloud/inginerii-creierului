'use client'
import { useState } from 'react'
import { cn, getSliderColor } from '@/lib/utils'
import type { Symptom } from '@/lib/types'

interface SymptomsEditorProps {
  symptoms: Symptom[]
  onChange: (symptoms: Symptom[]) => void
}

export default function SymptomsEditor({ symptoms, onChange }: SymptomsEditorProps) {
  const [newName, setNewName] = useState('')

  function addSymptom() {
    if (!newName.trim()) return
    onChange([...symptoms, { name: newName.trim(), severity: 5 }])
    setNewName('')
  }

  function removeSymptom(idx: number) {
    onChange(symptoms.filter((_, i) => i !== idx))
  }

  function updateSeverity(idx: number, severity: number) {
    onChange(symptoms.map((s, i) => i === idx ? { ...s, severity } : s))
  }

  function updateName(idx: number, name: string) {
    onChange(symptoms.map((s, i) => i === idx ? { ...s, name } : s))
  }

  return (
    <div className="space-y-3">
      {symptoms.map((symptom, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={symptom.name}
              onChange={e => updateName(idx, e.target.value)}
              className="input flex-1 text-sm py-1.5"
              placeholder="Descrie simptomul..."
            />
            <button
              onClick={() => removeSymptom(idx)}
              className="text-red-400 hover:text-red-600 text-lg leading-none p-1"
              title="Șterge"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Severitate:</span>
            <input
              type="range"
              min={1} max={10} step={1}
              value={symptom.severity}
              onChange={e => updateSeverity(idx, Number(e.target.value))}
              className="flex-1 h-2 rounded-full accent-brand-600"
            />
            <span className={cn('text-xs font-bold w-8 text-right', getSliderColor(symptom.severity))}>
              {symptom.severity}/10
            </span>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
          className="input flex-1 text-sm"
          placeholder="Adaugă un simptom..."
        />
        <button
          onClick={addSymptom}
          disabled={!newName.trim()}
          className="btn-secondary text-sm px-3 py-2"
        >
          + Adaugă
        </button>
      </div>

      {symptoms.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Nu ai simptome înregistrate astăzi.
        </p>
      )}
    </div>
  )
}
