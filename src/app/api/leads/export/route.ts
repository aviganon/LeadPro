import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth } from '@/lib/apiAuth'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { LEADS_EXPORT_MAX } from '@/lib/appConstants'
import type { Lead } from '@/types'

function escapeCsv(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
}

function cell(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return escapeCsv((v as { toDate: () => Date }).toDate().toISOString())
  }
  if (typeof v === 'object') return escapeCsv(JSON.stringify(v))
  return escapeCsv(String(v))
}

// GET /api/leads/export — CSV for the signed-in user (no userId query; uses session).
export async function GET(req: NextRequest) {
  const auth = await verifyApiAuth(req)
  if (!auth.ok) return auth.response

  try {
    const db = getAdminFirestore()
    const snap = await db.collection('leads').where('userId', '==', auth.uid).limit(LEADS_EXPORT_MAX).get()

    const docs = snap.docs.sort((a, b) => {
      const ta = (a.data().createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
      const tb = (b.data().createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
      return tb - ta
    })

    const headers = ['id', 'status', 'vertical', 'source', 'qualityScore', 'notes', 'phone', 'email', 'name', 'createdAt']
    const lines = [headers.join(',')]

    for (const doc of docs) {
      const d = doc.data() as Partial<Lead>
      const row = [
        cell(doc.id),
        cell(d.status),
        cell(d.vertical),
        cell(d.source),
        cell(d.qualityScore),
        cell(d.notes),
        cell(d.phone),
        cell(d.email),
        cell(d.name),
        cell(d.createdAt),
      ]
      lines.push(row.join(','))
    }

    const csv = '\uFEFF' + lines.join('\n')
    const filename = `leads-${auth.uid.slice(0, 8)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('leads/export', e)
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
}
