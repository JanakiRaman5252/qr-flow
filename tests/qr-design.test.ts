import { describe, it, expect } from 'vitest'
import {
  DEFAULT_QR_DESIGN,
  QR_THEME_PRESETS,
  PRESET_ICONS,
} from '../src/lib/qr-design'
import { generateQRRawContent } from '../src/lib/qr-generator'

describe('QR Code Design System', () => {
  it('should have complete DEFAULT_QR_DESIGN definitions', () => {
    expect(DEFAULT_QR_DESIGN).toBeDefined()
    expect(DEFAULT_QR_DESIGN.dotsStyle).toBe('square')
    expect(DEFAULT_QR_DESIGN.cornerSquareStyle).toBe('square')
    expect(DEFAULT_QR_DESIGN.cornerDotStyle).toBe('square')
    expect(DEFAULT_QR_DESIGN.colorType).toBe('solid')
    expect(DEFAULT_QR_DESIGN.fgColor).toBe('#000000')
    expect(DEFAULT_QR_DESIGN.bgColor).toBe('#FFFFFF')
    expect(DEFAULT_QR_DESIGN.frameTemplate).toBe('none')
    expect(DEFAULT_QR_DESIGN.logoSize).toBe(0.22)
  })

  it('should provide 7 curated designer presets with unique styles', () => {
    expect(QR_THEME_PRESETS.length).toBe(7)

    const presetIds = QR_THEME_PRESETS.map((p) => p.id)
    expect(presetIds).toContain('classic')
    expect(presetIds).toContain('midnight-neon')
    expect(presetIds).toContain('emerald-luxury')
    expect(presetIds).toContain('sunset-flame')
    expect(presetIds).toContain('ocean-cyber')
    expect(presetIds).toContain('golden-prestige')
    expect(presetIds).toContain('minimal-dark')

    // Verify Midnight Neon uses gradient and circular dots
    const neon = QR_THEME_PRESETS.find((p) => p.id === 'midnight-neon')!
    expect(neon.config.colorType).toBe('gradient')
    expect(neon.config.dotsStyle).toBe('dots')
    expect(neon.config.cornerSquareStyle).toBe('extra-rounded')
    expect(neon.config.cornerDotStyle).toBe('dot')

    // Verify Emerald Luxury uses leaf corner squares
    const emerald = QR_THEME_PRESETS.find((p) => p.id === 'emerald-luxury')!
    expect(emerald.config.cornerSquareStyle).toBe('leaf')
    expect(emerald.config.dotsStyle).toBe('rounded')
  })

  it('should provide preset brand and utility icons', () => {
    expect(PRESET_ICONS.length).toBeGreaterThanOrEqual(8)
    const iconIds = PRESET_ICONS.map((i) => i.id)
    expect(iconIds).toContain('web')
    expect(iconIds).toContain('wifi')
    expect(iconIds).toContain('whatsapp')
    expect(iconIds).toContain('instagram')
    expect(iconIds).toContain('youtube')
    expect(iconIds).toContain('mail')
    expect(iconIds).toContain('phone')
    expect(iconIds).toContain('location')

    PRESET_ICONS.forEach((icon) => {
      expect(icon.svg).toContain('data:image/svg+xml')
    })
  })

  it('should correctly format QR payloads for all types', () => {
    expect(
      generateQRRawContent({
        type: 'WEBSITE',
        url: 'https://example.com',
      })
    ).toBe('https://example.com')

    expect(
      generateQRRawContent({
        type: 'WIFI',
        wifiSsid: 'MyOffice',
        wifiPassword: 'securepass123',
        wifiEncryption: 'WPA',
      })
    ).toBe('WIFI:S:MyOffice;T:WPA;P:securepass123;;')

    expect(
      generateQRRawContent({
        type: 'WHATSAPP',
        phone: '+1 (555) 000-1111',
        sms: 'Hello from QR',
      })
    ).toBe('https://wa.me/15550001111?text=Hello%20from%20QR')
  })
})
