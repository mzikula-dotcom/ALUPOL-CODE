'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Check, Save, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Providers } from '@/components/providers'
import {
  type RoofConfiguration,
  getDefaultConfiguration,
  calculateQuote,
  formatPrice,
  formatNumber,
  getStandardLength,
} from '@/lib/calculations'

interface RoofType {
  id: string
  code: string
  name: string
  maxWidth: number
  minWidth: number
  hasSkirts: boolean
}

interface PriceData {
  widthLabel: string
  widthMin: number
  widthMax: number
  modules: number
  price: number
  height: number
}

interface SurchargeData {
  code: string
  name: string
  category: string
  type: 'FIXED' | 'PERCENT'
  value: number
  valueRock?: number | null
  minValue?: number | null
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
}

// Fallback data
const fallbackRoofTypes: RoofType[] = [
  { id: '1', code: 'PRACTIC', name: 'Practic', maxWidth: 5500, minWidth: 2000, hasSkirts: false },
  { id: '2', code: 'HARMONY', name: 'Harmony', maxWidth: 6000, minWidth: 2000, hasSkirts: true },
  { id: '3', code: 'DREAM', name: 'Dream', maxWidth: 6000, minWidth: 2000, hasSkirts: true },
  { id: '4', code: 'HORIZONT', name: 'Horizont', maxWidth: 6000, minWidth: 2000, hasSkirts: false },
  { id: '5', code: 'STAR', name: 'Star', maxWidth: 5500, minWidth: 2000, hasSkirts: true },
  { id: '6', code: 'ROCK', name: 'Rock', maxWidth: 6000, minWidth: 2000, hasSkirts: false },
  { id: '7', code: 'TERRACE', name: 'Terrace', maxWidth: 5000, minWidth: 1750, hasSkirts: true },
  { id: '8', code: 'WAVE', name: 'Wave', maxWidth: 5000, minWidth: 3100, hasSkirts: false },
  { id: '9', code: 'FLASH', name: 'Flash', maxWidth: 5000, minWidth: 2000, hasSkirts: false },
  { id: '10', code: 'WING', name: 'Wing', maxWidth: 5000, minWidth: 2000, hasSkirts: false },
  { id: '11', code: 'SUNSET', name: 'SunSet', maxWidth: 5500, minWidth: 2000, hasSkirts: false },
]

const fallbackPrices: PriceData[] = [
  { widthLabel: 'do 3 m', widthMin: 2000, widthMax: 3000, modules: 2, price: 59038, height: 0.70 },
  { widthLabel: 'do 3 m', widthMin: 2000, widthMax: 3000, modules: 3, price: 83590, height: 0.77 },
  { widthLabel: 'do 3 m', widthMin: 2000, widthMax: 3000, modules: 4, price: 110618, height: 0.84 },
  { widthLabel: 'do 3,25 m', widthMin: 3001, widthMax: 3250, modules: 2, price: 64626, height: 0.72 },
  { widthLabel: 'do 3,25 m', widthMin: 3001, widthMax: 3250, modules: 3, price: 91504, height: 0.79 },
  { widthLabel: 'do 3,5 m', widthMin: 3251, widthMax: 3500, modules: 2, price: 69134, height: 0.75 },
  { widthLabel: 'do 4 m', widthMin: 3501, widthMax: 4000, modules: 2, price: 76567, height: 0.80 },
]

const fallbackSurcharges: SurchargeData[] = [
  { code: 'doors_single_small', name: 'Dveře do 1m', category: 'DOORS', type: 'FIXED', value: 5000 },
  { code: 'doors_single_large', name: 'Dveře nad 1m', category: 'DOORS', type: 'FIXED', value: 7000 },
  { code: 'doors_side', name: 'Boční dveře', category: 'DOORS', type: 'FIXED', value: 7000 },
  { code: 'doors_lock', name: 'Zámek dveří', category: 'DOORS', type: 'FIXED', value: 800 },
  { code: 'vent_flap', name: 'Klapka', category: 'DOORS', type: 'FIXED', value: 7000 },
  { code: 'height_increase', name: 'Zvýšení', category: 'CONSTRUCTION', type: 'PERCENT', value: 0.03 },
  { code: 'mountain_reinforcement', name: 'Podhorská oblast', category: 'CONSTRUCTION', type: 'PERCENT', value: 0.15 },
  { code: 'segment_lock', name: 'Zámek segmentu', category: 'CONSTRUCTION', type: 'FIXED', value: 1000 },
  { code: 'poly_solid', name: 'Plný poly', category: 'POLYCARBONATE', type: 'FIXED', value: 1000 },
  { code: 'surface_bronze_elox', name: 'Bronz', category: 'SURFACE', type: 'PERCENT', value: 0.05 },
  { code: 'surface_anthracite_elox', name: 'Antracit', category: 'SURFACE', type: 'PERCENT', value: 0.05 },
  { code: 'surface_ral', name: 'RAL', category: 'SURFACE', type: 'PERCENT', value: 0.20 },
  { code: 'install_cz', name: 'Montáž CZ', category: 'INSTALLATION', type: 'PERCENT', value: 0.06, minValue: 5500 },
  { code: 'install_eu', name: 'Montáž EU', category: 'INSTALLATION', type: 'PERCENT', value: 0.08 },
  { code: 'module_shorten', name: 'Zkrácení', category: 'CONSTRUCTION', type: 'FIXED', value: 1500 },
  { code: 'module_extend', name: 'Prodloužení', category: 'CONSTRUCTION', type: 'FIXED', value: 3000 },
  { code: 'module_extend_meter', name: 'Prodloužení/m', category: 'CONSTRUCTION', type: 'FIXED', value: 2000 },
]

type Step = 'type' | 'dimensions' | 'options' | 'transport' | 'customer' | 'summary'

const steps: { id: Step; label: string }[] = [
  { id: 'type', label: 'Typ' },
  { id: 'dimensions', label: 'Rozměry' },
  { id: 'options', label: 'Doplňky' },
  { id: 'transport', label: 'Doprava' },
  { id: 'customer', label: 'Zákazník' },
  { id: 'summary', label: 'Souhrn' },
]

function CalculatorContent() {
  const router = useRouter()
  const { data: session } = useSession()

  const [step, setStep] = useState<Step>('type')
  const [config, setConfig] = useState<RoofConfiguration>(getDefaultConfiguration())
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', email: '', phone: '', address: '' })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [roofTypes, setRoofTypes] = useState<RoofType[]>(fallbackRoofTypes)
  const [prices, setPrices] = useState<PriceData[]>(fallbackPrices)
  const [surcharges, setSurcharges] = useState<SurchargeData[]>(fallbackSurcharges)

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        const [rtRes, sRes] = await Promise.all([
          fetch('/api/roof-types'),
          fetch('/api/surcharges'),
        ])
        if (rtRes.ok) setRoofTypes(await rtRes.json())
        if (sRes.ok) setSurcharges(await sRes.json())
      } catch (e) {
        console.error('Failed to load data:', e)
      }
    }
    loadData()
  }, [])

  // Load prices when roof type changes
  useEffect(() => {
    async function loadPrices() {
      const rt = roofTypes.find(r => r.code === config.roofTypeCode)
      if (!rt) return
      try {
        const res = await fetch(`/api/prices?roofTypeId=${rt.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) setPrices(data)
        }
      } catch (e) {
        console.error('Failed to load prices:', e)
      }
    }
    loadPrices()
  }, [config.roofTypeCode, roofTypes])

  const selectedRoofType = roofTypes.find(rt => rt.code === config.roofTypeCode)
  const standardLength = getStandardLength(config.modules)
  const standardHeight = useMemo(() => {
    const price = prices.find(
      p => config.width >= p.widthMin && config.width <= p.widthMax && p.modules === config.modules
    )
    return price ? Math.round(price.height * 1000) : 700
  }, [config.width, config.modules, prices])

  const calculation = useMemo(() => {
    if (!selectedRoofType) return null
    try {
      return calculateQuote(config, selectedRoofType, prices, surcharges)
    } catch {
      return null
    }
  }, [config, selectedRoofType, prices, surcharges])

  const updateConfig = (updates: Partial<RoofConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const currentStepIndex = steps.findIndex(s => s.id === step)

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].id)
    }
  }

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].id)
    }
  }

  const handleSave = async () => {
    if (!session) {
      router.push('/admin/login?callbackUrl=/calculator')
      return
    }

    if (!customer.name) {
      alert('Zadejte jméno zákazníka')
      setStep('customer')
      return
    }

    if (!calculation || !selectedRoofType) return

    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email || null,
          customerPhone: customer.phone || null,
          customerAddress: customer.address || null,
          roofTypeId: selectedRoofType.id,
          width: config.width,
          modules: config.modules,
          length: config.useStandardLength ? null : config.customLength,
          height: config.useStandardHeight ? null : config.customHeight,
          standardLength: calculation.standardLength,
          standardHeight: calculation.standardHeight,
          configuration: config,
          basePrice: calculation.basePrice,
          surchargesTotal: calculation.surchargesTotal,
          transportPrice: calculation.transportPrice,
          transportKm: config.includeTransport ? config.transportKm : null,
          transportRate: config.includeTransport ? config.transportRate : null,
          installPrice: calculation.installPrice,
          installType: config.installationType !== 'none' ? config.installationType : null,
          discountPercent: config.discountPercent || null,
          discountAmount: calculation.discountAmount || null,
          finalPrice: calculation.finalPrice,
          validityMonths: 3,
          notes: notes || null,
        }),
      })

      if (res.ok) {
        const quote = await res.json()
        router.push(`/quotes/${quote.id}`)
      } else {
        const err = await res.json()
        alert(`Chyba: ${err.error || 'Nepodařilo se uložit'}`)
      }
    } catch (e) {
      console.error('Save failed:', e)
      alert('Nepodařilo se uložit nabídku')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-lg font-bold text-gray-900">ALUPOL</span>
          </Link>

          {/* Steps */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                    step === s.id
                      ? 'bg-blue-600 text-white'
                      : i < currentStepIndex
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i < currentStepIndex && <Check className="w-3 h-3" />}
                  {s.label}
                </button>
                {i < steps.length - 1 && <div className="w-3 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>

          {/* Price */}
          {calculation && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Celkem</div>
              <div className="text-lg font-bold text-blue-600">{formatPrice(calculation.finalPrice)}</div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Step: Type */}
            {step === 'type' && (
              <Card>
                <CardHeader><CardTitle>Vyberte typ zastřešení</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {roofTypes.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => updateConfig({ roofTypeCode: rt.code })}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          config.roofTypeCode === rt.code
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-video relative mb-2">
                          <Image src={`/images/${rt.code.toLowerCase()}.png`} alt={rt.name} fill className="object-contain" />
                        </div>
                        <div className="font-medium text-sm">{rt.name}</div>
                        <div className="text-xs text-gray-500">max {formatNumber(rt.maxWidth)} mm</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Dimensions */}
            {step === 'dimensions' && (
              <Card>
                <CardHeader><CardTitle>Rozměry</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Šířka mezi kolejemi (mm)</Label>
                    <Input
                      type="number"
                      value={config.width}
                      onChange={(e) => updateConfig({ width: parseInt(e.target.value) || 0 })}
                      min={selectedRoofType?.minWidth || 2000}
                      max={selectedRoofType?.maxWidth || 6000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(selectedRoofType?.minWidth || 2000)} - {formatNumber(selectedRoofType?.maxWidth || 6000)} mm
                    </p>
                  </div>
                  <div>
                    <Label>Počet modulů</Label>
                    <Select value={config.modules.toString()} onValueChange={(v) => updateConfig({ modules: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7].map((m) => (
                          <SelectItem key={m} value={m.toString()}>{m} moduly</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Checkbox id="stdLen" checked={config.useStandardLength} onCheckedChange={(c) => updateConfig({ useStandardLength: !!c })} />
                    <Label htmlFor="stdLen">Standardní délka ({formatNumber(standardLength)} mm)</Label>
                  </div>
                  {!config.useStandardLength && (
                    <Input type="number" value={config.customLength || standardLength} onChange={(e) => updateConfig({ customLength: parseInt(e.target.value) || 0 })} />
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox id="stdHei" checked={config.useStandardHeight} onCheckedChange={(c) => updateConfig({ useStandardHeight: !!c })} />
                    <Label htmlFor="stdHei">Standardní výška ({formatNumber(standardHeight)} mm)</Label>
                  </div>
                  {!config.useStandardHeight && (
                    <Input type="number" value={config.customHeight || standardHeight} onChange={(e) => updateConfig({ customHeight: parseInt(e.target.value) || 0 })} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step: Options */}
            {step === 'options' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Čela</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox checked={config.hasBigFront} onCheckedChange={(c) => updateConfig({ hasBigFront: !!c })} />
                          <Label>Velké čelo</Label>
                        </div>
                        {config.hasBigFront && (
                          <RadioGroup value={config.bigFrontType} onValueChange={(v) => updateConfig({ bigFrontType: v as 'fixed' | 'doors' | 'flap' })}>
                            <div className="flex items-center gap-2"><RadioGroupItem value="fixed" /><Label>Pevné</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="doors" /><Label>Dveře</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="flap" /><Label>Klapka</Label></div>
                          </RadioGroup>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox checked={config.hasSmallFront} onCheckedChange={(c) => updateConfig({ hasSmallFront: !!c })} />
                          <Label>Malé čelo</Label>
                        </div>
                        {config.hasSmallFront && (
                          <RadioGroup value={config.smallFrontType} onValueChange={(v) => updateConfig({ smallFrontType: v as 'fixed' | 'doors' | 'flap' })}>
                            <div className="flex items-center gap-2"><RadioGroupItem value="fixed" /><Label>Pevné</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="doors" /><Label>Dveře</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="flap" /><Label>Klapka</Label></div>
                          </RadioGroup>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Konstrukce</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={config.hasSideDoors} onCheckedChange={(c) => updateConfig({ hasSideDoors: !!c })} />
                      <Label>Boční dveře (+7 000 Kč)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={config.walkingRails} onCheckedChange={(c) => updateConfig({ walkingRails: !!c })} />
                      <Label>Pochozí koleje</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={config.segmentLocking} onCheckedChange={(c) => updateConfig({ segmentLocking: !!c })} />
                      <Label>Uzamykání segmentů</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={config.mountainReinforcement} onCheckedChange={(c) => updateConfig({ mountainReinforcement: !!c })} />
                      <Label>Zpevnění pro podhorskou oblast (+15%)</Label>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Povrch</CardTitle></CardHeader>
                  <CardContent>
                    <RadioGroup value={config.surfaceType} onValueChange={(v) => updateConfig({ surfaceType: v as RoofConfiguration['surfaceType'] })}>
                      <div className="flex items-center gap-2"><RadioGroupItem value="standard" /><Label>Stříbrný elox</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="anthracite_elox" /><Label>Antracitový elox (+5%)</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="bronze_elox" /><Label>Bronzový elox (+5%)</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="ral" /><Label>RAL nástřik (+20%)</Label></div>
                    </RadioGroup>
                    {config.surfaceType === 'ral' && (
                      <Input className="mt-2" placeholder="Číslo RAL" value={config.ralColor || ''} onChange={(e) => updateConfig({ ralColor: e.target.value })} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step: Transport */}
            {step === 'transport' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Doprava</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={config.includeTransport} onCheckedChange={(c) => updateConfig({ includeTransport: !!c })} />
                      <Label>Zahrnout dopravu</Label>
                    </div>
                    {config.includeTransport && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Vzdálenost (km)</Label>
                          <Input type="number" value={config.transportKm} onChange={(e) => updateConfig({ transportKm: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label>Sazba (Kč/km)</Label>
                          <Input type="number" value={config.transportRate} onChange={(e) => updateConfig({ transportRate: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Montáž</CardTitle></CardHeader>
                  <CardContent>
                    <RadioGroup value={config.installationType} onValueChange={(v) => updateConfig({ installationType: v as RoofConfiguration['installationType'] })}>
                      <div className="flex items-center gap-2"><RadioGroupItem value="none" /><Label>Vlastní</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="cz" /><Label>Montáž v ČR (6%, min 5 500)</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="eu" /><Label>Montáž v zahraničí (8%)</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="free" /><Label>ZDARMA</Label></div>
                    </RadioGroup>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Sleva</CardTitle></CardHeader>
                  <CardContent>
                    <Label>Sleva (%)</Label>
                    <Input type="number" value={config.discountPercent} onChange={(e) => updateConfig({ discountPercent: parseFloat(e.target.value) || 0 })} min={0} max={100} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step: Customer */}
            {step === 'customer' && (
              <Card>
                <CardHeader><CardTitle>Zákazník</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Jméno / Firma *</Label>
                    <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Jan Novák" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="jan@example.cz" />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="+420 123 456 789" />
                  </div>
                  <div>
                    <Label>Adresa</Label>
                    <Input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Ulice 123, Město" />
                  </div>
                  <Separator />
                  <div>
                    <Label>Poznámky k nabídce</Label>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Volitelné poznámky..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Summary */}
            {step === 'summary' && calculation && (
              <Card>
                <CardHeader><CardTitle>Souhrn nabídky</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Typ:</span><span className="font-medium">{selectedRoofType?.name}</span></div>
                    <div className="flex justify-between"><span>Šířka:</span><span>{formatNumber(config.width)} mm</span></div>
                    <div className="flex justify-between"><span>Moduly:</span><span>{config.modules}</span></div>
                    <div className="flex justify-between"><span>Délka:</span><span>{formatNumber(calculation.standardLength)} mm</span></div>
                    <div className="flex justify-between"><span>Výška:</span><span>{formatNumber(calculation.standardHeight)} mm</span></div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>Základní cena</span>
                      <span className="font-medium">{formatPrice(calculation.basePrice)}</span>
                    </div>
                    {calculation.items.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className={item.price < 0 ? 'text-green-600' : ''}>
                          {item.price === 0 ? 'ZDARMA' : formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between py-2 font-medium">
                      <span>Cena zastřešení</span>
                      <span>{formatPrice(calculation.roofPrice)}</span>
                    </div>
                    {calculation.transportPrice > 0 && (
                      <div className="flex justify-between py-1">
                        <span>Doprava</span>
                        <span>{formatPrice(calculation.transportPrice)}</span>
                      </div>
                    )}
                    {calculation.installPrice > 0 && (
                      <div className="flex justify-between py-1">
                        <span>Montáž</span>
                        <span>{formatPrice(calculation.installPrice)}</span>
                      </div>
                    )}
                    {calculation.discountAmount > 0 && (
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Sleva ({config.discountPercent}%)</span>
                        <span>-{formatPrice(calculation.discountAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between py-2 text-lg">
                      <span className="font-bold">CELKEM</span>
                      <span className="font-bold text-blue-600">{formatPrice(calculation.finalPrice)} + DPH</span>
                    </div>
                  </div>

                  {customer.name && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="font-medium">Zákazník: {customer.name}</p>
                        {customer.email && <p className="text-gray-500">{customer.email}</p>}
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1" onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Ukládám...' : 'Uložit nabídku'}
                    </Button>
                    <Button variant="outline" className="flex-1" disabled>
                      <FileText className="w-4 h-4 mr-2" />
                      Stáhnout PDF
                    </Button>
                  </div>

                  {!session && (
                    <p className="text-sm text-amber-600 text-center">
                      Pro uložení nabídky se musíte přihlásit
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={goPrev} disabled={currentStepIndex === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />Zpět
              </Button>
              <Button onClick={goNext} disabled={currentStepIndex === steps.length - 1}>
                Další<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    {selectedRoofType && (
                      <Image src={`/images/${selectedRoofType.code.toLowerCase()}.png`} alt={selectedRoofType.name} fill className="object-contain" />
                    )}
                  </div>
                  <p className="text-center mt-2 font-medium">{selectedRoofType?.name}</p>
                </CardContent>
              </Card>
              {calculation && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Přehled</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Základ</span><span>{formatPrice(calculation.basePrice)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Příplatky</span><span>{formatPrice(calculation.surchargesTotal)}</span></div>
                    {calculation.transportPrice > 0 && <div className="flex justify-between"><span className="text-gray-500">Doprava</span><span>{formatPrice(calculation.transportPrice)}</span></div>}
                    {calculation.installPrice > 0 && <div className="flex justify-between"><span className="text-gray-500">Montáž</span><span>{formatPrice(calculation.installPrice)}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-bold"><span>CELKEM</span><span className="text-blue-600">{formatPrice(calculation.finalPrice)}</span></div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CalculatorPage() {
  return (
    <Providers>
      <CalculatorContent />
    </Providers>
  )
}
