// kiểm tra bài viết của user
export function isCurrentUserPost(post, user) {
  if (!user || !post) {
    return false;
  }

  // lấy ID user
  const userId =
    user.id || user.userID || user.userId || user.user_id || user.ID || null;

  // lấy ID tác giả bài viết
  const postUserId =
    post.UserID ||
    post.userId ||
    post.userID ||
    post.author?.UserID ||
    post.author?.userId ||
    post.author?.userID ||
    post.author?.id ||
    post.author?.ID ||
    null;

  // kiểm tra bài viết của user hiện tại
  if (!userId || !postUserId) {
    return false;
  }
  const isMatch =
    String(userId) === String(postUserId) ||
    Number(userId) === Number(postUserId);
  return isMatch;
}

// chuẩn hóa avatar & tên hiển thị cho user hiện tại
export function getUserAvatarAndName(user) {
  const displayName = user?.fullName || user?.name || user?.phone || "User";
  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=0ea5e9&color=fff&size=100`;

  return {
    displayName,
    avatarUrl,
    initial: displayName.charAt(0).toUpperCase(),
  };
}
