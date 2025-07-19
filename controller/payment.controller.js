import { Order } from '../model/order.model.js'
import { paymentInfo } from '../model/payment.model.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})


// // getClientToken client token
// export const getClientToken = async (req, res) => {
//   try {
//     const { clientToken } = await generateClientToken()
//     res.status(200).json({ clientToken })
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to generate token', error: err })
//   }
// }

// // processTransaction
// export const makePayment = async (req, res) => {
//   try {
//     const { amount, paymentMethodNonce, userId, orderId, seasonId, type } = req.body

//     const result = await processTransaction(amount, paymentMethodNonce)

//     if (result.success) {
//       const newPayment = await paymentInfo.create({
//         userId,
//         orderId,
//         seasonId,
//         price: amount,
//         paymentStatus: 'complete',
//         transactionId: result.transaction.id,
//         paymentMethodNonce,
//         paymentMethod: result.transaction.paymentInstrumentType,
//         type
//       })
//       if (orderId && type === "order") {
//         const order = await Order.findByIdUpdate(orderId, { paymentStatus: "paid", transectionId: result.transaction.id })
//       }

//       res.status(200).json({
//         message: 'Payment successful',
//         transactionId: result.transaction.id,
//         payment: newPayment,
//       })
//       return
//     } else {
//       res.status(400).json({
//         message: 'Payment failed',
//         error: result.message
//       })
//     }
//   } catch (err) {
//     res.status(500).json({ message: 'Internal Server Error', error: err })
//   }
// }

export const createPayment = async (req, res) => {
  const { userId, price, orderId, type } = req.body

  if (!userId  || !price || !type) {
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

// // Confirm Payment – Stripe will automatically confirm via webhook or frontend, but optionally:
export const confirmPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({
      error: 'paymentIntentId is required.',
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update paymentInfo record
      const paymentRecord = await paymentInfo.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { paymentStatus: 'complete' },
        { new: true }
      );

      // Update corresponding order's payment status to 'paid'
      if (paymentRecord?.orderId) {
        await Order.findByIdAndUpdate(paymentRecord.orderId, {
          paymentStatus: 'paid',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment successfully captured.',
        paymentIntent,
      });
    } else {
      await paymentInfo.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { paymentStatus: 'failed' }
      );

      return res.status(400).json({
        error: 'Payment was not successful.',
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: 'Internal server error.',
    });
  }
};
