'use client'

import { useEffect, useState } from 'react'
import { FileText, Eye, Download, Trash2, Search } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Quote {
  id: string
  number: string
  status: string
  customerName: string
  roofType: { name: string }
  finalPrice: number
  createdAt: string
  validUntil: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rozpracovaná', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Odeslaná', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Přijatá', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Odmítnutá', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Prošlá', color: 'bg-yellow-100 text-yellow-700' },
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchQuotes()
  }, [])

  async function fetchQuotes() {
    try {
      const res = await fetch('/api/admin/quotes')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      search === '' ||
      quote.number.toLowerCase().includes(search.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nabídky</h1>
          <p className="text-gray-500">Přehled vytvořených nabídek</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
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
                {Object.entries(statusLabels).map(([value, { label }]) => (
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
        <CardHeader>
          <CardTitle>Seznam nabídek</CardTitle>
          <CardDescription>
            Celkem {filteredQuotes.length} nabídek
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Žádné nabídky</h3>
              <p className="text-gray-500 mt-1">
                Zatím nebyly vytvořeny žádné nabídky.
              </p>
              <p className="text-gray-500">
                Použijte kalkulátor pro vytvoření nové nabídky.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo</TableHead>
                  <TableHead>Zákazník</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead>Vytvořeno</TableHead>
                  <TableHead>Platnost</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const status = statusLabels[quote.status] || statusLabels.DRAFT
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono">{quote.number}</TableCell>
                      <TableCell className="font-medium">{quote.customerName}</TableCell>
                      <TableCell>{quote.roofType.name}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {quote.finalPrice.toLocaleString('cs-CZ')} Kč
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString('cs-CZ')}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(quote.validUntil).toLocaleDateString('cs-CZ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
