import twilio from 'twilio'

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

export function normalizeMobile(mobile: string): string {
  const cleaned = mobile.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`
  return `+91${cleaned}`
}

export async function sendVerification(mobile: string): Promise<void> {
  const client = getClient()
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: normalizeMobile(mobile), channel: 'sms' })
}

export async function checkVerification(mobile: string, code: string): Promise<boolean> {
  const client = getClient()
  try {
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: normalizeMobile(mobile), code })
    return check.status === 'approved'
  } catch {
    return false
  }
}
