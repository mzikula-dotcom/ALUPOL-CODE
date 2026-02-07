'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Pencil,
  Copy,
  Trash2,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Providers } from '@/components/providers'
import { formatPrice } from '@/lib/calculations'

interface QuoteDetail {
  id: string
  number: string
  status: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  dealerName: string | null
  dealerContact: string | null
  roofType: {
    code: string
    name: string
    image: string | null
  }
  width: number
  modules: number
  length: number | null
  height: number | null
  standardLength: number
  standardHeight: number
  configuration: Record<string, unknown>
  basePrice: number
  surchargesTotal: number
  transportPrice: number
  transportKm: number | null
  installPrice: number
  installType: string | null
  discountPercent: number | null
  discountAmount: number | null
  finalPrice: number
  validUntil: string
  notes: string | null
  createdAt: string
  user: { name: string | null; email: string }
  items: Array<{
    id: string
    name: string
    description: string | null
    quantity: number | null
    unit: string | null
    price: number
  }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rozpracovaná', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Odeslaná', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Přijatá', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Odmítnutá', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Prošlá', color: 'bg-yellow-100 text-yellow-700' },
}

function QuoteDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (session && id) {
      fetchQuote()
    }
  }, [session, id])

  async function fetchQuote() {
    try {
      const res = await fetch(`/api/quotes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setQuote(data)
      } else if (res.status === 404) {
        router.push('/quotes')
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Opravdu chcete smazat tuto nabídku?')) return

    try {
      const res = await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/quotes')
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
    }
  }

  async function handleDownloadPDF() {
    try {
      const res = await fetch(`/api/quotes/${id}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${quote?.number || 'nabidka'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Nepodařilo se vygenerovat PDF')
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert('Nepodařilo se stáhnout PDF')
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session || !quote) {
    return null
  }

  const status = statusConfig[quote.status] || statusConfig.DRAFT
  const isExpired = new Date(quote.validUntil) < new Date()
  const config = quote.configuration as {
    hasBigFront?: boolean
    hasSmallFront?: boolean
    bigFrontType?: string
    smallFrontType?: string
    hasSideDoors?: boolean
    walkingRails?: boolean
    mountainReinforcement?: boolean
    surfaceType?: string
    ralColor?: string
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">{quote.number}</h1>
              <p className="text-sm text-gray-500">
                Vytvořeno {new Date(quote.createdAt).toLocaleDateString('cs-CZ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/calculator?duplicate=${id}`)}>
              <Copy className="w-4 h-4 mr-2" />
              Kopírovat
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => router.push(`/quotes/${id}/edit`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Upravit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Validity */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={status.color}>
                      {isExpired && quote.status === 'DRAFT' ? 'Prošlá' : status.label}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      Platnost do {new Date(quote.validUntil).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Smazat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Konfigurace zastřešení</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Základní parametry</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Typ zastřešení</dt>
                        <dd className="font-medium">{quote.roofType.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Šířka</dt>
                        <dd className="font-medium">{quote.width.toLocaleString('cs-CZ')} mm</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Počet modulů</dt>
                        <dd className="font-medium">{quote.modules}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Délka</dt>
                        <dd className="font-medium">
                          {(quote.length || quote.standardLength).toLocaleString('cs-CZ')} mm
                          {!quote.length && ' (std.)'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Výška</dt>
                        <dd className="font-medium">
                          {(quote.height || quote.standardHeight).toLocaleString('cs-CZ')} mm
                          {!quote.height && ' (std.)'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Doplňky</h4>
                    <ul className="space-y-1 text-sm">
                      {config.hasBigFront === false && (
                        <li className="text-gray-600">• Bez velkého čela</li>
                      )}
                      {config.hasSmallFront === false && (
                        <li className="text-gray-600">• Bez malého čela</li>
                      )}
                      {config.bigFrontType === 'doors' && (
                        <li className="text-gray-600">• Dveře ve velkém čele</li>
                      )}
                      {config.smallFrontType === 'doors' && (
                        <li className="text-gray-600">• Dveře v malém čele</li>
                      )}
                      {config.hasSideDoors && (
                        <li className="text-gray-600">• Boční dveře</li>
                      )}
                      {config.walkingRails && (
                        <li className="text-gray-600">• Pochozí koleje</li>
                      )}
                      {config.mountainReinforcement && (
                        <li className="text-gray-600">• Zpevnění pro podhorskou oblast</li>
                      )}
                      {config.surfaceType && config.surfaceType !== 'standard' && (
                        <li className="text-gray-600">
                          • Povrch: {config.surfaceType === 'bronze_elox' ? 'Bronzový elox' :
                            config.surfaceType === 'anthracite_elox' ? 'Antracitový elox' :
                            config.surfaceType === 'ral' ? `RAL ${config.ralColor}` : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cenová kalkulace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Základní cena zastřešení</span>
                    <span className="font-medium">{formatPrice(quote.basePrice)}</span>
                  </div>

                  {quote.surchargesTotal !== 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span>Příplatky a doplňky</span>
                      <span className={quote.surchargesTotal < 0 ? 'text-green-600' : ''}>
                        {formatPrice(quote.surchargesTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-b font-medium">
                    <span>Cena zastřešení</span>
                    <span>{formatPrice(quote.basePrice + quote.surchargesTotal)}</span>
                  </div>

                  {quote.transportPrice > 0 && (
                    <div className="flex justify-between py-2">
                      <span>
                        Doprava {quote.transportKm && `(${quote.transportKm} km)`}
                      </span>
                      <span>{formatPrice(quote.transportPrice)}</span>
                    </div>
                  )}

                  {quote.installPrice > 0 && (
                    <div className="flex justify-between py-2">
                      <span>
                        Montáž {quote.installType === 'cz' ? '(ČR)' : quote.installType === 'eu' ? '(EU)' : ''}
                      </span>
                      <span>{formatPrice(quote.installPrice)}</span>
                    </div>
                  )}

                  {quote.discountAmount && quote.discountAmount > 0 && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Sleva {quote.discountPercent}%</span>
                      <span>-{formatPrice(quote.discountAmount)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between py-2 text-lg">
                    <span className="font-bold">CELKEM</span>
                    <span className="font-bold text-blue-600">
                      {formatPrice(quote.finalPrice)} + DPH
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Poznámky</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image */}
            <Card>
              <CardContent className="p-4">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={quote.roofType.image || `/images/${quote.roofType.code.toLowerCase()}.png`}
                    alt={quote.roofType.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-center mt-2 font-medium">{quote.roofType.name}</p>
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zákazník</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{quote.customerName}</p>
                  </div>
                </div>
                {quote.customerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${quote.customerEmail}`} className="text-blue-600 hover:underline">
                      {quote.customerEmail}
                    </a>
                  </div>
                )}
                {quote.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${quote.customerPhone}`} className="text-blue-600 hover:underline">
                      {quote.customerPhone}
                    </a>
                  </div>
                )}
                {quote.customerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-600">{quote.customerAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dealer */}
            {quote.dealerName && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Odběratel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{quote.dealerName}</p>
                  {quote.dealerContact && (
                    <p className="text-gray-600 text-sm">{quote.dealerContact}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vypracoval</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{quote.user.name || quote.user.email}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(quote.createdAt).toLocaleString('cs-CZ')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Providers>
      <QuoteDetailContent params={params} />
    </Providers>
  )
}
