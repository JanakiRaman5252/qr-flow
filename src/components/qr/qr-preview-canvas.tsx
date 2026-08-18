'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import {
  Download,
  FileImage,
  FileCode,
  FileText,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react'
import QRCodeLib from 'qrcode'
import {
  DEFAULT_QR_DESIGN,
  type QRDesignConfig,
} from '@/lib/qr-design'
import {
  renderQRToCanvas,
  exportHighResPNG,
  exportPrintReadyPDF,
} from '@/lib/qr-canvas-renderer'

export interface QRPreviewCanvasProps {
  content: string
  // Full or partial design config
  designConfig?: Partial<QRDesignConfig>
  // Backward compatible props
  fgColor?: string
  bgColor?: string
  logoUrl?: string | null
  frameText?: string
  dotsStyle?: string
  width?: number
  showDownloads?: boolean
  title?: string
}

export function QRPreviewCanvas({
  content,
  designConfig,
  fgColor,
  bgColor,
  logoUrl,
  frameText,
  dotsStyle,
  width = 280,
  showDownloads = true,
  title = 'QR Code',
}: QRPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [svgString, setSvgString] = useState('')
  const [isRendering, setIsRendering] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)
  const [copiedSuccess, setCopiedSuccess] = useState(false)

  // Merge full design configuration
  const mergedConfig: QRDesignConfig = useMemo(() => {
    return {
      ...DEFAULT_QR_DESIGN,
      ...(fgColor ? { fgColor } : {}),
      ...(bgColor ? { bgColor } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(frameText ? { frameText } : {}),
      ...(dotsStyle ? { dotsStyle: dotsStyle as any } : {}),
      ...(designConfig || {}),
    }
  }, [designConfig, fgColor, bgColor, logoUrl, frameText, dotsStyle])

  useEffect(() => {
    let isCancelled = false

    async function updateCanvas() {
      if (!canvasRef.current) return
      setIsRendering(true)

      try {
        await renderQRToCanvas(canvasRef.current, {
          content: content || 'https://qrflow.io',
          config: mergedConfig,
          width,
        })

        // Generate vector SVG fallback
        const svg = await QRCodeLib.toString(content || 'https://qrflow.io', {
          type: 'svg',
          margin: 2,
          color: {
            dark: mergedConfig.fgColor || '#000000',
            light: mergedConfig.bgColor || '#FFFFFF',
          },
        })
        if (!isCancelled) setSvgString(svg)
      } catch (err) {
        console.error('QR Render Error:', err)
      } finally {
        if (!isCancelled) setIsRendering(false)
      }
    }

    updateCanvas()

    return () => {
      isCancelled = true
    }
  }, [content, mergedConfig, width])

  // Download High-Resolution PNG (2048x2048)
  const handleDownloadPNG = async (res = 2048) => {
    setDownloadingFormat('png')
    try {
      const dataUrl = await exportHighResPNG(content || 'https://qrflow.io', mergedConfig, res)
      triggerDownload(dataUrl, `qrflow-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${res}px.png`)
    } catch (err) {
      console.error('Download PNG Error:', err)
    } finally {
      setDownloadingFormat(null)
    }
  }

  // Download Vector SVG
  const handleDownloadSVG = () => {
    setDownloadingFormat('svg')
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `qrflow-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`)
    } catch (err) {
      console.error('Download SVG Error:', err)
    } finally {
      setDownloadingFormat(null)
    }
  }

  // Print-Ready PDF
  const handleDownloadPDF = () => {
    if (!canvasRef.current) return
    exportPrintReadyPDF(canvasRef.current, title)
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
    <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
      {/* Canvas Frame Container */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all group">
        <canvas
          ref={canvasRef}
          className="rounded-2xl max-w-full h-auto shadow-sm"
          style={{ imageRendering: 'auto' }}
        />

        {isRendering && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}
      </div>

      {/* Download Action Buttons */}
      {showDownloads && (
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={() => handleDownloadPNG(2048)}
            disabled={isRendering || downloadingFormat !== null}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {downloadingFormat === 'png' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download High-Res PNG (2048px)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadSVG}
              disabled={isRendering || downloadingFormat !== null}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:border-slate-700"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vector SVG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isRendering}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
