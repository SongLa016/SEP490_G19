import { getRequestOwnerId, getOwnerTeamNames } from './matchRequestHelpers';

// Check if participant is owner
export const isOwnerParticipant = (participant, ownerId, ownerTeamNames = []) => {
     if (!participant) return false;
     if (participant.isOwnerTeam || participant.isHostTeam || participant.role === "owner") return true;

     const statusFromA = String(participant.statusFromA || "").toLowerCase();
     const statusFromB = String(participant.statusFromB || "").toLowerCase();

     if (statusFromA === "accepted" && statusFromB === "accepted") {
          return true;
     }

     if (statusFromB !== "accepted") {
          return false;
     }

     const participantTeamName = (participant.teamName || participant.fullName || "")
          .toString()
          .trim()
          .toLowerCase();

     if (participantTeamName && ownerTeamNames.includes(participantTeamName)) {
          return true;
     }

     if (ownerId == null) return false;

     const ownerValue = String(ownerId);
     const possibleOwnerIds = [
          participant.ownerId,
          participant.ownerID,
          participant.userId,
          participant.userID,
          participant.playerId,
          participant.playerID,
          participant.createdById,
          participant.createdByID,
          participant.creatorId,
          participant.creatorID,
          participant.createdByUserId,
          participant.createdByUserID,
          participant.hostUserId,
          participant.hostUserID,
          participant.teamOwnerId,
          participant.teamOwnerID,
          participant?.user?.id,
          participant?.user?.userId,
          participant?.user?.userID,
          participant?.owner?.id,
          participant?.owner?.userId,
          participant?.owner?.userID
     ]
          .filter((val) => val !== undefined && val !== null)
          .map((val) => String(val));

     if (!possibleOwnerIds.includes(ownerValue)) {
          return false;
     }

     if (ownerTeamNames.length === 0) {
          return true;
     }

     return ownerTeamNames.includes(participantTeamName);
};

// Normalize status value
export const normalizeStatusValue = (value) => {
     if (value === undefined || value === null) return "";
     const raw = value.toString().trim().toLowerCase();
     if (!raw) return "";
     if (raw.includes("accept") || raw.includes("approve") || raw.includes("confirm") || raw.includes("match")) return "accepted";
     if (raw.includes("reject") || raw.includes("deny") || raw.includes("decline")) return "rejected";
     if (raw.includes("withdraw")) return "withdrawn";
     if (raw.includes("cancel")) return "cancelled";
     if (raw.includes("pending") || raw.includes("wait")) return "pending";
     if (raw === "0") return "pending";
     return raw;
};

// Get owner decision status
export const getOwnerDecisionStatus = (participant) => {
     if (!participant) return "";
     const ownerStatusSources = [
          participant.statusFromB,
          participant.statusFromOwner,
          participant.statusFromHost,
          participant.statusFromCreator,
          participant.statusFromRequester,
          participant.ownerStatus,
          participant.hostDecision,
          participant.approvalStatus
     ];

     for (const source of ownerStatusSources) {
          const normalized = normalizeStatusValue(source);
          if (normalized) return normalized;
     }
     return "";
};

// Get opponent decision status
export const getOpponentDecisionStatus = (participant) => {
     if (!participant) return "";
     const opponentStatusSources = [
          participant.statusFromA,
          participant.statusFromParticipant,
          participant.statusFromTeam,
          participant.opponentStatus,
          participant.teamStatus,
          participant.joinStatus,
          participant.state,
          participant.participantStatus,
          participant.responseStatus
     ];

     for (const source of opponentStatusSources) {
          const normalized = normalizeStatusValue(source);
          if (normalized) return normalized;
     }
     return "";
};

// Check if participant needs owner action
export const participantNeedsOwnerAction = (participant) => {
     const ownerStatus = getOwnerDecisionStatus(participant);
     return !ownerStatus || ownerStatus === "pending";
};

// Check if participant is accepted by owner
export const isParticipantAcceptedByOwner = (participant) => {
     return getOwnerDecisionStatus(participant) === "accepted";
};

// Check if participant is rejected by owner
export const isParticipantRejectedByOwner = (participant) => {
     return getOwnerDecisionStatus(participant) === "rejected";
};

// Normalize participant status for display
export const normalizeParticipantStatus = (participant) => {
     const ownerStatus = getOwnerDecisionStatus(participant);
     const opponentStatus = getOpponentDecisionStatus(participant);

     if (ownerStatus === "accepted" && opponentStatus === "accepted") {
          return "Hai đội đã xác nhận";
     }

     if (ownerStatus === "accepted" && (!opponentStatus || opponentStatus === "pending")) {
          return "Đã chấp nhận • Chờ đội bạn";
     }

     if (participantNeedsOwnerAction(participant)) {
          return "Chờ bạn duyệt";
     }

     if (ownerStatus === "rejected") {
          return "Đã từ chối";
     }

     if (opponentStatus === "rejected" || opponentStatus === "cancelled") {
          return "Đội bạn đã hủy";
     }

     if (opponentStatus === "withdrawn") {
          return "Đội bạn đã rút";
     }

     const fallback =
          ownerStatus ||
          opponentStatus ||
          normalizeStatusValue(
               participant?.status ??
               participant?.state ??
               participant?.joinStatus ??
               participant?.joinState
          ) ||
          "pending";

     return fallback.charAt(0).toUpperCase() + fallback.slice(1);
};

// Filter participants for display (exclude owner)
export const filterParticipantsForDisplay = (participants, request) => {
     if (!Array.isArray(participants)) return [];
     const ownerId = getRequestOwnerId(request);
     const ownerTeamNames = getOwnerTeamNames(request);

     const filtered = participants.filter((participant) => {
          const isOwner = isOwnerParticipant(participant, ownerId, ownerTeamNames);
          return !isOwner;
     });

     return filtered;
};
