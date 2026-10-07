// bunnyImageUrl.js

// module id: 632021
export function bunnyImageUrl(url, { width, height, quality, format } = {}) {
  if (!url || (!width && !height && !quality && !format)) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (width) parsedUrl.searchParams.set("width", String(width));
    if (height) parsedUrl.searchParams.set("height", String(height));
    if (quality) parsedUrl.searchParams.set("quality", String(quality));
    if (format) parsedUrl.searchParams.set("format", String(format));

    return parsedUrl.toString();
  } catch (err) {
    return url;
  }
}
