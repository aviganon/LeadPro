'use client'

import { useState } from 'react'

/** קוד OpenMoji לאימוג'י: מורידים רק בורר-וריאציה (FE0F); רצף ZWJ (200D) נשמר. 🐶 → "1F436". */
export function emojiCode(emoji: string): string {
  return [...emoji]
    .map((c) => c.codePointAt(0) ?? 0)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16).toUpperCase())
    .join('-')
}

/**
 * איור OpenMoji לפי האימוג'י (קבצים מקומיים ב-public/openmoji).
 * אם האיור לא נטען — נופל בחזרה לאימוג'י הרגיל, כך שלעולם לא נשאר ריק.
 */
export function WordImage({ emoji, size = 56, className }: { emoji: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className={className} style={{ fontSize: size * 0.86, lineHeight: 1 }}>{emoji}</span>
  }
  return (
    <img
      src={`/openmoji/${emojiCode(emoji)}.svg`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      className={`inline-block select-none ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  )
}
