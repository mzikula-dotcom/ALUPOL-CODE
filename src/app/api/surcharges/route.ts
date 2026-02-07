import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Veřejný seznam příplatků
export async function GET() {
  try {
    const surcharges = await prisma.surcharge.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        type: true,
        value: true,
        valueRock: true,
        minValue: true,
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json(surcharges)
  } catch (error) {
    console.error('Failed to fetch surcharges:', error)
    return NextResponse.json({ error: 'Failed to fetch surcharges' }, { status: 500 })
  }
}
