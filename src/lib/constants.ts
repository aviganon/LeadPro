// ========== APP CONFIG ==========
// שם המוצר — מקור יחיד. שינוי כאן משנה בכל המערכת.
export const APP_NAME = 'ApexLeads'
export const APP_TAGLINE = 'לומדים תוך כדי משחק'
export const APP_DESCRIPTION =
  'פלטפורמת למידה ומשחקים לתלמידים וסטודנטים — בוחרים רמה, כיתה ומקצוע ומקבלים משחקים, שאלות תרגול וחומרי עזר חכמים.'
export const APP_LOGO = '/logo-apexleads.jpg'

// ========== LEVELS ==========
export const LEVELS = [
  { id: 'elementary', nameHe: 'בית ספר יסודי', nameEn: 'Elementary', emoji: '🎒', grades: [1, 2, 3, 4, 5, 6] },
  { id: 'middle_high', nameHe: 'חטיבה ותיכון', nameEn: 'Middle & High', emoji: '📚', grades: [7, 8, 9, 10, 11, 12] },
  { id: 'student', nameHe: 'סטודנטים', nameEn: 'Students', emoji: '🎓', grades: [1, 2, 3, 4] },
] as const

// אותיות הכיתות בישראל: א'–יב'. לסטודנטים מציגים את מספר השנה.
const HEB_GRADE = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב']

/** תווית כיתה/שנה לתצוגה: בית ספר → אות עברית; סטודנט → מספר השנה. */
export function gradeLabel(grade: number, isStudent = false): string {
  if (isStudent) return String(grade)
  return HEB_GRADE[grade] ?? String(grade)
}
