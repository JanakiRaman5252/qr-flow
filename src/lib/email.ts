import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.warn('[Email] RESEND_API_KEY is not configured')
}

export const resend = new Resend(apiKey || '')

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const cleanTo = to.trim().toLowerCase()

  if (!cleanTo) {
    return {
      success: false,
      error: 'Recipient email address is required',
    }
  }

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY is missing')

    return {
      success: false,
      error: 'Email service is not configured',
    }
  }

  const fromAddress =
    process.env.EMAIL_FROM || 'QRFlow <noreply@dynoqr.in>'

  console.log('[Email] Sending email')
  console.log(`[Email] To: ${cleanTo}`)
  console.log(`[Email] From: ${fromAddress}`)
  console.log(`[Email] Subject: ${subject}`)

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [cleanTo],
      subject,
      html,
      ...(text ? { text } : {}),
    })

    if (error) {
      console.error('[Resend Error]', {
        name: error.name,
        message: error.message,
      })

      return {
        success: false,
        error: error.message || 'Resend failed to send email',
      }
    }

    if (!data?.id) {
      console.error('[Resend Error] No message ID returned')

      return {
        success: false,
        error: 'Email provider did not return a message ID',
      }
    }

    console.log(
      `[Email] Successfully accepted by Resend. Message ID: ${data.id}`
    )

    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error('[Email Exception]', error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unexpected email delivery error',
    }
  }
}