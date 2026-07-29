'use client'

import { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'
import { Download, FileImage, FileCode, FileText } from 'lucide-react'

interface QRCanvasProps {
  content: string
  fgColor: string
  bgColor: string
  logoUrl?: string | null
  frameText?: string
  dotsStyle?: string
  width?: number
}

export function QRPreviewCanvas({
  content,
  fgColor,
  bgColor,
  logoUrl,
  frameText,
  dotsStyle = 'square',
  width = 300,
}: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [svgString, setSvgString] = useState('')

  useEffect(() => {
    async function renderQR() {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Render base QR onto canvas
      await QRCodeLib.toCanvas(canvas, content || 'https://qrflow.io', {
        width,
        margin: 2,
        color: {
          dark: fgColor || '#000000',
          light: bgColor || '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction permits logo overlay
      })

      // Generate SVG string
      const svg = await QRCodeLib.toString(content || 'https://qrflow.io', {
        type: 'svg',
        margin: 2,
        color: {
          dark: fgColor || '#000000',
          light: bgColor || '#FFFFFF',
        },
      })
      setSvgString(svg)

      // Draw custom logo overlay if provided
      if (logoUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = logoUrl
        img.onload = () => {
          const logoSize = width * 0.22
          const logoX = (width - logoSize) / 2
          const logoY = (width - logoSize) / 2

          // Draw white background circle / rounded rect behind logo
          ctx.fillStyle = bgColor || '#FFFFFF'
          ctx.beginPath()
          ctx.arc(width / 2, width / 2, logoSize / 2 + 4, 0, Math.PI * 2)
          ctx.fill()

          // Draw uploaded logo centered
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
        }
      }
    }

    renderQR()
  }, [content, fgColor, bgColor, logoUrl, width])

  // Download High-Resolution PNG (1024x1024)
  const downloadPNG = async () => {
    const tempCanvas = document.createElement('canvas')
    const hiResWidth = 1024
    tempCanvas.width = hiResWidth
    tempCanvas.height = hiResWidth

    await QRCodeLib.toCanvas(tempCanvas, content || 'https://qrflow.io', {
      width: hiResWidth,
      margin: 2,
      color: {
        dark: fgColor || '#000000',
        light: bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })

    if (logoUrl) {
      const ctx = tempCanvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = logoUrl
        img.onload = () => {
          const logoSize = hiResWidth * 0.22
          const logoX = (hiResWidth - logoSize) / 2
          const logoY = (hiResWidth - logoSize) / 2

          ctx.fillStyle = bgColor || '#FFFFFF'
          ctx.beginPath()
          ctx.arc(hiResWidth / 2, hiResWidth / 2, logoSize / 2 + 12, 0, Math.PI * 2)
          ctx.fill()

          ctx.drawImage(img, logoX, logoY, logoSize, logoSize)

          triggerDownload(tempCanvas.toDataURL('image/png'), 'qrflow-qrcode-1024x1024.png')
        }
        return
      }
    }

    triggerDownload(tempCanvas.toDataURL('image/png'), 'qrflow-qrcode-1024x1024.png')
  }

  // Download SVG
  const downloadSVG = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'qrflow-qrcode.svg')
  }

  // Download Print Ready PDF
  const downloadPDF = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print QR Code — QRFlow</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-center:center;height:100vh;margin:0;font-family:sans-serif;">
            <h2>Print-Ready QR Code</h2>
            <img src="${dataUrl}" style="width:300px;height:300px;margin-bottom:20px;" />
            <p style="color:#666;font-size:14px;">Scan with any smartphone camera</p>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Frame Container */}
      <div className="p-5 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center space-y-3">
        {frameText && (
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800 font-mono">
            {frameText}
          </span>
        )}
        <canvas ref={canvasRef} width={width} height={width} className="rounded-lg" />
      </div>

      {/* Download Action Buttons */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2">
        <button
          type="button"
          onClick={downloadPNG}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <FileImage className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          onClick={downloadSVG}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          onClick={downloadPDF}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
        >
          <FileText className="w-3.5 h-3.5 text-pink-400" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  )
}
