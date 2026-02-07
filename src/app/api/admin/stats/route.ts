import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [roofTypes, prices, surcharges, quotes, users] = await Promise.all([
      prisma.roofType.count({ where: { isActive: true } }),
      prisma.price.count(),
      prisma.surcharge.count({ where: { isActive: true } }),
      prisma.quote.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      roofTypes,
      prices,
      surcharges,
      quotes,
      users,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
