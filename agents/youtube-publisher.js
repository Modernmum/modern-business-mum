/**
 * YOUTUBE AUTO-PUBLISHER AGENT
 * Automatically creates and publishes YouTube videos for products
 * Long-term SEO strategy - videos rank in Google forever
 */

import { getProducts, logAction } from '../lib/database.js';
import { generateText } from '../lib/ai.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const youtube = google.youtube('v3');

/**
 * Generate video script for a product walkthrough
 */
const generateVideoScript = async (product) => {
  const prompt = `You are a professional YouTube content creator specializing in Notion templates and productivity.

Generate a compelling 3-5 minute video script for a Notion template walkthrough.

Product Details:
- Title: ${product.title}
- Description: ${product.description}
- Features: ${product.template_content.features.join(', ')}
- Niche: ${product.niche}
- Price: $${product.suggested_price}

Create a script that:
1. Has an engaging hook in the first 5 seconds
2. Explains what the template does and who it's for
3. Walks through the key features (show, don't just tell)
4. Highlights the benefits and outcomes
5. Ends with a clear call-to-action to purchase
6. Is conversational and enthusiastic (not salesy)
7. Includes timestamps for each section

Format:
{
  "hook": "First 5 seconds that grab attention",
  "intro": "30 second introduction",
  "feature_walkthrough": ["Section 1 script", "Section 2 script", "Section 3 script"],
  "benefits": "30 second benefits summary",
  "cta": "15 second call to action",
  "timestamps": [
    "0:00 - Introduction",
    "0:30 - Feature 1",
    "1:15 - Feature 2",
    "..."
  ],
  "video_title": "SEO-optimized YouTube title (60 chars max)",
  "video_description": "SEO-optimized description with keywords and links",
  "tags": ["keyword1", "keyword2", ...]
}`;

  const script = await generateText(prompt, 'json');
  return script;
};

/**
 * Generate video description with SEO and links
 */
const generateVideoDescription = (product, script, buyLink) => {
  const baseDescription = script.video_description || '';

  return `${baseDescription}

📥 GET THIS TEMPLATE: ${buyLink}

✨ What's Included:
${product.template_content.features.slice(0, 5).map(f => `✓ ${f}`).join('\n')}

💰 Price: $${product.suggested_price}
🔗 Website: https://modernbusinessmum.com

⏱️ TIMESTAMPS:
${script.timestamps.join('\n')}

---

#NotionTemplate #Productivity #${product.niche === 'business' ? 'Business' : 'Finance'} #Organization #DigitalPlanner

🤖 This video was created with AI automation to help you discover the best Notion templates for your needs.`;
};

/**
 * Upload video to YouTube
 * Note: This requires actual video files. For now, we'll prepare the metadata
 * and create a placeholder system. You can integrate with video generation APIs later.
 */
const uploadToYouTube = async (product, script, buyLink, videoFilePath) => {
  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
    console.log('  ⚠️  YouTube API not configured');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });

    google.options({ auth: oauth2Client });

    const videoMetadata = {
      snippet: {
        title: script.video_title,
        description: generateVideoDescription(product, script, buyLink),
        tags: script.tags,
        categoryId: '28', // Science & Technology category
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en',
      },
      status: {
        privacyStatus: 'public', // or 'unlisted' for testing
        selfDeclaredMadeForKids: false,
      },
    };

    // Check if video file exists
    if (!videoFilePath || !fs.existsSync(videoFilePath)) {
      console.log('  ⚠️  Video file not found - saving script for manual creation');

      // Save script for manual video creation
      const scriptsDir = path.join(process.cwd(), 'youtube-scripts');
      if (!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir, { recursive: true });
      }

      const scriptPath = path.join(scriptsDir, `${product.id}-script.json`);
      fs.writeFileSync(scriptPath, JSON.stringify({
        product_id: product.id,
        product_title: product.title,
        script,
        metadata: videoMetadata,
        buy_link: buyLink,
        created_at: new Date().toISOString(),
      }, null, 2));

      console.log(`  💾 Script saved: ${scriptPath}`);

      return {
        success: false,
        reason: 'no_video_file',
        script_saved: true,
        script_path: scriptPath,
        metadata: videoMetadata,
      };
    }

    // Upload video
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: videoMetadata,
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    console.log(`  ✅ Video uploaded: ${response.data.id}`);

    return {
      success: true,
      video_id: response.data.id,
      video_url: `https://youtube.com/watch?v=${response.data.id}`,
      title: script.video_title,
    };

  } catch (error) {
    console.error(`  ❌ YouTube upload error:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Main YouTube Publisher Agent
 */
export const runYouTubePublisher = async () => {
  console.log('\n📺 YOUTUBE PUBLISHER AGENT STARTING...\n');

  try {
    await logAction('youtube-publisher', 'run_started', 'in_progress', {
      timestamp: new Date().toISOString(),
    });

    // Get products that need YouTube videos
    // For now, get the 3 most recent products
    const products = await getProducts({ status: 'listed', limit: 3 });

    if (products.length === 0) {
      console.log('ℹ️  No products to create videos for.');
      return { published: 0 };
    }

    console.log(`🎯 Creating YouTube videos for ${products.length} products...\n`);

    const videoResults = [];

    for (const product of products) {
      try {
        console.log(`  📹 Creating video for: ${product.title}`);

        // Get the Stripe payment link
        const listingResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/listings?product_id=eq.${product.id}&select=url`,
          {
            headers: {
              'apikey': process.env.SUPABASE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
            }
          }
        );
        const listings = await listingResponse.json();
        const buyLink = listings[0]?.url || 'https://modernbusinessmum.com';

        // Generate video script
        console.log(`  📝 Generating video script...`);
        const script = await generateVideoScript(product);
        console.log(`  ✅ Script generated: "${script.video_title}"`);

        // Upload to YouTube (or save script if no video file)
        const result = await uploadToYouTube(product, script, buyLink, null);

        videoResults.push({
          product_id: product.id,
          title: product.title,
          ...result,
        });

        // Log result
        if (result.success) {
          await logAction('youtube-publisher', 'video_uploaded', 'success', {
            product_id: product.id,
            title: product.title,
            video_id: result.video_id,
          });
        } else if (result.script_saved) {
          await logAction('youtube-publisher', 'script_saved', 'success', {
            product_id: product.id,
            title: product.title,
            script_path: result.script_path,
          });
        }

        // Rate limiting: wait 3 seconds between videos
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`  ❌ Error processing ${product.title}:`, error.message);
        await logAction('youtube-publisher', 'video_failed', 'error', {
          product_id: product.id,
          error: error.message,
        });
      }
    }

    const successCount = videoResults.filter(r => r.success).length;
    const scriptsSaved = videoResults.filter(r => r.script_saved).length;

    console.log(`\n✅ YouTube Publisher Agent completed`);
    console.log(`📊 Videos uploaded: ${successCount}/${products.length}`);
    console.log(`📝 Scripts saved for manual creation: ${scriptsSaved}\n`);

    await logAction('youtube-publisher', 'run_completed', 'success', {
      uploaded_count: successCount,
      scripts_saved: scriptsSaved,
      total_count: products.length,
      timestamp: new Date().toISOString(),
    });

    return {
      published: successCount,
      scripts_saved: scriptsSaved,
      results: videoResults,
    };

  } catch (error) {
    console.error('❌ YouTube Publisher Agent failed:', error.message);
    await logAction('youtube-publisher', 'run_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  runYouTubePublisher()
    .then((result) => {
      console.log('\n📊 YOUTUBE SUMMARY:');
      console.log(`   Videos published: ${result.published}`);
      console.log(`   Scripts saved: ${result.scripts_saved}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('YouTube Publisher Error:', error);
      process.exit(1);
    });
}

export default { runYouTubePublisher };
