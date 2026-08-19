'use client'

import React, { useEffect, useState } from 'react'
import {
  Globe,
  Smartphone,
  Monitor,
  Loader2,
  Users,
  Activity,
  FileSpreadsheet,
} from 'lucide-react'
import { exportToCSV } from '@/lib/csv-exporter'
import { AnalyticsAreaChart } from '@/components/analytics/AnalyticsAreaChart'
import { DeviceDonutChart } from '@/components/analytics/DeviceDonutChart'
import { BreakdownCard } from '@/components/analytics/BreakdownCard'
import { TopQRCodesCard } from '@/components/analytics/TopQRCodesCard'
import { Skeleton } from '@/components/ui/skeleton'

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

interface AnalyticsState {
  totalScans: number
  uniqueVisitors: number
  timeSeries: Array<{ date: string; scans: number; unique: number }>
  deviceBreakdown: Array<{ name: string; count: number; percentage: number }>
  browserBreakdown: Array<{ name: string; count: number; percentage: number }>
  locationBreakdown: Array<{ name: string; count: number; percentage: number }>
  topQRCodes: Array<{
    id: string
    title: string
    shortCode: string
    type: string
    periodScans: number
    totalScans: number
  }>
  logs: Array<{
    id: string
    qrTitle: string
    shortCode: string
    timestamp: string
    country: string
    city: string
    device: string
    browser: string
    ip: string
  }>
  hasAdvancedAnalytics: boolean
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'telemetry'>('overview')

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/analytics?timeframe=${timeframe}`)
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
  }, [timeframe])

  const handleExport = () => {
    if (!data?.logs || data.logs.length === 0) {
      alert('No scan telemetry logs available to export.')
      return
    }
    exportToCSV(data.logs, `dynoqr-scan-analytics-${timeframe}`)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white">Analytics & Intelligence</h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Real-time traffic trends, multi-dimensional device shares, and audience location intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation View Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview & Charts
            </button>
            <button
              onClick={() => setActiveTab('audience')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'audience'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audience Breakdown
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scan Logs
            </button>
          </div>

          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 shadow-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>

          {/* Main Chart Skeleton */}
          <Skeleton className="h-80 rounded-3xl" />

          {/* Breakdown Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Top Key Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Scan Count</span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3 tracking-tight">
                {data?.totalScans.toLocaleString() || 0}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Real database total
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Unique Visitors</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3 tracking-tight">
                {data?.uniqueVisitors.toLocaleString() || 0}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Distinct IP addresses
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Primary Device</span>
                <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3 tracking-tight truncate">
                {data?.deviceBreakdown[0]?.name || 'Desktop'}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {data?.deviceBreakdown[0]?.percentage || 0}% of audience
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Top Location</span>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3 tracking-tight truncate">
                {data?.locationBreakdown[0]?.name || 'Local'}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Highest scan region
              </span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & CHARTS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 2-Column Grid Layout: 2/3 Main Chart + 1/3 Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                  <AnalyticsAreaChart data={data?.timeSeries || []} timeframe={timeframe} />
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <TopQRCodesCard items={data?.topQRCodes || []} />
                  <DeviceDonutChart items={data?.deviceBreakdown || []} />
                </div>
              </div>

              {/* Geographic & Browser Split Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <BreakdownCard
                  title="Geographic Scan Distribution"
                  subtitle="Top scan countries & cities"
                  icon={<Globe className="w-4 h-4" />}
                  items={data?.locationBreakdown || []}
                  barColor="bg-emerald-600"
                />

                <BreakdownCard
                  title="Browser Client Distribution"
                  subtitle="User agent client engines"
                  icon={<Monitor className="w-4 h-4" />}
                  items={data?.browserBreakdown || []}
                  barColor="bg-violet-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE BREAKDOWN */}
          {activeTab === 'audience' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <DeviceDonutChart items={data?.deviceBreakdown || []} />

                <BreakdownCard
                  title="Browser Client Engines"
                  subtitle="Chrome, Safari, Firefox, Edge distribution"
                  icon={<Monitor className="w-4 h-4" />}
                  items={data?.browserBreakdown || []}
                  barColor="bg-indigo-600"
                />

                <BreakdownCard
                  title="Geographic Scan Locations"
                  subtitle="Country & city breakdown"
                  icon={<Globe className="w-4 h-4" />}
                  items={data?.locationBreakdown || []}
                  barColor="bg-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SCAN LOGS TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Live Scan Telemetry Stream</h3>
                  <p className="text-slate-400 text-xs mt-1">Real-time raw scan events recorded at edge nodes</p>
                </div>

                <button
                  onClick={handleExport}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700"
                >
                  <DownloadIcon className="w-4 h-4 text-emerald-400" />
                  <span>Download Telemetry</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                {data?.logs && data.logs.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 uppercase">
                        <th className="p-4 font-bold">Timestamp</th>
                        <th className="p-4 font-bold">QR Code</th>
                        <th className="p-4 font-bold">Location</th>
                        <th className="p-4 font-bold">Device</th>
                        <th className="p-4 font-bold">Browser</th>
                        <th className="p-4 font-bold">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {data.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 text-slate-400">{log.timestamp}</td>
                          <td className="p-4 font-sans font-bold text-indigo-400">
                            {log.qrTitle} <span className="text-slate-500 font-mono text-[11px]">( /q/{log.shortCode} )</span>
                          </td>
                          <td className="p-4 font-sans font-semibold text-white">
                            {log.city}, {log.country}
                          </td>
                          <td className="p-4 text-indigo-300 font-sans font-medium">{log.device}</td>
                          <td className="p-4 text-slate-300 font-sans">{log.browser}</td>
                          <td className="p-4 text-slate-500">{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No scan events recorded for this period. Scan a QR code to stream telemetry logs live!
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
