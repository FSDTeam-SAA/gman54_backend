import express from 'express'
import {
  //   getClientToken,
  //   makePayment,
  createPayment,
  confirmPayment,
  createStripeConnectAccount,
} from '../controller/payment.controller.js'


const router = express.Router()

// Generate client token for Braintree
// router.get('/payments/client-token', getClientToken)

// Process payment
// router.post('/payments/checkout', makePayment)

// Create Payment
router.post("/create-payment", createPayment);

// Capture Payment
router.post("/confirm-payment", confirmPayment)


router.post('/connect', createStripeConnectAccount)


export default router
