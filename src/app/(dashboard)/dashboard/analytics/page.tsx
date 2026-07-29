'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Globe, Smartphone, Monitor, Download, Loader2 } from 'lucide-react'
import { exportToCSV } from '@/lib/csv-exporter'

interface ScanLogItem {
  id: string
  qrTitle: string
  shortCode: string
  timestamp: string
  country: string
  city: string
  device: string
  browser: string
  ip: string
}

interface AnalyticsData {
  logs: ScanLogItem[]
  topDevice: string
  topBrowser: string
  topCountry: string
  totalScansRecorded: number
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleExport = () => {
    if (!data?.logs || data.logs.length === 0) {
      alert('No scan telemetry logs available to export.')
      return
    }
    exportToCSV(data.logs, `qrflow-scan-analytics-${timeframe}`)
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics & Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time scan telemetry, geographic distribution, and device metrics.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Fetching live scan telemetry from database...</span>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Device Category</span>
                <Smartphone className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{data?.topDevice || 'Mobile'}</p>
              <span className="text-xs text-slate-400 mt-1 block">Captured via user agent</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Browser</span>
                <Monitor className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{data?.topBrowser || 'Chrome'}</p>
              <span className="text-xs text-slate-400 mt-1 block">Live browser breakdown</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Location</span>
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{data?.topCountry || 'United States'}</p>
              <span className="text-xs text-slate-400 mt-1 block">{data?.totalScansRecorded || 0} Total Scans Logged</span>
            </div>
          </div>

          {/* Scan Log Telemetry Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Live Scan Telemetry Stream</h2>
                <p className="text-slate-400 text-xs mt-0.5">Sub-second scan events captured across edge nodes</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              {data?.logs && data.logs.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp</th>
                      <th className="px-4 py-3 font-semibold">QR Code</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                      <th className="px-4 py-3 font-semibold">Browser</th>
                      <th className="px-4 py-3 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {data.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 text-slate-400">{log.timestamp}</td>
                        <td className="px-4 py-3.5 text-indigo-400 font-sans font-medium">
                          {log.qrTitle} <span className="text-slate-500 font-mono">(/q/{log.shortCode})</span>
                        </td>
                        <td className="px-4 py-3.5 text-white font-sans font-medium">
                          {log.city}, {log.country}
                        </td>
                        <td className="px-4 py-3.5 text-indigo-300 font-sans font-medium">{log.device}</td>
                        <td className="px-4 py-3.5 text-slate-300 font-sans">{log.browser}</td>
                        <td className="px-4 py-3.5 text-slate-500">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No scan events recorded yet. Scan a QR code link to see real-time telemetry here!
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
