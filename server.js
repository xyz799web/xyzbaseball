const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')('sk_test_yourSecretKeyHere'); // Replace with actual key
const endpointSecret = 'whsec_yourWebhookSecret'; // Replace with actual secret

const YOUR_DOMAIN = 'https://skitter-clumsy-sweatshirt.glitch.me'; // Replace with your live domain

const users = {}; // In-memory "DB" — replace with real DB in production

// Middleware
app.use(cors());
app.use(express.json());

// Webhook must come before bodyParser
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    users[email] = { isVIP: true };
    console.log(`🎉 VIP granted to: ${email}`);
  }

  res.json({ received: true });
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'XYZ VIP Membership',
              description: 'Exclusive access & discounts',
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Error creating session:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// VIP Content Page
app.get('/vip-content', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send('Email required');

  const user = users[email];
  if (user && user.isVIP) {
    res.send(`
      <h1>🎉 Welcome, VIP!</h1>
      <p>This is your exclusive VIP content. Enjoy the perks!</p>
      <a href="/">🏠 Back to XYZ</a>
    `);
  } else {
    res.status(403).send('⛔ Access denied. You are not a VIP member.');
  }
});

// Success & Cancel Routes
app.get('/success', (req, res) => {
  res.send('✅ Thanks for becoming a VIP! You can now access exclusive content.');
});

app.get('/cancel', (req, res) => {
  res.send('❌ Payment was cancelled.');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${YOUR_DOMAIN} (port ${PORT})`);
});
