import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || '')

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
  
  // Resend requires custom domain verification. Fallback .vercel.app or .io to onboarding@resend.dev unless explicitly verified
  if (fromAddress.includes('.vercel.app') || (fromAddress.includes('@qrflow.io') && process.env.NODE_ENV !== 'production')) {
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
      console.error('[Resend Error]:', result.error.message || result.error)
      if (result.error.message?.includes('testing emails')) {
        console.warn('\n[Resend Domain Restriction Notice]:')
        console.warn('Resend free onboarding address (onboarding@resend.dev) can only send emails to the account owner.')
        console.warn('To send real emails to any address, add and verify your custom domain at https://resend.com/domains')
        console.warn('and set EMAIL_FROM="QRFlow <noreply@yourdomain.com>" in your .env file.\n')
      }
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (err: any) {
    console.error('[sendEmail Exception]:', err)
    return { success: false, error: err.message || 'Email delivery failed' }
  }
}

