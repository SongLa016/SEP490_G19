// Utility functions for handling images

export const DEFAULT_FIELD_IMAGE = "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg";

/**
 * Get image source with fallback
 * @param {string} imageSrc - Original image source
 * @param {string} fallback - Fallback image source
 * @returns {string} Valid image source
 */
export const getImageSrc = (imageSrc, fallback = DEFAULT_FIELD_IMAGE) => {
  return imageSrc && imageSrc.trim() !== "" ? imageSrc : fallback;
};

/**
 * Handle image error by setting fallback
 * @param {Event} e - Image error event
 * @param {string} fallback - Fallback image source
 */
export const handleImageError = (e, fallback = DEFAULT_FIELD_IMAGE) => {
  if (e.target.src !== fallback) {
    e.target.src = fallback;
  }
};

/**
 * Props for image component with error handling
 * @param {string} src - Image source
 * @param {string} alt - Alt text
 * @param {string} fallback - Fallback image
 * @returns {object} Props object
 */
export const getImageProps = (src, alt, fallback = DEFAULT_FIELD_IMAGE) => ({
  src: getImageSrc(src, fallback),
  alt: alt || "Field image",
  onError: (e) => handleImageError(e, fallback),
});