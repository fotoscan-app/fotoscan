import twilio from 'twilio'

function getClient() {
  return twilio(
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { accountSid: process.env.TWILIO_ACCOUNT_SID! }
  )
}

export function normalizeMobile(mobile: string): string {
  const cleaned = mobile.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`
  return `+91${cleaned}`
}

export async function sendWhatsAppOtp(mobile: string, otp: string): Promise<void> {
  const client = getClient()
  const to = `whatsapp:${normalizeMobile(mobile)}`

  if (process.env.TWILIO_OTP_TEMPLATE_SID) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to,
      contentSid: process.env.TWILIO_OTP_TEMPLATE_SID,
      contentVariables: JSON.stringify({ '1': otp }),
    } as Parameters<typeof client.messages.create>[0])
  } else {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to,
      body: `Your QuickPik verification code is: *${otp}*\n\nExpires in 10 minutes. Do not share it with anyone.`,
    })
  }
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
