import QRCodeLib from 'qrcode'
import type { QRDesignConfig } from './qr-design'

export interface RenderOptions {
  content: string
  config: QRDesignConfig
  width?: number
}

// ─────────────────────────────────────────────
// HTML5 Canvas Multi-Shape Renderer
// ─────────────────────────────────────────────

export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): Promise<void> {
  const { content, config, width = 360 } = options
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const qr = QRCodeLib.create(content || 'https://qrflow.io', {
    errorCorrectionLevel: 'H',
  })

  const moduleCount = qr.modules.size
  const hasFrame = config.frameTemplate && config.frameTemplate !== 'none'

  // Determine canvas dimensions based on frame
  let canvasWidth = width
  let canvasHeight = width
  let qrOffsetX = 0
  let qrOffsetY = 0
  let qrRenderWidth = width

  if (hasFrame) {
    if (config.frameTemplate === 'top-badge') {
      canvasHeight = width + 50
      qrOffsetY = 50
    } else if (config.frameTemplate === 'bottom-badge') {
      canvasHeight = width + 50
      qrOffsetY = 0
    } else if (config.frameTemplate === 'modern-card' || config.frameTemplate === 'polaroid') {
      canvasHeight = width + 80
      canvasWidth = width + 40
      qrOffsetX = 20
      qrOffsetY = 20
    } else if (config.frameTemplate === 'chat-bubble') {
      canvasHeight = width + 60
      qrOffsetY = 10
    }
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // 1. Draw Frame / Canvas Background
  if (hasFrame) {
    drawFrameBackground(ctx, canvasWidth, canvasHeight, config)
  } else {
    if (config.bgColor && config.bgColor !== 'transparent') {
      ctx.fillStyle = config.bgColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    }
  }

  // 2. Compute QR Module Matrix Positioning
  const marginModules = 2
  const totalModules = moduleCount + marginModules * 2
  const moduleSize = qrRenderWidth / totalModules
  const actualQrX = qrOffsetX + marginModules * moduleSize
  const actualQrY = qrOffsetY + marginModules * moduleSize

  // If inside modern card or polaroid, fill white QR backing
  if (hasFrame && (config.frameTemplate === 'modern-card' || config.frameTemplate === 'polaroid')) {
    ctx.fillStyle = config.bgColor || '#FFFFFF'
    ctx.beginPath()
    roundRectPath(ctx, qrOffsetX + 8, qrOffsetY + 8, width + 24, width + 24, 16)
    ctx.fill()
  }

  // 3. Create Color Fill / Gradient for Data Modules
  const fgFill = createFillStyle(ctx, qrOffsetX, qrOffsetY, qrRenderWidth, config)

  // 4. Draw Regular Data Modules (excluding 7x7 corner eye zones)
  ctx.fillStyle = fgFill

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isCornerEyeZone(r, c, moduleCount)) continue

      if (qr.modules.get(r, c)) {
        const x = actualQrX + c * moduleSize
        const y = actualQrY + r * moduleSize
        drawDotModule(ctx, x, y, moduleSize, config.dotsStyle)
      }
    }
  }

  // 5. Draw 3 Corner Eyes (Top-Left, Top-Right, Bottom-Left)
  const eyePositions = [
    { r: 0, c: 0 }, // Top-Left
    { r: 0, c: moduleCount - 7 }, // Top-Right
    { r: moduleCount - 7, c: 0 }, // Bottom-Left
  ]

  for (const pos of eyePositions) {
    const eyeX = actualQrX + pos.c * moduleSize
    const eyeY = actualQrY + pos.r * moduleSize
    const eyeSize = 7 * moduleSize

    drawCornerEye(ctx, eyeX, eyeY, eyeSize, moduleSize, config, fgFill)
  }

  // 6. Draw Center Logo (if present)
  if (config.logoUrl) {
    await drawCenterLogo(ctx, qrOffsetX, qrOffsetY, qrRenderWidth, config)
  }

  // 7. Draw Frame Text & CTA overlay
  if (hasFrame) {
    drawFrameText(ctx, canvasWidth, canvasHeight, qrOffsetY, qrRenderWidth, config)
  }
}

// ─────────────────────────────────────────────
// Shape & Module Drawing Helpers
// ─────────────────────────────────────────────

function isCornerEyeZone(r: number, c: number, size: number): boolean {
  // Top-Left (0..6, 0..6)
  if (r < 7 && c < 7) return true
  // Top-Right (0..6, size-7..size-1)
  if (r < 7 && c >= size - 7) return true
  // Bottom-Left (size-7..size-1, 0..6)
  if (r >= size - 7 && c < 7) return true
  return false
}

function createFillStyle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  config: QRDesignConfig
): string | CanvasGradient {
  if (config.colorType === 'solid' || !config.fgColor2) {
    return config.fgColor || '#000000'
  }

  let grad: CanvasGradient
  switch (config.gradientType) {
    case 'linear-h':
      grad = ctx.createLinearGradient(x, y, x + size, y)
      break
    case 'linear-v':
      grad = ctx.createLinearGradient(x, y, x, y + size)
      break
    case 'radial':
      grad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size * 0.7)
      break
    case 'linear-diagonal':
    default:
      grad = ctx.createLinearGradient(x, y, x + size, y + size)
      break
  }

  grad.addColorStop(0, config.fgColor || '#4F46E5')
  grad.addColorStop(1, config.fgColor2 || '#9333EA')
  return grad
}

function drawDotModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: string
): void {
  const padding = size * 0.05
  const innerSize = size - padding * 2
  const cx = x + size / 2
  const cy = y + size / 2

  ctx.beginPath()

  switch (style) {
    case 'dots':
      ctx.arc(cx, cy, innerSize / 2, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'rounded':
      roundRectPath(ctx, x + padding, y + padding, innerSize, innerSize, innerSize * 0.35)
      ctx.fill()
      break

    case 'extra-rounded':
      roundRectPath(ctx, x + padding, y + padding, innerSize, innerSize, innerSize * 0.5)
      ctx.fill()
      break

    case 'classy':
      // Diamond star
      ctx.moveTo(cx, y + padding)
      ctx.lineTo(x + size - padding, cy)
      ctx.lineTo(cx, y + size - padding)
      ctx.lineTo(x + padding, cy)
      ctx.closePath()
      ctx.fill()
      break

    case 'square':
    default:
      ctx.fillRect(x, y, size, size)
      break
  }
}

function drawCornerEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  eyeSize: number,
  moduleSize: number,
  config: QRDesignConfig,
  defaultFill: string | CanvasGradient
): void {
  const frameColor = config.eyeFrameColor || defaultFill
  const dotColor = config.eyeDotColor || defaultFill
  const bgColor = config.bgColor && config.bgColor !== 'transparent' ? config.bgColor : '#FFFFFF'

  ctx.save()

  // 1. Draw Outer Frame (7x7 modules)
  ctx.fillStyle = frameColor

  const outerRadius = getCornerRadius(config.cornerSquareStyle, eyeSize)
  const innerOffset = moduleSize
  const innerSize = eyeSize - innerOffset * 2
  const innerRadius = Math.max(0, outerRadius - innerOffset)

  // Outer solid shape
  ctx.beginPath()
  if (config.cornerSquareStyle === 'leaf') {
    leafPath(ctx, x, y, eyeSize)
  } else {
    roundRectPath(ctx, x, y, eyeSize, eyeSize, outerRadius)
  }
  ctx.fill()

  // Cut out 5x5 inner area with background color
  ctx.fillStyle = bgColor
  ctx.beginPath()
  if (config.cornerSquareStyle === 'leaf') {
    leafPath(ctx, x + innerOffset, y + innerOffset, innerSize)
  } else {
    roundRectPath(ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, innerRadius)
  }
  ctx.fill()

  // 2. Draw Center Inner Dot (3x3 modules, offset by 2 modules)
  ctx.fillStyle = dotColor
  const dotOffset = 2 * moduleSize
  const dotSize = 3 * moduleSize
  const dotX = x + dotOffset
  const dotY = y + dotOffset
  const dotRadius = getDotRadius(config.cornerDotStyle, dotSize)

  ctx.beginPath()
  switch (config.cornerDotStyle) {
    case 'dot':
      ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'diamond':
      ctx.moveTo(dotX + dotSize / 2, dotY)
      ctx.lineTo(dotX + dotSize, dotY + dotSize / 2)
      ctx.lineTo(dotX + dotSize / 2, dotY + dotSize)
      ctx.lineTo(dotX, dotY + dotSize / 2)
      ctx.closePath()
      ctx.fill()
      break
    case 'rounded':
    case 'square':
    default:
      roundRectPath(ctx, dotX, dotY, dotSize, dotSize, dotRadius)
      ctx.fill()
      break
  }

  ctx.restore()
}

function getCornerRadius(style: string, size: number): number {
  switch (style) {
    case 'extra-rounded':
      return size * 0.45
    case 'rounded':
      return size * 0.25
    case 'square':
    default:
      return 0
  }
}

function getDotRadius(style: string, size: number): number {
  switch (style) {
    case 'dot':
      return size * 0.5
    case 'rounded':
      return size * 0.3
    case 'square':
    default:
      return 0
  }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (r <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  const radius = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function leafPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const r = size * 0.45
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + size, y) // sharp top-right
  ctx.arcTo(x + size, y + size, x, y + size, r) // rounded bottom-right
  ctx.lineTo(x, y + size) // sharp bottom-left
  ctx.arcTo(x, y, x + size, y, r) // rounded top-left
  ctx.closePath()
}

// ─────────────────────────────────────────────
// Center Logo Overlay
// ─────────────────────────────────────────────

async function drawCenterLogo(
  ctx: CanvasRenderingContext2D,
  qrOffsetX: number,
  qrOffsetY: number,
  qrSize: number,
  config: QRDesignConfig
): Promise<void> {
  if (!config.logoUrl) return

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = config.logoUrl!

    img.onload = () => {
      const scale = config.logoSize || 0.22
      const logoW = qrSize * scale
      const logoH = qrSize * scale
      const cx = qrOffsetX + qrSize / 2
      const cy = qrOffsetY + qrSize / 2
      const x = cx - logoW / 2
      const y = cy - logoH / 2

      ctx.save()

      // Draw background behind logo if not 'none'
      if (config.logoShape !== 'none') {
        const bgPadding = logoW * 0.15
        const bgW = logoW + bgPadding * 2
        const bgH = logoH + bgPadding * 2
        const bgX = cx - bgW / 2
        const bgY = cy - bgH / 2

        ctx.fillStyle = config.logoBgColor || '#FFFFFF'
        ctx.beginPath()

        if (config.logoShape === 'circle') {
          ctx.arc(cx, cy, bgW / 2, 0, Math.PI * 2)
        } else if (config.logoShape === 'rounded') {
          roundRectPath(ctx, bgX, bgY, bgW, bgH, bgW * 0.25)
        } else {
          ctx.rect(bgX, bgY, bgW, bgH)
        }
        ctx.fill()

        // Subtle shadow border
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      ctx.drawImage(img, x, y, logoW, logoH)
      ctx.restore()
      resolve()
    }

    img.onerror = () => {
      resolve()
    }
  })
}

// ─────────────────────────────────────────────
// Frame Templates & Call-To-Action Rendering
// ─────────────────────────────────────────────

function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: QRDesignConfig
): void {
  ctx.save()
  const frameColor = config.frameColor || '#000000'

  if (config.frameTemplate === 'modern-card') {
    ctx.fillStyle = frameColor
    ctx.beginPath()
    roundRectPath(ctx, 0, 0, w, h, 28)
    ctx.fill()
  } else if (config.frameTemplate === 'polaroid') {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    roundRectPath(ctx, 0, 0, w, h, 16)
    ctx.fill()
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.stroke()
  } else if (config.frameTemplate === 'chat-bubble') {
    ctx.fillStyle = frameColor
    ctx.beginPath()
    roundRectPath(ctx, 0, 0, w, h - 14, 24)
    ctx.fill()
    // Speech bubble tail
    ctx.beginPath()
    ctx.moveTo(w / 2 - 12, h - 14)
    ctx.lineTo(w / 2, h)
    ctx.lineTo(w / 2 + 12, h - 14)
    ctx.closePath()
    ctx.fill()
  } else if (config.frameTemplate === 'top-badge') {
    // Fill white background for QR
    ctx.fillStyle = config.bgColor || '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
    // Top banner
    ctx.fillStyle = frameColor
    ctx.beginPath()
    roundRectPath(ctx, w * 0.15, 6, w * 0.7, 36, 18)
    ctx.fill()
  } else if (config.frameTemplate === 'bottom-badge') {
    ctx.fillStyle = config.bgColor || '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
    // Bottom banner
    ctx.fillStyle = frameColor
    ctx.beginPath()
    roundRectPath(ctx, w * 0.15, h - 42, w * 0.7, 36, 18)
    ctx.fill()
  }

  ctx.restore()
}

function drawFrameText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  qrOffsetY: number,
  qrWidth: number,
  config: QRDesignConfig
): void {
  const text = (config.frameText || 'SCAN ME').toUpperCase()
  const textColor = config.frameTextColor || '#FFFFFF'

  ctx.save()
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (config.frameTemplate === 'top-badge') {
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(text, w / 2, 24)
  } else if (config.frameTemplate === 'bottom-badge') {
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(text, w / 2, h - 24)
  } else if (config.frameTemplate === 'modern-card') {
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(text, w / 2, h - 28)
  } else if (config.frameTemplate === 'polaroid') {
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(text, w / 2, h - 30)
  } else if (config.frameTemplate === 'chat-bubble') {
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(text, w / 2, h - 28)
  }

  ctx.restore()
}

// ─────────────────────────────────────────────
// High-Resolution & Vector Export Helpers
// ─────────────────────────────────────────────

export async function exportHighResPNG(
  content: string,
  config: QRDesignConfig,
  targetWidth = 1024
): Promise<string> {
  const canvas = document.createElement('canvas')
  await renderQRToCanvas(canvas, { content, config, width: targetWidth })
  return canvas.toDataURL('image/png')
}

export function exportPrintReadyPDF(
  canvas: HTMLCanvasElement,
  title = 'QR Code'
): void {
  const dataUrl = canvas.toDataURL('image/png')
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} — QRFlow Print</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFF; }
            .card { padding: 30px; text-align: center; border: 1px dashed #CCC; border-radius: 16px; }
            h2 { margin: 0 0 10px; font-size: 22px; color: #111; }
            p { margin: 10px 0 0; font-size: 13px; color: #666; }
            img { width: 320px; height: auto; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${title}</h2>
            <img src="${dataUrl}" />
            <p>Scan with any smartphone camera</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
}
