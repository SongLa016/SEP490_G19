// hàm xử lý ảnh

export const DEFAULT_FIELD_IMAGE =
  "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg";

// lấy đường dẫn ảnh
export const getImageSrc = (imageSrc, fallback = DEFAULT_FIELD_IMAGE) => {
  return imageSrc && imageSrc.trim() !== "" ? imageSrc : fallback;
};

// xử lý lỗi ảnh
export const handleImageError = (e, fallback = DEFAULT_FIELD_IMAGE) => {
  if (e.target.src !== fallback) {
    e.target.src = fallback;
  }
};

// lấy props cho component ảnh
export const getImageProps = (src, alt, fallback = DEFAULT_FIELD_IMAGE) => ({
  src: getImageSrc(src, fallback),
  alt: alt || "Field image",
  onError: (e) => handleImageError(e, fallback),
});
