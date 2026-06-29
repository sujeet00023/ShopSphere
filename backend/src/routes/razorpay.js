// routes/razorpay.js

import express from 'express'
import Razorpay from 'razorpay'

const router = express.Router()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body

    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    }

    const order = await razorpay.orders.create(options)

    res.json(order)
  }catch (err) {
  console.log("========== ERROR ==========");
  console.log(err);
  console.log(err.statusCode);
  console.log(err.error);
  console.log(err.response);
  console.log("===========================");

  res.status(500).json({
    message: "Failed to create Razorpay order",
    error: err
  });
}
})

export default router