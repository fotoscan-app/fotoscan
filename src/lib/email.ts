import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { EventPack } from './plans'

const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Where "someone's interested" leads get sent — event pack purchase requests,
// since there's no self-serve checkout for those yet. Falls back to the known
// admin login if the env var isn't set.
const LEAD_NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'authguru@gmail.com'

export async function sendOtpEmail(to: string, otp: string, name: string) {
  await ses.send(new SendEmailCommand({
    Source: process.env.FROM_EMAIL!,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `${otp} is your QuickPik password reset code` },
      Body: {
        Html: {
          Data: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fdfaf3;border-radius:12px;border:1px solid #eddfa8">
              <h2 style="color:#7a5e1b;margin-bottom:8px">Password Reset</h2>
              <p style="color:#555;margin-bottom:24px">Hi ${name}, use the code below to reset your QuickPik password. It expires in <strong>10 minutes</strong>.</p>
              <div style="background:#fff;border:2px solid #b8922e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#b8922e">${otp}</span>
              </div>
              <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
              <hr style="border:none;border-top:1px solid #eddfa8;margin:24px 0"/>
              <p style="color:#aaa;font-size:12px;text-align:center">QuickPik by Anss Studio Pvt. Ltd.</p>
            </div>
          `,
        },
        Text: { Data: `Your QuickPik password reset OTP is: ${otp}\n\nExpires in 10 minutes.` },
      },
    },
  }))
}

// Event Packs (Starter/Growth/Studio Pack — the one-time "pay per event" tier
// on /pricing) have no self-serve checkout built yet. Instead of a broken or
// silent CTA, we capture interest and email the team to close the sale
// manually.
export async function sendEventPackLeadEmail(lead: { name: string; email: string; phone?: string; pack: EventPack }) {
  const { name, email, phone, pack } = lead
  await ses.send(new SendEmailCommand({
    Source: process.env.FROM_EMAIL!,
    Destination: { ToAddresses: [LEAD_NOTIFY_EMAIL] },
    ReplyToAddresses: [email],
    Message: {
      Subject: { Data: `Event pack interest: ${pack.name} (₹${pack.priceINR.toLocaleString('en-IN')}) — ${name}` },
      Body: {
        Html: {
          Data: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fdfaf3;border-radius:12px;border:1px solid #eddfa8">
              <h2 style="color:#7a5e1b;margin-bottom:16px">New event pack request</h2>
              <table style="width:100%;font-size:14px;color:#333">
                <tr><td style="padding:4px 0;color:#888">Pack</td><td style="padding:4px 0"><strong>${pack.name}</strong> — ${pack.events} events, ${pack.storageGB} GB, ₹${pack.priceINR.toLocaleString('en-IN')}</td></tr>
                <tr><td style="padding:4px 0;color:#888">Name</td><td style="padding:4px 0">${name}</td></tr>
                <tr><td style="padding:4px 0;color:#888">Email</td><td style="padding:4px 0">${email}</td></tr>
                <tr><td style="padding:4px 0;color:#888">Phone</td><td style="padding:4px 0">${phone || '—'}</td></tr>
              </table>
              <p style="color:#888;font-size:13px;margin-top:24px">Reply-to is already set to their email — just hit reply to get back to them.</p>
            </div>
          `,
        },
        Text: { Data: `New event pack request\n\nPack: ${pack.name} — ${pack.events} events, ${pack.storageGB} GB, ₹${pack.priceINR.toLocaleString('en-IN')}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}` },
      },
    },
  }))
}
