'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface Surcharge {
  id: string
  code: string
  name: string
  category: string
  type: 'FIXED' | 'PERCENT'
  value: number
  valueRock: number | null
  minValue: number | null
  description: string | null
  sortOrder: number
  isActive: boolean
}

const categories = [
  { value: 'DOORS', label: 'Dveře' },
  { value: 'RAILS', label: 'Koleje' },
  { value: 'SURFACE', label: 'Povrch' },
  { value: 'POLYCARBONATE', label: 'Polykarbonát' },
  { value: 'CONSTRUCTION', label: 'Konstrukce' },
  { value: 'INSTALLATION', label: 'Montáž' },
  { value: 'OTHER', label: 'Ostatní' },
]

const categoryLabels: Record<string, string> = {
  DOORS: 'Dveře',
  RAILS: 'Koleje',
  SURFACE: 'Povrch',
  POLYCARBONATE: 'Polykarbonát',
  CONSTRUCTION: 'Konstrukce',
  INSTALLATION: 'Montáž',
  OTHER: 'Ostatní',
}

const defaultSurcharge: Partial<Surcharge> = {
  code: '',
  name: '',
  category: 'OTHER',
  type: 'FIXED',
  value: 0,
  valueRock: null,
  minValue: null,
  description: null,
  sortOrder: 0,
  isActive: true,
}

export default function SurchargesPage() {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Surcharge> | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    fetchSurcharges()
  }, [])

  async function fetchSurcharges() {
    try {
      const res = await fetch('/api/admin/surcharges')
      if (res.ok) {
        const data = await res.json()
        setSurcharges(data)
      }
    } catch (error) {
      console.error('Failed to fetch surcharges:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingItem({ ...defaultSurcharge })
    setDialogOpen(true)
  }

  function openEditDialog(surcharge: Surcharge) {
    setEditingItem({ ...surcharge })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!editingItem) return

    setSaving(true)
    try {
      const method = editingItem.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/surcharges', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      })

      if (res.ok) {
        setDialogOpen(false)
        setEditingItem(null)
        fetchSurcharges()
      } else {
        const error = await res.json()
        alert(`Chyba: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Nepodařilo se uložit')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Opravdu chcete smazat tento příplatek?')) return

    try {
      const res = await fetch(`/api/admin/surcharges?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchSurcharges()
      } else {
        alert('Nepodařilo se smazat')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  function formatValue(surcharge: Surcharge) {
    if (surcharge.type === 'PERCENT') {
      return `${(surcharge.value * 100).toFixed(0)}%`
    }
    return `${surcharge.value.toLocaleString('cs-CZ')} Kč`
  }

  const filteredSurcharges = filterCategory === 'all'
    ? surcharges
    : surcharges.filter(s => s.category === filterCategory)

  // Group by category
  const groupedSurcharges = filteredSurcharges.reduce((acc, surcharge) => {
    const category = surcharge.category
    if (!acc[category]) acc[category] = []
    acc[category].push(surcharge)
    return acc
  }, {} as Record<string, Surcharge[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Příplatky</h1>
          <p className="text-gray-500">Správa příplatků a doplňků</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nový příplatek
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label>Kategorie:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSurcharges).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="py-3">
                <CardTitle className="text-lg">{categoryLabels[category] || category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kód</TableHead>
                      <TableHead>Název</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Hodnota</TableHead>
                      <TableHead className="text-right">ROCK</TableHead>
                      <TableHead className="text-center">Aktivní</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((surcharge) => (
                      <TableRow key={surcharge.id}>
                        <TableCell className="font-mono text-sm">
                          {surcharge.code}
                        </TableCell>
                        <TableCell>{surcharge.name}</TableCell>
                        <TableCell>
                          <Badge variant={surcharge.type === 'FIXED' ? 'default' : 'secondary'}>
                            {surcharge.type === 'FIXED' ? 'Fixní' : 'Procenta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatValue(surcharge)}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {surcharge.valueRock !== null && surcharge.type === 'PERCENT'
                            ? `${(surcharge.valueRock * 100).toFixed(0)}%`
                            : surcharge.valueRock !== null
                            ? `${surcharge.valueRock.toLocaleString('cs-CZ')} Kč`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {surcharge.isActive ? (
                            <Check className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(surcharge)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(surcharge.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? 'Upravit příplatek' : 'Nový příplatek'}
            </DialogTitle>
            <DialogDescription>
              Vyplňte údaje o příplatku
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kód</Label>
                  <Input
                    value={editingItem.code || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, code: e.target.value })
                    }
                    placeholder="doors_lock"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(v) =>
                      setEditingItem({ ...editingItem, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Název</Label>
                <Input
                  value={editingItem.name || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  placeholder="Uzamykání dveří"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select
                    value={editingItem.type}
                    onValueChange={(v) =>
                      setEditingItem({
                        ...editingItem,
                        type: v as 'FIXED' | 'PERCENT',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixní (Kč)</SelectItem>
                      <SelectItem value="PERCENT">Procenta (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Hodnota {editingItem.type === 'PERCENT' ? '(desetinně)' : '(Kč)'}
                  </Label>
                  <Input
                    type="number"
                    value={editingItem.value || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    step={editingItem.type === 'PERCENT' ? 0.01 : 100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hodnota pro ROCK (volitelné)</Label>
                  <Input
                    type="number"
                    value={editingItem.valueRock ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        valueRock: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    step={editingItem.type === 'PERCENT' ? 0.01 : 100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min. hodnota (volitelné)</Label>
                  <Input
                    type="number"
                    value={editingItem.minValue ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        minValue: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={editingItem.isActive ?? true}
                  onCheckedChange={(c) =>
                    setEditingItem({ ...editingItem, isActive: !!c })
                  }
                />
                <Label htmlFor="isActive">Aktivní</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
