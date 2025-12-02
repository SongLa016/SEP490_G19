// Extract request ID from various response formats
export const extractRequestId = (payload) => {
  if (!payload) return null;
  if (typeof payload === "number") return payload;
  if (payload.requestId) return payload.requestId;
  if (payload.matchRequestId) return payload.matchRequestId;
  if (payload.id) return payload.id;
  if (payload.data) return extractRequestId(payload.data);
  if (payload.hasRequest && payload.request)
    return extractRequestId(payload.request);
  if (payload.hasRequest && payload.id) return payload.id;
  return null;
};

// Extract participants from various response formats
export const extractParticipants = (detail) => {
  if (!detail) return [];
  if (Array.isArray(detail)) return detail;

  const candidateKeys = [
    "participants",
    "participantsList",
    "joinRequests",
    "joins",
    "joinResponses",
    "matchJoinResponses",
    "matchJoinRequests",
    "matchJoins",
    "matchParticipants",
    "pendingParticipants",
  ];

  for (const key of candidateKeys) {
    if (Array.isArray(detail[key])) {
      return detail[key];
    }
  }

  if (detail.data) {
    const nested = extractParticipants(detail.data);
    if (Array.isArray(nested) && nested.length > 0) {
      return nested;
    }
  }
  if (detail.result) {
    const nested = extractParticipants(detail.result);
    if (Array.isArray(nested) && nested.length > 0) {
      return nested;
    }
  }

  return [];
};

// Get request owner ID
export const getRequestOwnerId = (request) => {
  if (!request) return null;
  const data = request.data || request;

  return (
    data.creatorUserId ||
    data.creatorUserID ||
    data.ownerId ||
    data.ownerID ||
    data.userId ||
    data.userID ||
    data.createdById ||
    data.createdByID ||
    data.createdByUserId ||
    data.createdByUserID ||
    data.creatorId ||
    data.creatorID ||
    data.createdBy ||
    request.ownerId ||
    request.ownerID ||
    request.userId ||
    request.userID ||
    request.creatorUserId ||
    null
  );
};

// Get owner team names
export const getOwnerTeamNames = (request) => {
  if (!request) return [];
  const data = request.data || request;

  const names = [
    data.creatorTeamName,
    data.homeTeamName,
    data.hostTeamName,
    data.ownerTeamName,
    data.teamName,
    data.ownerTeam,
    data?.owner?.teamName,
    data?.homeTeam?.name,
    data?.hostTeam?.name,
    data?.booking?.teamName,
    request.creatorTeamName,
    request.homeTeamName,
    request.hostTeamName,
    request.ownerTeamName,
  ];
  return names
    .filter((name) => typeof name === "string" && name.trim().length > 0)
    .map((name) => name.trim().toLowerCase());
};

// Get participant ID
export const getParticipantId = (participant) => {
  if (!participant) return null;
  return (
    participant.participantId || participant.joinId || participant.id || null
  );
};
