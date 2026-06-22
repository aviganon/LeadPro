// מוריד איורי OpenMoji (color SVG) עבור כל האימוג'ים שבשימוש משחקי הקריאה.
// הרצה: node scripts/fetch-openmoji.mjs
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs'

const src = readFileSync('src/lib/readingContent.ts', 'utf8')
const emojis = new Set()
for (const m of src.matchAll(/emoji:\s*'([^']+)'/g)) emojis.add(m[1])

const code = (e) => [...e].map((c) => c.codePointAt(0) ?? 0).filter((cp) => cp !== 0xfe0f).map((cp) => cp.toString(16).toUpperCase()).join('-')

mkdirSync('public/openmoji', { recursive: true })
const codes = [...new Set([...emojis].map(code))]
let have = 0
const need = []
for (const cd of codes) (existsSync(`public/openmoji/${cd}.svg`) ? have++ : need.push(cd))
console.log(`emojis: ${codes.length} | have: ${have} | need: ${need.length}`)

let ok = 0
const fail = []
for (const cd of need) {
  try {
    const r = await fetch(`https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/${cd}.svg`)
    if (r.ok) {
      const t = await r.text()
      if (t.includes('<svg')) { writeFileSync(`public/openmoji/${cd}.svg`, t); ok++ } else fail.push(cd)
    } else fail.push(`${cd}:${r.status}`)
  } catch { fail.push(`${cd}:err`) }
}
console.log(`downloaded: ${ok} | failed: ${fail.length}`, fail)
