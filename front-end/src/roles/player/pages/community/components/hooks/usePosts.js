import { useState, useEffect } from "react";
import {
  fetchPosts,
  fetchNewsfeedPosts,
  fetchTrendingPosts,
  likePost,
  unlikePost,
} from "../../../../../../shared/services/posts";
import { normalizePostData } from "../utils/postTransformers";

export function usePosts(user, refreshTrigger) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let fetchedPosts = [];

      if (user) {
        try {
          fetchedPosts = await fetchNewsfeedPosts();
        } catch (error) {
          console.warn("Failed to fetch newsfeed, trying all posts:", error);
          fetchedPosts = await fetchPosts();
        }
      } else {
        try {
          fetchedPosts = await fetchTrendingPosts();
        } catch (error) {
          console.warn("Failed to fetch trending, trying all posts:", error);
          fetchedPosts = await fetchPosts();
        }
      }

      // Transform API posts to match component format
      const transformedPosts = await Promise.all(
        fetchedPosts.map(async (post) => {
          const normalizedPost = await normalizePostData(post);
          return normalizedPost;
        })
      );

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user, refreshTrigger]);

  const toggleLike = async (postId) => {
    const post = posts.find((p) => p.PostID === postId);
    if (!post) return;

    const wasLiked = post.isLiked;

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.PostID === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );

    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      // Reload posts to get accurate like count
      loadPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.PostID === postId
            ? {
                ...p,
                isLiked: wasLiked,
                likes: wasLiked ? p.likes + 1 : p.likes - 1,
              }
            : p
        )
      );
    }
  };

  const toggleRepost = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.PostID === postId
          ? {
              ...post,
              isReposted: !post.isReposted,
              reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1,
            }
          : post
      )
    );
  };

  const toggleBookmark = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.PostID === postId
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    );
  };

  return {
    posts,
    loading,
    setPosts,
    loadPosts,
    toggleLike,
    toggleRepost,
    toggleBookmark,
  };
}
