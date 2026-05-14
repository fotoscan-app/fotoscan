import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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
