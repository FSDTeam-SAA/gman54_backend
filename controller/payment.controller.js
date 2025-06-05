
import { paymentInfo } from '../model/payment.model.js'
import {
  generateClientToken,
  processTransaction,
} from '../utils/braintree.service.js'



// getClientToken client token
export const getClientToken = async (req, res) => {
  try {
    const { clientToken } = await generateClientToken()
    res.status(200).json({ clientToken })
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate token', error: err })
  }
}

// processTransaction
export const makePayment = async (req, res) => {
  try {
    const { amount, paymentMethodNonce, userId, orderId, seasonId,type } = req.body

    const result = await processTransaction(amount, paymentMethodNonce)

    if (result.success) {
      const newPayment = await paymentInfo.create({
        userId,
        orderId,
        seasonId,
        price: amount,
        paymentStatus: 'complete',
        transactionId: result.transaction.id,
        paymentMethodNonce,
        paymentMethod: result.transaction.paymentInstrumentType,
        type
      })

       res.status(200).json({
        message: 'Payment successful',
        transactionId: result.transaction.id,
        payment: newPayment,
      })
      return
    } else {
       res.status(400).json({
        message: 'Payment failed',
        error: result.message
      })
    }
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err })
  }
}


