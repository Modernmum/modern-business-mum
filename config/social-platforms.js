/**
 * SOCIAL MEDIA PLATFORM CONFIGURATION
 * Controls which platforms are enabled for posting
 * Only platforms using official APIs and following ToS are enabled
 */

export const SOCIAL_PLATFORMS = {
  // ✅ ENABLED PLATFORMS (Using Official APIs)
  pinterest: {
    enabled: true,
    method: 'api',
    notes: 'Using official Pinterest API - fully compliant'
  },
  youtube: {
    enabled: true,
    method: 'api',
    notes: 'Using official YouTube API - fully compliant'
  },
  twitter: {
    enabled: true,
    method: 'api',
    notes: 'Using official Twitter/X API - fully compliant'
  },
  reddit: {
    enabled: true,
    method: 'api', // MUST use reddit-api-poster.js, NOT browser automation
    notes: 'Using official Reddit API - reddit-api-poster.js only'
  },

  // ❌ DISABLED PLATFORMS (ToS Violations)
  facebook: {
    enabled: false,
    method: 'browser',
    notes: 'Browser automation violates Facebook ToS - DISABLED',
    reason: 'Facebook explicitly prohibits automated posting via browser automation'
  },
  linkedin: {
    enabled: false,
    method: 'browser',
    notes: 'Browser automation violates LinkedIn ToS - DISABLED',
    reason: 'LinkedIn explicitly prohibits automated posting via browser automation'
  },

  // 📝 MANUAL PLATFORMS (Requires manual posting or proper API setup)
  instagram: {
    enabled: false,
    method: 'manual',
    notes: 'Requires Instagram Graph API with business account'
  },
  tiktok: {
    enabled: false,
    method: 'manual',
    notes: 'No official posting API available - manual posting only'
  }
};

/**
 * Get list of enabled platforms
 */
export function getEnabledPlatforms() {
  return Object.entries(SOCIAL_PLATFORMS)
    .filter(([_, config]) => config.enabled)
    .map(([platform]) => platform);
}

/**
 * Check if a platform is enabled
 */
export function isPlatformEnabled(platform) {
  return SOCIAL_PLATFORMS[platform]?.enabled === true;
}

/**
 * Get platform config
 */
export function getPlatformConfig(platform) {
  return SOCIAL_PLATFORMS[platform];
}
