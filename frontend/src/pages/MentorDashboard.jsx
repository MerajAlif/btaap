// src/pages/MentorDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  getMyCommunities, 
  getPendingRequests, 
  processJoinRequest,
  getCommunityMembers 
} from "@/lib/communityApi";
// import useAuth from "@/hooks/useAuth";
import { 
  Users, 
  Plus, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function MentorDashboard() {
//   const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [view, setView] = useState("overview"); // overview, requests, members

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      if (view === "requests") loadPendingRequests();
      if (view === "members") loadMembers();
    }
  }, [selectedCommunity, view]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await getMyCommunities();
      setCommunities(data.communities || []);
      if (data.communities?.length > 0) {
        setSelectedCommunity(data.communities[0]);
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!selectedCommunity) return;
    try {
      const data = await getPendingRequests(selectedCommunity._id);
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  const loadMembers = async () => {
    if (!selectedCommunity) return;
    try {
      const data = await getCommunityMembers(selectedCommunity._id);
      setMembers(data.members || []);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const handleProcessRequest = async (requestId, action) => {
    setProcessing(requestId);
    try {
      let rejectionReason = "";
      if (action === "reject") {
        rejectionReason = window.prompt("Rejection reason (optional):") || "Not a fit";
      }

      await processJoinRequest(selectedCommunity._id, requestId, action, rejectionReason);
      
      // Refresh data
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      loadCommunities(); // Refresh stats
    } catch (error) {
      alert(error.message || `Failed to ${action} request`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="border-purple-200">
          <CardContent className="py-16 text-center space-y-4">
            <Users className="w-16 h-16 text-purple-300 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-purple-900 mb-2">
                No communities yet
              </h3>
              <p className="text-purple-700 mb-4">
                Create your first community to start mentoring students
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/communities/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMembers = communities.reduce((sum, c) => sum + (c.statistics?.totalMembers || 0), 0);
  const totalRevenue = communities.reduce((sum, c) => sum + (c.statistics?.totalRevenue || 0), 0);
  const totalPending = communities.reduce((sum, c) => sum + (c.statistics?.pendingRequests || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-purple-900">Mentor Dashboard</h1>
            <p className="text-purple-700 mt-1">Manage your communities and members</p>
          </div>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/communities/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-purple-900">{totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">{totalRevenue} credits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-900">{totalPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communities List & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Communities List */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Your Communities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {communities.map((community) => (
                <button
                  key={community._id}
                  onClick={() => {
                    setSelectedCommunity(community);
                    setView("overview");
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedCommunity?._id === community._id
                      ? "bg-purple-100 border-2 border-purple-300"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {community.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {community.statistics?.totalMembers || 0} members
                  </p>
                  {community.statistics?.pendingRequests > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {community.statistics.pendingRequests} pending
                    </Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Details Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCommunity && (
              <>
                {/* Tab Navigation */}
                <Card className="border-purple-200">
                  <CardContent className="py-3">
                    <div className="flex gap-2">
                      <Button
                        variant={view === "overview" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setView("overview")}
                        className={view === "overview" ? "bg-purple-600" : ""}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Overview
                      </Button>
                      <Button
                        variant={view === "requests" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setView("requests")}
                        className={view === "requests" ? "bg-purple-600" : ""}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Requests ({selectedCommunity.statistics?.pendingRequests || 0})
                      </Button>
                      <Button
                        variant={view === "members" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setView("members")}
                        className={view === "members" ? "bg-purple-600" : ""}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Members ({selectedCommunity.statistics?.totalMembers || 0})
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Overview */}
                {view === "overview" && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>{selectedCommunity.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">{selectedCommunity.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-600">Members</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {selectedCommunity.statistics?.totalMembers || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-900">
                            {selectedCommunity.statistics?.totalRevenue || 0}
                          </p>
                        </div>
                      </div>

                      <Button asChild className="w-full">
                        <Link to={`/communities/${selectedCommunity._id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Public Page
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Pending Requests */}
                {view === "requests" && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>Pending Join Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pendingRequests.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No pending requests</p>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <div
                              key={request._id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-semibold">{request.student?.name}</p>
                                <p className="text-sm text-gray-600">{request.student?.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Requested {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(request._id, "approve")}
                                  disabled={processing === request._id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProcessRequest(request._id, "reject")}
                                  disabled={processing === request._id}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Members List */}
                {view === "members" && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>Community Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {members.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No members yet</p>
                      ) : (
                        <div className="space-y-3">
                          {members.map((membership) => (
                            <div
                              key={membership._id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-semibold">{membership.student?.name}</p>
                                <p className="text-sm text-gray-600">
                                  Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                  <span>{membership.statistics?.postsCreated || 0} posts</span>
                                  <span>{membership.statistics?.commentsCreated || 0} comments</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}