// Template rendering engine
// Supports {{variable}} placeholders and AI-assisted generation

import type { PostTemplate, Lead, LeadVertical } from '@/types'

// ========== BUILT-IN TEMPLATES ==========

export const DEFAULT_TEMPLATES: Omit<PostTemplate, 'id' | 'createdAt'>[] = [
  // Real estate
  {
    userId: 'system',
    vertical: 'real_estate',
    name: 'נדל"ן - חיפוש כללי',
    bodyTemplate: `🏠 מחפשים דירה ב{{city}}?

אני {{agentName}}, מתמחה בנדל"ן באזור {{area}}.

✅ תיווך ממוקד ומקצועי
✅ ליווי מלא בתהליך הקנייה/שכירות  
✅ גישה לנכסים שאינם מפורסמים

השאירו פרטים בתגובה או צרו קשר ישירות.
{{phone}}`,
    variables: ['city', 'agentName', 'area', 'phone'],
    isActive: true,
  },
  {
    userId: 'system',
    vertical: 'real_estate',
    name: 'נדל"ן - מוכרים',
    bodyTemplate: `💰 שוקלים למכור?

שוק הנדל"ן ב{{city}} פעיל כרגע.
קיבלתי פניות מרוכשים שמחפשים ב{{area}}.

{{agentName}} | {{phone}}
הערכת שווי חינמית ללא התחייבות 📊`,
    variables: ['city', 'area', 'agentName', 'phone'],
    isActive: true,
  },
  // Car
  {
    userId: 'system',
    vertical: 'car',
    name: 'רכב - קנייה',
    bodyTemplate: `🚗 מחפש {{carModel}}?

יש לי גישה למלאי עדכני ומחירים תחרותיים.

{{dealerName}} | {{city}}
📞 {{phone}}

השאירו פרטים ואחזור אליכם תוך שעה ✅`,
    variables: ['carModel', 'dealerName', 'city', 'phone'],
    isActive: true,
  },
  {
    userId: 'system',
    vertical: 'car',
    name: 'רכב - לידים ממכירה',
    bodyTemplate: `💡 מוכרים רכב?

אני {{dealerName}}, קונה רכבים מכל הסוגים.
💰 תשלום מיידי ביום העסקה
📋 טיפול בכל הניירת
🚗 עובד עם כל הדגמים

{{phone}} | {{city}}`,
    variables: ['dealerName', 'phone', 'city'],
    isActive: true,
  },
]

// ========== RENDERER ==========

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match)
}

export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g)
  const vars = new Set<string>()
  for (const match of matches) vars.add(match[1])
  return Array.from(vars)
}

// ========== AI GENERATION ==========

export async function generatePostFromLead(
  lead: Partial<Lead>,
  vertical: LeadVertical,
  agentInfo: { name: string; phone: string; city?: string }
): Promise<string> {
  const prompt = buildLeadPrompt(lead, vertical, agentInfo)

  try {
    const res = await fetch('/api/ai/generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    return data.text ?? fallbackPost(vertical, agentInfo)
  } catch {
    return fallbackPost(vertical, agentInfo)
  }
}

function buildLeadPrompt(
  lead: Partial<Lead>,
  vertical: LeadVertical,
  agentInfo: { name: string; phone: string; city?: string }
): string {
  const verticalLabel = vertical === 'real_estate' ? 'נדל"ן' : vertical === 'car' ? 'רכב' : vertical
  return `כתוב פוסט קצר (עד 150 מילים) בעברית לפרסום בקבוצת פייסבוק בתחום ${verticalLabel}.
המידע על הליד: ${lead.notes ?? 'לא זמין'}
שם הסוכן: ${agentInfo.name}
טלפון: ${agentInfo.phone}
עיר: ${agentInfo.city ?? 'ישראל'}
הפוסט צריך להיות מזמין, מקצועי, עם אימוג'י מתאים. אל תכתוב כותרת, רק את גוף הפוסט.`
}

function fallbackPost(vertical: LeadVertical, agentInfo: { name: string; phone: string }): string {
  if (vertical === 'real_estate') {
    return `🏠 שירותי נדל"ן מקצועיים\n\n${agentInfo.name} | 📞 ${agentInfo.phone}\n\nצרו קשר לפגישת ייעוץ ✅`
  }
  return `🚗 שירותי רכב מקצועיים\n\n${agentInfo.name} | 📞 ${agentInfo.phone}\n\nצרו קשר ✅`
}

// ========== VERTICAL CONFIG ==========

export const VERTICAL_CONFIG: Record<string, { label: string; keywords: string[]; emoji: string }> = {
  real_estate: {
    label: 'נדל"ן',
    emoji: '🏠',
    keywords: ['דירה', 'בית', 'נדלן', 'השכרה', 'מכירה', 'מקרקעין'],
  },
  car: {
    label: 'רכב',
    emoji: '🚗',
    keywords: ['רכב', 'מכונית', 'טסטה', 'ביטוח רכב', 'יד שנייה'],
  },
  general: {
    label: 'כללי',
    emoji: '💼',
    keywords: [],
  },
}
