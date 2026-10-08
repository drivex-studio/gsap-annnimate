export function bunnyImageUrl(url, { width, height, quality, format } = {}) {
 if (!url || (!width && !height && !quality && !format)) {
    return url;
  }
 try {
  const urlObj = new URL(url);

  if (width) {
    urlObj.searchParams.set('width', String(width));
  }
  if (height) {
    urlObj.searchParams.set('height', String(height));
  }
  if (quality) {
    urlObj.searchParams.set('quality', String(quality));
  }
  if (format) {
    urlObj.searchParams.set('format', String(format));
  }

  return urlObj.toString();
 } catch (err) {
  return url;
 }
}
