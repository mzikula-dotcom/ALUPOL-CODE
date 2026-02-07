'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  Copy,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Providers } from '@/components/providers'

interface Quote {
  id: string
  number: string
  status: string
  customerName: string
  customerEmail: string | null
  width: number
  modules: number
  finalPrice: number
  createdAt: string
  validUntil: string
  roofType: { code: string; name: string }
  user: { name: string | null; email: string }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Rozpracovaná', variant: 'secondary' },
  SENT: { label: 'Odeslaná', variant: 'default' },
  ACCEPTED: { label: 'Přijatá', variant: 'default' },
  REJECTED: { label: 'Odmítnutá', variant: 'destructive' },
  EXPIRED: { label: 'Prošlá', variant: 'outline' },
}

function QuotesContent() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (session) {
      fetchQuotes()
    }
  }, [session, search, statusFilter])

  async function fetchQuotes() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/quotes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Opravdu chcete smazat tuto nabídku?')) return

    try {
      const res = await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchQuotes()
      } else {
        alert('Nepodařilo se smazat nabídku')
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        fetchQuotes()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  async function handleDuplicate(quote: Quote) {
    router.push(`/calculator?duplicate=${quote.id}`)
  }

  async function handleDownloadPDF(quote: Quote) {
    try {
      const res = await fetch(`/api/quotes/${quote.id}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${quote.number}.pdf`
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

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-lg font-bold text-gray-900">ALUPOL</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">Nabídky</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/calculator" className="text-gray-600 hover:text-gray-900">
              Kalkulátor
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
            <span className="text-sm text-gray-500">
              {session.user?.name || session.user?.email}
            </span>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Moje nabídky</h1>
            <p className="text-gray-500">Celkem {total} nabídek</p>
          </div>
          <Link href="/calculator">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nová nabídka
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Hledat podle čísla nebo zákazníka..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny stavy</SelectItem>
                  {Object.entries(statusConfig).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Žádné nabídky</h3>
                <p className="text-gray-500 mt-1">
                  {search || statusFilter !== 'all'
                    ? 'Žádné nabídky neodpovídají filtrům.'
                    : 'Vytvořte svou první nabídku pomocí kalkulátoru.'}
                </p>
                <Link href="/calculator" className="mt-4 inline-block">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nová nabídka
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Číslo</TableHead>
                    <TableHead>Zákazník</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Rozměry</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Cena</TableHead>
                    <TableHead>Vytvořeno</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => {
                    const status = statusConfig[quote.status] || statusConfig.DRAFT
                    const isExpired = new Date(quote.validUntil) < new Date()

                    return (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <Link
                            href={`/quotes/${quote.id}`}
                            className="font-mono text-blue-600 hover:underline"
                          >
                            {quote.number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{quote.customerName}</div>
                            {quote.customerEmail && (
                              <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{quote.roofType.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {quote.width.toLocaleString('cs-CZ')} mm × {quote.modules} mod.
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {isExpired && quote.status === 'DRAFT' ? 'Prošlá' : status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {quote.finalPrice.toLocaleString('cs-CZ')} Kč
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString('cs-CZ')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/quotes/${quote.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Zobrazit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/quotes/${quote.id}/edit`}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Upravit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(quote)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Kopírovat
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                                <Download className="w-4 h-4 mr-2" />
                                Stáhnout PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'SENT')}>
                                Označit jako odeslanou
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'ACCEPTED')}>
                                Označit jako přijatou
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(quote.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Smazat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function QuotesPage() {
  return (
    <Providers>
      <QuotesContent />
    </Providers>
  )
}
