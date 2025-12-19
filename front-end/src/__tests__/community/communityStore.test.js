/**
 * Test suite cho Community Store
 * Kiểm tra các chức năng cộng đồng: posts, comments, likes, teams
 */
import {
  listCommunityPosts,
  createCommunityPost,
  joinCommunityPost,
  listJoinsByPost,
  updateJoinStatus,
  togglePostLike,
  countPostLikes,
  addComment,
  listComments,
  reportTarget,
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  createTeamJoinRequest,
  listTeamJoinRequestsByTeam,
  approveTeamJoinRequest,
  rejectTeamJoinRequest,
} from '../../shared/utils/communityStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Community Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // ==================== Community Posts ====================
  describe('Community Posts', () => {
    describe('createCommunityPost', () => {
      test('tạo post mới với đầy đủ thông tin', () => {
        const post = createCommunityPost({
          userId: 'user-1',
          content: 'Tìm đối thủ giao hữu',
          location: 'Quận 7, TP.HCM',
          time: '2025-01-01 18:00',
          authorName: 'Nguyen Van A',
        });

        expect(post.postId).toBeDefined();
        expect(post.postId).toMatch(/^CP-/);
        expect(post.userId).toBe('user-1');
        expect(post.content).toBe('Tìm đối thủ giao hữu');
        expect(post.location).toBe('Quận 7, TP.HCM');
        expect(post.status).toBe('open');
        expect(post.createdAt).toBeDefined();
      });

      test('tạo post với thông tin booking', () => {
        const post = createCommunityPost({
          userId: 'user-1',
          content: 'Tìm đối',
          bookingId: 'BK-123',
          fieldName: 'Sân A',
          date: '2025-01-01',
          slotName: '18:00 - 19:00',
        });

        expect(post.bookingId).toBe('BK-123');
        expect(post.fieldName).toBe('Sân A');
        expect(post.slotName).toBe('18:00 - 19:00');
      });
    });

    describe('listCommunityPosts', () => {
      beforeEach(() => {
        createCommunityPost({
          userId: 'user-1',
          content: 'Post 1',
          location: 'Quận 7',
          time: '2025-01-01 18:00',
        });
        createCommunityPost({
          userId: 'user-2',
          content: 'Post 2',
          location: 'Quận 1',
          time: '2025-01-02 19:00',
        });
      });

      test('lấy tất cả posts', () => {
        const posts = listCommunityPosts();
        expect(posts.length).toBe(2);
      });

      test('filter theo location', () => {
        const posts = listCommunityPosts({ location: 'Quận 7' });
        expect(posts.length).toBe(1);
        expect(posts[0].location).toContain('Quận 7');
      });

      test('filter theo date', () => {
        const posts = listCommunityPosts({ date: '2025-01-01' });
        expect(posts.length).toBe(1);
      });

      test('sắp xếp theo createdAt giảm dần', () => {
        const posts = listCommunityPosts();
        expect(posts[0].createdAt).toBeGreaterThanOrEqual(posts[1].createdAt);
      });
    });
  });

  // ==================== Community Joins ====================
  describe('Community Joins', () => {
    let testPost;

    beforeEach(() => {
      testPost = createCommunityPost({
        userId: 'owner-1',
        content: 'Test post',
        location: 'Test location',
      });
    });

    describe('joinCommunityPost', () => {
      test('tạo join request mới', () => {
        const join = joinCommunityPost({
          postId: testPost.postId,
          userId: 'user-2',
        });

        expect(join.joinId).toBeDefined();
        expect(join.joinId).toMatch(/^CJ-/);
        expect(join.postId).toBe(testPost.postId);
        expect(join.userId).toBe('user-2');
        expect(join.status).toBe('pending');
      });

      test('không tạo duplicate join', () => {
        const join1 = joinCommunityPost({
          postId: testPost.postId,
          userId: 'user-2',
        });
        const join2 = joinCommunityPost({
          postId: testPost.postId,
          userId: 'user-2',
        });

        expect(join1.joinId).toBe(join2.joinId);
      });
    });

    describe('listJoinsByPost', () => {
      test('lấy danh sách joins của post', () => {
        joinCommunityPost({ postId: testPost.postId, userId: 'user-2' });
        joinCommunityPost({ postId: testPost.postId, userId: 'user-3' });

        const joins = listJoinsByPost(testPost.postId);
        expect(joins.length).toBe(2);
      });
    });

    describe('updateJoinStatus', () => {
      test('cập nhật status của join', () => {
        const join = joinCommunityPost({
          postId: testPost.postId,
          userId: 'user-2',
        });

        const updated = updateJoinStatus(join.joinId, 'accepted');
        expect(updated.status).toBe('accepted');
      });

      test('trả về null khi joinId không tồn tại', () => {
        const result = updateJoinStatus('invalid-id', 'accepted');
        expect(result).toBeNull();
      });
    });
  });

  // ==================== Likes & Comments ====================
  describe('Likes & Comments', () => {
    let testPost;

    beforeEach(() => {
      testPost = createCommunityPost({
        userId: 'owner-1',
        content: 'Test post',
      });
    });

    describe('togglePostLike', () => {
      test('thêm like khi chưa like', () => {
        const count = togglePostLike({
          postId: testPost.postId,
          userId: 'user-2',
        });
        expect(count).toBe(1);
      });

      test('bỏ like khi đã like', () => {
        togglePostLike({ postId: testPost.postId, userId: 'user-2' });
        const count = togglePostLike({
          postId: testPost.postId,
          userId: 'user-2',
        });
        expect(count).toBe(0);
      });

      test('nhiều user like cùng post', () => {
        togglePostLike({ postId: testPost.postId, userId: 'user-2' });
        togglePostLike({ postId: testPost.postId, userId: 'user-3' });
        const count = countPostLikes(testPost.postId);
        expect(count).toBe(2);
      });
    });

    describe('addComment & listComments', () => {
      test('thêm comment mới', () => {
        const comment = addComment({
          postId: testPost.postId,
          userId: 'user-2',
          content: 'Test comment',
        });

        expect(comment.commentId).toBeDefined();
        expect(comment.content).toBe('Test comment');
        expect(comment.status).toBe('Active');
      });

      test('thêm reply comment', () => {
        const parent = addComment({
          postId: testPost.postId,
          userId: 'user-2',
          content: 'Parent comment',
        });

        const reply = addComment({
          postId: testPost.postId,
          userId: 'user-3',
          content: 'Reply comment',
          parentCommentId: parent.commentId,
        });

        expect(reply.parentCommentId).toBe(parent.commentId);
      });

      test('lấy danh sách comments của post', () => {
        addComment({ postId: testPost.postId, userId: 'user-2', content: 'C1' });
        addComment({ postId: testPost.postId, userId: 'user-3', content: 'C2' });

        const comments = listComments(testPost.postId);
        expect(comments.length).toBe(2);
      });
    });
  });

  // ==================== Reports ====================
  describe('Reports', () => {
    test('tạo report mới', () => {
      const report = reportTarget({
        reporterId: 'user-1',
        targetType: 'Post',
        targetId: 'post-123',
        reason: 'Spam content',
      });

      expect(report.reportId).toBeDefined();
      expect(report.reportId).toMatch(/^RP-/);
      expect(report.targetType).toBe('Post');
      expect(report.status).toBe('Pending');
    });
  });
});
