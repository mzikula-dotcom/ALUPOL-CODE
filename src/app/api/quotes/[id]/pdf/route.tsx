import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF, type QuotePDFData } from '@/lib/pdf-template'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        roofType: { select: { code: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check ownership (or admin)
    if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Transform quote data for PDF
    const pdfData: QuotePDFData = {
      number: quote.number,
      status: quote.status,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      customerAddress: quote.customerAddress,
      dealerName: quote.dealerName,
      dealerContact: quote.dealerContact,
      roofType: quote.roofType,
      width: quote.width,
      modules: quote.modules,
      length: quote.length,
      height: quote.height,
      standardLength: quote.standardLength,
      standardHeight: quote.standardHeight,
      configuration: quote.configuration as Record<string, unknown>,
      basePrice: quote.basePrice,
      surchargesTotal: quote.surchargesTotal,
      transportPrice: quote.transportPrice,
      transportKm: quote.transportKm,
      installPrice: quote.installPrice,
      installType: quote.installType,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      finalPrice: quote.finalPrice,
      validUntil: quote.validUntil.toISOString(),
      notes: quote.notes,
      createdAt: quote.createdAt.toISOString(),
      user: quote.user,
    }

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(<QuotePDF data={pdfData} /> as any)

    // Return PDF with proper headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
