/**
 * Format time ago from date string
 */
export function formatTimeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Vừa xong";
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return postDate.toLocaleDateString("vi-VN");
}
