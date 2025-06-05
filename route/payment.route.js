import express from 'express'
import { getClientToken, makePayment } from '../controller/payment.controller.js'


const router = express.Router()

// Generate client token for Braintree
router.get('/payments/client-token', getClientToken)

// Process payment
router.post('/payments/checkout', makePayment)

export default router
