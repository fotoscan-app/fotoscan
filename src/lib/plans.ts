export interface Plan {
  id: string
  name: string
  razorpayPlanId: string | null
  priceINR: number
  storageLimit: number
  eventLimit: number   // -1 = unlimited
  scanLimit: number    // -1 = unlimited
  features: string[]
  highlighted?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    razorpayPlanId: null,
    priceINR: 0,
    storageLimit: 10 * 1024 ** 3,       // 10 GB
    eventLimit: 2,
    scanLimit: 500,
    features: [
      '2 events / month',
      '10 GB storage',
      '500 face scans / month',
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
    highlighted: true,
    features: [
      '15 events / month',
      '50 GB storage',
      '5,000 face scans / month',
      'Custom branding',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    razorpayPlanId: process.env.RAZORPAY_BUSINESS_PLAN_ID ?? null,
    priceINR: 4999,
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
