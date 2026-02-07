import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Registrace fontu pro češtinu
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2563eb',
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  quoteInfo: {
    textAlign: 'right',
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  quoteDate: {
    color: '#6b7280',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#6b7280',
  },
  value: {
    fontWeight: 700,
    textAlign: 'right',
  },
  customerBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  customerDetail: {
    color: '#4b5563',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  tableHeaderCell: {
    fontWeight: 700,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #f3f4f6',
  },
  tableCell: {
    color: '#4b5563',
  },
  col1: { width: '50%' },
  col2: { width: '25%', textAlign: 'center' },
  col3: { width: '25%', textAlign: 'right' },
  priceSection: {
    marginTop: 20,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: {
    color: '#4b5563',
  },
  priceValue: {
    fontWeight: 700,
  },
  priceDivider: {
    borderTop: '1px solid #e5e7eb',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
    borderTop: '2px solid #2563eb',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  validityBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    marginTop: 4,
  },
  configList: {
    marginTop: 5,
  },
  configItem: {
    color: '#4b5563',
    marginBottom: 3,
    paddingLeft: 10,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  discountValue: {
    color: '#059669',
  },
  notes: {
    backgroundColor: '#fefce8',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  notesText: {
    color: '#713f12',
    fontSize: 9,
  },
})

export interface QuotePDFData {
  number: string
  status: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  dealerName: string | null
  dealerContact: string | null
  roofType: {
    code: string
    name: string
  }
  width: number
  modules: number
  length: number | null
  height: number | null
  standardLength: number
  standardHeight: number
  configuration: Record<string, unknown>
  basePrice: number
  surchargesTotal: number
  transportPrice: number
  transportKm: number | null
  installPrice: number
  installType: string | null
  discountPercent: number | null
  discountAmount: number | null
  finalPrice: number
  validUntil: string
  notes: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('cs-CZ')} Kč`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const config = data.configuration as Record<string, unknown>

  const configItems: string[] = []
  if (config.hasBigFront === false) configItems.push('Bez velkého čela')
  if (config.hasSmallFront === false) configItems.push('Bez malého čela')
  if (config.bigFrontType === 'doors') configItems.push('Dveře ve velkém čele')
  if (config.smallFrontType === 'doors') configItems.push('Dveře v malém čele')
  if (config.hasSideDoors) configItems.push('Boční dveře')
  if (config.walkingRails) configItems.push('Pochozí koleje')
  if (config.mountainReinforcement) configItems.push('Zpevnění pro podhorskou oblast')
  if (config.surfaceType && config.surfaceType !== 'standard') {
    const surfaceNames: Record<string, string> = {
      bronze_elox: 'Bronzový elox',
      anthracite_elox: 'Antracitový elox',
      ral: `RAL ${config.ralColor}`,
    }
    configItems.push(`Povrch: ${surfaceNames[config.surfaceType as string] || config.surfaceType}`)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ALUPOL</Text>
            <Text style={styles.logoSubtitle}>Zastřešení bazénů a teras</Text>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteNumber}>{data.number}</Text>
            <Text style={styles.quoteDate}>Vystaveno: {formatDate(data.createdAt)}</Text>
            <Text style={styles.validityBadge}>Platnost do: {formatDate(data.validUntil)}</Text>
          </View>
        </View>

        {/* Customer & Dealer */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Zákazník</Text>
              <View style={styles.customerBox}>
                <Text style={styles.customerName}>{data.customerName}</Text>
                {data.customerEmail && (
                  <Text style={styles.customerDetail}>{data.customerEmail}</Text>
                )}
                {data.customerPhone && (
                  <Text style={styles.customerDetail}>{data.customerPhone}</Text>
                )}
                {data.customerAddress && (
                  <Text style={styles.customerDetail}>{data.customerAddress}</Text>
                )}
              </View>
            </View>
          </View>

          {data.dealerName && (
            <View style={styles.column}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Odběratel</Text>
                <View style={styles.customerBox}>
                  <Text style={styles.customerName}>{data.dealerName}</Text>
                  {data.dealerContact && (
                    <Text style={styles.customerDetail}>{data.dealerContact}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konfigurace zastřešení</Text>

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Typ zastřešení</Text>
                <Text style={styles.value}>{data.roofType.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Šířka</Text>
                <Text style={styles.value}>{data.width.toLocaleString('cs-CZ')} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Počet modulů</Text>
                <Text style={styles.value}>{data.modules}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Délka</Text>
                <Text style={styles.value}>
                  {(data.length || data.standardLength).toLocaleString('cs-CZ')} mm
                  {!data.length ? ' (std.)' : ''}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Výška</Text>
                <Text style={styles.value}>
                  {(data.height || data.standardHeight).toLocaleString('cs-CZ')} mm
                  {!data.height ? ' (std.)' : ''}
                </Text>
              </View>
            </View>
          </View>

          {configItems.length > 0 && (
            <View style={styles.configList}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Doplňky a úpravy:</Text>
              {configItems.map((item, index) => (
                <Text key={index} style={styles.configItem}>• {item}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Price breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cenová kalkulace</Text>
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Základní cena zastřešení</Text>
              <Text style={styles.priceValue}>{formatPrice(data.basePrice)}</Text>
            </View>

            {data.surchargesTotal !== 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Příplatky a doplňky</Text>
                <Text style={data.surchargesTotal < 0 ? [styles.priceValue, styles.discountValue] : styles.priceValue}>
                  {formatPrice(data.surchargesTotal)}
                </Text>
              </View>
            )}

            <View style={styles.priceDivider} />

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Cena zastřešení</Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.basePrice + data.surchargesTotal)}
              </Text>
            </View>

            {data.transportPrice > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Doprava {data.transportKm ? `(${data.transportKm} km)` : ''}
                </Text>
                <Text style={styles.priceValue}>{formatPrice(data.transportPrice)}</Text>
              </View>
            )}

            {data.installPrice > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Montáž {data.installType === 'cz' ? '(ČR)' : data.installType === 'eu' ? '(EU)' : ''}
                </Text>
                <Text style={styles.priceValue}>{formatPrice(data.installPrice)}</Text>
              </View>
            )}

            {data.discountAmount && data.discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Sleva {data.discountPercent}%</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{formatPrice(data.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CELKEM</Text>
              <Text style={styles.totalValue}>{formatPrice(data.finalPrice)} + DPH</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Poznámky:</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Vypracoval: {data.user.name || data.user.email}</Text>
          <Text style={{ marginTop: 4 }}>
            ALUPOL s.r.o. | www.alupol.cz | Tato nabídka je platná do {formatDate(data.validUntil)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
