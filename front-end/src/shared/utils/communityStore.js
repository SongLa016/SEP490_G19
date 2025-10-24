// Simple localStorage-based store for community features

const KEYS = {
  posts: "community_posts",
  joins: "community_joins",
  notifications: "community_notifications",
  rooms: "chat_rooms",
  roomMembers: "chat_room_members",
  matchRequests: "match_requests",
  matchJoins: "match_joins",
  postLikes: "post_likes",
  comments: "post_comments",
  reports: "reports",
  playerHistories: "player_histories",
  teams: "teams",
  teamJoinRequests: "team_join_requests",
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// CommunityPosts(PostId, UserId, Content, Location, Time, Status)
export function listCommunityPosts({ location = "", date = "" } = {}) {
  const posts = load(KEYS.posts);
  return posts
    .filter((p) => {
      const matchLocation =
        !location ||
        (p.location || "").toLowerCase().includes(location.toLowerCase());
      const matchDate = !date || (p.time || "").startsWith(date);
      return matchLocation && matchDate;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function seedCommunityPostsOnce() {
  const posts = load(KEYS.posts);
  if (posts.length > 0) return;
  const now = Date.now();
  const demo = [
    {
      postId: "CP-1",
      userId: "demo-1",
      content: "Tìm đối thủ giao hữu 7 người",
      location: "Quận 7, TP.HCM",
      time: "2025-10-25 18:00",
      status: "open",
      createdAt: now - 100000,
    },
    {
      postId: "CP-2",
      userId: "demo-2",
      content: "Cần đội đá 5 người tối nay",
      location: "Cầu Giấy, Hà Nội",
      time: "2025-10-26 20:00",
      status: "open",
      createdAt: now - 50000,
    },
  ];
  save(KEYS.posts, demo);
}

export function createCommunityPost({
  userId,
  content,
  location,
  time,
  authorName,
  bookingId,
  fieldName,
  date,
  slotName,
}) {
  const posts = load(KEYS.posts);
  const post = {
    postId: `CP-${Date.now()}`,
    userId,
    content,
    location,
    time,
    authorName: authorName || "",
    bookingId: bookingId || "",
    fieldName: fieldName || "",
    date: date || "",
    slotName: slotName || "",
    status: "open",
    createdAt: Date.now(),
  };
  posts.unshift(post);
  save(KEYS.posts, posts);
  return post;
}

// CommunityJoins(JoinId, PostId, UserId, Status)
export function joinCommunityPost({ postId, userId }) {
  const joins = load(KEYS.joins);
  const exists = joins.find((j) => j.postId === postId && j.userId === userId);
  if (exists) return exists;
  const join = {
    joinId: `CJ-${Date.now()}`,
    postId,
    userId,
    status: "pending",
    createdAt: Date.now(),
  };
  joins.push(join);
  save(KEYS.joins, joins);
  return join;
}

export function listJoinsByPost(postId) {
  return load(KEYS.joins).filter((j) => j.postId === postId);
}

export function updateJoinStatus(joinId, status) {
  const joins = load(KEYS.joins);
  const idx = joins.findIndex((j) => j.joinId === joinId);
  if (idx < 0) return null;
  joins[idx] = { ...joins[idx], status };
  save(KEYS.joins, joins);
  return joins[idx];
}

// Notifications(NotificationId, UserId, Type, RefId, Message, IsRead)
export function createNotification({ userId, type, refId, message }) {
  const notifs = load(KEYS.notifications);
  const n = {
    notificationId: `NT-${Date.now()}`,
    userId,
    type,
    refId,
    message,
    isRead: false,
    createdAt: Date.now(),
  };
  notifs.unshift(n);
  save(KEYS.notifications, notifs);
  return n;
}

// ===================== Community Core: Posts, Comments, Likes, Reports =====================
// Likes
export function togglePostLike({ postId, userId }) {
  const likes = load(KEYS.postLikes);
  const idx = likes.findIndex(
    (l) => l.postId === postId && l.userId === userId
  );
  if (idx >= 0) {
    likes.splice(idx, 1);
  } else {
    likes.push({
      likeId: `PL-${Date.now()}`,
      postId,
      userId,
      createdAt: Date.now(),
    });
  }
  save(KEYS.postLikes, likes);
  return likes.filter((l) => l.postId === postId).length;
}

export function countPostLikes(postId) {
  return load(KEYS.postLikes).filter((l) => l.postId === postId).length;
}

// Comments
export function addComment({
  postId,
  userId,
  content,
  parentCommentId = null,
}) {
  const comments = load(KEYS.comments);
  const c = {
    commentId: `CMT-${Date.now()}`,
    postId,
    userId,
    parentCommentId,
    content,
    createdAt: Date.now(),
    status: "Active",
  };
  comments.push(c);
  save(KEYS.comments, comments);
  return c;
}

export function listComments(postId) {
  return load(KEYS.comments).filter(
    (c) => c.postId === postId && c.status === "Active"
  );
}

// Reports
export function reportTarget({ reporterId, targetType, targetId, reason }) {
  const reports = load(KEYS.reports);
  const r = {
    reportId: `RP-${Date.now()}`,
    reporterId,
    targetType,
    targetId,
    reason,
    createdAt: Date.now(),
    status: "Pending",
  };
  reports.push(r);
  save(KEYS.reports, reports);
  return r;
}

// ChatRooms(RoomId, Type=Match, CreatedBy, RefId=PostId)
// ChatRoomMembers(RoomId, UserId)
export function createMatchRoom({ createdBy, postId, memberUserIds }) {
  const rooms = load(KEYS.rooms);
  const room = {
    roomId: `RM-${Date.now()}`,
    type: "Match",
    createdBy,
    refId: postId,
    createdAt: Date.now(),
  };
  rooms.push(room);
  save(KEYS.rooms, rooms);
  const members = load(KEYS.roomMembers);
  memberUserIds.forEach((uid) =>
    members.push({ roomId: room.roomId, userId: uid })
  );
  save(KEYS.roomMembers, members);
  return room;
}

// Accept flow: update join, create room, notify
export function acceptJoin({ joinId }) {
  const join = updateJoinStatus(joinId, "accepted");
  if (!join) return null;
  // find all joins for post
  const joins = load(KEYS.joins).filter(
    (j) => j.postId === join.postId && j.status === "accepted"
  );
  // include author
  const posts = load(KEYS.posts);
  const post = posts.find((p) => p.postId === join.postId);
  if (!post) return join;
  const memberUserIds = Array.from(
    new Set([post.userId, ...joins.map((j) => j.userId)])
  );
  const room = createMatchRoom({
    createdBy: post.userId,
    postId: post.postId,
    memberUserIds,
  });
  memberUserIds.forEach((uid) =>
    createNotification({
      userId: uid,
      type: "MatchRoom",
      refId: room.roomId,
      message: "Bạn đã được thêm vào phòng chat Match",
    })
  );
  return { join, room };
}

export function rejectJoin({ joinId }) {
  return updateJoinStatus(joinId, "rejected");
}

// ===================== Match Requests (Find Opponent for Booking) =====================
// MatchRequests(RequestId, BookingId, OwnerId, Level, Note, Status: Open|Pending|Matched|Rejected|Expired, CreatedAt)
export function createMatchRequest({
  bookingId,
  ownerId,
  level,
  note,
  fieldName,
  address,
  date,
  slotName,
  price,
  createdByName,
  // New fields for recurring bookings
  isRecurring = false,
  recurringSessions = [],
  recurringType = "single", // "single" | "all" | "individual" | "first"
}) {
  const items = load(KEYS.matchRequests);

  // For single bookings, prevent duplicate open request
  if (
    !isRecurring &&
    bookingId &&
    items.some(
      (r) => r.bookingId === bookingId && ["Open", "Pending"].includes(r.status)
    )
  ) {
    throw new Error("Yêu cầu tìm đối cho booking này đang mở");
  }

  const baseRequest = {
    requestId: `MR-${Date.now()}`,
    bookingId: bookingId || null,
    ownerId,
    level: level || "any",
    note: note || "",
    status: "Open",
    fieldName: fieldName || "",
    address: address || "",
    date: date || "",
    slotName: slotName || "",
    price: price || 0,
    createdByName: createdByName || "",
    createdAt: Date.now(),
    expireAt: Date.now() + 60 * 60 * 1000, // 1h
    // Recurring fields
    isRecurring,
    recurringSessions: recurringSessions || [],
    recurringType,
  };

  if (isRecurring && recurringType === "individual") {
    // Create individual requests for each session
    const requests = [];
    recurringSessions.forEach((session, index) => {
      const req = {
        ...baseRequest,
        requestId: `MR-${Date.now()}-${index}`,
        bookingId: session.bookingId || null,
        date: session.date
          ? session.date instanceof Date
            ? session.date.toISOString().split("T")[0]
            : session.date
          : "",
        slotName: session.slotName || "",
        note: `${note} (Buổi ${index + 1}/${recurringSessions.length})`,
      };
      requests.push(req);
    });
    items.unshift(...requests);
    save(KEYS.matchRequests, items);
    return requests;
  } else {
    // Single request (for all sessions or first session)
    items.unshift(baseRequest);
    save(KEYS.matchRequests, items);
    return baseRequest;
  }
}

export function listMatchRequests({
  status = "Open",
  level = "",
  location = "",
  date = "",
} = {}) {
  const items = load(KEYS.matchRequests);
  return items
    .filter((r) => {
      const matchStatus = !status || r.status === status;
      const matchLevel =
        !level ||
        level === "all" ||
        r.level === level ||
        (level === "any" && r.level === "any");
      const matchLocation =
        !location ||
        (r.address || "").toLowerCase().includes(location.toLowerCase());
      const matchDate = !date || (r.date || "").startsWith(date);
      return matchStatus && matchLevel && matchLocation && matchDate;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getMatchRequestById(requestId) {
  return (
    load(KEYS.matchRequests).find((r) => r.requestId === requestId) || null
  );
}

export function updateMatchRequest(requestId, updates) {
  const list = load(KEYS.matchRequests);
  const idx = list.findIndex((r) => r.requestId === requestId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...updates };
  save(KEYS.matchRequests, list);
  return list[idx];
}

export function expireMatchRequestsNow() {
  const now = Date.now();
  const list = load(KEYS.matchRequests).map((r) =>
    r.status !== "Matched" && r.expireAt && r.expireAt < now
      ? { ...r, status: "Expired" }
      : r
  );
  save(KEYS.matchRequests, list);
  return list;
}

// MatchJoins(JoinId, RequestId, UserId, Level, Status: Pending|Accepted|Rejected)
export function joinMatchRequest({ requestId, userId, level }) {
  const joins = load(KEYS.matchJoins);
  const req = getMatchRequestById(requestId);
  if (!req) throw new Error("Yêu cầu không tồn tại");
  if (["Matched", "Expired", "Rejected"].includes(req.status))
    throw new Error("Trận đã không còn mở để tham gia");
  if (joins.find((j) => j.requestId === requestId && j.userId === userId))
    throw new Error("Bạn đã gửi yêu cầu tham gia");
  const j = {
    joinId: `MRJ-${Date.now()}`,
    requestId,
    userId,
    level: level || "any",
    status: "Pending",
    createdAt: Date.now(),
  };
  joins.push(j);
  save(KEYS.matchJoins, joins);
  createNotification({
    userId: req.ownerId,
    type: "MatchJoin",
    refId: requestId,
    message: "Có đội muốn tham gia trận của bạn",
  });
  updateMatchRequest(requestId, { status: "Pending" });
  return j;
}

export function listMatchJoinsByRequest(requestId) {
  return load(KEYS.matchJoins).filter((j) => j.requestId === requestId);
}

export function acceptMatchJoin({ joinId }) {
  const joins = load(KEYS.matchJoins);
  const idx = joins.findIndex((j) => j.joinId === joinId);
  if (idx < 0) return null;
  const target = joins[idx];
  target.status = "Accepted";
  // auto reject others for same request
  joins.forEach((j, i) => {
    if (j.requestId === target.requestId && j.joinId !== joinId)
      joins[i] = { ...j, status: "Rejected" };
  });
  save(KEYS.matchJoins, joins);
  const req = updateMatchRequest(target.requestId, { status: "Matched" });
  // notify both sides
  createNotification({
    userId: req.ownerId,
    type: "Match",
    refId: req.requestId,
    message: "Bạn đã ghép trận thành công",
  });
  createNotification({
    userId: target.userId,
    type: "Match",
    refId: req.requestId,
    message: "Yêu cầu tham gia của bạn đã được chấp nhận",
  });

  // histories for both players
  const histories = load(KEYS.playerHistories);
  const now = Date.now();
  const base = {
    requestId: req.requestId,
    bookingId: req.bookingId,
    fieldName: req.fieldName || "",
    address: req.address || "",
    date: req.date || "",
    slotName: req.slotName || "",
    price: req.price || 0,
    createdAt: now,
  };
  histories.push({
    historyId: `PH-${now}-A`,
    userId: req.ownerId,
    role: "Creator",
    finalStatus: "Matched",
    ...base,
  });
  histories.push({
    historyId: `PH-${now}-B`,
    userId: target.userId,
    role: "Joiner",
    finalStatus: "Matched",
    ...base,
  });
  save(KEYS.playerHistories, histories);
  return { join: target, request: req };
}

// Player histories helpers
export function listPlayerHistoriesByUser(userId) {
  const histories = load(KEYS.playerHistories);
  return histories
    .filter((h) => String(h.userId) === String(userId))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function rejectMatchJoin({ joinId }) {
  const joins = load(KEYS.matchJoins);
  const idx = joins.findIndex((j) => j.joinId === joinId);
  if (idx < 0) return null;
  joins[idx] = { ...joins[idx], status: "Rejected" };
  save(KEYS.matchJoins, joins);
  const req = getMatchRequestById(joins[idx].requestId);
  // if no other pending joins, revert to Open
  const othersPending = joins.some(
    (j) => j.requestId === req.requestId && j.status === "Pending"
  );
  if (!othersPending && req.status !== "Matched")
    updateMatchRequest(req.requestId, { status: "Open" });
  return joins[idx];
}

// ===================== Team Management =====================
// Teams(TeamID, TeamName, CreatedBy, ContactPhone, Description, PreferredSkillLevel, PreferredPositions, CurrentMembers, MaxMembers, Status, CreatedAt)
export function createTeam({
  teamName,
  createdBy,
  contactPhone,
  description,
  preferredSkillLevel,
  preferredPositions,
  maxMembers,
  createdByName,
}) {
  const teams = load(KEYS.teams);
  const team = {
    teamId: `TM-${Date.now()}`,
    teamName,
    createdBy,
    contactPhone,
    description: description || "",
    preferredSkillLevel: preferredSkillLevel || "Any",
    preferredPositions: preferredPositions || "",
    currentMembers: 1,
    maxMembers,
    status: "Open",
    createdByName: createdByName || "",
    createdAt: Date.now(),
  };
  teams.unshift(team);
  save(KEYS.teams, teams);
  return team;
}

export function listTeams({
  status = "Open",
  skillLevel = "",
  location = "",
} = {}) {
  const teams = load(KEYS.teams);
  return teams
    .filter((t) => {
      const matchStatus = !status || t.status === status;
      const matchSkillLevel =
        !skillLevel ||
        skillLevel === "all" ||
        t.preferredSkillLevel === skillLevel ||
        (skillLevel === "any" && t.preferredSkillLevel === "Any");
      return matchStatus && matchSkillLevel;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getTeamById(teamId) {
  return load(KEYS.teams).find((t) => t.teamId === teamId) || null;
}

export function updateTeam(teamId, updates) {
  const teams = load(KEYS.teams);
  const idx = teams.findIndex((t) => t.teamId === teamId);
  if (idx < 0) return null;
  teams[idx] = { ...teams[idx], ...updates };
  save(KEYS.teams, teams);
  return teams[idx];
}

// TeamJoinRequests(RequestID, TeamID, UserID, Message, Status, RequestedAt, RespondedAt, RespondedBy)
export function createTeamJoinRequest({ teamId, userId, message, userName }) {
  const requests = load(KEYS.teamJoinRequests);
  const team = getTeamById(teamId);
  if (!team) throw new Error("Đội không tồn tại");
  if (team.status !== "Open") throw new Error("Đội không còn mở để tham gia");
  if (team.createdBy === userId)
    throw new Error("Bạn không thể tham gia đội của chính mình");

  // Check if user already has a pending request
  const existingRequest = requests.find(
    (r) => r.teamId === teamId && r.userId === userId && r.status === "Pending"
  );
  if (existingRequest) throw new Error("Bạn đã gửi yêu cầu tham gia đội này");

  const request = {
    requestId: `TJR-${Date.now()}`,
    teamId,
    userId,
    message: message || "",
    status: "Pending",
    userName: userName || "",
    requestedAt: Date.now(),
    respondedAt: null,
    respondedBy: null,
  };
  requests.push(request);
  save(KEYS.teamJoinRequests, requests);

  // Notify team creator
  createNotification({
    userId: team.createdBy,
    type: "TeamJoinRequest",
    refId: teamId,
    message: `Có người muốn tham gia đội "${team.teamName}"`,
  });

  return request;
}

export function listTeamJoinRequestsByTeam(teamId) {
  return load(KEYS.teamJoinRequests).filter((r) => r.teamId === teamId);
}

export function listTeamJoinRequestsByUser(userId) {
  return load(KEYS.teamJoinRequests).filter((r) => r.userId === userId);
}

export function approveTeamJoinRequest({ requestId, respondedBy }) {
  const requests = load(KEYS.teamJoinRequests);
  const idx = requests.findIndex((r) => r.requestId === requestId);
  if (idx < 0) return null;

  const request = requests[idx];
  const team = getTeamById(request.teamId);
  if (!team) return null;

  // Check if team is still open and has space
  if (team.status !== "Open" || team.currentMembers >= team.maxMembers) {
    throw new Error("Đội đã đầy hoặc không còn mở");
  }

  // Update request status
  requests[idx] = {
    ...request,
    status: "Approved",
    respondedAt: Date.now(),
    respondedBy,
  };
  save(KEYS.teamJoinRequests, requests);

  // Update team member count
  const newMemberCount = team.currentMembers + 1;
  const newStatus = newMemberCount >= team.maxMembers ? "Full" : "Open";
  updateTeam(request.teamId, {
    currentMembers: newMemberCount,
    status: newStatus,
  });

  // Notify the user
  createNotification({
    userId: request.userId,
    type: "TeamJoinApproved",
    refId: request.teamId,
    message: `Yêu cầu tham gia đội "${team.teamName}" đã được chấp nhận`,
  });

  return requests[idx];
}

export function rejectTeamJoinRequest({ requestId, respondedBy }) {
  const requests = load(KEYS.teamJoinRequests);
  const idx = requests.findIndex((r) => r.requestId === requestId);
  if (idx < 0) return null;

  const request = requests[idx];
  requests[idx] = {
    ...request,
    status: "Rejected",
    respondedAt: Date.now(),
    respondedBy,
  };
  save(KEYS.teamJoinRequests, requests);

  // Notify the user
  const team = getTeamById(request.teamId);
  createNotification({
    userId: request.userId,
    type: "TeamJoinRejected",
    refId: request.teamId,
    message: `Yêu cầu tham gia đội "${team.teamName}" đã bị từ chối`,
  });

  return requests[idx];
}
