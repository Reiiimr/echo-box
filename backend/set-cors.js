/**
 * Run this ONCE from the echo-box/backend folder:
 *   node set-cors.js
 *
 * It sets CORS on your Firebase Storage bucket so the browser
 * can upload images and audio from https://echo-boxx.web.app
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Init Firebase Admin (reuses your existing .env values)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const storage = new Storage({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const corsConfig = [
  {
    origin: ['https://echo-boxx.web.app'],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length'],
  },
];

async function setCors() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  console.log(`Setting CORS on bucket: ${bucketName}`);
  await storage.bucket(bucketName).setCorsConfiguration(corsConfig);
  console.log('✅ CORS set successfully!');
}

setCors().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
