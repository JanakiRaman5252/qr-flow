import { describe, it, expect } from 'vitest'
import { generateQRRawContent } from '../src/lib/qr-generator'

describe('QR Generator Helper', () => {
  it('formats Website URLs correctly', () => {
    const res = generateQRRawContent({ type: 'WEBSITE', url: 'https://qrflow.io' })
    expect(res).toBe('https://qrflow.io')
  })

  it('formats Wi-Fi strings correctly', () => {
    const res = generateQRRawContent({
      type: 'WIFI',
      wifiSsid: 'MyNetwork',
      wifiPassword: 'Pass',
      wifiEncryption: 'WPA',
    })
    expect(res).toBe('WIFI:S:MyNetwork;T:WPA;P:Pass;;')
  })

  it('formats Email strings correctly', () => {
    const res = generateQRRawContent({
      type: 'EMAIL',
      email: 'user@test.com',
      subject: 'Hello',
      body: 'World',
    })
    expect(res).toBe('mailto:user@test.com?subject=Hello&body=World')
  })
})
