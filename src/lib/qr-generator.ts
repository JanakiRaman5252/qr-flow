export type QRType =
  | 'WEBSITE'
  | 'PDF'
  | 'IMAGE'
  | 'VIDEO'
  | 'VCARD'
  | 'EMAIL'
  | 'PHONE'
  | 'SMS'
  | 'WHATSAPP'
  | 'WIFI'
  | 'APP_STORE'
  | 'GOOGLE_PLAY'
  | 'GOOGLE_MAPS'
  | 'LOCATION'
  | 'TEXT'
  | 'EVENT'
  | 'CALENDAR'
  | 'RESTAURANT_MENU'
  | 'DIGITAL_BUSINESS_CARD'
  | 'SOCIAL_LINKS'
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'X'
  | 'TIKTOK'
  | 'CUSTOM_REDIRECT'

export interface QRFormPayload {
  type: QRType
  url?: string
  text?: string
  email?: string
  subject?: string
  body?: string
  phone?: string
  sms?: string
  wifiSsid?: string
  wifiPassword?: string
  wifiEncryption?: 'WPA' | 'WEP' | 'nopass'
  vCardName?: string
  vCardEmail?: string
  vCardPhone?: string
  vCardCompany?: string
  vCardTitle?: string
  latitude?: string
  longitude?: string
  socialHandle?: string
}

export function generateQRRawContent(payload: QRFormPayload): string {
  switch (payload.type) {
    case 'WEBSITE':
    case 'CUSTOM_REDIRECT':
    case 'PDF':
    case 'IMAGE':
    case 'VIDEO':
    case 'RESTAURANT_MENU':
    case 'DIGITAL_BUSINESS_CARD':
      return payload.url || 'https://qrflow.io'

    case 'TEXT':
      return payload.text || ''

    case 'EMAIL':
      return `mailto:${payload.email || ''}?subject=${encodeURIComponent(payload.subject || '')}&body=${encodeURIComponent(payload.body || '')}`

    case 'PHONE':
      return `tel:${payload.phone || ''}`

    case 'SMS':
      return `sms:${payload.phone || ''}?body=${encodeURIComponent(payload.sms || '')}`

    case 'WHATSAPP':
      return `https://wa.me/${(payload.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(payload.sms || '')}`

    case 'WIFI':
      return `WIFI:S:${payload.wifiSsid || ''};T:${payload.wifiEncryption || 'WPA'};P:${payload.wifiPassword || ''};;`

    case 'LOCATION':
    case 'GOOGLE_MAPS':
      return `https://maps.google.com/?q=${payload.latitude || 0},${payload.longitude || 0}`

    case 'VCARD':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${payload.vCardName || ''}`,
        `ORG:${payload.vCardCompany || ''}`,
        `TITLE:${payload.vCardTitle || ''}`,
        `TEL:${payload.vCardPhone || ''}`,
        `EMAIL:${payload.vCardEmail || ''}`,
        'END:VCARD',
      ].join('\n')

    case 'YOUTUBE':
      return `https://youtube.com/@${payload.socialHandle || ''}`

    case 'INSTAGRAM':
      return `https://instagram.com/${payload.socialHandle || ''}`

    case 'FACEBOOK':
      return `https://facebook.com/${payload.socialHandle || ''}`

    case 'LINKEDIN':
      return `https://linkedin.com/in/${payload.socialHandle || ''}`

    case 'X':
      return `https://x.com/${payload.socialHandle || ''}`

    case 'TIKTOK':
      return `https://tiktok.com/@${payload.socialHandle || ''}`

    default:
      return payload.url || 'https://qrflow.io'
  }
}
