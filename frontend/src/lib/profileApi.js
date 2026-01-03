// src/lib/profileApi.js
import { api } from "./api";

// Get mentor public profile
export const getMentorProfile = async (mentorId) => {
  return api(`/api/profiles/mentor/${mentorId}`, { auth: false });
};

// Get student public profile
export const getStudentProfile = async (studentId) => {
  return api(`/api/profiles/student/${studentId}`, { auth: false });
};

// Get own detailed profile
export const getMyProfile = async () => {
  return api("/api/profiles/me");
};

// Browse all approved mentors
export const browseMentors = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/api/profiles/mentors?${query}` : `/api/profiles/mentors`;
  return api(path, { auth: false });
};

// Apply to become a mentor (student -> mentor)
export const applyAsMentor = async (data) => {
  return api("/api/profiles/apply-mentor", {
    method: "POST",
    body: JSON.stringify(data),
  });
};