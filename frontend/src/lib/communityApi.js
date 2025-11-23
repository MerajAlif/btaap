// src/lib/communityApi.js
import { api } from "./api";

// ========== PUBLIC ==========

// Browse all communities
export const getCommunities = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/api/communities?${query}` : `/api/communities`;
  return api(path, { auth: false });
};

// Get single community
export const getCommunity = async (id) => {
  return api(`/api/communities/${id}`, { auth: false });
};

// ========== MENTOR ==========

// Create community (mentor only)
export const createCommunity = async (data) => {
  return api("/api/communities", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Update community (mentor only)
export const updateCommunity = async (id, data) => {
  return api(`/api/communities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Get mentor's own communities
export const getMyCommunities = async () => {
  return api("/api/communities/mentor/my-communities");
};

// Get pending join requests for a community
export const getPendingRequests = async (communityId) => {
  return api(`/api/communities/${communityId}/pending-requests`);
};

// Approve or reject a join request
export const processJoinRequest = async (communityId, requestId, action, rejectionReason = "") => {
  return api(`/api/communities/${communityId}/requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ action, rejectionReason }),
  });
};

// Get community members (mentor only)
export const getCommunityMembers = async (communityId) => {
  return api(`/api/communities/${communityId}/members`);
};

// ========== STUDENT ==========

// Join a community
export const joinCommunity = async (communityId) => {
  return api(`/api/communities/${communityId}/join`, {
    method: "POST",
  });
};

// Get student's joined communities
export const getMyMemberships = async () => {
  return api("/api/communities/student/my-communities");
};

// Leave a community
export const leaveCommunity = async (communityId) => {
  return api(`/api/communities/${communityId}/leave`, {
    method: "DELETE",
  });
};