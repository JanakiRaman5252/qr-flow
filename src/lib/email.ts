import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`)
    return { success: true, id: 'mock_id' }
  }

  // Use configured EMAIL_FROM or default to Resend onboarding address
  let fromAddress = process.env.EMAIL_FROM || 'QRFlow <onboarding@resend.dev>'
  
  // If set to unverified domain notifications@qrflow.io in development, fallback to onboarding@resend.dev
  if (fromAddress.includes('@qrflow.io') && process.env.NODE_ENV !== 'production') {
    fromAddress = 'QRFlow <onboarding@resend.dev>'
  }

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    })

    if (result.error) {
      console.error('[Resend Error]:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (err: any) {
    console.error('[sendEmail Exception]:', err)
    return { success: false, error: err.message || 'Email delivery failed' }
  }
}

