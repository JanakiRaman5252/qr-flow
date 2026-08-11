'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QrCode, Plus, TrendingUp, BarChart2, Eye, Globe, ArrowUpRight, Loader2 } from 'lucide-react'

interface StatsData {
  totalScans: number
  activeQRsCount: number
  dynamicQRsCount: number
  uniqueVisitors: number
  topCountry: string
  recentQRs: Array<{
    id: string
    title: string
    shortCode: string
    type: string
    destinationUrl: string
    scanCount: number
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        if (json.success) {
          setStats(json.data)
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your dynamic QR codes, monitor live traffic, and manage team workspaces.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/qr/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create QR Code</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Fetching live metrics from database...</span>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
                <BarChart2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{stats?.totalScans.toLocaleString() || 0}</p>
              <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live Database Analytics</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active QR Codes</span>
                <QrCode className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{stats?.activeQRsCount || 0}</p>
              <div className="text-xs font-medium text-slate-400 mt-2">
                {stats?.dynamicQRsCount || 0} Dynamic QRs
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Unique Visitors</span>
                <Eye className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">{stats?.uniqueVisitors.toLocaleString() || 0}</p>
              <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Real-Time Edge Capture</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Location</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-3 truncate">{stats?.topCountry || 'No Scans Yet'}</p>
              <div className="text-xs font-medium text-slate-400 mt-2">
                Geographic distribution
              </div>
            </div>
          </div>

          {/* Recent QRs Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Active QR Codes</h2>
                <p className="text-slate-400 text-xs mt-0.5">Instant editable destinations with geo analytics</p>
              </div>
              <Link href="/dashboard/qr" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View all QRs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {stats?.recentQRs && stats.recentQRs.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Title / Shortcode</th>
                      <th className="px-4 py-3 font-semibold">Destination URL</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Scans</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recentQRs.map((qr) => (
                      <tr key={qr.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">
                          {qr.title}
                          <span className="block text-xs font-mono text-slate-500">/q/{qr.shortCode}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-400 max-w-xs truncate">
                          {qr.destinationUrl}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {qr.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-white">{qr.scanCount}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No QR codes created yet.{' '}
                  <Link href="/dashboard/qr/new" className="text-indigo-400 font-semibold hover:underline">
                    Create your first dynamic QR code!
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
