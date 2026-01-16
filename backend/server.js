// server.js - Backend Node.js pour JerseyShop avec Stripe
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Utilise la clé service_role pour le backend
);

// IMPORTANT : CORS doit être avant tout
app.use(cors());

// Webhook endpoint - DOIT être AVANT express.json() pour recevoir le raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Gérer l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Récupérer les métadonnées de la session
    const { userId, customerInfo } = session.metadata;
    const parsedCustomerInfo = JSON.parse(customerInfo);
    
    try {
      // Récupérer les items de la session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      
      // Créer la commande dans Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          items: lineItems.data.map(item => ({
            name: item.description,
            quantity: item.quantity,
            price: item.amount_total / 100,
            price_id: item.price.id
          })),
          total: session.amount_total / 100,
          customer_name: parsedCustomerInfo.name,
          customer_email: parsedCustomerInfo.email,
          customer_phone: parsedCustomerInfo.phone,
          customer_address: parsedCustomerInfo.address,
          customer_city: parsedCustomerInfo.city,
          customer_postal: parsedCustomerInfo.postal,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: 'paid'
        }])
        .select();

      if (error) {
        console.error('Erreur création commande:', error);
      } else {
        console.log('✅ Commande créée:', data[0].id);
      }
    } catch (error) {
      console.error('Erreur traitement webhook:', error);
    }
  }

  res.json({ received: true });
});

// Middleware JSON pour les autres routes (APRÈS le webhook)
app.use(express.json());

// Endpoint pour créer une session Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cart, customerInfo, userId } = req.body;

    // Créer les line items pour Stripe
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: `${item.club} - Taille: ${item.size}`,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Convertir en centimes
      },
      quantity: item.quantity,
    }));

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
      customer_email: customerInfo.email,
      metadata: {
        userId: userId,
        customerInfo: JSON.stringify(customerInfo)
      },
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'LU', 'CH', 'MC'],
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer les détails d'une session (après paiement)
app.get('/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json(session);
  } catch (error) {
    console.error('Erreur récupération session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'JerseyShop API is running' });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    name: 'JerseyShop API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createCheckout: 'POST /create-checkout-session',
      webhook: 'POST /webhook',
      getSession: 'GET /checkout-session/:sessionId'
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
