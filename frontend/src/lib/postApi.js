import { api } from "./api";

export const getPosts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/api/posts?${query}` : `/api/posts`;
  return api(path);
};

export const getPost = async (id) => {
  return api(`/api/posts/${id}`);
};

export const createPost = async (data) => {
  return api("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getUserPosts = async (userId, params = {}) => {
  console.log("getUserPosts called with userId:", userId); // Debug log
  
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([v]) => v !== undefined)
    )
  ).toString();
  
  const path = query ? `/api/posts/user/${userId}?${query}` : `/api/posts/user/${userId}`;
  console.log("Fetching from:", path); // Debug log
  
  return api(path);
};

export const deletePost = async (postId) => {
  return api(`/api/posts/${postId}`, {
    method: "DELETE",
  });
};

export const markPostSolved = async (postId, commentId) => {
  return api(`/api/posts/${postId}/mark-solved`, {
    method: "PATCH",
    body: JSON.stringify({ commentId }),
  });
};

export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const token = localStorage.getItem("token");
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/upload/images`,
    {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    // try to parse error json
    let err;
    try {
      err = await response.json();
    } catch {
      err = { message: "Upload failed" };
    }
    throw err;
  }
  return response.json();
};


export const addComment = async (data) => {
  return api("/api/comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const searchPosts = async (query) => {
  return api(`/api/posts?search=${encodeURIComponent(query)}`);
};
