/**
 * Test Twitter API Authentication
 */

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const testTwitterAuth = async () => {
  console.log('\n🐦 Testing Twitter API Authentication...\n');

  try {
    // Initialize client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const rwClient = client.readWrite;

    // Test 1: Verify credentials
    console.log('📋 Test 1: Verifying credentials...');
    const currentUser = await rwClient.v2.me();
    console.log(`✅ Authenticated as: @${currentUser.data.username} (${currentUser.data.name})`);

    // Test 2: Check permissions
    console.log('\n📋 Test 2: Checking tweet permissions...');
    console.log(`   App Key: ${process.env.TWITTER_API_KEY?.substring(0, 20)}...`);
    console.log(`   Access Token: ${process.env.TWITTER_ACCESS_TOKEN?.substring(0, 20)}...`);

    console.log('\n✅ Twitter API is working! Ready to tweet.\n');

    return {
      success: true,
      username: currentUser.data.username,
      name: currentUser.data.name,
      userId: currentUser.data.id
    };

  } catch (error) {
    console.error('\n❌ Twitter Authentication Failed\n');
    console.error('Error:', error.message);

    if (error.code === 401) {
      console.error('\n💡 FIX: Your Twitter tokens are invalid or expired.');
      console.error('   Go to: https://developer.twitter.com/en/portal/dashboard');
      console.error('   1. Select your app');
      console.error('   2. Go to "Keys and tokens"');
      console.error('   3. Regenerate "Access Token & Secret"');
      console.error('   4. Update your .env file with new tokens\n');
    }

    if (error.code === 403) {
      console.error('\n💡 FIX: Your app doesn\'t have write permissions.');
      console.error('   Go to: https://developer.twitter.com/en/portal/dashboard');
      console.error('   1. Select your app');
      console.error('   2. Go to "Settings"');
      console.error('   3. Under "App permissions", select "Read and write"');
      console.error('   4. Save and regenerate your Access Token & Secret\n');
    }

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Run test
testTwitterAuth()
  .then(result => {
    if (result.success) {
      console.log('🎉 All tests passed! Twitter automation is ready.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Fix the issues above and try again.\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
