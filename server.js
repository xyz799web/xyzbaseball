const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_yourSecretKeyHere'); // Replace with your secret key
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Simulated DB (replace with real DB)
const users = {}; // { email: { isVIP: false } }

app.post('/create-checkout-session', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Create checkout session
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
    success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: 'http://localhost:3000/cancel',
  });

  res.json({ url: session.url });
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_yourWebhookSecret'; // Replace with your webhook secret

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;

    // Update user VIP status in DB
    users[email] = { isVIP: true };
    console.log(`VIP membership granted for ${email}`);
  }

  res.json({ received: true });
});

app.get('/success', (req, res) => {
  res.send('Thanks for buying VIP! You are now a member. Refresh your login to see exclusive content.');
});

app.get('/cancel', (req, res) => {
  res.send('Purchase cancelled, no worries!');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
const YOUR_DOMAIN = 'https://skitter-clumsy-sweatshirt.glitch.me'; // ← your Glitch URL

success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${YOUR_DOMAIN}/cancel`,
  const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')('sk_test_yourSecretKeyHere'); // 🔁 Replace with your real secret key

// 🔁 Replace with your Glitch app's live URL
const YOUR_DOMAIN = 'https://skitter-clumsy-sweatshirt.glitch.me';

// 🔁 Replace with your Stripe webhook secret
const endpointSecret = 'whsec_yourWebhookSecret';

const users = {}; // Simulated DB: { email: { isVIP: true } }

// ✅ Stripe Webhook (must come before express.json)
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

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Create Stripe Checkout Session
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

// ✅ VIP-only route
app.get('/vip-content', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send('Email required');

  const user = users[email];
  if (user && user.isVIP) {
    res.send(`
      <h1>🎉 Welcome, VIP!</h1>
      <p>This is your exclusive VIP content. Enjoy the perks!</p>
      <a href="/">🏠 Go back home</a>
    `);
  } else {
    res.status(403).send('⛔ Access denied. You are not a VIP member.');
  }
});

// ✅ Success & Cancel routes
app.get('/success', (req, res) => {
  res.send('✅ Thank you for becoming a VIP! You can now access exclusive content.');
});

app.get('/cancel', (req, res) => {
  res.send('❌ Payment cancelled. Come back anytime!');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at ${YOUR_DOMAIN} on port ${PORT}`);
});
