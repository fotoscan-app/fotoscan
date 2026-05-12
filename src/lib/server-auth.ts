import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from './auth'
import { db } from './db'

export async function getServerUser() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, name: true,
      businessName: true, logoKey: true,
      plan: true, storageUsed: true, storageLimit: true, isActive: true,
      subscriptionStatus: true, razorpayCustomerId: true,
    },
  })
}
