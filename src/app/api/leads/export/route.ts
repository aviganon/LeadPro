import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth } from '@/lib/apiAuth'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { LEADS_EXPORT_MAX } from '@/lib/appConstants'
import type { Lead } from '@/types'

export const runtime = 'nodejs'

function escapeCsv(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
}

function toPlain(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function cellCsv(v: unknown): string {
  return escapeCsv(toPlain(v))
}

const HEADERS = ['id', 'status', 'vertical', 'source', 'qualityScore', 'notes', 'phone', 'email', 'name', 'createdAt'] as const

// GET /api/leads/export?format=csv|xlsx — for the signed-in user (session-based).
export async function GET(req: NextRequest) {
  const auth = await verifyApiAuth(req)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const format = (url.searchParams.get('format') ?? 'csv').toLowerCase()
  if (format !== 'csv' && format !== 'xlsx') {
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  }

  try {
    const db = getAdminFirestore()
    const snap = await db.collection('leads').where('userId', '==', auth.uid).limit(LEADS_EXPORT_MAX).get()

    const docs = snap.docs.sort((a, b) => {
      const ta = (a.data().createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
      const tb = (b.data().createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
      return tb - ta
    })

    const rows = docs.map((doc) => {
      const d = doc.data() as Partial<Lead>
      return {
        id: doc.id,
        status: d.status ?? '',
        vertical: d.vertical ?? '',
        source: d.source ?? '',
        qualityScore: typeof d.qualityScore === 'number' ? d.qualityScore : 0,
        notes: d.notes ?? '',
        phone: d.phone ?? '',
        email: d.email ?? '',
        name: d.name ?? '',
        createdAt: toPlain(d.createdAt),
      }
    })

    const filenameBase = `leads-${auth.uid.slice(0, 8)}`

    if (format === 'xlsx') {
      const { default: ExcelJS } = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      wb.creator = 'ApexLeads'
      wb.created = new Date()
      const ws = wb.addWorksheet('Leads', { views: [{ rightToLeft: true }] })
      ws.columns = [
        { header: 'ID', key: 'id', width: 22 },
        { header: 'סטטוס', key: 'status', width: 12 },
        { header: 'ורטיקל', key: 'vertical', width: 14 },
        { header: 'מקור', key: 'source', width: 14 },
        { header: 'ציון', key: 'qualityScore', width: 8 },
        { header: 'הערות', key: 'notes', width: 64 },
        { header: 'טלפון', key: 'phone', width: 16 },
        { header: 'אימייל', key: 'email', width: 24 },
        { header: 'שם', key: 'name', width: 20 },
        { header: 'נוצר', key: 'createdAt', width: 22 },
      ]
      ws.getRow(1).font = { bold: true }
      ws.getRow(1).alignment = { horizontal: 'right' }
      ws.addRows(rows)

      const buf = await wb.xlsx.writeBuffer()
      return new NextResponse(buf as ArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // CSV (default)
    const lines = [HEADERS.join(',')]
    for (const r of rows) {
      lines.push([
        cellCsv(r.id),
        cellCsv(r.status),
        cellCsv(r.vertical),
        cellCsv(r.source),
        cellCsv(r.qualityScore),
        cellCsv(r.notes),
        cellCsv(r.phone),
        cellCsv(r.email),
        cellCsv(r.name),
        cellCsv(r.createdAt),
      ].join(','))
    }

    const csv = '\uFEFF' + lines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('leads/export', e)
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
}
