import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.RESEND_API_KEY
console.log('RESEND_API_KEY:', apiKey)
console.log('EMAIL_FROM:', process.env.EMAIL_FROM)

const resend = new Resend(apiKey)

async function testEmail() {
  console.log('Sending test email...')

  // Test with EMAIL_FROM
  const res1 = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'QRFlow <onboarding@resend.dev>',
    to: 'janakiraman5226@gmail.com',
    subject: 'Test Email from DynoQR',
    html: '<p>Testing DynoQR email sending</p>',
  })

  console.log('Result with EMAIL_FROM:', JSON.stringify(res1, null, 2))

  // Test with onboarding@resend.dev
  const res2 = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'janakiraman5226@gmail.com',
    subject: 'Test Email with onboarding@resend.dev',
    html: '<p>Testing onboarding address</p>',
  })

  console.log('Result with onboarding@resend.dev:', JSON.stringify(res2, null, 2))
}

testEmail()
