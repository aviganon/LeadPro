import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  User, Subject, Topic, Question, Game, Material, Progress, Level,
  Institution, Department, ExamResult,
} from '@/types'

// ========== COLLECTIONS ==========
const USERS = 'users'
const SUBJECTS = 'subjects'
const TOPICS = 'topics'
const QUESTIONS = 'questions'
const GAMES = 'games'
const MATERIALS = 'materials'
const PROGRESS = 'progress'
const INSTITUTIONS = 'institutions'
const DEPARTMENTS = 'departments'
const EXAM_RESULTS = 'exam_results'

// ========== USERS ==========

export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, USERS, userId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as User
}

/**
 * יוצר מסמך משתמש רק אם אינו קיים — לא דורס role/plan (למשל admin) בכניסה חוזרת.
 */
export async function createUser(userId: string, data: Omit<User, 'id'>): Promise<void> {
  const ref = doc(db, USERS, userId)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, USERS, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(query(collection(db, USERS), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User))
}

// ========== SUBJECTS ==========

export async function getSubjects(level?: Level): Promise<Subject[]> {
  // מיון בצד הלקוח (בלי orderBy ב-Firestore) — נמנע מתלות באינדקס מורכב שצריך זמן בנייה.
  const base = collection(db, SUBJECTS)
  const snap = await getDocs(level ? query(base, where('level', '==', level)) : query(base))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Subject))
    .sort((a, b) => a.order - b.order)
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const snap = await getDocs(query(collection(db, SUBJECTS), where('slug', '==', slug)))
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Subject
}

/** קורסים של מסלול סטודנטים לשנה (ואופציונלית לסמסטר) נתונים */
export async function getDepartmentSubjects(
  departmentId: string,
  year: number,
  semester?: 'a' | 'b',
): Promise<Subject[]> {
  const snap = await getDocs(
    query(collection(db, SUBJECTS), where('departmentId', '==', departmentId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Subject))
    .filter(s => year >= s.gradeFrom && year <= s.gradeTo)
    .filter(s => !semester || !s.semester || s.semester === 'both' || s.semester === semester)
    .sort((a, b) => (a.courseNumber ?? '').localeCompare(b.courseNumber ?? '') || a.order - b.order)
}

/** כל הקורסים של מסלול (כל השנים) — לשימוש בניהול */
export async function getDepartmentCourses(departmentId: string): Promise<Subject[]> {
  const snap = await getDocs(
    query(collection(db, SUBJECTS), where('departmentId', '==', departmentId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Subject))
    .sort((a, b) => a.gradeFrom - b.gradeFrom || a.order - b.order)
}

// ========== INSTITUTIONS & DEPARTMENTS (student level) ==========

export async function getInstitutions(): Promise<Institution[]> {
  const snap = await getDocs(query(collection(db, INSTITUTIONS)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Institution))
    .sort((a, b) => a.order - b.order)
}

export async function getDepartments(institutionId: string): Promise<Department[]> {
  // בלי orderBy — מיון בצד הלקוח כדי שלא נחכה לבניית אינדקס מורכב
  const snap = await getDocs(
    query(collection(db, DEPARTMENTS), where('institutionId', '==', institutionId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Department))
    .sort((a, b) => a.order - b.order)
}

// ========== TOPICS ==========

export async function getTopics(subjectId: string, grade?: number): Promise<Topic[]> {
  const base = collection(db, TOPICS)
  const q = grade != null
    ? query(base, where('subjectId', '==', subjectId), where('grade', '==', grade))
    : query(base, where('subjectId', '==', subjectId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Topic))
    .sort((a, b) => a.order - b.order)
}

// ========== QUESTIONS ==========

export async function getQuestions(subjectId: string, grade: number): Promise<Question[]> {
  const snap = await getDocs(
    query(collection(db, QUESTIONS),
      where('subjectId', '==', subjectId),
      where('grade', '==', grade),
    )
  )
  // שאלות שדווחו ועדיין לא טופלו (reportedHidden) מוסתרות מהמשתמשים
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Question))
    .filter(q => q.reportedHidden !== true)
}

// ========== GAMES ==========

export async function getGames(subjectId: string, grade: number): Promise<Game[]> {
  const snap = await getDocs(
    query(collection(db, GAMES),
      where('subjectId', '==', subjectId),
      where('grade', '==', grade),
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Game))
}

export async function getGame(gameId: string): Promise<Game | null> {
  const snap = await getDoc(doc(db, GAMES, gameId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Game
}

// ========== MATERIALS ==========

export async function getMaterials(subjectId: string, grade: number): Promise<Material[]> {
  const snap = await getDocs(
    query(collection(db, MATERIALS),
      where('subjectId', '==', subjectId),
      where('grade', '==', grade),
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Material))
}

// ========== PROGRESS (logged-in users only) ==========

export async function getProgress(userId: string, subjectId: string): Promise<Progress | null> {
  const snap = await getDoc(doc(db, PROGRESS, `${userId}_${subjectId}`))
  if (!snap.exists()) return null
  return snap.data() as Progress
}

export async function saveProgress(p: Progress): Promise<void> {
  await setDoc(doc(db, PROGRESS, `${p.userId}_${p.subjectId}`), {
    ...p,
    lastPlayed: serverTimestamp(),
  }, { merge: true })
}

// ========== EXAM RESULTS (logged-in users) ==========
// docId = `${userId}__${subjectId}__${grade}__${paper}` — owner-scoped, שומר ציון מרבי.

function examResultId(userId: string, subjectId: string, grade: number, paper: string): string {
  return `${userId}__${subjectId}__${grade}__${paper}`.replace(/[^a-zA-Z0-9_֐-׿.:-]/g, '_')
}

export async function getExamResults(userId: string, subjectId: string, grade: number): Promise<ExamResult[]> {
  // שאילתה לפי userId בלבד (בלי אינדקס מורכב) — סינון מקצוע/כיתה בצד הלקוח
  const snap = await getDocs(query(collection(db, EXAM_RESULTS), where('userId', '==', userId)))
  return snap.docs
    .map(d => d.data() as ExamResult)
    .filter(r => r.subjectId === subjectId && r.grade === grade)
}

/** שומר/מעדכן תוצאת מבחן למשתמש רשום — שומר את הציון המרבי וסופר נסיונות. */
export async function saveExamResult(
  userId: string, subjectId: string, grade: number, paper: string, gradeVal: number,
): Promise<void> {
  const ref = doc(db, EXAM_RESULTS, examResultId(userId, subjectId, grade, paper))
  const snap = await getDoc(ref)
  const prevBest = snap.exists() ? Number((snap.data() as ExamResult).bestGrade ?? 0) : 0
  const prevAttempts = snap.exists() ? Number((snap.data() as ExamResult).attempts ?? 0) : 0
  await setDoc(ref, {
    userId, subjectId, grade, paper,
    bestGrade: Math.max(prevBest, gradeVal),
    lastGrade: gradeVal,
    attempts: prevAttempts + 1,
    lastAt: serverTimestamp(),
  }, { merge: true })
}
