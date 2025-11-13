// src/pages/PostDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  getPost,
  addComment,
  markPostSolved,
  uploadImages,
} from "@/lib/postApi";
import { MessageCircle, Upload, X, CheckCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import ImageLightbox from "@/components/ImageLightbox";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [commentPreviews, setCommentPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);

  // Lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]); // array of full URL strings

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await getPost(id);
      setPost(data.post);
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to load post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (commentImages.length + files.length > 5) return;

    setCommentImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setCommentPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      // safety: should not happen because UI hides form, but keep defense-in-depth
      return;
    }

    setSubmitting(true);

    try {
      let imageUrls = [];
      if (commentImages.length > 0) {
        const uploadRes = await uploadImages(commentImages);
        imageUrls = uploadRes.images || [];
      }

      await addComment({
        postId: id,
        text: commentText,
        images: imageUrls,
      });

      setCommentText("");
      setCommentImages([]);
      setCommentPreviews([]);
      await loadPost();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSolved = async (commentId) => {
    try {
      await markPostSolved(id, commentId);
      await loadPost();
      setShowSolveModal(false);
    } catch (error) {
      console.error("Failed to mark as solved:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  const isAuthor = user?._id === post?.author?._id;
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{post?.author?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post?.author?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(post?.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge
              variant={post?.status === "solved" ? "default" : "secondary"}
              className={post?.status === "solved" ? "bg-green-500" : ""}
            >
              {post?.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{post?.title}</h1>
          <Badge variant="outline">{post?.subject}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap">{post?.description}</p>

          {/* Post images with lightbox */}
          {post?.images?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {post.images.map((img, i) => {
                const url = `${BASE}${img.url}`;
                return (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-90 transition"
                    onClick={() => {
                      // set array of full urls and open lightbox at clicked index
                      setLightboxImages(post.images.map((it) => `${BASE}${it.url}`));
                      setLightboxIndex(i);
                      setLightboxOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}

          {isAuthor && post?.status === "open" && comments.length > 0 && (
            <Button onClick={() => setShowSolveModal(true)} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Mark as Solved
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {comments.length} Responses
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className={`border rounded-lg p-4 ${
                comment.isSolution ? "bg-green-50 border-green-200" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{comment.author?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">{comment.author?.name}</p>
                    {comment.isSolution && (
                      <Badge className="bg-green-500">Solution</Badge>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.text}</p>

                  {/* Comment images with lightbox */}
                  {comment.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {comment.images.map((img, i) => {
                        const url = `${BASE}${img.url}`;
                        return (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition"
                            onClick={() => {
                              setLightboxImages(
                                comment.images.map((it) => `${BASE}${it.url}`)
                              );
                              setLightboxIndex(i);
                              setLightboxOpen(true);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Comment Form (only for logged-in users) */}
          {user ? (
            <form
              onSubmit={handleSubmitComment}
              className="border-t pt-4 space-y-3"
            >
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="comment-images"
                  disabled={commentImages.length >= 5}
                />
                <label htmlFor="comment-images">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Images ({commentImages.length}/5)
                    </span>
                  </Button>
                </label>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Posting..." : "Post Response"}
                </Button>
              </div>

              {commentPreviews.length > 0 && (
                <div className="flex gap-2">
                  {commentPreviews.map((preview, i) => (
                    <div key={i} className="relative">
                      <img
                        src={preview}
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCommentImages(commentImages.filter((_, idx) => idx !== i));
                          setCommentPreviews(
                            commentPreviews.filter((_, idx) => idx !== i)
                          );
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className="text-sm text-gray-600 border-t pt-4">
              <p className="mb-2">You must be logged in to comment.</p>
              <Link to="/login" state={{ from: location }}>
                <Button>Login to Comment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Solved Modal */}
      {showSolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <h3 className="text-lg font-semibold">Select Solution</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {comments.map((comment) => (
                <button
                  key={comment._id}
                  onClick={() => handleMarkSolved(comment._id)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <p className="font-medium">{comment.author?.name}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {comment.text}
                  </p>
                </button>
              ))}
              <Button
                variant="outline"
                onClick={() => setShowSolveModal(false)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lightbox */}
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
