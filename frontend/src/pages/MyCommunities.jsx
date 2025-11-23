// src/pages/MyCommunities.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMyMemberships, leaveCommunity } from "@/lib/communityApi";
// import useAuth from "@/hooks/useAuth";
import { 
  Users, 
  Calendar, 
  LogOut, 
  Search,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function MyCommunities() {
//   const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leavingId, setLeavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyMemberships();
      setMemberships(data.memberships || []);
    } catch (err) {
      setError(err.message || "Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (communityId, communityName) => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${communityName}"? You'll need to rejoin (and pay again if applicable) to access it.`
    );
    
    if (!confirmed) return;

    setLeavingId(communityId);
    try {
      await leaveCommunity(communityId);
      setMemberships(prev => prev.filter(m => m.community._id !== communityId));
    } catch (err) {
      alert(err.message || "Failed to leave community");
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 flex items-center gap-3">
              <Sparkles className="w-10 h-10" />
              My Communities
            </h1>
            <p className="text-purple-700 mt-2">
              Communities you've joined
            </p>
          </div>
          
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/communities">
              <Search className="w-4 h-4 mr-2" />
              Browse More
            </Link>
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Communities List */}
        {memberships.length === 0 ? (
          <Card className="border-purple-200">
            <CardContent className="py-16 text-center space-y-4">
              <Users className="w-16 h-16 text-purple-300 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-purple-900 mb-2">
                  No communities yet
                </h3>
                <p className="text-purple-700 mb-4">
                  Join a community to start learning with mentors
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link to="/communities">Explore Communities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => {
              const community = membership.community;
              const isLeaving = leavingId === community._id;
              
              return (
                <Card 
                  key={membership._id}
                  className="group border-purple-200 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300 overflow-hidden bg-white"
                >
                  {/* Cover Image */}
                  <Link to={`/communities/${community._id}`}>
                    <div className="relative h-40 bg-gradient-to-br from-purple-400 to-indigo-500 overflow-hidden">
                      {community.coverImage ? (
                        <img
                          src={
                            community.coverImage.startsWith("http")
                              ? community.coverImage
                              : `${BASE_URL}${community.coverImage}`
                          }
                          alt={community.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Users className="w-16 h-16 opacity-50" />
                        </div>
                      )}
                      
                      {/* Member Badge */}
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Member
                      </Badge>
                    </div>
                  </Link>

                  <CardContent className="p-4 space-y-3">
                    {/* Community Name */}
                    <Link to={`/communities/${community._id}`}>
                      <h3 className="text-lg font-bold text-purple-900 line-clamp-1 hover:text-purple-600 transition-colors">
                        {community.name}
                      </h3>
                    </Link>

                    {/* Mentor */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={community.mentor?.profile?.avatar} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                          {community.mentor?.name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 truncate">
                        {community.mentor?.name}
                      </span>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Joined {new Date(membership.joinedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stats */}
                    {membership.statistics && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100">
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-900">
                            {membership.statistics.postsCreated || 0}
                          </p>
                          <p className="text-xs text-purple-600">Posts</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-lg font-bold text-blue-900">
                            {membership.statistics.commentsCreated || 0}
                          </p>
                          <p className="text-xs text-blue-600">Comments</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        asChild
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        <Link to={`/communities/${community._id}`}>
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeave(community._id, community.name)}
                        disabled={isLeaving}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {isLeaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}