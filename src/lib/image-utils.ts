/**
 * Sanitizes image URLs to prevent using unreliable external placeholder services
 * @param imageUrl - The image URL to sanitize
 * @param fallback - The fallback image to use (defaults to generic placeholder)
 * @returns A safe image URL
 */
export function sanitizeImageUrl(imageUrl: string | null | undefined, fallback: string = '/placeholder-item.svg'): string {
  // Return fallback if no URL provided
  if (!imageUrl) {
    return fallback;
  }

  // Replace via.placeholder.com URLs with local placeholders
  if (imageUrl.includes('via.placeholder.com')) {
    if (imageUrl.includes('Divine+Orb') || imageUrl.includes('Divine%20Orb')) {
      return '/placeholder-divine-orb.svg';
    }
    return '/placeholder-item.svg';
  }

  // Return the original URL if it's safe
  return imageUrl;
}

/**
 * Sanitizes an array of image URLs
 * @param images - Array of image URLs or JSON string
 * @param fallback - The fallback image to use
 * @returns Array of safe image URLs
 */
export function sanitizeImageArray(images: string[] | string | null | undefined, fallback: string = '/placeholder-item.svg'): string[] {
  if (!images) {
    return [fallback];
  }

  // Parse JSON string if needed
  let imageArray: string[];
  if (typeof images === 'string') {
    try {
      imageArray = JSON.parse(images);
    } catch {
      // If it's not JSON, treat it as a single URL
      return [sanitizeImageUrl(images, fallback)];
    }
  } else {
    imageArray = images;
  }

  // Sanitize each URL in the array
  const sanitizedImages = imageArray.map(url => sanitizeImageUrl(url, fallback));
  
  // Return fallback if no valid images
  return sanitizedImages.length > 0 ? sanitizedImages : [fallback];
}