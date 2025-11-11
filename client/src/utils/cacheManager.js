/**
 * Cache Manager Utility
 * 
 * Provides helper functions to manage browser cache and service worker cache
 * Used to ensure logo and assets load instantly from cache
 */

/**
 * Check if asset is cached
 * @param {string} url - Asset URL to check
 * @returns {Promise<boolean>} - True if asset is in cache
 */
export const isAssetCached = async (url) => {
  if (!('caches' in window)) return false;
  
  try {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) return true;
    }
    return false;
  } catch (error) {
    console.error('[CacheManager] Error checking cache:', error);
    return false;
  }
};

/**
 * Preload and cache critical assets
 * Call this on app initialization to ensure instant loading
 * @param {string[]} urls - Array of asset URLs to cache
 */
export const precacheAssets = async (urls) => {
  if (!('caches' in window)) {
    console.warn('[CacheManager] Cache API not supported');
    return;
  }

  try {
    const cacheName = 'sret-manual-cache-v1';
    const cache = await caches.open(cacheName);
    
    const fetchPromises = urls.map(async (url) => {
      const isCached = await cache.match(url);
      if (!isCached) {
        console.log('[CacheManager] Precaching:', url);
        return cache.add(url);
      }
    });
    
    await Promise.all(fetchPromises);
    console.log('[CacheManager] All assets precached successfully');
  } catch (error) {
    console.error('[CacheManager] Error precaching assets:', error);
  }
};

/**
 * Clear all caches (useful when logo changes)
 * @param {string} version - Optional version to clear specific cache
 */
export const clearCache = async (version = null) => {
  if (!('caches' in window)) return;
  
  try {
    const cacheNames = await caches.keys();
    const deletionPromises = cacheNames
      .filter((cacheName) => !version || cacheName.includes(version))
      .map((cacheName) => {
        console.log('[CacheManager] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      });
    
    await Promise.all(deletionPromises);
    console.log('[CacheManager] Cache cleared successfully');
    
    // Reload the page to fetch fresh assets
    window.location.reload(true);
  } catch (error) {
    console.error('[CacheManager] Error clearing cache:', error);
  }
};

/**
 * Update service worker to get latest assets
 * Call this when you update the logo or other cached assets
 */
export const updateServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
      console.log('[CacheManager] Service worker update requested');
    });
  }
};

/**
 * Get cache statistics (useful for debugging)
 * @returns {Promise<Object>} - Cache stats
 */
export const getCacheStats = async () => {
  if (!('caches' in window)) return null;
  
  try {
    const cacheNames = await caches.keys();
    const stats = {
      totalCaches: cacheNames.length,
      caches: []
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats.caches.push({
        name: cacheName,
        assetCount: keys.length,
        assets: keys.map(req => req.url)
      });
    }
    
    return stats;
  } catch (error) {
    console.error('[CacheManager] Error getting cache stats:', error);
    return null;
  }
};

/**
 * Versioned asset URL helper
 * Append version query param to force cache refresh when logo changes
 * @param {string} url - Base asset URL
 * @param {string} version - Version identifier
 * @returns {string} - Versioned URL
 */
export const getVersionedUrl = (url, version = '1') => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
};

/**
 * Preload image and add to cache
 * @param {string} src - Image source URL
 * @returns {Promise<void>}
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log('[CacheManager] Image preloaded:', src);
      resolve();
    };
    img.onerror = (error) => {
      console.error('[CacheManager] Failed to preload image:', src, error);
      reject(error);
    };
    img.src = src;
  });
};

export default {
  isAssetCached,
  precacheAssets,
  clearCache,
  updateServiceWorker,
  getCacheStats,
  getVersionedUrl,
  preloadImage
};
