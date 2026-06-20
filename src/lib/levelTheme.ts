// ערכת עיצוב לכל רמת לימוד — צבע, גרדיאנט, אייקון וכותרת משנה.
// משותף ל-/learn, ל-/learn/[subject] ולמסכים נוספים כדי לשמור שפה עיצובית אחת.
import { Shapes, Atom, GraduationCap, type LucideIcon } from 'lucide-react'
import type { Level } from '@/types'

export interface LevelTheme {
  icon: LucideIcon
  tagline: string
  grad: string        // גרדיאנט לכותרת/אייקון
  accent: string      // צבע מבטא (oklch)
  soft: string        // רקע רך למבטא
  glyphs: string[]    // סמלי למידה אופייניים לרמה
}

export const LEVEL_THEME: Record<Level, LevelTheme> = {
  elementary: {
    icon: Shapes,
    tagline: 'בונים יסודות חזקים — בהנאה',
    grad: 'linear-gradient(135deg, oklch(0.82 0.16 75) 0%, oklch(0.68 0.2 30) 100%)',
    accent: 'oklch(0.7 0.19 45)',
    soft: 'oklch(0.7 0.19 45 / 0.12)',
    glyphs: ['＋', '−', 'ABC', '△', '123'],
  },
  middle_high: {
    icon: Atom,
    tagline: 'מגלים, חוקרים ומעמיקים',
    grad: 'linear-gradient(135deg, oklch(0.74 0.15 195) 0%, oklch(0.58 0.25 295) 100%)',
    accent: 'oklch(0.62 0.2 250)',
    soft: 'oklch(0.62 0.2 250 / 0.12)',
    glyphs: ['π', 'Σ', '√', 'H₂O', '∞'],
  },
  student: {
    icon: GraduationCap,
    tagline: 'לתואר, למקצוע ולהסמכה',
    grad: 'linear-gradient(135deg, oklch(0.56 0.16 285) 0%, oklch(0.44 0.07 265) 100%)',
    accent: 'oklch(0.55 0.18 285)',
    soft: 'oklch(0.55 0.18 285 / 0.12)',
    glyphs: ['∫', 'Δ', 'λ', '∂', 'Σℱ'],
  },
}

export function levelTheme(level?: Level | null): LevelTheme | null {
  return level ? LEVEL_THEME[level] : null
}
