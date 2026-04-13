import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateUser } from '@/lib/db'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

// Plan → Stripe Price ID mapping
export const PLAN_PRICES: Record<string, string> = {
  basic:      process.env.STRIPE_PRICE_BASIC ?? '',
  pro:        process.env.STRIPE_PRICE_PRO ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
}

export const PLAN_LIMITS = {
  free:       { postsPerDay: 3,  leadsPerMonth: 20,  groups: 5 },
  basic:      { postsPerDay: 10, leadsPerMonth: 100, groups: 15 },
  pro:        { postsPerDay: 30, leadsPerMonth: 500, groups: 50 },
  enterprise: { postsPerDay: 100, leadsPerMonth: 9999, groups: 200 },
}

// POST /api/billing/checkout
export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json()

    if (!userId || !plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const userSnap = await getDoc(doc(db, 'users', userId))
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userSnap.data()

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId
    const stripe = getStripe()
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { firebaseUid: userId },
      })
      customerId = customer.id
      await updateUser(userId, { stripeCustomerId: customerId })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?upgrade=cancelled`,
      metadata: { userId, plan },
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, plan },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 }
    )
  }
}
