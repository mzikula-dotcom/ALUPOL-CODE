import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Veřejný seznam typů zastřešení
export async function GET() {
  try {
    const roofTypes = await prisma.roofType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        maxWidth: true,
        minWidth: true,
        hasSkirts: true,
        minModules: true,
        maxModules: true,
        image: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(roofTypes)
  } catch (error) {
    console.error('Failed to fetch roof types:', error)
    return NextResponse.json({ error: 'Failed to fetch roof types' }, { status: 500 })
  }
}
