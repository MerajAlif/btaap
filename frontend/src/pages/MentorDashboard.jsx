// src/pages/MentorDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RejectionReasonDialog from "@/components/RejectionReasonDialog";
import {
  getMyCommunities,
  getPendingRequests,
  processJoinRequest,
  getCommunityMembers
} from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import {
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  CreditCard,
  Briefcase,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function MentorDashboard() {
  const { user } = useAuth(); // Uncommented useAuth
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [view, setView] = useState("overview"); // overview, requests, members
  const [rejectionDialog, setRejectionDialog] = useState({
    isOpen: false,
    requestId: null,
    studentName: ""
  });

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
    // ... existing code
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

  const handleProcessRequest = async (requestId, action, studentName = "") => {
    if (action === "reject") {
      // Open rejection dialog instead of using prompt
      setRejectionDialog({
        isOpen: true,
        requestId,
        studentName
      });
      return;
    }

    // Handle approve action
    setProcessing(requestId);
    try {
      await processJoinRequest(selectedCommunity._id, requestId, action, "");
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      loadCommunities(); // Refresh stats
    } catch (error) {
      alert(error.message || `Failed to ${action} request`);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmRejection = async (reason) => {
    const { requestId } = rejectionDialog;
    setProcessing(requestId);

    try {
      await processJoinRequest(selectedCommunity._id, requestId, "reject", reason);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      loadCommunities(); // Refresh stats
      setRejectionDialog({ isOpen: false, requestId: null, studentName: "" });
    } catch (error) {
      alert(error.message || "Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      alert("Transaction ID copied!");
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  // Subscription Logic
  const subscription = user?.mentorSubscription || {};
  const isSubActive = subscription.isActive;
  const daysRemaining = subscription.expiry ? Math.ceil((new Date(subscription.expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  if (communities.length === 0) {
    // ... keep existing empty state logic but maybe show subscription warning if inactive?
    // For now keeping simpler - user can create community from empty state which will trigger checks.
  }

  // CALCULATE STATS
  const totalMembers = communities.reduce((sum, c) => sum + (c.statistics?.totalMembers || 0), 0);
  const totalRevenue = communities.reduce((sum, c) => sum + (c.statistics?.totalRevenue || 0), 0);
  const totalPending = communities.reduce((sum, c) => sum + (c.statistics?.pendingRequests || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 selection:bg-emerald-100 pb-20">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-blue-50/20 to-white" />

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1 mb-3">
              Mentor Dashboard
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Overview & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Analytics</span>
            </h1>
          </div>
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all h-12 px-6">
            <Link to="/communities/create">
              <Plus className="w-5 h-5 mr-2" />
              Create New Community
            </Link>
          </Button>
        </div>

        {/* SUBSCRIPTION BANNER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isSubActive ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"}`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Subscription Plan: <span className="text-purple-600">{subscription.planName || "No Active Plan"}</span>
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  Status:
                  <Badge variant={isSubActive ? "default" : "destructive"} className={`rounded-full px-2 py-0.5 text-xs ${isSubActive ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}`}>
                    {isSubActive ? "Active" : "Expired / Inactive"}
                  </Badge>
                  {isSubActive && (
                    <span className="text-gray-400">• Expires in {daysRemaining} days</span>
                  )}
                </p>
              </div>
            </div>

            {/* Balance Stats */}
            <div className="flex gap-8 border-l border-gray-100 pl-8">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Communities</p>
                <p className="text-2xl font-bold text-gray-900">{subscription.balance?.communities || 0}</p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Live Classes</p>
                <p className="text-2xl font-bold text-gray-900">{subscription.balance?.liveClasses || 0}</p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Link to="/pricing">Manage Subscription</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700 delay-100">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-[100px] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <p className="font-semibold text-purple-900">Total Members</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-gray-900">{totalMembers}</h2>
                <span className="text-sm text-gray-500">students</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-bl-[100px] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                  <DollarSign className="w-6 h-6" />
                </div>
                <p className="font-semibold text-emerald-900">Total Revenue</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-emerald-600">{totalRevenue}</h2>
                <span className="text-sm text-emerald-600/80 font-medium">credits earned</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-[100px] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shadow-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="font-semibold text-amber-900">Pending Requests</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-gray-900">{totalPending}</h2>
                <span className="text-sm text-gray-500">awaiting</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">

          {/* Sidebar: Communities List */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-0 shadow-md bg-white overflow-hidden sticky top-24">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  Your Communities
                </CardTitle>
              </CardHeader>
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-2 space-y-1">
                {communities.map((community) => (
                  <button
                    key={community._id}
                    onClick={() => {
                      setSelectedCommunity(community);
                      setView("overview");
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${selectedCommunity?._id === community._id
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200"
                      : "hover:bg-gray-50 text-gray-600"
                      }`}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h4 className={`font-bold text-sm mb-1 ${selectedCommunity?._id === community._id ? "text-white" : "text-gray-900"}`}>
                          {community.name}
                        </h4>
                        <p className={`text-xs ${selectedCommunity?._id === community._id ? "text-emerald-100" : "text-gray-500"}`}>
                          {community.statistics?.totalMembers || 0} members
                        </p>
                      </div>
                      {community.statistics?.pendingRequests > 0 && (
                        <Badge className={`${selectedCommunity?._id === community._id ? "bg-white text-emerald-600" : "bg-amber-100 text-amber-700"} border-0`}>
                          {community.statistics.pendingRequests}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Panel: Details */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCommunity ? (
              <Card className="border-0 shadow-xl bg-white overflow-hidden min-h-[500px]">
                {/* Community Header Strip */}
                <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800 relative p-6 flex flex-col justify-end">
                  <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <h2 className="text-2xl font-bold text-white relative z-10">{selectedCommunity.name}</h2>
                  <p className="text-gray-300 text-sm line-clamp-1 relative z-10">{selectedCommunity.description}</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 px-6 pt-4 flex gap-6 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'requests', label: 'Requests', icon: Clock, count: selectedCommunity.statistics?.pendingRequests },
                    { id: 'members', label: 'Members', icon: Users, count: selectedCommunity.statistics?.totalMembers },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setView(tab.id)}
                      className={`pb-4 text-sm font-medium flex items-center gap-2 transition-all relative ${view === tab.id ? "text-emerald-600" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${view === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {tab.count}
                        </span>
                      )}
                      {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Overview View */}
                  {view === "overview" && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 text-center">
                          <p className="text-sm text-purple-600 font-medium mb-2">Active Members</p>
                          <p className="text-3xl font-bold text-purple-900">{selectedCommunity.statistics?.totalMembers || 0}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 text-center">
                          <p className="text-sm text-emerald-600 font-medium mb-2">Total Revenue</p>
                          <p className="text-3xl font-bold text-emerald-700">{selectedCommunity.statistics?.totalRevenue || 0}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button asChild variant="outline" className="w-full justify-start h-12">
                            <Link to={`/communities/${selectedCommunity._id}`}>
                              <Eye className="w-4 h-4 mr-2 text-gray-500" />
                              View Public Page
                            </Link>
                          </Button>
                          <Button variant="outline" className="w-full justify-start h-12" disabled>
                            <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                            Create Coupon (Coming Soon)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Requests View */}
                  {view === "requests" && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
                      {pendingRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500">No pending requests at the moment</p>
                        </div>
                      ) : (
                        pendingRequests.map((request) => (
                          <div key={request._id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-emerald-100 hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{request.student?.name}</h4>
                                  {request.paymentStatus !== 'free' && (
                                    <Badge variant={request.paymentStatus === 'verified' ? 'default' : 'outline'} className={request.paymentStatus === 'verified' ? 'bg-emerald-600' : 'text-gray-500'}>
                                      {request.paymentStatus}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{request.student?.email}</p>

                                {request.transactionId && (
                                  <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg text-xs font-mono text-gray-700">
                                    <CreditCard className="w-3 h-3" />
                                    {request.transactionId}
                                    <button onClick={() => copyToClipboard(request.transactionId)} className="hover:text-emerald-600">
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(request._id, "approve")}
                                  disabled={processing === request._id}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  {processing === request._id ? "..." : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProcessRequest(request._id, "reject", request.student?.name)}
                                  disabled={processing === request._id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Members View */}
                  {view === "members" && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      {members.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">No members yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {members.map((member) => (
                            <div key={member._id} className="py-4 flex items-center justify-between group hover:bg-gray-50/50 px-2 -mx-2 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold">
                                  {(member.student?.name || member.name)?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{member.student?.name || member.name}</p>
                                  <p className="text-xs text-gray-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link to={`/profile/${member.student?._id || member._id}`}>
                                  View Profile <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Select a Community</h3>
                <p className="text-gray-500">Choose a community from the sidebar to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rejection Reason Dialog */}
      <RejectionReasonDialog
        isOpen={rejectionDialog.isOpen}
        onClose={() => setRejectionDialog({ isOpen: false, requestId: null, studentName: "" })}
        onConfirm={handleConfirmRejection}
        studentName={rejectionDialog.studentName}
        isProcessing={processing === rejectionDialog.requestId}
      />
    </div>
  );
}
