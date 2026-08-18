// ─────────────────────────────────────────────
// QR Code Design System & Styling Definitions
// ─────────────────────────────────────────────

export type QRDotsStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy'
export type QRCornerSquareStyle = 'square' | 'extra-rounded' | 'rounded' | 'leaf'
export type QRCornerDotStyle = 'square' | 'dot' | 'rounded' | 'diamond'
export type QRColorType = 'solid' | 'gradient'
export type QRGradientType = 'linear-h' | 'linear-v' | 'linear-diagonal' | 'radial'
export type QRFrameTemplate =
  | 'none'
  | 'top-badge'
  | 'bottom-badge'
  | 'chat-bubble'
  | 'modern-card'
  | 'polaroid'
  | 'phone-frame'
export type QRLogoShape = 'circle' | 'rounded' | 'square' | 'none'

export interface QRDesignConfig {
  // Pattern shapes
  dotsStyle: QRDotsStyle
  cornerSquareStyle: QRCornerSquareStyle
  cornerDotStyle: QRCornerDotStyle

  // Color & Gradient
  colorType: QRColorType
  fgColor: string
  fgColor2: string
  gradientType: QRGradientType
  bgColor: string

  // Corner Eye Colors (optional overrides, falls back to fgColor)
  eyeFrameColor?: string | null
  eyeDotColor?: string | null

  // Frame Template & CTA
  frameTemplate: QRFrameTemplate
  frameText: string
  frameColor: string
  frameTextColor: string

  // Logo & Branding
  logoUrl?: string | null
  logoShape: QRLogoShape
  logoSize: number // 0.15 to 0.30
  logoBgColor: string
}

export const DEFAULT_QR_DESIGN: QRDesignConfig = {
  dotsStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
  colorType: 'solid',
  fgColor: '#000000',
  fgColor2: '#4F46E5',
  gradientType: 'linear-diagonal',
  bgColor: '#FFFFFF',
  eyeFrameColor: null,
  eyeDotColor: null,
  frameTemplate: 'none',
  frameText: 'SCAN ME',
  frameColor: '#000000',
  frameTextColor: '#FFFFFF',
  logoUrl: null,
  logoShape: 'circle',
  logoSize: 0.22,
  logoBgColor: '#FFFFFF',
}

// ─────────────────────────────────────────────
// PRESET DESIGNER THEMES
// ─────────────────────────────────────────────

export interface QRThemePreset {
  id: string
  name: string
  description: string
  previewBadge: string
  config: Partial<QRDesignConfig>
}

export const QR_THEME_PRESETS: QRThemePreset[] = [
  {
    id: 'classic',
    name: 'Classic Crisp',
    description: 'Timeless high-contrast black & white',
    previewBadge: 'bg-slate-900 border-slate-700 text-white',
    config: {
      dotsStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
      colorType: 'solid',
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      frameTemplate: 'none',
    },
  },
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    description: 'Electric Indigo & Purple gradient with circular dots',
    previewBadge: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
    config: {
      dotsStyle: 'dots',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      colorType: 'gradient',
      fgColor: '#4F46E5',
      fgColor2: '#9333EA',
      gradientType: 'linear-diagonal',
      bgColor: '#FFFFFF',
      eyeFrameColor: '#4F46E5',
      eyeDotColor: '#9333EA',
      frameTemplate: 'bottom-badge',
      frameText: 'SCAN NOW',
      frameColor: '#4F46E5',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    description: 'Vibrant Emerald to Teal with leaf corner eyes',
    previewBadge: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    config: {
      dotsStyle: 'rounded',
      cornerSquareStyle: 'leaf',
      cornerDotStyle: 'rounded',
      colorType: 'gradient',
      fgColor: '#059669',
      fgColor2: '#0D9488',
      gradientType: 'linear-h',
      bgColor: '#FFFFFF',
      eyeFrameColor: '#059669',
      eyeDotColor: '#047857',
      frameTemplate: 'top-badge',
      frameText: 'DISCOVER',
      frameColor: '#059669',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'sunset-flame',
    name: 'Sunset Flame',
    description: 'Warm Rose to Amber gradient with smooth organic dots',
    previewBadge: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white',
    config: {
      dotsStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      colorType: 'gradient',
      fgColor: '#E11D48',
      fgColor2: '#F59E0B',
      gradientType: 'linear-diagonal',
      bgColor: '#FFFFFF',
      eyeFrameColor: '#E11D48',
      eyeDotColor: '#D97706',
      frameTemplate: 'modern-card',
      frameText: 'SCAN TO VIEW',
      frameColor: '#1E1B4B',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'ocean-cyber',
    name: 'Ocean Cyber',
    description: 'Deep Ocean Blue to Electric Cyan',
    previewBadge: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
    config: {
      dotsStyle: 'classy',
      cornerSquareStyle: 'rounded',
      cornerDotStyle: 'diamond',
      colorType: 'gradient',
      fgColor: '#0284C7',
      fgColor2: '#06B6D4',
      gradientType: 'linear-v',
      bgColor: '#FFFFFF',
      eyeFrameColor: '#0369A1',
      eyeDotColor: '#0891B2',
      frameTemplate: 'chat-bubble',
      frameText: 'CONNECT',
      frameColor: '#0284C7',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'golden-prestige',
    name: 'Golden Prestige',
    description: 'Rich Amber Gold and Obsidian Dark elegance',
    previewBadge: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
    config: {
      dotsStyle: 'classy',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'diamond',
      colorType: 'solid',
      fgColor: '#D97706',
      bgColor: '#18181B',
      eyeFrameColor: '#F59E0B',
      eyeDotColor: '#FBBF24',
      frameTemplate: 'polaroid',
      frameText: 'VIP ACCESS',
      frameColor: '#27272A',
      frameTextColor: '#F59E0B',
    },
  },
  {
    id: 'minimal-dark',
    name: 'Obsidian Dark',
    description: 'Dark theme QR for sleek modern packaging',
    previewBadge: 'bg-slate-950 border border-slate-700 text-slate-200',
    config: {
      dotsStyle: 'dots',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
      colorType: 'solid',
      fgColor: '#F8FAFC',
      bgColor: '#0F172A',
      eyeFrameColor: '#38BDF8',
      eyeDotColor: '#38BDF8',
      frameTemplate: 'none',
    },
  },
]

// ─────────────────────────────────────────────
// PRESET LOGO ICONS (SVG Data URLs)
// ─────────────────────────────────────────────

export interface PresetIcon {
  id: string
  name: string
  category: string
  svg: string
}

export const PRESET_ICONS: PresetIcon[] = [
  {
    id: 'web',
    name: 'Website',
    category: 'General',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    category: 'General',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Social',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2325D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.67-1.39 1.28-1.92 1.36-.51.08-1.17.11-3.37-.8-2.67-1.11-4.38-3.83-4.51-4.01-.13-.18-1.07-1.42-1.07-2.72 0-1.29.68-1.93.92-2.19.24-.26.53-.33.71-.33.18 0 .35 0 .51.01.16.01.38-.06.59.45.22.53.75 1.83.82 1.96.07.13.11.29.02.47-.09.18-.13.29-.26.44-.13.15-.28.34-.4.46-.13.13-.27.27-.12.53.15.26.68 1.12 1.46 1.81 1 .89 1.84 1.17 2.1 1.3.26.13.42.11.57-.07.15-.18.66-.77.84-1.03.18-.26.35-.22.59-.13.24.09 1.54.73 1.8 86.26.13.44.2.5.31.07.11.07.64-.17 1.31z"/></svg>',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Social',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF0000"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon fill="%23FFFFFF" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>',
  },
  {
    id: 'mail',
    name: 'Email',
    category: 'Contact',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%233B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  },
  {
    id: 'phone',
    name: 'Phone',
    category: 'Contact',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  },
  {
    id: 'location',
    name: 'Location',
    category: 'General',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  },
]
