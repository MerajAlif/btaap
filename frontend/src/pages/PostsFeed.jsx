// src/pages/PostsFeed.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getPosts, searchPosts } from '@/lib/postApi';
import { Search, Plus, MessageCircle, Eye, CheckCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import ImageLightbox from '@/components/ImageLightbox';

export default function PostsFeed() {
  const { user } = useAuth();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, open, solved

  // Lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getPosts(params);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return loadPosts();

    setLoading(true);
    try {
      const data = await searchPosts(searchQuery);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discussion Hub</h1>

        {/* show Ask Question only for logged-in users, otherwise link to login and keep return path */}
        {user ? (
          <Button asChild className="gap-2">
            <Link to="/posts/create">
              <Plus className="w-4 h-4" />
              Ask Question
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="gap-2">
            <Link to="/login" state={{ from: location }}>
              <Plus className="w-4 h-4" />
              Login to Ask
            </Link>
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex gap-2">
            {['all', 'open', 'solved'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
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

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No posts found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post._id} to={`/posts/${post._id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {post.author?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">{post.author?.name}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{post.description}</p>
                    </div>
                    <Badge
                      variant={post.status === 'solved' ? 'default' : 'secondary'}
                      className={post.status === 'solved' ? 'bg-green-500' : ''}
                    >
                      {post.status === 'solved' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {post.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
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

                  {/* images with lightbox */}
                  {post.images?.length > 0 && (
                    <div className="flex gap-2 mt-3">
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
                              setLightboxImages(post.images.map((it) => `${BASE}${it.url}`));
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
                            setLightboxImages(post.images.map((it) => `${BASE}${it.url}`));
                            // open at fourth item (index 3) so user sees the overflow
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
          ))}
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
