/**
 * Test suite cho Team Management
 * Kiểm tra các chức năng quản lý đội bóng
 */
import {
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  createTeamJoinRequest,
  listTeamJoinRequestsByTeam,
  listTeamJoinRequestsByUser,
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

describe('Team Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // ==================== Create Team ====================
  describe('createTeam', () => {
    test('tạo đội mới với đầy đủ thông tin', () => {
      const team = createTeam({
        teamName: 'FC Test',
        createdBy: 'user-1',
        contactPhone: '0901234567',
        description: 'Đội bóng test',
        preferredSkillLevel: 'Intermediate',
        preferredPositions: 'Tiền đạo, Tiền vệ',
        maxMembers: 11,
        createdByName: 'Nguyen Van A',
      });

      expect(team.teamId).toBeDefined();
      expect(team.teamId).toMatch(/^TM-/);
      expect(team.teamName).toBe('FC Test');
      expect(team.createdBy).toBe('user-1');
      expect(team.currentMembers).toBe(1);
      expect(team.maxMembers).toBe(11);
      expect(team.status).toBe('Open');
    });

    test('tạo đội với thông tin tối thiểu', () => {
      const team = createTeam({
        teamName: 'FC Minimal',
        createdBy: 'user-1',
        maxMembers: 5,
      });

      expect(team.teamName).toBe('FC Minimal');
      expect(team.description).toBe('');
      expect(team.preferredSkillLevel).toBe('Any');
    });
  });

  // ==================== List Teams ====================
  describe('listTeams', () => {
    beforeEach(() => {
      createTeam({
        teamName: 'Team A',
        createdBy: 'user-1',
        maxMembers: 11,
        preferredSkillLevel: 'Beginner',
      });
      createTeam({
        teamName: 'Team B',
        createdBy: 'user-2',
        maxMembers: 7,
        preferredSkillLevel: 'Intermediate',
      });
    });

    test('lấy tất cả teams đang Open', () => {
      const teams = listTeams();
      expect(teams.length).toBe(2);
    });

    test('filter theo skillLevel', () => {
      const teams = listTeams({ skillLevel: 'Beginner' });
      expect(teams.length).toBe(1);
      expect(teams[0].preferredSkillLevel).toBe('Beginner');
    });

    test('filter với skillLevel = "all" lấy tất cả', () => {
      const teams = listTeams({ skillLevel: 'all' });
      expect(teams.length).toBe(2);
    });

    test('sắp xếp theo createdAt giảm dần', () => {
      const teams = listTeams();
      expect(teams[0].createdAt).toBeGreaterThanOrEqual(teams[1].createdAt);
    });
  });

  // ==================== Get & Update Team ====================
  describe('getTeamById & updateTeam', () => {
    let testTeam;

    beforeEach(() => {
      testTeam = createTeam({
        teamName: 'Test Team',
        createdBy: 'user-1',
        maxMembers: 11,
      });
    });

    test('lấy team theo ID', () => {
      const team = getTeamById(testTeam.teamId);
      expect(team).not.toBeNull();
      expect(team.teamName).toBe('Test Team');
    });

    test('trả về null khi teamId không tồn tại', () => {
      const team = getTeamById('invalid-id');
      expect(team).toBeNull();
    });

    test('cập nhật thông tin team', () => {
      const updated = updateTeam(testTeam.teamId, {
        teamName: 'Updated Team',
        description: 'New description',
      });

      expect(updated.teamName).toBe('Updated Team');
      expect(updated.description).toBe('New description');
    });

    test('cập nhật status team', () => {
      const updated = updateTeam(testTeam.teamId, { status: 'Full' });
      expect(updated.status).toBe('Full');
    });
  });

  // ==================== Team Join Requests ====================
  describe('Team Join Requests', () => {
    let testTeam;

    beforeEach(() => {
      testTeam = createTeam({
        teamName: 'Test Team',
        createdBy: 'owner-1',
        maxMembers: 5,
      });
    });

    describe('createTeamJoinRequest', () => {
      test('tạo yêu cầu tham gia đội', () => {
        const request = createTeamJoinRequest({
          teamId: testTeam.teamId,
          userId: 'user-2',
          message: 'Tôi muốn tham gia đội',
          userName: 'Nguyen Van B',
        });

        expect(request.requestId).toBeDefined();
        expect(request.requestId).toMatch(/^TJR-/);
        expect(request.teamId).toBe(testTeam.teamId);
        expect(request.status).toBe('Pending');
      });

      test('throw error khi đội không tồn tại', () => {
        expect(() => {
          createTeamJoinRequest({
            teamId: 'invalid-id',
            userId: 'user-2',
          });
        }).toThrow('Đội không tồn tại');
      });

      test('throw error khi owner tự tham gia đội mình', () => {
        expect(() => {
          createTeamJoinRequest({
            teamId: testTeam.teamId,
            userId: 'owner-1',
          });
        }).toThrow('không thể tham gia đội của chính mình');
      });

      test('throw error khi đã có pending request', () => {
        createTeamJoinRequest({
          teamId: testTeam.teamId,
          userId: 'user-2',
        });

        expect(() => {
          createTeamJoinRequest({
            teamId: testTeam.teamId,
            userId: 'user-2',
          });
        }).toThrow('đã gửi yêu cầu');
      });
    });

    describe('listTeamJoinRequests', () => {
      test('lấy danh sách requests theo team', () => {
        createTeamJoinRequest({ teamId: testTeam.teamId, userId: 'user-2' });
        createTeamJoinRequest({ teamId: testTeam.teamId, userId: 'user-3' });

        const requests = listTeamJoinRequestsByTeam(testTeam.teamId);
        expect(requests.length).toBe(2);
      });

      test('lấy danh sách requests theo user', () => {
        createTeamJoinRequest({ teamId: testTeam.teamId, userId: 'user-2' });

        const requests = listTeamJoinRequestsByUser('user-2');
        expect(requests.length).toBe(1);
      });
    });

    describe('approveTeamJoinRequest', () => {
      test('duyệt yêu cầu tham gia', () => {
        const request = createTeamJoinRequest({
          teamId: testTeam.teamId,
          userId: 'user-2',
        });

        const approved = approveTeamJoinRequest({
          requestId: request.requestId,
          respondedBy: 'owner-1',
        });

        expect(approved.status).toBe('Approved');
        expect(approved.respondedAt).toBeDefined();
        expect(approved.respondedBy).toBe('owner-1');

        // Kiểm tra team đã tăng số thành viên
        const team = getTeamById(testTeam.teamId);
        expect(team.currentMembers).toBe(2);
      });

      test('team chuyển sang Full khi đủ thành viên', () => {
        // Tạo team với maxMembers = 2
        const smallTeam = createTeam({
          teamName: 'Small Team',
          createdBy: 'owner-2',
          maxMembers: 2,
        });

        const request = createTeamJoinRequest({
          teamId: smallTeam.teamId,
          userId: 'user-2',
        });

        approveTeamJoinRequest({
          requestId: request.requestId,
          respondedBy: 'owner-2',
        });

        const team = getTeamById(smallTeam.teamId);
        expect(team.status).toBe('Full');
      });
    });

    describe('rejectTeamJoinRequest', () => {
      test('từ chối yêu cầu tham gia', () => {
        const request = createTeamJoinRequest({
          teamId: testTeam.teamId,
          userId: 'user-2',
        });

        const rejected = rejectTeamJoinRequest({
          requestId: request.requestId,
          respondedBy: 'owner-1',
        });

        expect(rejected.status).toBe('Rejected');
        expect(rejected.respondedAt).toBeDefined();

        // Kiểm tra team không tăng số thành viên
        const team = getTeamById(testTeam.teamId);
        expect(team.currentMembers).toBe(1);
      });
    });
  });
});
