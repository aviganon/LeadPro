// ========== USERS & AUTH ==========

export type UserRole = 'admin' | 'user'
export type UserPlan = 'free' | 'basic' | 'pro' | 'enterprise'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  plan: UserPlan
  createdAt: Date
  updatedAt: Date
  stripeCustomerId?: string
  isActive: boolean
}

// ========== LEARNING DOMAIN ==========

/** רמת לימוד */
export type Level = 'elementary' | 'middle_high' | 'student'

/** שפת תוכן */
export type Lang = 'he' | 'en'

/** מוסד לימוד (רלוונטי לרמת student) — מכללה / אוניברסיטה */
export interface Institution {
  id: string
  name: string
  type: 'college' | 'university'
  order: number
}

/** מסלול/מחלקה בתוך מוסד (למשל: הנדסאי בניין) */
export interface Department {
  id: string
  institutionId: string
  name: string
  order: number
}

export interface Subject {
  id: string
  slug: string            // e.g. 'math', 'english', 'shenkar-binyan-statics'
  level: Level
  nameHe: string
  nameEn: string
  icon: string            // lucide icon name
  color: string           // tailwind/hex accent
  gradeFrom: number       // inclusive (לסטודנטים: שנת לימוד)
  gradeTo: number         // inclusive
  order: number
  /** רק לרמת student — שיוך למוסד ומסלול */
  institutionId?: string
  departmentId?: string
  /** רק לקורסי סטודנטים — סמסטר: 'a' / 'b' / 'both' (שנתי) */
  semester?: Semester
  /** מספר קורס (למשל 3855) — לתצוגה */
  courseNumber?: string
}

export type Semester = 'a' | 'b' | 'both'

export interface Topic {
  id: string
  subjectId: string
  level: Level
  grade: number
  nameHe: string
  nameEn: string
  order: number
}

export type QuestionType = 'mc' | 'numeric' | 'truefalse' | 'open'

export interface Question {
  id: string
  subjectId: string
  topicId?: string
  level: Level
  grade: number
  lang: Lang
  type: QuestionType
  prompt: string
  options?: string[]       // for 'mc'
  answer: string           // canonical answer (index-as-string for mc, value otherwise)
  explanation?: string
  difficulty: 1 | 2 | 3
}

export type GameType = 'quiz' | 'flashcards' | 'memory'

export interface Game {
  id: string
  subjectId: string
  type: GameType
  level: Level
  grade: number
  titleHe: string
  titleEn: string
  /** game-specific configuration (e.g. pairs for memory, cards for flashcards) */
  config: Record<string, unknown>
}

export interface Material {
  id: string
  subjectId: string
  topicId?: string
  level: Level
  grade: number
  lang: Lang
  title: string
  bodyMarkdown: string
  order: number
}

/** רשומת טבלת מנצחים (scope = מזהה הטבלה, למשל מקצוע+כיתה) */
export interface LeaderboardEntry {
  id: string
  scope: string
  name: string
  score: number
  verified: boolean   // true למשתמש מחובר
  updatedAt: Date
}

/** התקדמות משתמש (אופציונלי — נשמר רק למחוברים) */
export interface Progress {
  userId: string
  subjectId: string
  score: number
  streak: number
  xp: number
  lastPlayed: Date
}

// ========== SYSTEM ==========

export interface SystemConfig {
  maintenanceMode: boolean
  updatedAt: Date
}
