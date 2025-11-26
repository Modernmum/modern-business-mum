/**
 * YouTube OAuth Helper
 * Run this once to get your refresh token
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import http from 'http';
import { URL } from 'url';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'http://localhost:3333/oauth2callback'
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

console.log('\n🎥 YouTube OAuth Setup\n');
console.log('This will open your browser to authorize the app.\n');

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force to get refresh token
});

console.log('📋 Step 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n');

// Create temporary server to receive OAuth callback
const server = http.createServer(async (req, res) => {
  if (req.url.indexOf('/oauth2callback') > -1) {
    const qs = new URL(req.url, 'http://localhost:3333').searchParams;
    const code = qs.get('code');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>✅ Authorization successful!</h1><p>You can close this window and return to your terminal.</p>');

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ Authorization successful!\n');
    console.log('Add this to your .env file:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n');

    server.close();
    process.exit(0);
  }
});

server.listen(3333, () => {
  console.log('⏳ Waiting for authorization...\n');
  console.log('If browser doesn\'t open automatically, copy the URL above.\n');
});
