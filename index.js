const cors = require('cors');
const express = require('express');
require("dotenv").config()
const stripe = require('stripe')(process.env.REACT_APP_KEY);
const { v4: uuidv4 } = require('uuid');

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// routes
app.get('/', (req, res) => {
  res.send('it works');
});

app.post('/payment', async (req, res) => {
  const { amount } = req.body;
  console.log('Amount', amount);

  const idempotencyKey = uuidv4();

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
        currency: 'usd',
        payment_method_types: ['card'],
        description: `Donation of $${amount}`,
      },
      { idempotencyKey }
    );

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// listen
app.listen(8282, () => console.log('Listening at port 8282'));