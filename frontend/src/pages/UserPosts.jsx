import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useAuth from "@/hooks/useAuth";
import { getUserPosts, deletePost as apiDeletePost } from "@/lib/postApi";
import { MessageCircle, Eye, CheckCircle, Edit2, Trash2 } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

export default function UserPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 8;
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);

  const resetAndLoad = useCallback(() => {
    setPage(1);
    setPosts([]);
    setHasMore(false);
    loadPosts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, filter]);

  useEffect(() => {
    if (!user?._id) {
      setPosts([]);
      setLoading(false);
      return;
    }
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, filter]);

  const loadPosts = async (requestedPage = page, replace = false) => {
    // Change this line:
    const userId = user._id || user.id; // Try both formats

    if (!userId) return;

    if (requestedPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        status: filter !== "all" ? filter : undefined,
        page: requestedPage,
        limit,
      };

      console.log("Loading posts for user:", userId); // Debug
      const data = await getUserPosts(userId, params);
      console.log("Received data:", data); // Debug

      const newPosts = data.posts || [];

      setPosts((prev) =>
        replace || requestedPage === 1 ? newPosts : [...prev, ...newPosts]
      );

      if (typeof data.hasMore === "boolean") {
        setHasMore(data.hasMore);
      } else {
        setHasMore(newPosts.length === limit);
      }
      setPage(requestedPage);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore) return;
    loadPosts(page + 1);
  };

  const handleDelete = async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingIds((s) => [...s, postId]);
    try {
      await apiDeletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingIds((s) => s.filter((id) => id !== postId));
    }
  };

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Posts</h1>
        <Button asChild className="gap-2">
          <Link to="/posts/create">Create Post</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "open", "solved"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 space-y-4">
            <div>No posts yet</div>
            <div>
              <Button asChild>
                <Link to="/posts/create">Create your first post</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor =
              user?._id &&
              post.author?._id &&
              String(user._id) === String(post.author._id);
            return (
              <Link key={post._id} to={`/posts/${post._id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {post.author?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="font-medium">{post.author?.name}</p>
                            <p className="text-gray-500 text-xs">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            post.status === "solved" ? "default" : "secondary"
                          }
                          className={
                            post.status === "solved" ? "bg-green-500" : ""
                          }
                        >
                          {post.status === "solved" && (
                            <CheckCircle className="w-3 h-3 mr-1 inline-block" />
                          )}
                          {post.status}
                        </Badge>

                        {isAuthor && (
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/posts/${post._id}`);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => handleDelete(post._id, e)}
                              disabled={deletingIds.includes(post._id)}
                              className="flex items-center gap-1"
                            >
                              {deletingIds.includes(post._id) ? (
                                <span className="animate-spin inline-block w-4 h-4 border-b-2 rounded-full" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.commentCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewCount || 0}
                      </span>
                      <Badge variant="outline">{post.subject}</Badge>
                    </div>

                    {post.images?.length > 0 && (
                      <div className="flex gap-2">
                        {post.images.slice(0, 3).map((img, i) => {
                          const url = `${BASE}${img.url}`;
                          return (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-90 transition"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLightboxImages(
                                  post.images.map((it) => `${BASE}${it.url}`)
                                );
                                setLightboxIndex(i);
                                setLightboxOpen(true);
                              }}
                            />
                          );
                        })}
                        {post.images.length > 3 && (
                          <div
                            className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600 cursor-pointer hover:bg-gray-200"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLightboxImages(
                                post.images.map((it) => `${BASE}${it.url}`)
                              );
                              setLightboxIndex(3);
                              setLightboxOpen(true);
                            }}
                          >
                            +{post.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
