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

// ---------------------------------------------------------------
// Config rețete per fază — single URL sau dual Vegetarian/Omnivor
// ---------------------------------------------------------------
export type PhaseRecipeConfig =
  | { kind: 'single'; url: string; label?: string }
  | { kind: 'dual';   vegetarian: string; omnivor: string }

export const PHASE_RECIPE_CONFIGS: Record<ProgramPhase, PhaseRecipeConfig> = {
  'Detox 21':  {
    kind: 'single',
    url: 'https://drive.google.com/drive/folders/1KXKUckDsC7E-x2W52ENiTJ6jHFCy1rPq',
  },
  'Tranziție': {
    kind: 'single',
    url: 'https://drive.google.com/drive/folders/10kE_6NTKmktFC2SfRP7NFXPqmqti9-gs',
  },
  'Faza 1': {
    kind: 'dual',
    vegetarian: 'https://drive.google.com/drive/folders/12kx4JIFU1ev6Jl30CqTpmBMdeac16vVm',
    omnivor:    'https://drive.google.com/drive/folders/1h6KDUQY5ZTdgqBXpp5tlhUfY8tYBy-xn',
  },
  'Faza 2': {
    kind: 'dual',
    vegetarian: 'https://drive.google.com/drive/folders/1nlC8dibhxjgVYettn274FNAut5rS56Aj',
    omnivor:    'https://drive.google.com/drive/folders/1SFSzawIozKTTeLtayBRywvpH7lM127Xa',
  },
  'Faza 3': {
    kind: 'single',
    url:   'https://docs.google.com/document/d/15DBt-j8z5cI3FqeBWQ8qEHpfWcULXpRlVAcykp8GOrc/edit',
    label: 'Protocol Tiroidă 30 zile',
  },
  'Faza 4': {
    kind: 'single',
    url:   'https://drive.google.com/drive/folders/1VPBPtgZz33Shuy3uHLSKnHWQmT9-kuM_',
    label: 'Post Intermitent',
  },
}

// Link unic per fază pentru dashboard/checklist (Vegetarian ca default pentru fazele duale)
export const PHASE_RECIPE_LINKS: Record<ProgramPhase, string> = Object.fromEntries(
  Object.entries(PHASE_RECIPE_CONFIGS).map(([phase, cfg]) => [
    phase,
    cfg.kind === 'single' ? cfg.url : cfg.vegetarian,
  ])
) as Record<ProgramPhase, string>

// ---------------------------------------------------------------
// Protocoale
// ---------------------------------------------------------------
export const PROTOCOL_LINKS: Record<keyof ProtocolFlags, string> = {
  sibo:                'https://drive.google.com/drive/folders/SIBO_FOLDER_ID',
  candidoza:           'https://drive.google.com/drive/folders/CANDIDOZA_FOLDER_ID',
  rezistenta_insulina: 'https://drive.google.com/drive/folders/INSULINA_FOLDER_ID',
  tiroida:             'https://docs.google.com/document/d/15DBt-j8z5cI3FqeBWQ8qEHpfWcULXpRlVAcykp8GOrc/edit',
}

export const PROTOCOL_LABELS: Record<keyof ProtocolFlags, string> = {
  sibo:                'SIBO',
  candidoza:           'Candidoză',
  rezistenta_insulina: 'Rezistență la insulină',
  tiroida:             'Tiroidă',
}

// ---------------------------------------------------------------
// Materiale generale
// ---------------------------------------------------------------
export const GENERAL_MATERIALS = [
  {
    title: 'Ghid nutriție',
    icon: '🥗',
    desc: 'Principiile 4R ale programului și protocolul de microbiom.',
    url: 'https://docs.google.com/document/d/1Q7Z_-ussigexqSLv0upI2MCVUs5WPKrOe8wk9Vu9-w8/edit',
  },
  {
    title: 'Suplimente Microbiom',
    icon: '💊',
    desc: 'Lista completă de suplimente pentru refacerea microbiomului.',
    url: 'https://docs.google.com/document/d/1xD9oMmTr_OD8NotMj_aM0A5yQKiX9ty_MNzwMtA1RhQ/edit',
  },
  {
    title: 'Suplimente Tiroidă',
    icon: '🦋',
    desc: 'Protocol de suplimentare specific pentru tiroidă.',
    url: 'https://docs.google.com/document/d/1abH79JfZmD45VVwluyygJzb3gL9UOaHRO6hDCXUylIw/edit',
  },
  {
    title: 'Cum să pierzi grăsime fără să pierzi mușchi',
    icon: '🏋️',
    desc: 'Ghid complet — fără să-ți încetinești tiroida.',
    url: 'https://drive.google.com/file/d/1vSNsHrQuGDUaqe_b5ObavKHE_Q2OWUFK/view',
  },
  {
    title: 'Program săptămânal',
    icon: '🗓️',
    desc: '3 zile/săptămână, full body — plan de antrenament structurat.',
    url: 'https://drive.google.com/file/d/1TGSdX_2upUfCj5lzuyxdLJnlABEk12W6/view',
  },
  {
    title: 'Gestionarea stresului',
    icon: '🧘',
    desc: 'Tehnici de meditație și relaxare pentru echilibrul hormonal.',
    url: 'https://drive.google.com/drive/folders/13WtYGaMAL3LJb-Hk-WVQek7ztTLtZR4-',
  },
  {
    title: 'Somn & recuperare',
    icon: '😴',
    desc: 'Optimizarea somnului pentru sănătatea microbiomului.',
    url: 'https://drive.google.com/drive/folders/1aoE-rnM6RgMd-Ur3NGc7uymZwPhvtrvr',
  },
  {
    title: 'Teste program',
    icon: '🔬',
    desc: 'Analize și teste recomandate pe parcursul programului.',
    url: 'https://docs.google.com/document/d/1N84crIydGWBuh_tLLfgmsscBjOv-7_d2HlN8imxpZiE/edit',
  },
  {
    title: 'Materiale suport curs',
    icon: '📚',
    desc: 'Resurse și materiale de suport pentru cursul de microbiom.',
    url: 'https://drive.google.com/drive/folders/1lXGP6buOq2pGPsu3Kv1Now1VA2SN1JTs',
  },
] as const

// ---------------------------------------------------------------
// Structura faze pentru UI
// ---------------------------------------------------------------
export const PROGRAM_PHASES: { phase: ProgramPhase; weeks: string }[] = [
  { phase: 'Detox 21',  weeks: 'Săpt. 1–3'   },
  { phase: 'Tranziție', weeks: 'Săpt. 4–5'   },
  { phase: 'Faza 1',    weeks: 'Săpt. 5–10'  },
  { phase: 'Faza 2',    weeks: 'Săpt. 10–15' },
  { phase: 'Faza 3',    weeks: 'Săpt. 15–20' },
  { phase: 'Faza 4',    weeks: 'Săpt. 20–24' },
]

// ---------------------------------------------------------------
// Slidere / checklist defaults
// ---------------------------------------------------------------
export const SLIDER_LABELS: Record<string, string> = {
  energie:        'Energie',
  somn:           'Calitate somn',
  stres:          'Nivel stres',
  stare_generala: 'Stare generală',
  productivitate: 'Productivitate',
  digestie:       'Digestie',
  claritate:      'Claritate mentală',
  dispozitie:     'Dispoziție emoțională',
}

export const DEFAULT_CHECKS = {
  breakfast:  { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  lunch:      { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  dinner:     { protein: false, vegetables: false, fats: false, water: false, supplements: false, recipe: false },
  snack1:     { protein: false, vegetables: false, fats: false, fruits: false },
  snack2:     { protein: false, vegetables: false, fats: false, fruits: false },
  movement:   false,
  meditation: false,
  steps:      0,
  total_water_ml: 0,
}

export const DEFAULT_SLIDERS = {
  energie: 5,
  somn: 5,
  stres: 5,
  stare_generala: 5,
  productivitate: 5,
  digestie: 5,
  claritate: 5,
  dispozitie: 5,
}
