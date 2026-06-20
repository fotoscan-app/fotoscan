import { NextResponse } from 'next/server'

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? ''
  const secret = process.env.RAZORPAY_KEY_SECRET ?? ''
  return NextResponse.json({
    keyId_first5: keyId.slice(0, 5),
    keyId_last4: keyId.slice(-4),
    keyId_length: keyId.length,
    secret_first4: secret.slice(0, 4),
    secret_last4: secret.slice(-4),
    secret_length: secret.length,
  })
}
