import { Order } from '../model/order.model.js'
import { paymentInfo } from '../model/payment.model.js'
import { User } from '../model/user.model.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

export const createPayment = async (req, res) => {
  const { userId, price, orderId, type } = req.body

  if (!userId || !price || !type) {
    return res.status(400).json({
      error: 'userId, and amount are required.',
    })
  }

  try {
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Stripe expects the amount in cents
      currency: 'usd',
      metadata: {
        userId,
        orderId,
        type,
      },
    })

    // Save payment record with status 'pending'
    const PaymentInfo = new paymentInfo({
      userId,
      orderId,
      price,
      transactionId: paymentIntent.id,
      paymentStatus: 'pending',
      type,
    })
    await PaymentInfo.save()

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      message: 'PaymentIntent created.',
    })
  } catch (error) {
    console.error('Error creating PaymentIntent:', error)
    res.status(500).json({
      error: 'Internal server error.',
    })
  }
}


export const confirmPayment = async (req, res) => {
  const { paymentIntentId } = req.body

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required.' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      await paymentInfo.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { paymentStatus: 'failed' }
      )

      return res.status(400).json({ error: 'Payment was not successful.' })
    }

    const paymentRecord = await paymentInfo.findOneAndUpdate(
      { transactionId: paymentIntentId },
      { paymentStatus: 'complete' },
      { new: true }
    )

    if (paymentRecord?.orderId) {
      const order = await Order.findByIdAndUpdate(paymentRecord.orderId, {
        paymentStatus: 'paid',
      }).populate('farm', 'seller')

      // Get seller account ID
      const sellerUser = await User.findById(order.farm.seller) // You must pass sellerId to paymentInfo when creating it
      const sellerStripeAccountId = sellerUser?.stripeAccountId

      if (!sellerStripeAccountId) {
        return res
          .status(400)
          .json({ error: 'Seller Stripe account not connected.' })
      }

      const adminShare = Math.round(paymentRecord.price * 0.049 * 100) // 5%
      const sellerShare = Math.round(paymentRecord.price * 0.951 * 100) // 95%

      // Transfer 95% to the seller
      await stripe.transfers.create({
        amount: sellerShare,
        currency: 'usd',
        destination: sellerStripeAccountId,
        transfer_group: `ORDER_${paymentIntent.id}`,
      })
    }
    

   

    return res.status(200).json({
      success: true,
      message: 'Payment processed and transferred.',
      paymentIntent,
    })
  } catch (error) {
    console.error('Error confirming or transferring payment:', error)
    res.status(500).json({ error: 'Internal server error.' })
  }
}


export const createStripeConnectAccount = async (req, res) => {
  try {
    const { userId } = req.body

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Step 1: Create account if not already exists
    let accountId = user.stripeAccountId
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      })

      user.stripeAccountId = account.id
      await user.save()

      accountId = account.id
    }

    // Step 2: Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/connect/refresh`,
      return_url: `${process.env.CLIENT_URL}/connect/success`,
      type: 'account_onboarding',
    })

    res.status(200).json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe onboarding error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}