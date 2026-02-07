import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Ceny pro daný typ zastřešení
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const roofTypeId = searchParams.get('roofTypeId')

  if (!roofTypeId) {
    return NextResponse.json({ error: 'roofTypeId is required' }, { status: 400 })
  }

  try {
    const prices = await prisma.price.findMany({
      where: { roofTypeId },
      select: {
        id: true,
        widthLabel: true,
        widthMin: true,
        widthMax: true,
        modules: true,
        price: true,
        height: true,
      },
      orderBy: [{ widthMax: 'asc' }, { modules: 'asc' }],
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
