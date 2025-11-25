#!/usr/bin/env node

/**
 * Automatic Delivery Server
 * Handles Stripe webhooks and automatically delivers templates to customers via Resend
 */

import express from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { getProducts, createTransaction } from './lib/database.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    console.log(`💰 Payment received! Session ID: ${session.id}`);

    try {
      // Get the product from Stripe
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      if (!priceId) {
        console.log('No price ID found');
        return res.sendStatus(200);
      }

      // Find the product in our database by matching the Stripe price
      const products = await getProducts({ status: 'listed' });
      const product = products.find(p => {
        // Match by price amount (rough match)
        return Math.abs(p.suggested_price - (lineItems.data[0].price.unit_amount / 100)) < 0.01;
      });

      if (!product) {
        console.log('Product not found in database');
        return res.sendStatus(200);
      }

      // Get customer email
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        console.log('No customer email found');
        return res.sendStatus(200);
      }

      // Send template files to customer
      await deliverTemplate(product, customerEmail, session);

      // Record the transaction
      await createTransaction({
        type: 'sale',
        amount: session.amount_total / 100,
        listing_id: null,
      });

      console.log(`✅ Template delivered to ${customerEmail}`);

    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  res.sendStatus(200);
});

/**
 * Deliver template to customer via Resend email
 */
async function deliverTemplate(product, customerEmail, session) {
  const templatesDir = path.join(process.cwd(), 'templates');
  const guidesDir = path.join(process.cwd(), 'guides');

  const templateFilename = `${product.id}-${product.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  const guideFilename = `${product.id}-guide.txt`;

  const templatePath = path.join(templatesDir, templateFilename);
  const guidePath = path.join(guidesDir, guideFilename);

  const attachments = [];

  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath);
    attachments.push({
      filename: `${product.title} - Template.md`,
      content: content.toString('base64')
    });
  }

  if (fs.existsSync(guidePath)) {
    const content = fs.readFileSync(guidePath);
    attachments.push({
      filename: `${product.title} - Guide.txt`,
      content: content.toString('base64')
    });
  }

  await resend.emails.send({
    from: 'templates@modernbusinessmum.com',
    to: customerEmail,
    subject: `Your ${product.title} Template is Ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #667eea;">Thank You for Your Purchase!</h1>

        <p>Hi there!</p>

        <p>Thank you for purchasing <strong>${product.title}</strong>!</p>

        <h2>Your Templates Are Attached</h2>
        <p>You'll find two files attached to this email:</p>
        <ul>
          <li><strong>Template.md</strong> - Import this into Notion</li>
          <li><strong>Guide.txt</strong> - Setup instructions and tips</li>
        </ul>

        <h3>How to Use:</h3>
        <ol>
          <li>Open Notion on your computer</li>
          <li>Go to Import → Markdown & CSV</li>
          <li>Select the Template.md file</li>
          <li>Customize it to your needs!</li>
        </ol>

        <h3>What's Included:</h3>
        <ul>
          ${product.features.map(f => `<li>${f}</li>`).join('')}
        </ul>

        <p style="margin-top: 30px;">
          <strong>Need Help?</strong><br>
          Visit <a href="https://modernbusinessmum.com">modernbusinessmum.com</a> for support.
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          Order ID: ${session.id}<br>
          Product: ${product.title}<br>
          Amount: $${session.amount_total / 100}
        </p>
      </div>
    `,
    attachments
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Delivery server is running' });
});

// Start server
const PORT = process.env.DELIVERY_PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Delivery Server Running on port ${PORT}`);
  console.log(`📧 Ready to deliver templates automatically with Resend!`);
  console.log(`\n💡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`\n⚠️  Make sure to add this webhook URL to your Stripe dashboard!\n`);
});

export default app;
