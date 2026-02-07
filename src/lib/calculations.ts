/**
 * ALUPOL Kalkulační Engine
 * Převedeno z VBA logiky do TypeScript
 */

// ==================== TYPY ====================

export interface RoofTypeData {
  id: string
  code: string
  name: string
  maxWidth: number
  minWidth: number
  hasSkirts: boolean
}

export interface PriceData {
  widthLabel: string
  widthMin: number
  widthMax: number
  modules: number
  price: number
  height: number
}

export interface SurchargeData {
  code: string
  name: string
  category: string
  type: 'FIXED' | 'PERCENT'
  value: number
  valueRock?: number | null
  minValue?: number | null
}

// Konfigurace zastřešení
export interface RoofConfiguration {
  // Základní parametry
  roofTypeCode: string
  width: number        // Šířka v mm
  modules: number      // Počet modulů (2-7)

  // Rozměry
  useStandardLength: boolean
  customLength?: number  // Vlastní délka v mm
  useStandardHeight: boolean
  customHeight?: number  // Vlastní výška v mm

  // Polykarbonát
  solidPolyModules: number      // Počet modulů s plným poly
  solidPolyBigFront: boolean    // Plný poly ve velkém čele
  solidPolySmallFront: boolean  // Plný poly v malém čele
  solidPolySkirts: boolean      // Plný poly v šikminách
  colorChangeModules: number    // Počet modulů se změnou barvy
  colorChangeBigFront: boolean  // Změna barvy ve velkém čele
  colorChangeSmallFront: boolean // Změna barvy v malém čele

  // Velké čelo
  hasBigFront: boolean
  bigFrontType: 'fixed' | 'doors' | 'flap'
  bigFrontDoorsWidth?: number
  bigFrontDoorsHeight?: number
  bigFrontDoorsLarge: boolean   // Dveře nad 1m
  bigFrontFlapHeight?: number
  bigFrontLock: boolean

  // Malé čelo
  hasSmallFront: boolean
  smallFrontType: 'fixed' | 'doors' | 'flap'
  smallFrontDoorsWidth?: number
  smallFrontDoorsHeight?: number
  smallFrontDoorsLarge: boolean
  smallFrontFlapHeight?: number
  smallFrontLock: boolean

  // Boční dveře
  hasSideDoors: boolean
  sideDoorLock: boolean

  // Koleje
  walkingRails: boolean
  bidirectionalRails: boolean
  railExtension: number  // Prodloužení kolejí v mm

  // Konstrukce
  mountainReinforcement: boolean  // Zpevnění pro podhorskou oblast
  segmentLocking: boolean         // Uzamykání segmentů

  // Povrch
  surfaceType: 'standard' | 'bronze_elox' | 'anthracite_elox' | 'ral'
  ralColor?: string

  // Jiné příplatky
  customSurcharges: Array<{
    name: string
    price: number
  }>

  // Doprava
  includeTransport: boolean
  transportKm: number
  transportRate: number  // Kč/km

  // Montáž
  installationType: 'none' | 'cz' | 'eu' | 'free'

  // Sleva
  discountPercent: number
}

// Výsledek kalkulace
export interface CalculationResult {
  // Základní cena
  basePrice: number
  standardLength: number
  standardHeight: number

  // Položky příplatků
  items: Array<{
    name: string
    description?: string
    quantity?: number
    unit?: string
    price: number
  }>

  // Souhrny
  surchargesTotal: number
  roofPrice: number       // basePrice + surcharges
  transportPrice: number
  installPrice: number
  totalPrice: number      // Celková cena před slevou
  discountAmount: number
  finalPrice: number      // Konečná cena po slevě
}

// ==================== POMOCNÉ FUNKCE ====================

/**
 * Najde cenu a standardní výšku podle typu, šířky a modulů
 */
export function findPrice(
  prices: PriceData[],
  width: number,
  modules: number
): PriceData | null {
  return prices.find(
    p => width >= p.widthMin && width <= p.widthMax && p.modules === modules
  ) || null
}

/**
 * Najde standardní délku podle počtu modulů
 * (Z VBA: List3.Cells(5, sloupec))
 */
export function getStandardLength(modules: number): number {
  // Standardní délky podle počtu modulů
  const lengths: Record<number, number> = {
    2: 4336,
    3: 6504,
    4: 8672,
    5: 10840,
    6: 13008,
    7: 15176,
  }
  return lengths[modules] || 4336
}

/**
 * Získá hodnotu příplatku (s ohledem na ROCK)
 */
function getSurchargeValue(
  surcharge: SurchargeData,
  roofTypeCode: string
): number {
  if (roofTypeCode === 'ROCK' && surcharge.valueRock != null) {
    return surcharge.valueRock
  }
  return surcharge.value
}

// ==================== HLAVNÍ KALKULACE ====================

export function calculateQuote(
  config: RoofConfiguration,
  roofType: RoofTypeData,
  prices: PriceData[],
  surcharges: SurchargeData[]
): CalculationResult {
  const items: CalculationResult['items'] = []
  let surchargesTotal = 0

  // 1. Najít základní cenu
  const priceData = findPrice(prices, config.width, config.modules)
  if (!priceData) {
    throw new Error(`Cena nenalezena pro šířku ${config.width}mm a ${config.modules} modulů`)
  }

  const basePrice = priceData.price
  const standardHeight = Math.round(priceData.height * 1000) // Převod na mm
  const standardLength = getStandardLength(config.modules)

  // Helper pro hledání příplatku
  const getSurcharge = (code: string) =>
    surcharges.find(s => s.code === code)

  // Helper pro přidání položky
  const addItem = (
    name: string,
    price: number,
    quantity?: number,
    unit?: string,
    description?: string
  ) => {
    items.push({ name, price, quantity, unit, description })
    surchargesTotal += price
  }

  // 2. Změna výšky
  if (!config.useStandardHeight && config.customHeight) {
    const heightDiff = config.customHeight - standardHeight
    if (heightDiff > 0) {
      // Zvýšení zastřešení
      const surcharge = getSurcharge('height_increase')
      if (surcharge) {
        const rate = getSurchargeValue(surcharge, config.roofTypeCode)
        const price = Math.round(basePrice * rate * (heightDiff / 100))
        addItem('Zvýšení zastřešení', price, heightDiff, 'mm')
      }
    }
    // Snížení je zdarma
    if (heightDiff < 0) {
      addItem('Snížení zastřešení', 0, Math.abs(heightDiff), 'mm')
    }
  }

  // 3. Změna délky
  if (!config.useStandardLength && config.customLength) {
    const lengthDiff = config.customLength - standardLength
    if (lengthDiff > 0) {
      // Prodloužení
      const surchargeBase = getSurcharge('module_extend')
      const surchargeMeter = getSurcharge('module_extend_meter')
      if (surchargeBase && surchargeMeter) {
        const price = surchargeBase.value + (lengthDiff / 1000) * surchargeMeter.value
        addItem('Prodloužení modulů', Math.round(price), lengthDiff, 'mm')
      }
    } else if (lengthDiff < 0) {
      // Zkrácení
      const surcharge = getSurcharge('module_shorten')
      if (surcharge) {
        addItem('Zkrácení modulů', surcharge.value, Math.abs(lengthDiff), 'mm')
      }
    }
  }

  // 4. Plný polykarbonát
  if (config.solidPolyModules > 0) {
    const surcharge = getSurcharge('poly_solid')
    if (surcharge) {
      const price = surcharge.value * config.solidPolyModules
      addItem('Plný polykarbonát v modulech', price, config.solidPolyModules, 'ks')
    }
  }

  if (config.solidPolyBigFront) {
    const surcharge = getSurcharge('poly_solid')
    if (surcharge) {
      addItem('Plný polykarbonát ve velkém čele', surcharge.value)
    }
  }

  if (config.solidPolySmallFront) {
    const surcharge = getSurcharge('poly_solid')
    if (surcharge) {
      addItem('Plný polykarbonát v malém čele', surcharge.value)
    }
  }

  if (config.solidPolySkirts && roofType.hasSkirts) {
    const surcharge = getSurcharge('poly_solid')
    if (surcharge) {
      addItem('Plný polykarbonát v šikminách', surcharge.value)
    }
  }

  // 5. Změna barvy polykarbonátu
  if (config.colorChangeModules > 0) {
    const surcharge = getSurcharge('poly_color_change')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value * config.colorChangeModules / config.modules)
      addItem('Změna barvy polykarbonátu v modulech', price, config.colorChangeModules, 'ks')
    }
  }

  if (config.colorChangeBigFront) {
    const surcharge = getSurcharge('poly_color_change')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value * 0.1) // Čelo cca 10% plochy
      addItem('Změna barvy polykarbonátu ve velkém čele', price)
    }
  }

  if (config.colorChangeSmallFront) {
    const surcharge = getSurcharge('poly_color_change')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value * 0.05) // Malé čelo cca 5% plochy
      addItem('Změna barvy polykarbonátu v malém čele', price)
    }
  }

  // 6. Zpevnění pro podhorskou oblast
  if (config.mountainReinforcement) {
    const surcharge = getSurcharge('mountain_reinforcement')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value)
      addItem('Zpevnění pro podhorskou oblast', price)
    }
  }

  // 7. Koleje
  if (config.walkingRails) {
    // Pochozí koleje jsou ZDARMA (podle VBA)
    addItem('Pochozí koleje', 0)
  }

  if (config.bidirectionalRails) {
    // Obousměrné koleje jsou ZDARMA (podle VBA)
    addItem('Obousměrné koleje', 0)
  }

  if (config.railExtension > 0) {
    const surcharge = getSurcharge('rail_meter')
    if (surcharge) {
      const rate = getSurchargeValue(surcharge, config.roofTypeCode)
      const extensionMeters = config.railExtension / 1000
      // Prodloužení do určité délky je zdarma, pak se platí
      if (extensionMeters > 1) {
        const price = Math.round((extensionMeters - 1) * rate * 2) // 2 koleje
        addItem('Prodloužení kolejí', price, config.railExtension, 'mm')
      } else {
        addItem('Prodloužení kolejí', 0, config.railExtension, 'mm')
      }
    }
  }

  // 8. Velké čelo
  if (!config.hasBigFront) {
    // Sleva za chybějící čelo
    const discount = Math.round(basePrice * -0.05)
    addItem('Bez velkého čela', discount)
  } else if (config.bigFrontType === 'doors') {
    const surchargeCode = config.bigFrontDoorsLarge ? 'doors_single_large' : 'doors_single_small'
    const surcharge = getSurcharge(surchargeCode)
    if (surcharge) {
      const desc = `š=${config.bigFrontDoorsWidth || 900} v=${config.bigFrontDoorsHeight || 1800} mm`
      addItem('Dveře ve velkém čele', surcharge.value, undefined, undefined, desc)
    }

    if (config.bigFrontLock) {
      const lockSurcharge = getSurcharge('doors_lock')
      if (lockSurcharge) {
        addItem('Uzamykání dveří (VČ)', lockSurcharge.value)
      }
    }
  } else if (config.bigFrontType === 'flap') {
    const surcharge = getSurcharge('vent_flap')
    if (surcharge) {
      const desc = `výška ${config.bigFrontFlapHeight || 300} mm`
      addItem('Větrací klapka ve velkém čele', surcharge.value, undefined, undefined, desc)
    }
  }

  // 9. Malé čelo
  if (!config.hasSmallFront) {
    const discount = Math.round(basePrice * -0.03)
    addItem('Bez malého čela', discount)
  } else if (config.smallFrontType === 'doors') {
    const surchargeCode = config.smallFrontDoorsLarge ? 'doors_single_large' : 'doors_single_small'
    const surcharge = getSurcharge(surchargeCode)
    if (surcharge) {
      const desc = `š=${config.smallFrontDoorsWidth || 900} v=${config.smallFrontDoorsHeight || 1800} mm`
      addItem('Dveře v malém čele', surcharge.value, undefined, undefined, desc)
    }

    if (config.smallFrontLock) {
      const lockSurcharge = getSurcharge('doors_lock')
      if (lockSurcharge) {
        addItem('Uzamykání dveří (MČ)', lockSurcharge.value)
      }
    }
  } else if (config.smallFrontType === 'flap') {
    const surcharge = getSurcharge('vent_flap')
    if (surcharge) {
      const desc = `výška ${config.smallFrontFlapHeight || 300} mm`
      addItem('Větrací klapka v malém čele', surcharge.value, undefined, undefined, desc)
    }
  }

  // 10. Boční dveře
  if (config.hasSideDoors) {
    const surcharge = getSurcharge('doors_side')
    if (surcharge) {
      addItem('Dveře pro boční vstup', surcharge.value)
    }

    if (config.sideDoorLock) {
      const lockSurcharge = getSurcharge('doors_lock')
      if (lockSurcharge) {
        addItem('Uzamykání bočních dveří', lockSurcharge.value)
      }
    }
  }

  // 11. Uzamykání segmentů
  if (config.segmentLocking) {
    const surcharge = getSurcharge('segment_lock')
    if (surcharge) {
      const segmentCount = config.modules - 1
      const price = surcharge.value * segmentCount
      addItem('Uzamykání segmentů', price, segmentCount, 'ks')
    }
  }

  // 12. Povrchová úprava
  if (config.surfaceType === 'bronze_elox') {
    const surcharge = getSurcharge('surface_bronze_elox')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value)
      addItem('Konstrukce v bronzovém eloxu', price)
    }
  } else if (config.surfaceType === 'anthracite_elox') {
    const surcharge = getSurcharge('surface_anthracite_elox')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value)
      addItem('Konstrukce v antracitovém eloxu', price)
    }
  } else if (config.surfaceType === 'ral' && config.ralColor) {
    const surcharge = getSurcharge('surface_ral')
    if (surcharge) {
      const price = Math.round(basePrice * surcharge.value)
      addItem('Nástřik konstrukce RAL', price, undefined, undefined, `barva ${config.ralColor}`)
    }
  }

  // 13. Vlastní příplatky
  for (const custom of config.customSurcharges) {
    if (custom.name && custom.price !== 0) {
      addItem(custom.name, custom.price)
    }
  }

  // === SOUHRN ===
  const roofPrice = basePrice + surchargesTotal

  // 14. Doprava
  let transportPrice = 0
  if (config.includeTransport && config.transportKm > 0) {
    transportPrice = Math.round(config.transportKm * config.transportRate)
  }

  // 15. Montáž
  let installPrice = 0
  if (config.installationType === 'cz') {
    const surcharge = getSurcharge('install_cz')
    if (surcharge) {
      const rate = getSurchargeValue(surcharge, config.roofTypeCode)
      installPrice = Math.round(roofPrice * rate)
      if (surcharge.minValue && installPrice < surcharge.minValue) {
        installPrice = surcharge.minValue
      }
    }
  } else if (config.installationType === 'eu') {
    const surcharge = getSurcharge('install_eu')
    if (surcharge) {
      const rate = getSurchargeValue(surcharge, config.roofTypeCode)
      installPrice = Math.round(roofPrice * rate)
    }
  }

  // 16. Celková cena
  const totalPrice = roofPrice + transportPrice + installPrice

  // 17. Sleva
  const discountAmount = config.discountPercent > 0
    ? Math.round(roofPrice * config.discountPercent / 100)
    : 0

  const finalPrice = totalPrice - discountAmount

  return {
    basePrice,
    standardLength,
    standardHeight,
    items,
    surchargesTotal,
    roofPrice,
    transportPrice,
    installPrice,
    totalPrice,
    discountAmount,
    finalPrice,
  }
}

// ==================== DEFAULT KONFIGURACE ====================

export function getDefaultConfiguration(): RoofConfiguration {
  return {
    roofTypeCode: 'HORIZONT',
    width: 3200,
    modules: 2,
    useStandardLength: true,
    useStandardHeight: true,
    solidPolyModules: 0,
    solidPolyBigFront: false,
    solidPolySmallFront: false,
    solidPolySkirts: false,
    colorChangeModules: 0,
    colorChangeBigFront: false,
    colorChangeSmallFront: false,
    hasBigFront: true,
    bigFrontType: 'fixed',
    bigFrontDoorsLarge: false,
    bigFrontLock: false,
    hasSmallFront: true,
    smallFrontType: 'fixed',
    smallFrontDoorsLarge: false,
    smallFrontLock: false,
    hasSideDoors: false,
    sideDoorLock: false,
    walkingRails: false,
    bidirectionalRails: false,
    railExtension: 0,
    mountainReinforcement: false,
    segmentLocking: false,
    surfaceType: 'standard',
    customSurcharges: [],
    includeTransport: true,
    transportKm: 0,
    transportRate: 19,
    installationType: 'none',
    discountPercent: 0,
  }
}

// ==================== FORMÁTOVÁNÍ ====================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('cs-CZ').format(num)
}
