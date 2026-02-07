import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema pro validaci
const surchargeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['DOORS', 'RAILS', 'SURFACE', 'POLYCARBONATE', 'CONSTRUCTION', 'INSTALLATION', 'OTHER']),
  type: z.enum(['FIXED', 'PERCENT']),
  value: z.number(),
  valueRock: z.number().optional().nullable(),
  minValue: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const surcharges = await prisma.surcharge.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json(surcharges)
  } catch (error) {
    console.error('Failed to fetch surcharges:', error)
    return NextResponse.json({ error: 'Failed to fetch surcharges' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = surchargeSchema.parse(body)

    const surcharge = await prisma.surcharge.create({
      data: {
        ...data,
        valueRock: data.valueRock ?? null,
        minValue: data.minValue ?? null,
        description: data.description ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(surcharge)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Failed to create surcharge:', error)
    return NextResponse.json({ error: 'Failed to create surcharge' }, { status: 500 })
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

    const validData = surchargeSchema.partial().parse(data)

    const surcharge = await prisma.surcharge.update({
      where: { id },
      data: validData,
    })

    return NextResponse.json(surcharge)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Failed to update surcharge:', error)
    return NextResponse.json({ error: 'Failed to update surcharge' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.surcharge.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete surcharge:', error)
    return NextResponse.json({ error: 'Failed to delete surcharge' }, { status: 500 })
  }
}
