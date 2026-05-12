import Razorpay from 'razorpay'

let _instance: InstanceType<typeof Razorpay> | null = null

export function getRazorpay(): InstanceType<typeof Razorpay> {
  if (!_instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay not configured: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to env')
    }
    _instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return _instance
}
