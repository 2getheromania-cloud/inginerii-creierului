export type UserRole = 'cursant' | 'admin'

export interface Profile {
  id: string
  name: string | null
  email: string
  role: UserRole
  week: number
  flags: ProtocolFlags
  saved_dates: Record<string, string>
  created_at: string
  reminder_time?: string
  app_start_date?: string | null
  allow_backfill?: boolean
  community_last_seen_at?: string | null
  onboarding_completed?: boolean | null
  protocols?: string[] | null
}

export interface ProtocolType {
  id: string
  name: string
  drive_url: string | null
  sort_order: number
  is_active: boolean
}

export interface ProtocolFlags {
  sibo: boolean
  candidoza: boolean
  rezistenta_insulina: boolean
  tiroida: boolean
}

export interface MealChecks {
  protein: boolean
  vegetables: boolean
  fats: boolean
  water: boolean
  supplements: boolean
  recipe: boolean
}

export interface SnackChecks {
  protein: boolean
  vegetables: boolean
  fats: boolean
  fruits: boolean
}

export interface DailyChecks {
  breakfast: MealChecks
  lunch: MealChecks
  dinner: MealChecks
  snack1?: SnackChecks
  snack2?: SnackChecks
  movement: boolean
  meditation: boolean
  steps: number
  total_water_ml: number
}

export interface DailySliders {
  energie: number
  somn: number
  stres: number
  stare_generala: number
  productivitate: number
  digestie?: number
  claritate?: number
  dispozitie?: number
}

export interface Symptom {
  name: string
  severity: number
}

export interface DailyReport {
  id: string
  user_id: string
  date: string
  checks: DailyChecks
  sliders: DailySliders
  symptoms: Symptom[]
  saved_at: string
  note?: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: 'daily_reminder' | 'weekly_summary' | 'inactivity_alert' | 'manual'
  channel: string
  message: string
  sent_at: string
}

export interface ChatMessageSender {
  id: string
  name: string | null
  email: string
  role: 'cursant' | 'admin'
}

export interface ChatReaction {
  emoji: string
  user_id: string
}

export interface ChatReplyPreview {
  id: string
  body: string | null
  image_url: string | null
  sender: { name: string | null; email: string }
}

export interface ChatMessage {
  id: string
  sender_id: string
  body: string | null
  image_url: string | null
  image_path: string | null
  message_type: 'message' | 'announcement'
  is_pinned: boolean
  is_announcement: boolean
  deleted_at: string | null
  created_at: string
  edited_at?: string | null
  reply_to_id?: string | null
  reply_to?: ChatReplyPreview | null
  sender: ChatMessageSender
  reactions?: ChatReaction[]
}

export interface PrivateReplyPreview {
  id: string
  content: string
  sender_id: string
}

export interface AdminMessage {
  id: string
  title: string
  body: string
  video_url: string | null
  target_type: 'all' | 'phase' | 'protocol'
  target_value: string | null
  is_active: boolean
  published_at: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  name: string
  file_path: string
  size_bytes: number | null
  uploaded_by: string
  is_global: boolean
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  created_at: string
}

export interface PrivateMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  edited_at?: string | null
  reactions?: ChatReaction[]
  reply_to_id?: string | null
  reply_to?: PrivateReplyPreview | null
}

export type ProgramPhase =
  | 'Detox 21'
  | 'Tranziție'
  | 'Faza 1'
  | 'Faza 2'
  | 'Faza 3'
  | 'Faza 4'

export interface AdminStats {
  id: string
  name: string | null
  email: string
  week: number
  flags: ProtocolFlags
  created_at: string
  last_report_date: string | null
  last_saved_at: string | null
  days_since_report: number | null
  reports_last_30_days: number
  onboarding_completed: boolean | null
}

export type VideoCategory = 'somn' | 'microbiom' | 'stres' | 'nutritie' | 'mindset' | 'tiroida' | 'general'

export interface VideoResource {
  id: string
  title: string
  description: string | null
  video_url: string
  category: VideoCategory
  target_type: 'all' | 'phase' | 'protocol'
  target_value: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}
