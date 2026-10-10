const imageCache = new Map();

export function loadSharedImage(url, options = {}) {
  let { maxWidth } = options;
  let cacheKey = maxWidth ? `${url}@w${maxWidth}` : url;
  let cachedPromise = imageCache.get(cacheKey);
  
  if (cachedPromise) {
    return cachedPromise;
  }
  
  let fetchPromise = (async () => {
    try {
      let response = await fetch(url, {
        mode: "cors",
        credentials: "omit"
      });
      
      if (!response.ok) {
        throw new Error(`fetch failed ${response.status} for ${url}`);
      }
      
      let blob = await response.blob();
      let bitmapOptions = {
        imageOrientation: "flipY"
      };
      
      if (maxWidth) {
        bitmapOptions.resizeWidth = maxWidth;
        bitmapOptions.resizeQuality = "high";
      }
      
      return await createImageBitmap(blob, bitmapOptions);
    } catch (error) {
      imageCache.delete(cacheKey);
      throw error;
    }
  })();
  
  imageCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function preloadSharedImages(urls, options) {
  for (let url of urls) {
    loadSharedImage(url, options).catch(() => {});
  }
}
