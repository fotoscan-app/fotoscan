export interface BillingCycle {
  id: 'monthly' | 'quarterly' | 'halfyearly' | 'annual'
  label: string
  months: number
  discountPct: number
}

export const BILLING_CYCLES: BillingCycle[] = [
  { id: 'monthly',    label: 'Monthly',     months: 1,  discountPct: 0  },
  { id: 'quarterly',  label: 'Quarterly',   months: 3,  discountPct: 15 },
  { id: 'halfyearly', label: 'Half-Yearly', months: 6,  discountPct: 25 },
  { id: 'annual',     label: 'Annual',      months: 12, discountPct: 38 },
]

export interface EventPack {
  id: string
  name: string
  events: number
  storageGB: number
  priceINR: number
  pricePerEvent: number
  highlighted?: boolean
}

export const EVENT_PACKS: EventPack[] = [
  { id: 'pack_5',  name: 'Starter Pack', events: 5,  storageGB: 25,  priceINR: 1999, pricePerEvent: 400 },
  { id: 'pack_15', name: 'Growth Pack',  events: 15, storageGB: 50,  priceINR: 4499, pricePerEvent: 300, highlighted: true },
  { id: 'pack_40', name: 'Studio Pack',  events: 40, storageGB: 200, priceINR: 9999, pricePerEvent: 250 },
]

export interface Plan {
  id: string
  name: string
  priceINR: number
  storageLimit: number   // bytes
  eventLimit: number     // -1 = unlimited
  scanLimit: number      // -1 = unlimited
  trialDays?: number
  trialStorageGB?: number
  features: string[]
  highlighted?: boolean
}

export function getPlanPrice(plan: Plan, cycleId: string): { monthly: number; total: number } {
  const cycle = BILLING_CYCLES.find(c => c.id === cycleId) ?? BILLING_CYCLES[0]
  const monthly = Math.round(plan.priceINR * (1 - cycle.discountPct / 100))
  return { monthly, total: monthly * cycle.months }
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceINR: 0,
    storageLimit: 5 * 1024 ** 3,        // 5 GB
    eventLimit: 2,
    scanLimit: 500,
    features: [
      '2 events total',
      '5 GB storage — upgrade when full',
      '500 face scans',
      'QR code sharing',
      'Guest photo download',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceINR: 1099,
    storageLimit: 50 * 1024 ** 3,       // 50 GB
    eventLimit: 10,
    scanLimit: 5000,
    highlighted: true,
    features: [
      '10 events / month',
      '50 GB storage',
      '5,000 face scans / month',
      'Custom branding',
      'Priority support',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    priceINR: 1499,
    storageLimit: 100 * 1024 ** 3,      // 100 GB
    eventLimit: 40,
    scanLimit: 20000,
    features: [
      '40 events / month',
      '100 GB storage',
      '20,000 face scans / month',
      'Custom branding',
      'Priority support',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    priceINR: 2099,
    storageLimit: 200 * 1024 ** 3,      // 200 GB
    eventLimit: 65,
    scanLimit: 20000,
    features: [
      '65 events / month',
      '200 GB storage',
      '20,000 face scans / month',
      'Custom branding',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    priceINR: 3099,
    storageLimit: 500 * 1024 ** 3,      // 500 GB
    eventLimit: -1,
    scanLimit: -1,
    features: [
      'Unlimited events',
      '500 GB storage',
      'Unlimited face scans',
      'Custom branding',
      'Priority support',
      'Dedicated account manager',
    ],
  },
]

export function getPlanById(id: string): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0]
}

// Each paid plan needs a separate Razorpay Plan per billing cycle (Razorpay bills
// off a fixed Plan amount+interval, so "Pro Quarterly" and "Pro Monthly" are
// different Razorpay Plan objects even though they map to the same internal Plan).
const RAZORPAY_PLAN_IDS: Record<string, Partial<Record<BillingCycle['id'], string>>> = {
  pro: {
    monthly:    process.env.RAZORPAY_PRO_PLAN_ID,
    quarterly:  process.env.RAZORPAY_PRO_QUARTERLY_PLAN_ID,
    halfyearly: process.env.RAZORPAY_PRO_HALFYEARLY_PLAN_ID,
    annual:     process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID,
  },
  studio: {
    monthly:    process.env.RAZORPAY_STUDIO_PLAN_ID,
    quarterly:  process.env.RAZORPAY_STUDIO_QUARTERLY_PLAN_ID,
    halfyearly: process.env.RAZORPAY_STUDIO_HALFYEARLY_PLAN_ID,
    annual:     process.env.RAZORPAY_STUDIO_ANNUAL_PLAN_ID,
  },
  elite: {
    monthly:    process.env.RAZORPAY_ELITE_PLAN_ID,
    quarterly:  process.env.RAZORPAY_ELITE_QUARTERLY_PLAN_ID,
    halfyearly: process.env.RAZORPAY_ELITE_HALFYEARLY_PLAN_ID,
    annual:     process.env.RAZORPAY_ELITE_ANNUAL_PLAN_ID,
  },
  business: {
    monthly:    process.env.RAZORPAY_BUSINESS_PLAN_ID,
    quarterly:  process.env.RAZORPAY_BUSINESS_QUARTERLY_PLAN_ID,
    halfyearly: process.env.RAZORPAY_BUSINESS_HALFYEARLY_PLAN_ID,
    annual:     process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID,
  },
}

export function getRazorpayPlanId(planId: string, cycleId: string): string | null {
  return RAZORPAY_PLAN_IDS[planId]?.[cycleId as BillingCycle['id']] ?? null
}

export function planFromRazorpayPlanId(razorpayPlanId: string): Plan {
  for (const plan of PLANS) {
    const ids = RAZORPAY_PLAN_IDS[plan.id]
    if (ids && Object.values(ids).includes(razorpayPlanId)) return plan
  }
  return PLANS[0]
}
