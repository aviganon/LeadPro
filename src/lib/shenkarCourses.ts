import type { Semester } from '@/types'

export interface CourseSeed {
  number: string
  nameHe: string
  year: number
  semester: Semester
}

// הנדסאי בניין — שנקר הנדסאים. שנה א' (בלי שמות מרצים, בלי כפילויות תגבור).
// קורס שמופיע בשני הסמסטרים מסומן 'both' (שנתי).
export const SHENKAR_BINYAN_COURSES: CourseSeed[] = [
  // שנה א' — סמסטר א'
  { number: '1120', nameHe: 'קורס הכנה במתמטיקה', year: 1, semester: 'a' },
  { number: '1124', nameHe: 'אסטרטגיות למידה', year: 1, semester: 'a' },
  { number: '1134', nameHe: 'קורס הכנה בסטטיקה', year: 1, semester: 'a' },
  { number: '3853', nameHe: 'אנגלית טכנית', year: 1, semester: 'a' },
  { number: '4073', nameHe: 'גיאודזיה', year: 1, semester: 'a' },
  { number: '4099', nameHe: 'תורת הבנייה והמבנים', year: 1, semester: 'a' },
  { number: '4101', nameHe: 'חומרי בניין', year: 1, semester: 'a' },
  { number: '4131', nameHe: 'שרטוט טכני', year: 1, semester: 'a' },
  { number: '5176', nameHe: 'דיני תכנון', year: 1, semester: 'a' },
  { number: '5999', nameHe: 'כבישים, עבודות כבישים ותשתית', year: 1, semester: 'a' },

  // שנה א' — שנתי (סמסטר א'+ב')
  { number: '3855', nameHe: 'מתמטיקה', year: 1, semester: 'both' },
  { number: '6902', nameHe: 'לימודי מבנים', year: 1, semester: 'both' },
  { number: '6966', nameHe: 'בטיחות בבנייה', year: 1, semester: 'both' },

  // שנה א' — סמסטר ב'
  { number: '4096', nameHe: 'שרטוט אדריכלי ופרטי בניין', year: 1, semester: 'b' },
  { number: '4106', nameHe: 'קונסטרוקציית בטון', year: 1, semester: 'b' },
  { number: '6972', nameHe: 'ניתוח, אומדן ועלויות בנייה', year: 1, semester: 'b' },
  { number: '6973', nameHe: 'מערכות אלקטרו-מכאניות', year: 1, semester: 'b' },
  { number: '15094', nameHe: 'דיני עבודה וניהול עובדים', year: 1, semester: 'b' },
]
