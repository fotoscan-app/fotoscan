export interface BillingCycle {
  id: 'monthly' | 'quarterly' | 'halfyearly' | 'annual'
  label: string
  months: number
  discountPct: number
}

export const BILLING_CYCLES: BillingCycle[] = [
  { id: 'monthly',    label: 'Monthly',     months: 1,  discountPct: 0  },
  { id: 'quarterly',  label: 'Quarterly',   months: 3,  discountPct: 10 },
  { id: 'halfyearly', label: 'Half-Yearly', months: 6,  discountPct: 15 },
  { id: 'annual',     label: 'Annual',      months: 12, discountPct: 25 },
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
  { id: 'pack_5',  name: 'Starter Pack', events: 5,  storageGB: 10, priceINR: 1999, pricePerEvent: 400 },
  { id: 'pack_15', name: 'Growth Pack',  events: 15, storageGB: 30, priceINR: 4499, pricePerEvent: 300, highlighted: true },
  { id: 'pack_40', name: 'Studio Pack',  events: 40, storageGB: 80, priceINR: 9999, pricePerEvent: 250 },
]

export const TOPUP_PACK = { events: 5, priceINR: 999 }

export interface Plan {
  id: string
  name: string
  razorpayPlanId: string | null
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
    razorpayPlanId: null,
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
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID ?? null,
    priceINR: 1999,
    storageLimit: 50 * 1024 ** 3,       // 50 GB
    eventLimit: 15,
    scanLimit: 5000,
    trialDays: 15,
    trialStorageGB: 2,
    highlighted: true,
    features: [
      '15 events / month',
      '50 GB storage',
      '5,000 face scans / month',
      'Custom branding',
      'Priority support',
      `Top-up: 5 extra events for ₹${TOPUP_PACK.priceINR}`,
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    razorpayPlanId: process.env.RAZORPAY_STUDIO_PLAN_ID ?? null,
    priceINR: 4499,
    storageLimit: 100 * 1024 ** 3,      // 100 GB
    eventLimit: 40,
    scanLimit: 20000,
    features: [
      '40 events / month',
      '100 GB storage',
      '20,000 face scans / month',
      'Custom branding',
      'Priority support',
      `Top-up: 5 extra events for ₹${TOPUP_PACK.priceINR}`,
    ],
  },
  {
    id: 'business',
    name: 'Business',
    razorpayPlanId: process.env.RAZORPAY_BUSINESS_PLAN_ID ?? null,
    priceINR: 7999,
    storageLimit: 200 * 1024 ** 3,      // 200 GB
    eventLimit: -1,
    scanLimit: -1,
    features: [
      'Unlimited events',
      '200 GB storage',
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

export function planFromRazorpayPlanId(razorpayPlanId: string): Plan {
  return PLANS.find(p => p.razorpayPlanId === razorpayPlanId) ?? PLANS[0]
}
