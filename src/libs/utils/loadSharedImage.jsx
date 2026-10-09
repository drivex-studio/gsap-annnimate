const imageCache = new Map(); // original mangled: t

// module id: 457714
export function loadSharedImage(url, options = {}) { // original mangled: r, e, n
  let { maxWidth } = options; // original mangled: a
  let cacheKey = maxWidth ? `${url}@w${maxWidth}` : url; // original mangled: i
  let cachedPromise = imageCache.get(cacheKey); // original mangled: s
  
  if (cachedPromise) {
    return cachedPromise;
  }
  
  let fetchPromise = (async () => { // original mangled: o
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

export function preloadSharedImages(urls, options) { // original mangled: e, t
  for (let url of urls) { // original mangled: n
    loadSharedImage(url, options).catch(() => {});
  }
}
