'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DollarSign, Settings, FileText, Users, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  roofTypes: number
  prices: number
  surcharges: number
  quotes: number
  users: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    roofTypes: 11,
    prices: 0,
    surcharges: 21,
    quotes: 0,
    users: 1,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Načtení statistik z API
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Typy zastřešení',
      value: stats.roofTypes,
      description: 'Aktivních typů',
      icon: TrendingUp,
      href: '/admin/prices',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Ceníkové položky',
      value: stats.prices,
      description: 'Cenových kombinací',
      icon: DollarSign,
      href: '/admin/prices',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Příplatky',
      value: stats.surcharges,
      description: 'Typů příplatků',
      icon: Settings,
      href: '/admin/surcharges',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Nabídky',
      value: stats.quotes,
      description: 'Vytvořených nabídek',
      icon: FileText,
      href: '/admin/quotes',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Uživatelé',
      value: stats.users,
      description: 'Registrovaných účtů',
      icon: Users,
      href: '/admin/users',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Přehled systému ALUPOL Kalkulátor</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : card.value.toLocaleString('cs-CZ')}
                  </div>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rychlé akce</CardTitle>
            <CardDescription>Nejčastější operace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/prices"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span>Upravit ceníky</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/surcharges"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-orange-600" />
                <span>Upravit příplatky</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/quotes"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Zobrazit nabídky</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Systémové informace</CardTitle>
            <CardDescription>Stav aplikace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Verze</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prostředí</span>
                <span className="font-medium">
                  {process.env.NODE_ENV === 'production' ? 'Produkce' : 'Vývoj'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Databáze</span>
                <span className="font-medium text-green-600">Připojeno</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
