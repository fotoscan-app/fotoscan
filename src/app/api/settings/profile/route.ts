import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { cdnUrl } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

const PROFILE_FIELDS = {
  name: true, email: true, avatarKey: true,
  country: true, state: true, city: true,
  companyName: true, industry: true, gstNumber: true,
} as const

const NULLABLE_TEXT_FIELDS = ['country', 'state', 'city', 'companyName', 'industry', 'gstNumber'] as const

// Text inputs are controlled components and need '' rather than null for empty values.
function serialize(user: { avatarKey: string | null } & Record<string, unknown>) {
  const { avatarKey, ...rest } = user
  for (const field of NULLABLE_TEXT_FIELDS) rest[field] = rest[field] ?? ''
  return { ...rest, avatarUrl: avatarKey ? cdnUrl(avatarKey) : null }
}

export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: payload.userId }, select: PROFILE_FIELDS })
  if (!user) return NextResponse.json({ success: false, error: ErrorCodes.USER_NOT_FOUND.message }, { status: 404 })

  return NextResponse.json({ success: true, data: serialize(user) })
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// The profile form always submits every field together, so this is a full
// replace, not a partial patch — no field is silently dropped or nulled.
const updateSchema = z.object({
  name:        z.string().trim().min(2).max(100),
  country:     z.string().trim().max(100).default(''),
  state:       z.string().trim().max(100).default(''),
  city:        z.string().trim().max(100).default(''),
  companyName: z.string().trim().max(200).default(''),
  industry:    z.string().trim().max(100).default(''),
  gstNumber:   z.string().trim().toUpperCase().max(15).default('')
    .refine(v => !v || GSTIN_RE.test(v), { message: 'Invalid GST number format.' }),
})

export async function PUT(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { name, country, state, city, companyName, industry, gstNumber } = parsed.data
  const user = await db.user.update({
    where: { id: payload.userId },
    data: {
      name,
      country: country || null,
      state: state || null,
      city: city || null,
      companyName: companyName || null,
      industry: industry || null,
      gstNumber: gstNumber || null,
    },
    select: PROFILE_FIELDS,
  })

  logger.info('SYSTEM', 'Profile updated', { userId: payload.userId })
  return NextResponse.json({ success: true, data: serialize(user) })
}
