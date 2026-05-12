export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface SafeUser {
  id: string
  email: string
  name: string
  businessName: string | null
  logoKey: string | null
  plan: string
  storageUsed: number
  storageLimit: number
  subscriptionStatus: string
  razorpayCustomerId: string | null
}
