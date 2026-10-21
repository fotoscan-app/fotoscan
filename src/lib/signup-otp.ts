import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

// Email verification for new sign-ups. Codes are stored hashed, expire after
// 10 minutes, and are burned after 5 wrong attempts.

const OTP_TTL_MS = 10 * 60_000
const MAX_ATTEMPTS = 5
export const RESEND_COOLDOWN_MS = 60_000

function hashCode(email: string, code: string): string {
  return createHash('sha256').update(`signup:${email}:${code}:${process.env.JWT_SECRET}`).digest('hex')
}

// Returns the new code, or null if one was sent less than a minute ago.
export async function issueSignupOtp(email: string): Promise<string | null> {
  const recent = await db.signupOtp.findFirst({
    where: { email, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  })
  if (recent) return null

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  await db.signupOtp.updateMany({ where: { email, used: false }, data: { used: true } })
  await db.signupOtp.create({ data: { email, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } })
  return code
}

export type SignupOtpResult = 'ok' | 'wrong' | 'expired'

export async function checkSignupOtp(email: string, code: string): Promise<SignupOtpResult> {
  const otp = await db.signupOtp.findFirst({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp) return 'expired'

  const expected = Buffer.from(otp.codeHash, 'hex')
  const actual = Buffer.from(hashCode(email, code), 'hex')
  if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
    await db.signupOtp.update({ where: { id: otp.id }, data: { used: true } })
    return 'ok'
  }

  const attempts = otp.attempts + 1
  await db.signupOtp.update({ where: { id: otp.id }, data: { attempts, used: attempts >= MAX_ATTEMPTS } })
  return attempts >= MAX_ATTEMPTS ? 'expired' : 'wrong'
}
