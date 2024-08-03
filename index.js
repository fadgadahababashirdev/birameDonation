const cors = require('cors');
const express = require('express');
require("dotenv").config()
const paypal = require('@paypal/checkout-server-sdk');

const app = express();

// middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8282', // Replace with your frontend URL
  credentials: true,
}));

// PayPal configuration
let environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
let client = new paypal.core.PayPalHttpClient(environment);

// routes
app.get('/', (req, res) => {
  res.send('it works');
});

app.post('/create-donation', async (req, res) => {
  const { amount } = req.body;
  console.log('Donation Amount', amount);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount
      },
      description: 'Donation',
      soft_descriptor: 'DONATION'
    }],
    application_context: {
      brand_name: 'Your Organization Name',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
      payment_method: {
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
      }
    }
  });

  try {
    const order = await client.execute(request);
    res.status(200).json({
      orderId: order.result.id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/capture-donation', async (req, res) => {
  const { orderId } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    res.status(200).json({
      captureId: capture.result.id,
      status: capture.result.status
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// listen
app.listen(8282, () => console.log('Listening at port 8282'));