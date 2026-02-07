import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const roofTypes = await prisma.roofType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { prices: true },
        },
      },
    })

    return NextResponse.json(roofTypes)
  } catch (error) {
    console.error('Failed to fetch roof types:', error)
    return NextResponse.json({ error: 'Failed to fetch roof types' }, { status: 500 })
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

    const roofType = await prisma.roofType.update({
      where: { id },
      data,
    })

    return NextResponse.json(roofType)
  } catch (error) {
    console.error('Failed to update roof type:', error)
    return NextResponse.json({ error: 'Failed to update roof type' }, { status: 500 })
  }
}
