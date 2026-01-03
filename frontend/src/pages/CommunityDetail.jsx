import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users, Calendar, MessageSquare, FileText, Megaphone,
  Clock, Video, Download, Send, Pin, Plus, CreditCard, BookOpen, ShieldCheck,
  ChevronLeft, Menu, Settings, LogOut, LayoutDashboard, Trophy, CheckCircle,
  MoreVertical, PanelLeftClose, PanelLeftOpen, Sparkles, Info, Tag, Globe, Lock,
  Zap, Star, UserCheck, AlertCircle, ExternalLink, Wallet, GraduationCap, Eye, EyeOff,
  Smartphone, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCommunity, joinCommunity, getMyMemberships } from "@/lib/communityApi";
import { BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import io from "socket.io-client";
import TasksTab from "@/components/community/TasksTab";
import LeaderboardTab from "@/components/community/LeaderboardTab";
import LiveClassTab from "@/components/community/LiveClassTab";
import { ComplaintForm } from "@/components/ComplaintForm";

import ErrorBoundary from "@/components/ErrorBoundary";

function CommunityDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshMe, logout } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState("none");
  const [membershipDetails, setMembershipDetails] = useState(null);

  const isCreator = user?.id === (community?.mentor?._id || community?.mentor);
  const isModerator = community?.moderators?.includes(user?.id);
  const canManage = isCreator || isModerator;

  // Navigation State
  const [activeTab, setActiveTab] = useState("announcements");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [requests, setRequests] = useState([]);

  // UI states
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isResourceOpen, setIsResourceOpen] = useState(false);

  // Forms
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", content: "", priority: "medium", isPinned: false
  });
  const [scheduleForm, setScheduleForm] = useState({
    classNumber: "", title: "", description: "", scheduledDate: "", duration: 60, meetingLink: ""
  });
  const [resourceForm, setResourceForm] = useState({
    title: "", description: "", file: null
  });

  // Manual Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const socketRef = useRef();
  const chatEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadCommunity();
  }, [id]);

  useEffect(() => {
    if (community && (membershipStatus === 'approved' || user?.id === (community.mentor?._id || community.mentor))) {
      loadAnnouncements();
      loadSchedules();
      loadResources();
      loadMessages();
      loadMembers();
      if (canManage) {
        loadRequests();
      }

      // Socket connection
      socketRef.current = io(BASE_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'] // force fallback
      });
      setSocket(socketRef.current);

      socketRef.current.on("connect_error", (err) => {
        console.warn("Socket connection warning:", err.message);
      });

      socketRef.current.emit("join_community", id);

      socketRef.current.on("receive_message", (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [community, membershipStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadCommunity = async () => {
    try {
      const data = await getCommunity(id);
      setCommunity(data.community);
      if (data.membershipStatus) {
        setMembershipStatus(data.membershipStatus);
      }
      if (data.membershipDetails) {
        setMembershipDetails(data.membershipDetails);
      }
    } catch (err) {
      setError("Failed to load community");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/community-messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements);
    } catch (error) {
      console.error("Failed to load announcements:", error);
    }
  };

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  const loadSchedules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSchedules(data.schedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  const loadResources = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setResources(data.resources);
    } catch (error) {
      console.error("Failed to load resources:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMembers(data.members);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const handleJoin = async () => {
    // Check if manual payment is required
    if (community.creatorRole === 'mentor' && community.mentorSettings?.monthlyFee > 0) {
      setShowPaymentModal(true);
      return;
    }

    setJoining(true);
    try {
      const data = await joinCommunity(id);
      setSuccess(data.message);
      loadCommunity();
      await refreshMe();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleManualJoin = async () => {
    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    setJoining(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setShowPaymentModal(false);
        loadCommunity();
        await refreshMe();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to submit join request");
    } finally {
      setJoining(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      communityId: id,
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.profile?.avatar
      },
      content: newMessage,
      timestamp: new Date()
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...announcementForm, communityId: id })
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements([data.announcement, ...announcements]);
        setIsAnnouncementOpen(false);
        setAnnouncementForm({ title: "", content: "", priority: "medium", isPinned: false });
        setSuccess("Announcement posted!");
      }
    } catch (error) {
      setError("Failed to post announcement");
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...scheduleForm, communityId: id })
      });
      const data = await res.json();
      if (data.success) {
        setSchedules([...schedules, data.classSchedule].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
        setIsScheduleOpen(false);
        setScheduleForm({ classNumber: "", title: "", description: "", scheduledDate: "", duration: 60, meetingLink: "" });
        setSuccess("Class scheduled!");
      }
    } catch (error) {
      setError("Failed to schedule class");
    }
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.file) return;

    const formData = new FormData();
    formData.append("file", resourceForm.file);
    formData.append("title", resourceForm.title);
    formData.append("description", resourceForm.description);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/resources/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setResources([data.resource, ...resources]);
        setIsResourceOpen(false);
        setResourceForm({ title: "", description: "", file: null });
        setSuccess("Resource uploaded!");
      }
    } catch (error) {
      setError("Failed to upload resource");
    }
  };

  const handleMakeModerator = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/moderators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      if (data.success) {
        setCommunity(prev => ({ ...prev, moderators: data.moderators }));
        setSuccess("Moderator added successfully");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to add moderator");
    }
  };

  const handleRemoveModerator = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/moderators/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCommunity(prev => ({
          ...prev,
          moderators: prev.moderators.filter(m => m !== studentId)
        }));
        setSuccess("Moderator removed successfully");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to remove moderator");
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/members/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m._id !== studentId));
        setSuccess("Member removed successfully");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to remove member");
    }
  };

  const handleApproveRequest = async (requestId, studentName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "approve" })
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.filter(r => r._id !== requestId));
        setSuccess(`Approved ${studentName}'s request`);
        loadMembers(); // Refresh members list
      }
    } catch (err) {
      setError("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/communities/${id}/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "reject" })
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.filter(r => r._id !== requestId));
        setSuccess("Request rejected");
      }
    } catch (err) {
      setError("Failed to reject request");
    }
  };


  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!community) return <div className="p-8 text-center">Community not found</div>;

  const canAccess = membershipStatus === 'approved' || isCreator || isModerator;

  // Calculate validity
  const validityDate = membershipDetails?.joinedAt
    ? new Date(new Date(membershipDetails.joinedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const daysRemaining = validityDate
    ? Math.max(0, Math.ceil((validityDate - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;


  // Sidebar Navigation Items
  const navItems = [
    { id: "info", label: "Community Info", icon: Info },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    ...(community.features?.classes ? [{ id: "schedule", label: "Schedule", icon: Calendar }] : []),
    ...(community.features?.resources ? [{ id: "resources", label: "Resources", icon: FileText }] : []),
    ...(community.features?.chat ? [{ id: "chat", label: "Chat", icon: MessageSquare }] : []),
    { id: "members", label: "Members", icon: Users },
    ...(community.features?.classes ? [{ id: "tasks", label: "Tasks", icon: CheckCircle }] : []),
    ...(community.features?.classes ? [{ id: "leaderboard", label: "Leaderboard", icon: Trophy }] : []),
    ...(community.features?.classes ? [{ id: "liveclass", label: "Live Class", icon: Video }] : []),
    ...(community.mentorSettings?.curriculumDescription ? [{ id: "plan", label: "Class Plan", icon: BookOpen }] : []),
    ...(canManage && requests.length > 0 ? [{ id: "requests", label: `Requests (${requests.length})`, icon: ShieldCheck, badge: requests.length }] : []),
  ];

  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      {/* Header */}
      <div className={`p-4 border-b flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <Link to="/communities" className="flex items-center gap-2 font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
              <ChevronLeft className="w-5 h-5" /> Back
            </Link>
          </div>
        ) : (
          <Link to="/communities" title="Back to Communities">
            <ChevronLeft className="w-5 h-5 text-gray-700 hover:text-emerald-600" />
          </Link>
        )}

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? "Expand" : "Collapse"} className="hidden md:flex">
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <SheetClose asChild className="md:hidden">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
          </SheetClose>
        )}
      </div>

      {/* Community Info Mini */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-b bg-gray-50/50">
          <h2 className="font-bold text-lg truncate" title={community.name}>{community.name}</h2>
          <p className="text-xs text-gray-500 truncate mt-1">
            {community.creatorRole === 'mentor' ? 'By ' + community.mentor?.name : 'Student Community'}
          </p>
        </div>
      )}

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-orange-500 text-white h-5 px-1.5 min-w-[1.25rem]">{item.badge}</Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {!isSidebarCollapsed && <div className="my-4 px-4"><div className="h-px bg-gray-200" /></div>}

        {/* Services Links */}
      </div>

      {/* User Menu (Bottom) */}
      <div className="p-4 border-t bg-gray-50/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200 outline-none ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <Avatar className="w-8 h-8 rounded-lg border border-gray-200">
                <AvatarImage src={user.profile?.avatar} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              )}
              {!isSidebarCollapsed && <MoreVertical className="w-4 h-4 text-gray-400" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 mb-2">
            <div className="p-2">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <p className="text-xs text-emerald-600 mt-0.5 capitalize">{user.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <Users className="w-4 h-4 mr-2" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/credits" className="cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2" /> Credits ({user.credits || 0})
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {user.role === 'student' && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/my-communities" className="cursor-pointer">
                    <Sparkles className="w-4 h-4 mr-2" /> My Communities
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/apply-mentor" className="cursor-pointer text-amber-600 focus:text-amber-700">
                    <Trophy className="w-4 h-4 mr-2" /> Become a Mentor
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {user.role === 'mentor' && user.approvalStatus === 'approved' && (
              <DropdownMenuItem asChild>
                <Link to="/mentor/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Mentor Dashboard
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/my-posts" className="cursor-pointer">
                <MessageSquare className="w-4 h-4 mr-2" /> My Posts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/downloads" className="cursor-pointer">
                <Download className="w-4 h-4 mr-2" /> Downloads
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Header & Drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/communities"><ChevronLeft className="w-6 h-6 text-gray-600" /></Link>
          <span className="font-bold truncate max-w-[200px]">{community.name}</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="w-6 h-6" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0 relative">
        {/* Main Container */}
        <div className="min-h-full">
          {/* HERO SECTION */}
          <div className="relative h-48 md:h-64 bg-gray-900 w-full group">
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img
              src={community.coverImage
                ? (community.coverImage.startsWith("http") ? community.coverImage : `${BASE_URL}${community.coverImage}`)
                : "/default-community.png"
              }
              alt="Cover"
              className="w-full h-full object-cover opacity-80"
              onError={(e) => { e.target.src = "/default-community.png"; }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-end gap-4 md:gap-6">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-lg rounded-2xl bg-white">
                  <AvatarImage
                    src={community.mentor?.profile?.avatar || "/default-avatar.png"}
                    onError={(e) => { e.target.src = "/default-avatar.png"; }}
                  />
                  <AvatarFallback className="text-2xl">{community.mentor?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 mb-2 text-white">
                  <h1 className="text-2xl md:text-4xl font-bold leading-tight">{community.name}</h1>
                  <p className="opacity-90 flex items-center gap-2 text-sm md:text-base">
                    {community.creatorRole === 'mentor' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    Created by {community.mentor?.name} • <span className="opacity-75">{community.category}</span>
                  </p>
                </div>
                {/* Access Status Badge */}
                {canAccess && (
                  <div className="hidden md:flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/50 text-white font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Member Access
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
            {/* Flash Messages */}
            {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="mb-6 bg-green-50 text-green-700 border-green-200"><AlertDescription>{success}</AlertDescription></Alert>}

            {/* Join Prompt */}
            {!canAccess && (
              <Card className="mb-8 border-emerald-100 bg-gradient-to-br from-white to-emerald-50">
                <CardContent className="p-8 text-center space-y-4">
                  <Users className="w-16 h-16 mx-auto text-emerald-200" />
                  <h2 className="text-2xl font-bold text-gray-900">Unlock Full Access</h2>
                  <p className="text-gray-600 max-w-lg mx-auto">
                    Join this community to access lesson plans, live classes, resources, and connect with other students.
                  </p>
                  <div className="flex justify-center gap-4 pt-2">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200/50" onClick={handleJoin} disabled={joining || membershipStatus === 'pending'}>
                      {joining ? "Processing..." : membershipStatus === 'pending' ? "Request Pending" : "Join Now"}
                    </Button>
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-sm font-bold text-gray-900">{community.mentorSettings?.monthlyFee > 0 ? `৳${community.mentorSettings.monthlyFee}/month` : 'Free Access'}</span>
                      <span className="text-xs text-gray-500">1 Month Validity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab Content Rendering */}
            {canAccess ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header for Tab */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-3">
                    {navItems.find(i => i.id === activeTab)?.icon && (
                      (() => {
                        const TabIcon = navItems.find(i => i.id === activeTab).icon;
                        return <TabIcon className="w-7 h-7 text-emerald-600" />;
                      })()
                    )}
                    {navItems.find(i => i.id === activeTab)?.label?.split('(')[0]}
                  </h2>

                  {/* Tab Actions (Create buttons based on active tab) */}
                  {activeTab === "announcements" && canManage && (
                    <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                      <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Post Announcement</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                          <div><Label>Title</Label><Input value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} required /></div>
                          <div><Label>Content</Label><Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} required /></div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1"><Label>Priority</Label><Select value={announcementForm.priority} onValueChange={v => setAnnouncementForm({ ...announcementForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
                            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={announcementForm.isPinned} onChange={e => setAnnouncementForm({ ...announcementForm, isPinned: e.target.checked })} id="pin" /><Label htmlFor="pin">Pin</Label></div>
                          </div>
                          <Button type="submit" className="w-full">Post</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {activeTab === "schedule" && isCreator && (
                    <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                      <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Calendar className="w-4 h-4 mr-2" /> Schedule Class</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Schedule Class</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Class No</Label><Input type="number" value={scheduleForm.classNumber} onChange={e => setScheduleForm({ ...scheduleForm, classNumber: e.target.value })} required /></div>
                            <div><Label>Duration (min)</Label><Input type="number" value={scheduleForm.duration} onChange={e => setScheduleForm({ ...scheduleForm, duration: e.target.value })} required /></div>
                          </div>
                          <div><Label>Title</Label><Input value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} required /></div>
                          <div><Label>Date/Time</Label><Input type="datetime-local" value={scheduleForm.scheduledDate} onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })} required /></div>
                          <div><Label>Link</Label><Input value={scheduleForm.meetingLink} onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })} placeholder="https://..." /></div>
                          <Button type="submit" className="w-full">Schedule</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {activeTab === "resources" && canManage && (
                    <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
                      <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Upload Resource</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
                        <form onSubmit={handleUploadResource} className="space-y-4">
                          <div><Label>Title</Label><Input value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required /></div>
                          <div><Label>Description</Label><Textarea value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} /></div>
                          <div><Label>File</Label><Input type="file" onChange={e => setResourceForm({ ...resourceForm, file: e.target.files[0] })} required /></div>
                          <Button type="submit" className="w-full">Upload</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* CONTENT RENDERER */}
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Hero Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-emerald-700">{community.statistics?.totalMembers || 0}</p>
                            <p className="text-xs text-emerald-600/80">Members</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-700">{resources.length || 0}</p>
                            <p className="text-xs text-blue-600/80">Resources</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Megaphone className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-700">{announcements.length || 0}</p>
                            <p className="text-xs text-purple-600/80">Announcements</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-700">
                              {new Date(community.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-amber-600/80">Created</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Main Content - Left Column */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* About Section */}
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <Info className="w-5 h-5 text-emerald-600" />
                                  About This Community
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {community.creatorRole === 'mentor' ? 'Mentor-led learning community' : 'Student community'}
                                </CardDescription>
                              </div>
                              <Badge
                                variant="secondary"
                                className={community.creatorRole === 'mentor'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                                }
                              >
                                {community.creatorRole === 'mentor' ? (
                                  <><GraduationCap className="w-3 h-3 mr-1" /> Mentor Community</>
                                ) : (
                                  <><Users className="w-3 h-3 mr-1" /> Student Community</>
                                )}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-5">
                            <p className="text-gray-600 leading-relaxed text-[15px]">
                              {community.description || "No description available for this community."}
                            </p>

                            {/* Category & Tags */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              {community.category && (
                                <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 px-3 py-1">
                                  <Tag className="w-3 h-3 mr-1.5" />
                                  {community.category}
                                </Badge>
                              )}
                              {community.tags?.length > 0 && community.tags.map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Curriculum Overview */}
                            {community.mentorSettings?.curriculumDescription && (
                              <div className="pt-4 border-t border-dashed">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-emerald-600" />
                                  Curriculum Overview
                                </h4>
                                <div className="bg-gradient-to-r from-emerald-50/50 to-transparent p-4 rounded-lg border-l-4 border-emerald-500">
                                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                    {community.mentorSettings.curriculumDescription}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Subscription/Pricing Card (Moved Here) */}
                        {community.creatorRole === 'mentor' && (
                          <Card className="border-purple-100 overflow-hidden">
                            <CardHeader className="bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5" />
                                    Subscription & Payment Details
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    Pricing and payment information for this community
                                  </CardDescription>
                                </div>
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                                  {community.mentorSettings?.monthlyFee > 0 ? 'Premium' : 'Free Access'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="grid md:grid-cols-2 gap-8">
                                {/* Left: Pricing & Features */}
                                <div className="space-y-6">
                                  <div className="text-center py-8 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-bl-full -mr-10 -mt-10"></div>
                                    <p className="text-5xl font-bold text-purple-700 relative z-10">
                                      {community.mentorSettings?.monthlyFee > 0
                                        ? `৳${community.mentorSettings.monthlyFee}`
                                        : 'Free'
                                      }
                                    </p>
                                    <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-wide relative z-10">Monthly Subscription</p>
                                  </div>

                                  <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b">
                                      <Zap className="w-4 h-4 text-purple-600" /> What's Included
                                    </h4>
                                    <div className="space-y-3">
                                      {community.mentorSettings?.classesPerMonth > 0 && (
                                        <div className="flex items-center gap-3">
                                          <div className="p-1.5 bg-purple-100 rounded-md"><Video className="w-3.5 h-3.5 text-purple-600" /></div>
                                          <span className="text-sm text-gray-700 flex-1">
                                            <strong>{community.mentorSettings.classesPerMonth}</strong> Live Classes / Month
                                          </span>
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                      )}
                                      {community.mentorSettings?.validityDuration && (
                                        <div className="flex items-center gap-3">
                                          <div className="p-1.5 bg-purple-100 rounded-md"><Clock className="w-3.5 h-3.5 text-purple-600" /></div>
                                          <span className="text-sm text-gray-700 flex-1">
                                            <strong>{community.mentorSettings.validityDuration}</strong> {community.mentorSettings.validityUnit || 'days'} Access Validity
                                          </span>
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                      )}
                                      {community.mentorSettings?.totalClasses > 0 && (
                                        <div className="flex items-center gap-3">
                                          <div className="p-1.5 bg-purple-100 rounded-md"><BookOpen className="w-3.5 h-3.5 text-purple-600" /></div>
                                          <span className="text-sm text-gray-700 flex-1">
                                            <strong>{community.mentorSettings.totalClasses}</strong> Total Sessions
                                          </span>
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Payment Methods */}
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                      <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Details
                                    </h4>
                                    {community.mentorSettings?.bkashNumber ? (
                                      <div className="p-5 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                          <Badge variant="outline" className="border-pink-200 text-pink-700 bg-pink-50">Mentor's bKash Personal</Badge>
                                          <Smartphone className="w-4 h-4 text-pink-400" />
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-100">
                                          <p className="font-mono font-bold text-pink-900 text-xl tracking-wider select-all">
                                            {community.mentorSettings.bkashNumber}
                                          </p>
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-pink-700 hover:bg-pink-50" onClick={() => { navigator.clipboard.writeText(community.mentorSettings.bkashNumber); setSuccess("Number copied!") }}>
                                            <Copy className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        <p className="text-[11px] text-pink-600 mt-3 font-medium">
                                          * Send Money (Personal) to this number
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                                        <p className="text-gray-500 text-sm">No specific payment number provided.</p>
                                      </div>
                                    )}
                                  </div>

                                  {community.mentorSettings?.paymentInstructions && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600" /> Instructions
                                      </h4>
                                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-900 leading-relaxed">
                                        {community.mentorSettings.paymentInstructions}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Community Settings Info */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Settings className="w-5 h-5 text-gray-500" />
                              Community Settings
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {community.settings?.isPrivate ? (
                                  <Lock className="w-5 h-5 text-amber-600" />
                                ) : (
                                  <Globe className="w-5 h-5 text-emerald-600" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {community.settings?.isPrivate ? 'Private' : 'Public'}
                                  </p>
                                  <p className="text-xs text-gray-500">Visibility</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {community.settings?.autoApprove ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-amber-600" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {community.settings?.autoApprove ? 'Auto-Approve' : 'Manual Approval'}
                                  </p>
                                  <p className="text-xs text-gray-500">Join Policy</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {community.maxMembers ? `${community.maxMembers} max` : 'Unlimited'}
                                  </p>
                                  <p className="text-xs text-gray-500">Member Limit</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Sidebar */}
                      <div className="space-y-6">
                        {/* Mentor/Creator Card */}
                        <Card className="overflow-hidden">
                          <div className={`h-16 ${community.creatorRole === 'mentor'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600'
                            }`} />
                          <CardContent className="pt-0 -mt-10 text-center pb-6">
                            <Avatar className="w-20 h-20 border-4 border-white shadow-lg mx-auto ring-2 ring-white/50">
                              <AvatarImage
                                src={community.mentor?.profile?.avatar || "/default-avatar.png"}
                                onError={(e) => { e.target.src = "/default-avatar.png"; }}
                              />
                              <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                                {community.mentor?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-lg mt-3 flex items-center justify-center gap-1.5">
                              {community.mentor?.name}
                              {community.creatorRole === 'mentor' && (
                                <ShieldCheck className="w-4 h-4 text-purple-500" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {community.creatorRole === 'mentor' ? 'Mentor' : 'Community Owner'}
                            </p>

                            {community.mentor?.profile?.bio && (
                              <p className="text-sm text-gray-600 mt-3 px-2 line-clamp-3">
                                {community.mentor.profile.bio}
                              </p>
                            )}

                            {community.mentor?.profile?.expertise?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                                {community.mentor.profile.expertise.slice(0, 3).map((exp, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-[10px] bg-purple-50 text-purple-700 border-purple-100"
                                  >
                                    {exp}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 w-full"
                              asChild
                            >
                              <Link to={`/mentors/${community.mentor?._id}`}>
                                <ExternalLink className="w-3 h-3 mr-2" />
                                View Profile
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Your Membership Card */}
                        {membershipDetails && (
                          <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-emerald-600" />
                                Your Membership
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Role Badge */}
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                <span className="text-sm text-gray-600">Your Role</span>
                                <Badge
                                  className={
                                    isCreator
                                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                                      : isModerator
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }
                                >
                                  {isCreator ? (
                                    <><Star className="w-3 h-3 mr-1" /> Owner</>
                                  ) : isModerator ? (
                                    <><ShieldCheck className="w-3 h-3 mr-1" /> Moderator</>
                                  ) : (
                                    <><UserCheck className="w-3 h-3 mr-1" /> Member</>
                                  )}
                                </Badge>
                              </div>

                              {/* Join Date */}
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Member Since</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(membershipDetails.joinedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              {/* Validity Progress - Only for Mentor Communities */}
                              {validityDate && !isCreator && community.creatorRole === 'mentor' && (
                                <div className="p-4 rounded-lg border bg-white space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      Membership Validity
                                    </span>
                                    <span className={`text-sm font-bold ${daysRemaining < 5 ? 'text-red-600' : daysRemaining < 10 ? 'text-amber-600' : 'text-emerald-600'
                                      }`}>
                                      {daysRemaining} days left
                                    </span>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${daysRemaining < 5
                                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                                        : daysRemaining < 10
                                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                          : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        }`}
                                      style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                                    />
                                  </div>

                                  <p className="text-xs text-gray-500 text-center">
                                    Expires on {validityDate.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>

                                  {daysRemaining < 7 && (
                                    <div className={`p-2 rounded-lg text-center text-xs font-medium ${daysRemaining < 3
                                      ? 'bg-red-50 text-red-700 border border-red-100'
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                      <AlertCircle className="w-3 h-3 inline mr-1" />
                                      {daysRemaining < 3 ? 'Renew now to avoid losing access!' : 'Renew soon to continue access'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}


                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {requests.length === 0 ? <p className="text-gray-500">No pending requests.</p> : requests.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                        <div className="flex items-center gap-4">
                          <Avatar><AvatarImage src={req.student?.profile?.avatar} /><AvatarFallback>{req.student?.name?.[0]}</AvatarFallback></Avatar>
                          <div><p className="font-semibold">{req.student?.name}</p><p className="text-sm text-gray-500">{req.student?.email}</p></div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveRequest(req._id, req.student?.name)} className="bg-green-600">Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req._id)} className="text-red-600">Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'plan' && (
                  <Card>
                    <CardHeader><CardTitle>Month's Lesson Plan</CardTitle></CardHeader>
                    <CardContent className="prose max-w-none">{community.mentorSettings?.curriculumDescription || "No plan description."}</CardContent>
                  </Card>
                )}

                {activeTab === 'announcements' && (
                  <div className="space-y-4">
                    {announcements.map(ann => (
                      <Card key={ann._id} className={ann.isPinned ? "border-blue-200 bg-blue-50/50" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-lg">{ann.isPinned && <Pin className="w-4 h-4 text-blue-500" />} {ann.title}</CardTitle>
                              <CardDescription>Posted by {ann.createdBy.name} • {new Date(ann.createdAt).toLocaleDateString()}</CardDescription>
                            </div>
                            <Badge variant={ann.priority === 'high' ? 'destructive' : ann.priority === 'medium' ? 'default' : 'secondary'}>{ann.priority}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap">{ann.content}</p></CardContent>
                      </Card>
                    ))}
                    {announcements.length === 0 && <p className="text-center text-gray-400 py-10">No announcements yet</p>}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="grid gap-4">
                    {schedules.map(sch => (
                      <Card key={sch._id}>
                        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-lg text-purple-600 text-center min-w-[80px]">
                              <div className="text-xs font-bold uppercase">{new Date(sch.scheduledDate).toLocaleString('default', { month: 'short' })}</div>
                              <div className="text-2xl font-bold">{new Date(sch.scheduledDate).getDate()}</div>
                              <div className="text-xs">{new Date(sch.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">Class {sch.classNumber}: {sch.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><Clock className="w-4 h-4" /> {sch.duration} min {sch.meetingLink && <span className="text-blue-600">• Online</span>}</p>
                            </div>
                          </div>
                          {sch.meetingLink && (
                            <Button asChild variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                              <a href={sch.meetingLink} target="_blank" rel="noopener noreferrer"><Video className="w-4 h-4 mr-2" /> Join Class</a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {schedules.length === 0 && <p className="text-center text-gray-400 py-10">No classes scheduled</p>}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {resources.map(res => (
                      <Card key={res._id}>
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FileText className="w-6 h-6" /></div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{res.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{res.description}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(res.createdAt).toLocaleDateString()} • {(res.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <Button variant="ghost" size="icon" asChild><a href={`${BASE_URL}${res.fileUrl}`} download target="_blank" rel="noopener noreferrer"><Download className="w-5 h-5 text-gray-400" /></a></Button>
                        </CardContent>
                      </Card>
                    ))}
                    {resources.length === 0 && <p className="text-center text-gray-400 py-10 col-span-2">No resources uploaded</p>}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <Card className="h-[600px] flex flex-col shadow-none border-gray-200">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((msg, idx) => {
                        const isMe = msg.sender === user.id || msg.sender?._id === user.id;
                        return (
                          <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                              <Avatar className="w-8 h-8"><AvatarImage src={msg.sender?.avatar || msg.sender?.profile?.avatar} /><AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback></Avatar>
                              <div>
                                <div className={`p-3 rounded-2xl ${isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-tl-none"}`}>
                                  {!isMe && <p className="text-xs font-bold mb-1 opacity-75">{msg.sender?.name}</p>}
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 px-1">{new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="bg-white" />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" size="icon"><Send className="w-4 h-4" /></Button>
                      </form>
                    </div>
                  </Card>
                )}

                {activeTab === 'members' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Owner/Creator Card */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${community.creatorRole === 'mentor' ? 'border-purple-100 bg-purple-50' : 'border-amber-100 bg-amber-50'}`}>
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={community.mentor?.profile?.avatar || "/default-avatar.png"}
                          onError={(e) => { e.target.src = "/default-avatar.png"; }}
                        />
                        <AvatarFallback>{community.mentor?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-gray-900 flex items-center gap-1">{community.mentor?.name} <ShieldCheck className={`w-3 h-3 ${community.creatorRole === 'mentor' ? 'text-purple-600' : 'text-amber-600'}`} /></p>
                        <Badge variant="secondary" className={`text-[10px] h-5 ${community.creatorRole === 'mentor' ? 'bg-purple-200 text-purple-800' : 'bg-amber-200 text-amber-800'}`}>
                          {community.creatorRole === 'mentor' ? 'Mentor' : 'Owner'}
                        </Badge>
                      </div>
                    </div>
                    {members.map(member => {
                      const isMemMod = community.moderators?.includes(member._id);
                      return (
                        <div key={member._id} className="p-4 rounded-xl border bg-white flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={member.profile?.avatar || "/default-avatar.png"}
                                onError={(e) => { e.target.src = "/default-avatar.png"; }}
                              />
                              <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{member.name}</p>
                              {isMemMod ? <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px]">Monitor</Badge> : <span className="text-xs text-gray-500">Student</span>}
                            </div>
                          </div>
                          {(isCreator || (canManage && !isMemMod)) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isCreator && (isMemMod ? <DropdownMenuItem onClick={() => handleRemoveModerator(member._id)}>Remove Monitor</DropdownMenuItem> : <DropdownMenuItem onClick={() => handleMakeModerator(member._id)}>Make Monitor</DropdownMenuItem>)}
                                <DropdownMenuItem onClick={() => handleRemoveMember(member._id)} className="text-red-600">Remove Member</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {activeTab === 'tasks' && <TasksTab communityId={id} isMentor={isCreator} user={user} />}
                {activeTab === 'leaderboard' && <LeaderboardTab communityId={id} />}
                {activeTab === 'liveclass' && <LiveClassTab />}

              </div>
            ) : (
              <div className="flex items-center justify-center p-20 text-gray-400">
                Select the Join option above to see {activeTab}.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment Required</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
              <p className="font-semibold text-blue-900 mb-2">Send ৳{community.mentorSettings?.monthlyFee} to:</p>
              <div className="text-xl font-mono font-bold text-center bg-white p-2 rounded border border-blue-200 select-all">{community.mentorSettings?.bkashNumber}</div>
              <p className="text-center mt-2 text-blue-700">Bkash Personal / Payment</p>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID (TrxID)</Label>
              <Input placeholder="e.g. 9H7..." value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
            <Button onClick={handleManualJoin} disabled={joining} className="w-full bg-emerald-600 hover:bg-emerald-700">{joining ? "Verifying..." : "Submit Payment"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CommunityDetail() {
  return (
    <ErrorBoundary>
      <CommunityDetailContent />
    </ErrorBoundary>
  );
}