'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface RoofType {
  id: string
  code: string
  name: string
  maxWidth: number
  minWidth: number
  hasSkirts: boolean
  isActive: boolean
  _count: {
    prices: number
  }
}

interface Price {
  id: string
  roofTypeId: string
  widthLabel: string
  widthMin: number
  widthMax: number
  modules: number
  price: number
  height: number
}

export default function PricesPage() {
  const [roofTypes, setRoofTypes] = useState<RoofType[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [selectedRoofType, setSelectedRoofType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedPrices, setEditedPrices] = useState<Record<string, { price?: number; height?: number }>>({})

  useEffect(() => {
    fetchRoofTypes()
  }, [])

  useEffect(() => {
    if (selectedRoofType) {
      fetchPrices(selectedRoofType)
    }
  }, [selectedRoofType])

  async function fetchRoofTypes() {
    try {
      const res = await fetch('/api/admin/roof-types')
      if (res.ok) {
        const data = await res.json()
        setRoofTypes(data)
        if (data.length > 0) {
          setSelectedRoofType(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch roof types:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPrices(roofTypeId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/prices?roofTypeId=${roofTypeId}`)
      if (res.ok) {
        const data = await res.json()
        setPrices(data)
        setEditedPrices({})
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    } finally {
      setLoading(false)
    }
  }

  function handlePriceChange(id: string, field: 'price' | 'height', value: number) {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  async function handleSave() {
    const updates = Object.entries(editedPrices).map(([id, changes]) => ({
      id,
      ...changes,
    }))

    if (updates.length === 0) {
      alert('Žádné změny k uložení')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (res.ok) {
        // Refresh prices
        await fetchPrices(selectedRoofType)
        alert(`Uloženo ${updates.length} změn`)
      } else {
        alert('Nepodařilo se uložit')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Nepodařilo se uložit')
    } finally {
      setSaving(false)
    }
  }

  // Group prices by width for matrix display
  const priceMatrix: Record<string, Record<number, Price>> = {}
  const widthLabels: string[] = []

  prices.forEach((price) => {
    if (!priceMatrix[price.widthLabel]) {
      priceMatrix[price.widthLabel] = {}
      widthLabels.push(price.widthLabel)
    }
    priceMatrix[price.widthLabel][price.modules] = price
  })

  const moduleNumbers = [2, 3, 4, 5, 6, 7]
  const selectedType = roofTypes.find((rt) => rt.id === selectedRoofType)
  const hasChanges = Object.keys(editedPrices).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ceníky</h1>
          <p className="text-gray-500">Správa cen zastřešení podle typu a rozměrů</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchPrices(selectedRoofType)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Ukládám...' : `Uložit změny (${Object.keys(editedPrices).length})`}
          </Button>
        </div>
      </div>

      {/* Roof Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Typ zastřešení</CardTitle>
          <CardDescription>Vyberte typ pro zobrazení a úpravu ceníku</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roofTypes.map((rt) => (
              <Button
                key={rt.id}
                variant={selectedRoofType === rt.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRoofType(rt.id)}
              >
                {rt.name}
                <Badge variant="secondary" className="ml-2">
                  {rt._count.prices}
                </Badge>
              </Button>
            ))}
          </div>

          {selectedType && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-500">Kód:</span>{' '}
                  <span className="font-medium">{selectedType.code}</span>
                </div>
                <div>
                  <span className="text-gray-500">Min. šířka:</span>{' '}
                  <span className="font-medium">{selectedType.minWidth.toLocaleString('cs-CZ')} mm</span>
                </div>
                <div>
                  <span className="text-gray-500">Max. šířka:</span>{' '}
                  <span className="font-medium">{selectedType.maxWidth.toLocaleString('cs-CZ')} mm</span>
                </div>
                <div>
                  <span className="text-gray-500">Šikminy:</span>{' '}
                  <span className="font-medium">{selectedType.hasSkirts ? 'Ano' : 'Ne'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Cenová matice</CardTitle>
          <CardDescription>
            Ceny v Kč / Standardní výška v metrech
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Šířka</TableHead>
                  {moduleNumbers.map((m) => (
                    <TableHead key={m} className="text-center min-w-[140px]">
                      {m} moduly
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {widthLabels.map((widthLabel) => (
                  <TableRow key={widthLabel}>
                    <TableCell className="sticky left-0 bg-white font-medium">
                      {widthLabel}
                    </TableCell>
                    {moduleNumbers.map((m) => {
                      const price = priceMatrix[widthLabel]?.[m]
                      if (!price) {
                        return (
                          <TableCell key={m} className="text-center text-gray-400">
                            -
                          </TableCell>
                        )
                      }

                      const edited = editedPrices[price.id]
                      const currentPrice = edited?.price ?? price.price
                      const currentHeight = edited?.height ?? price.height
                      const isEdited = edited !== undefined

                      return (
                        <TableCell key={m} className="p-1">
                          <div className={`space-y-1 p-2 rounded ${isEdited ? 'bg-yellow-50' : ''}`}>
                            <Input
                              type="number"
                              value={currentPrice}
                              onChange={(e) =>
                                handlePriceChange(price.id, 'price', parseInt(e.target.value) || 0)
                              }
                              className="h-8 text-right text-sm"
                            />
                            <Input
                              type="number"
                              value={currentHeight}
                              onChange={(e) =>
                                handlePriceChange(price.id, 'height', parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-right text-sm text-gray-500"
                              step={0.01}
                            />
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-sm text-gray-500">
        <p>• Horní pole: Cena v Kč</p>
        <p>• Dolní pole: Standardní výška v metrech</p>
        <p>• Žluté pozadí: Neuložené změny</p>
      </div>
    </div>
  )
}
