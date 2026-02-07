import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Schema pro vytvoření nabídky
const quoteSchema = z.object({
  // Zákazník
  customerName: z.string().min(1, 'Jméno zákazníka je povinné'),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),

  // Odběratel
  dealerName: z.string().optional().nullable(),
  dealerContact: z.string().optional().nullable(),

  // Zastřešení
  roofTypeId: z.string(),
  width: z.number().min(1500).max(7000),
  modules: z.number().min(2).max(7),
  length: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  standardLength: z.number(),
  standardHeight: z.number(),

  // Konfigurace
  configuration: z.record(z.string(), z.unknown()),

  // Ceny
  basePrice: z.number(),
  surchargesTotal: z.number(),
  transportPrice: z.number(),
  transportKm: z.number().optional().nullable(),
  transportRate: z.number().optional().nullable(),
  installPrice: z.number(),
  installType: z.string().optional().nullable(),
  discountPercent: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  finalPrice: z.number(),

  // Metadata
  validityMonths: z.number().default(3),
  notes: z.string().optional().nullable(),
})

// Generování čísla nabídky
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ALU-${year}-`

  // Najít poslední nabídku tohoto roku
  const lastQuote = await prisma.quote.findFirst({
    where: {
      number: { startsWith: prefix },
    },
    orderBy: { number: 'desc' },
  })

  let nextNumber = 1
  if (lastQuote) {
    const lastNumber = parseInt(lastQuote.number.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET - Seznam nabídek
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  try {
    const where: Record<string, unknown> = {}

    // Filtr podle statusu
    if (status && status !== 'all') {
      where.status = status
    }

    // Hledání
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Pro dealery jen jejich nabídky, admin vidí vše
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        select: {
          id: true,
          number: true,
          status: true,
          customerName: true,
          customerEmail: true,
          width: true,
          modules: true,
          finalPrice: true,
          createdAt: true,
          validUntil: true,
          roofType: {
            select: { code: true, name: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({ quotes, total })
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

// POST - Vytvořit novou nabídku
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = quoteSchema.parse(body)

    // Generovat číslo nabídky
    const number = await generateQuoteNumber()

    // Vypočítat platnost
    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + (data.validityMonths || 3))

    const quote = await prisma.quote.create({
      data: {
        number,
        status: 'DRAFT',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        dealerName: data.dealerName,
        dealerContact: data.dealerContact,
        roofTypeId: data.roofTypeId,
        width: data.width,
        modules: data.modules,
        length: data.length,
        height: data.height,
        standardLength: data.standardLength,
        standardHeight: data.standardHeight,
        configuration: data.configuration as Prisma.JsonObject,
        basePrice: data.basePrice,
        surchargesTotal: data.surchargesTotal,
        transportPrice: data.transportPrice,
        transportKm: data.transportKm,
        transportRate: data.transportRate,
        installPrice: data.installPrice,
        installType: data.installType,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        validUntil,
        notes: data.notes,
        userId: session.user.id,
      },
      include: {
        roofType: { select: { code: true, name: true } },
      },
    })

    return NextResponse.json(quote)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Failed to create quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}

// PUT - Aktualizovat nabídku
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Ověřit vlastnictví (nebo admin)
    const existing = await prisma.quote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN' && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Pokud se mění validityMonths, přepočítat validUntil
    if (updateData.validityMonths) {
      const validUntil = new Date(existing.createdAt)
      validUntil.setMonth(validUntil.getMonth() + updateData.validityMonths)
      updateData.validUntil = validUntil
      delete updateData.validityMonths
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        roofType: { select: { code: true, name: true } },
      },
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Failed to update quote:', error)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}

// DELETE - Smazat nabídku
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Ověřit vlastnictví (nebo admin)
    const existing = await prisma.quote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN' && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.quote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quote:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}
