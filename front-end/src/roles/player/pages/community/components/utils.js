// Helper function to check if current user is the owner of the post
export function isCurrentUserPost(post, user) {
     if (!user || !post) {
          console.log("[isCurrentUserPost] Missing user or post:", { user: !!user, post: !!post });
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
     console.log("[isCurrentUserPost] Comparing IDs:", {
          userId: userId,
          userIdType: typeof userId,
          postUserId: postUserId,
          postUserIdType: typeof postUserId,
          post: {
               UserID: post.UserID,
               userId: post.userId,
               userID: post.userID,
               author: post.author
          },
          user: {
               id: user.id,
               userID: user.userID,
               userId: user.userId
          }
     });

     // Compare as strings or numbers
     if (!userId || !postUserId) {
          console.log("[isCurrentUserPost] Missing ID:", { userId, postUserId });
          return false;
     }

     // Try both string and number comparison
     const isMatch = String(userId) === String(postUserId) || Number(userId) === Number(postUserId);
     console.log("[isCurrentUserPost] Match result:", isMatch);

     return isMatch;
}

