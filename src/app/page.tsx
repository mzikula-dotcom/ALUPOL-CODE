'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calculator, FileText, Settings, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const roofTypes = [
  { code: 'horizont', name: 'Horizont' },
  { code: 'practic', name: 'Practic' },
  { code: 'harmony', name: 'Harmony' },
  { code: 'dream', name: 'Dream' },
  { code: 'star', name: 'Star' },
  { code: 'rock', name: 'Rock' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ALUPOL</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/calculator" className="text-gray-600 hover:text-gray-900">
              Kalkulátor
            </Link>
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
              Nabídky
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kalkulátor zastřešení bazénů a teras
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Profesionální nástroj pro rychlý výpočet ceny zastřešení.
              11 typů zastřešení, všechny příplatky a doplňky, PDF nabídky.
            </p>
            <Link href="/calculator">
              <Button size="lg" variant="secondary" className="gap-2">
                Spustit kalkulátor
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            Funkce aplikace
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calculator className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Přesná kalkulace</CardTitle>
                <CardDescription>
                  Automatický výpočet ceny na základě aktuálních ceníků a příplatků
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 11 typů zastřešení</li>
                  <li>• Všechny rozměry a moduly</li>
                  <li>• Automatické příplatky</li>
                  <li>• Doprava a montáž</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>PDF nabídky</CardTitle>
                <CardDescription>
                  Profesionální PDF dokumenty připravené k odeslání zákazníkovi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Firemní design</li>
                  <li>• Detailní rozpis položek</li>
                  <li>• Obrázek zastřešení</li>
                  <li>• Podmínky a platnost</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Admin správa</CardTitle>
                <CardDescription>
                  Snadná aktualizace ceníků a příplatků bez programování
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Správa ceníků</li>
                  <li>• Editace příplatků</li>
                  <li>• Historie nabídek</li>
                  <li>• Uživatelské účty</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roof Types Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            Typy zastřešení
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {roofTypes.map((type) => (
              <div
                key={type.code}
                className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="aspect-video relative mb-3">
                  <Image
                    src={`/images/${type.code}.png`}
                    alt={type.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-medium text-gray-900">{type.name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6">
            + Terrace, Wave, Flash, Wing, SunSet
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Připraveni začít?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Vytvořte svou první nabídku během několika minut.
            Kalkulátor je připraven k použití.
          </p>
          <Link href="/calculator">
            <Button size="lg" className="gap-2">
              Spustit kalkulátor
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} ALUPOL. Všechna práva vyhrazena.</p>
        </div>
      </footer>
    </div>
  )
}
