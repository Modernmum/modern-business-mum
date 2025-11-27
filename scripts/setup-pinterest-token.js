console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                     PINTEREST API TOKEN SETUP                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Your current Pinterest token is missing required permissions.

📋 STEP-BY-STEP INSTRUCTIONS:

1. Go to Pinterest Developers Console:
   🔗 https://developers.pinterest.com/apps/

2. Click on your app (or create a new one if needed)

3. Go to the "Access Token" section

4. Click "Generate Access Token" with these scopes:
   ✓ boards:read
   ✓ boards:write
   ✓ pins:read
   ✓ pins:write
   ✓ user_accounts:read

5. Copy the generated token

6. Update your .env file:
   PINTEREST_ACCESS_TOKEN=paste_your_new_token_here

7. Restart the automation cycle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT NOTES:

- The token must have BOTH "boards:write" AND "pins:write" permissions
- If you can't find these scopes, you may need to apply for Pinterest API access
- Application link: https://developers.pinterest.com/docs/getting-started/set-up-app/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once you've updated the token, test it with:
  node agents/pinterest-poster.js

`);
