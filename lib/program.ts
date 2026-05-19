import type { ProgramPhase, ProtocolFlags } from './types'

export function getPhaseFromWeek(week: number): ProgramPhase {
  if (week <= 3)  return 'Detox 21'
  if (week <= 5)  return 'Tranziție'
  if (week <= 10) return 'Faza 1'
  if (week <= 15) return 'Faza 2'
  if (week <= 20) return 'Faza 3'
  return 'Faza 4'
}

export const PHASE_COLORS: Record<ProgramPhase, string> = {
  'Detox 21':  'bg-purple-100 text-purple-800',
  'Tranziție': 'bg-yellow-100 text-yellow-800',
  'Faza 1':    'bg-blue-100 text-blue-800',
  'Faza 2':    'bg-green-100 text-green-800',
  'Faza 3':    'bg-teal-100 text-teal-800',
  'Faza 4':    'bg-brand-100 text-brand-800',
}

// Link-uri Drive per fază (placeholder-e — admin le actualizează)
export const PHASE_RECIPE_LINKS: Record<ProgramPhase, string> = {
  'Detox 21':  'https://drive.google.com/drive/folders/DETOX21_FOLDER_ID',
  'Tranziție': 'https://drive.google.com/drive/folders/TRANZITIE_FOLDER_ID',
  'Faza 1':    'https://drive.google.com/drive/folders/FAZA1_FOLDER_ID',
  'Faza 2':    'https://drive.google.com/drive/folders/FAZA2_FOLDER_ID',
  'Faza 3':    'https://drive.google.com/drive/folders/FAZA3_FOLDER_ID',
  'Faza 4':    'https://drive.google.com/drive/folders/FAZA4_FOLDER_ID',
}

export const PROTOCOL_LINKS: Record<keyof ProtocolFlags, string> = {
  sibo:                  'https://drive.google.com/drive/folders/SIBO_FOLDER_ID',
  candidoza:             'https://drive.google.com/drive/folders/CANDIDOZA_FOLDER_ID',
  rezistenta_insulina:   'https://drive.google.com/drive/folders/INSULINA_FOLDER_ID',
  tiroida:               'https://drive.google.com/drive/folders/TIROIDA_FOLDER_ID',
}

export const PROTOCOL_LABELS: Record<keyof ProtocolFlags, string> = {
  sibo:                'SIBO',
  candidoza:           'Candidoză',
  rezistenta_insulina: 'Rezistență la insulină',
  tiroida:             'Tiroidă',
}

export const PROGRAM_PHASES: { phase: ProgramPhase; weeks: string; color: string }[] = [
  { phase: 'Detox 21',  weeks: 'Săpt. 1–3',   color: 'purple' },
  { phase: 'Tranziție', weeks: 'Săpt. 4–5',   color: 'yellow' },
  { phase: 'Faza 1',    weeks: 'Săpt. 5–10',  color: 'blue'   },
  { phase: 'Faza 2',    weeks: 'Săpt. 10–15', color: 'green'  },
  { phase: 'Faza 3',    weeks: 'Săpt. 15–20', color: 'teal'   },
  { phase: 'Faza 4',    weeks: 'Săpt. 20–24', color: 'brand'  },
]

export const SLIDER_LABELS: Record<string, string> = {
  energie:        'Energie',
  somn:           'Calitate somn',
  stres:          'Nivel stres',
  stare_generala: 'Stare generală',
  productivitate: 'Productivitate',
}

export const DEFAULT_CHECKS = {
  breakfast: { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  lunch:     { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  dinner:    { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  snack1:    { protein: false, vegetables: false, fats: false, fruits: false },
  snack2:    { protein: false, vegetables: false, fats: false, fruits: false },
  movement:  false,
  meditation: false,
  steps:     0,
  total_water_ml: 0,
}

export const DEFAULT_SLIDERS = {
  energie: 5,
  somn: 5,
  stres: 5,
  stare_generala: 5,
  productivitate: 5,
}
