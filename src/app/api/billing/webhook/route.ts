import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateUser } from '@/lib/db'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, plan } = session.metadata ?? {}
      if (userId && plan) {
        await updateUser(userId, { plan: plan as 'basic' | 'pro' | 'enterprise', isActive: true })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      const plan = sub.metadata?.plan
      if (userId && plan) {
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        await updateUser(userId, {
          plan: plan as 'basic' | 'pro' | 'enterprise',
          isActive,
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (userId) {
        await updateUser(userId, { plan: 'free' })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      // Find user by stripeCustomerId and notify
      // In production: query Firestore for user with this customerId
      console.warn('Payment failed for customer:', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
