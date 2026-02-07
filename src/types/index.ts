// Re-export kalkulačních typů
export type {
  RoofTypeData,
  PriceData,
  SurchargeData,
  RoofConfiguration,
  CalculationResult,
} from '@/lib/calculations'

// API response typy
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Formulářové typy
export interface CustomerInfo {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface DealerInfo {
  name: string
  contact?: string
}

export interface QuoteFormData {
  customer: CustomerInfo
  dealer?: DealerInfo
  configuration: import('@/lib/calculations').RoofConfiguration
  notes?: string
  validityMonths: number
  preparedBy: string
  preparedByPhone: string
}

// Stav kalkulátoru
export type CalculatorStep =
  | 'type'        // Výběr typu zastřešení
  | 'dimensions'  // Rozměry
  | 'options'     // Příplatky a doplňky
  | 'transport'   // Doprava a montáž
  | 'summary'     // Souhrn a uložení

export interface CalculatorState {
  step: CalculatorStep
  configuration: import('@/lib/calculations').RoofConfiguration
  customer: CustomerInfo
  dealer?: DealerInfo
}
