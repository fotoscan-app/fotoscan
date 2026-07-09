import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { JWTPayload } from '@/types'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'qp_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const TRUSTED_DEVICE_COOKIE = 'qp_trusted_device'
const TRUSTED_DEVICE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function createTrustedDeviceToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'trusted_device' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyTrustedDeviceToken(token: string, userId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.type === 'trusted_device' && payload.userId === userId
  } catch {
    return false
  }
}

export { COOKIE, COOKIE_MAX_AGE, TRUSTED_DEVICE_COOKIE, TRUSTED_DEVICE_MAX_AGE }
