// src/pages/CommunityDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCommunity, joinCommunity } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  Lock
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();
  
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCommunity();
  }, [id]);

  const loadCommunity = async () => {
    setLoading(true);
    try {
      const data = await getCommunity(id);
      setCommunity(data.community);
    } catch (error) {
      console.error("Failed to load community:", error);
      setError("Failed to load community details");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/communities/${id}` } });
      return;
    }

    if (user.role !== "student") {
      setError("Only students can join communities");
      return;
    }

    setJoining(true);
    setError("");
    setSuccess("");

    try {
      const data = await joinCommunity(id);
      setSuccess(data.message || "Successfully joined community!");
      await refreshMe();
      
      setTimeout(() => {
        navigate("/my-communities");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to join community");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>Community not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/communities")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </Button>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Cover Image */}
        <div className="relative h-64 rounded-2xl overflow-hidden">
          {community.coverImage ? (
            <img
              src={
                community.coverImage.startsWith("http")
                  ? community.coverImage
                  : `${BASE_URL}${community.coverImage}`
              }
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-32 h-32 text-white opacity-50" />
            </div>
          )}
          
          {/* Category Badge */}
          <Badge className="absolute top-4 left-4 bg-white/90 text-purple-700 text-base px-4 py-2">
            {community.category}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Community Info */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-3xl text-purple-900">
                  {community.name}
                </CardTitle>
                <p className="text-gray-600 mt-2">{community.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                {community.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {community.statistics?.totalMembers || 0}
                      </p>
                      <p className="text-sm text-purple-600">Members</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {new Date(community.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-blue-600">Created</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mentor Info */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl">Meet Your Mentor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={community.mentor?.profile?.avatar} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                      {community.mentor?.name?.charAt(0) || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {community.mentor?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {community.mentor?.profile?.bio || "Expert mentor"}
                    </p>
                    {community.mentor?.profile?.expertise?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {community.mentor.profile.expertise.map((exp, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Card */}
            <Card className="border-purple-200 sticky top-6">
              <CardContent className="pt-6 space-y-4">
                {/* Price */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  {community.joinCost > 0 ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-4xl font-bold text-purple-900">
                        <DollarSign className="w-8 h-8" />
                        {community.joinCost}
                      </div>
                      <p className="text-sm text-purple-600 mt-1">credits to join</p>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-green-600">FREE</div>
                  )}
                </div>

                {/* Settings Info */}
                {community.settings?.autoApprove ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>Instant access</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Requires mentor approval</span>
                  </div>
                )}

                {community.settings?.isPrivate && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                    <Lock className="w-4 h-4" />
                    <span>Private community</span>
                  </div>
                )}

                {/* Max Members */}
                {community.maxMembers && (
                  <p className="text-sm text-gray-600 text-center">
                    {community.statistics?.totalMembers || 0} / {community.maxMembers} members
                  </p>
                )}

                {/* Join Button */}
                {user?.role === "student" ? (
                  <Button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                  >
                    {joining ? "Joining..." : "Join Community"}
                  </Button>
                ) : user?.role === "mentor" ? (
                  <Button disabled className="w-full" variant="outline">
                    Only students can join
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                  >
                    Sign in to Join
                  </Button>
                )}

                {/* Credit Info */}
                {user?.role === "student" && community.joinCost > 0 && (
                  <p className="text-xs text-center text-gray-500">
                    You have {user.credits || 0} credits
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}