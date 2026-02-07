import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const priceSchema = z.object({
  roofTypeId: z.string(),
  widthLabel: z.string(),
  widthMin: z.number(),
  widthMax: z.number(),
  modules: z.number().min(2).max(7),
  price: z.number().min(0),
  height: z.number().min(0),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roofTypeId = searchParams.get('roofTypeId')

  try {
    const where = roofTypeId ? { roofTypeId } : {}

    const prices = await prisma.price.findMany({
      where,
      orderBy: [{ widthMax: 'asc' }, { modules: 'asc' }],
      include: {
        roofType: {
          select: { code: true, name: true },
        },
      },
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const validData = priceSchema.partial().parse(data)

    const price = await prisma.price.update({
      where: { id },
      data: validData,
    })

    return NextResponse.json(price)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Failed to update price:', error)
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 })
  }
}

// Bulk update for price matrix
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { updates } = body // Array of { id, price, height }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 })
    }

    // Update all prices in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; price?: number; height?: number }) =>
        prisma.price.update({
          where: { id: update.id },
          data: {
            ...(update.price !== undefined && { price: update.price }),
            ...(update.height !== undefined && { height: update.height }),
          },
        })
      )
    )

    return NextResponse.json({ success: true, count: updates.length })
  } catch (error) {
    console.error('Failed to bulk update prices:', error)
    return NextResponse.json({ error: 'Failed to bulk update prices' }, { status: 500 })
  }
}
