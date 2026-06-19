// בנק תוכן התחלתי (יסודי): חשבון + אנגלית, כיתות א'–ו'.
// כל פריט מקבל מזהה דטרמיניסטי כדי שזריעה חוזרת לא תיצור כפילויות.

export interface SeedDoc {
  collection: 'subjects' | 'topics' | 'questions' | 'games' | 'materials' | 'institutions' | 'departments'
  id: string
  data: Record<string, unknown>
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ----- Math generators -----

function mathPairsForGrade(grade: number): { a: string; b: string; result: number }[] {
  const pairs: { a: string; b: string; result: number }[] = []
  const rnd = (n: number) => Math.floor(Math.random() * n) + 1
  const n = 6
  for (let i = 0; i < n; i++) {
    if (grade <= 1) {
      const x = rnd(9), y = rnd(10 - x)
      pairs.push({ a: `${x} + ${y}`, b: `${x + y}`, result: x + y })
    } else if (grade === 2) {
      const x = rnd(18), y = rnd(20 - x)
      pairs.push({ a: `${x} + ${y}`, b: `${x + y}`, result: x + y })
    } else if (grade === 3) {
      const x = rnd(5) + 1, y = rnd(9) + 1
      pairs.push({ a: `${x} × ${y}`, b: `${x * y}`, result: x * y })
    } else if (grade === 4) {
      const x = rnd(10), y = rnd(10)
      pairs.push({ a: `${x} × ${y}`, b: `${x * y}`, result: x * y })
    } else if (grade === 5) {
      const y = rnd(9) + 1, q = rnd(9) + 1
      pairs.push({ a: `${y * q} ÷ ${y}`, b: `${q}`, result: q })
    } else {
      const p = (rnd(9) + 1) * 10, pct = [10, 20, 25, 50][i % 4]
      pairs.push({ a: `${pct}% מתוך ${p}`, b: `${(p * pct) / 100}`, result: (p * pct) / 100 })
    }
  }
  return pairs
}

function mcOptions(correct: number): { options: string[]; answer: string } {
  const set = new Set<number>([correct])
  let delta = 1
  while (set.size < 4) {
    set.add(correct + delta)
    if (correct - delta >= 0) set.add(correct - delta)
    delta++
  }
  const options = shuffle(Array.from(set).slice(0, 4)).map(String)
  if (!options.includes(String(correct))) options[0] = String(correct)
  return { options: shuffle(options), answer: String(correct) }
}

// ----- English vocab -----

const VOCAB: { en: string; he: string }[] = [
  { en: 'cat', he: 'חתול' }, { en: 'dog', he: 'כלב' }, { en: 'sun', he: 'שמש' },
  { en: 'book', he: 'ספר' }, { en: 'apple', he: 'תפוח' }, { en: 'water', he: 'מים' },
  { en: 'house', he: 'בית' }, { en: 'tree', he: 'עץ' }, { en: 'friend', he: 'חבר' },
  { en: 'happy', he: 'שמח' }, { en: 'school', he: 'בית ספר' }, { en: 'teacher', he: 'מורה' },
  { en: 'family', he: 'משפחה' }, { en: 'beautiful', he: 'יפה' }, { en: 'important', he: 'חשוב' },
  { en: 'because', he: 'בגלל' }, { en: 'together', he: 'ביחד' }, { en: 'different', he: 'שונה' },
]

function vocabForGrade(grade: number): { en: string; he: string }[] {
  const start = Math.min((grade - 1) * 2, VOCAB.length - 6)
  return VOCAB.slice(Math.max(0, start), Math.max(6, start + 6))
}

// ----- Build the full seed set -----

export function buildSeedDocs(): SeedDoc[] {
  const docs: SeedDoc[] = []

  docs.push({
    collection: 'subjects', id: 'math',
    data: { slug: 'math', level: 'elementary', nameHe: 'חשבון', nameEn: 'Math', icon: 'Calculator', color: '#7C3AED', gradeFrom: 1, gradeTo: 6, order: 1 },
  })
  docs.push({
    collection: 'subjects', id: 'english',
    data: { slug: 'english', level: 'elementary', nameHe: 'אנגלית', nameEn: 'English', icon: 'Languages', color: '#06B6D4', gradeFrom: 1, gradeTo: 6, order: 2 },
  })

  // --- STUDENT STRUCTURE: שנקר הנדסאים → הנדסאי בניין (קורסים יתווספו בהמשך) ---
  docs.push({
    collection: 'institutions', id: 'shenkar-handasaim',
    data: { name: 'מכללת שנקר הנדסאים', type: 'college', order: 1 },
  })
  docs.push({
    collection: 'departments', id: 'shenkar-binyan',
    data: { institutionId: 'shenkar-handasaim', name: 'הנדסאי בניין', order: 1 },
  })

  for (let grade = 1; grade <= 6; grade++) {
    // --- MATH ---
    const mpairs = mathPairsForGrade(grade)
    mpairs.forEach((p, i) => {
      const { options, answer } = mcOptions(p.result)
      docs.push({
        collection: 'questions', id: `math-g${grade}-q${i}`,
        data: {
          subjectId: 'math', level: 'elementary', grade, lang: 'he', type: 'mc',
          prompt: `כמה זה ${p.a}?`, options, answer, explanation: `${p.a} = ${p.result}`, difficulty: grade <= 2 ? 1 : grade <= 4 ? 2 : 3,
        },
      })
    })
    docs.push({
      collection: 'games', id: `math-g${grade}-memory`,
      data: {
        subjectId: 'math', type: 'memory', level: 'elementary', grade,
        titleHe: 'זיכרון חשבון', titleEn: 'Math Memory',
        config: { pairs: mpairs.map((p) => ({ a: p.a, b: p.b })) },
      },
    })
    docs.push({
      collection: 'games', id: `math-g${grade}-quiz`,
      data: { subjectId: 'math', type: 'quiz', level: 'elementary', grade, titleHe: 'חידון חשבון', titleEn: 'Math Quiz', config: {} },
    })
    docs.push({
      collection: 'materials', id: `math-g${grade}-help`,
      data: {
        subjectId: 'math', level: 'elementary', grade, lang: 'he', order: 1,
        title: `טיפים לחשבון — כיתה ${grade}`,
        bodyMarkdown: `כדי לפתור תרגילים בקלות:\n\n• קראו את התרגיל לאט\n• פרקו מספרים גדולים לקטנים\n• בדקו את התשובה בסוף\n\nתרגול קצר כל יום עוזר הכי הרבה! 💪`,
      },
    })

    // --- ENGLISH ---
    const vocab = vocabForGrade(grade)
    vocab.forEach((w, i) => {
      const distractors = shuffle(VOCAB.filter((v) => v.he !== w.he)).slice(0, 3).map((v) => v.he)
      const options = shuffle([w.he, ...distractors])
      docs.push({
        collection: 'questions', id: `english-g${grade}-q${i}`,
        data: {
          subjectId: 'english', level: 'elementary', grade, lang: 'en', type: 'mc',
          prompt: `What does "${w.en}" mean?`, options, answer: w.he, explanation: `${w.en} = ${w.he}`, difficulty: grade <= 2 ? 1 : grade <= 4 ? 2 : 3,
        },
      })
    })
    docs.push({
      collection: 'games', id: `english-g${grade}-flashcards`,
      data: {
        subjectId: 'english', type: 'flashcards', level: 'elementary', grade,
        titleHe: 'כרטיסיות מילים', titleEn: 'Word Flashcards',
        config: { cards: vocab.map((w) => ({ front: w.en, back: w.he })) },
      },
    })
    docs.push({
      collection: 'games', id: `english-g${grade}-memory`,
      data: {
        subjectId: 'english', type: 'memory', level: 'elementary', grade,
        titleHe: 'זיכרון מילים', titleEn: 'Word Memory',
        config: { pairs: vocab.map((w) => ({ a: w.en, b: w.he })) },
      },
    })
    docs.push({
      collection: 'materials', id: `english-g${grade}-help`,
      data: {
        subjectId: 'english', level: 'elementary', grade, lang: 'he', order: 1,
        title: `איך ללמוד מילים באנגלית — כיתה ${grade}`,
        bodyMarkdown: `דרכים כיפיות לזכור מילים:\n\n• שחקו בכרטיסיות ובזיכרון\n• אמרו את המילה בקול\n• חפשו את המילה בשיר או סרטון\n\nכמה מילים חדשות כל יום, ותתפלאו כמה מהר זוכרים! ✨`,
      },
    })
  }

  return docs
}
