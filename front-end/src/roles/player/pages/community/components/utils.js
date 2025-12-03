// Helper function to check if current user is the owner of the post
export function isCurrentUserPost(post, user) {
     if (!user || !post) {
          return false;
     }

     // Get user ID from various possible formats
     const userId = user.id || user.userID || user.userId || user.user_id || user.ID || null;

     // Get post user ID from various possible formats
     const postUserId = post.UserID ||
          post.userId ||
          post.userID ||
          post.author?.UserID ||
          post.author?.userId ||
          post.author?.userID ||
          post.author?.id ||
          post.author?.ID ||
          null;

     // Debug log
     // Compare as strings or numbers
     if (!userId || !postUserId) {
          return false;
     }

     // Try both string and number comparison
     const isMatch = String(userId) === String(postUserId) || Number(userId) === Number(postUserId);
     return isMatch;
}

// Chuẩn hóa avatar & tên hiển thị cho user hiện tại (sử dụng profile nếu có, fallback ui-avatars)
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

