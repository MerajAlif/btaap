import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users, Calendar, MessageSquare, FileText, Megaphone,
  Clock, Video, Download, Send, Pin, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCommunity, joinCommunity, getMyMemberships } from "@/lib/communityApi";
import { BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import io from "socket.io-client";
import TasksTab from "@/components/community/TasksTab";
import LeaderboardTab from "@/components/community/LeaderboardTab";
import LiveClassTab from "@/components/community/LiveClassTab";

export default function CommunityDetail() {
  const { id } = useParams();
  const { user, refreshMe } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState("none");

  // Data states
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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

      // Socket connection
      socketRef.current = io(BASE_URL);
      setSocket(socketRef.current);

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!community) return <div className="p-8 text-center">Community not found</div>;

  const isMentor = user?.id === (community.mentor?._id || community.mentor);
  const canAccess = membershipStatus === 'approved' || isMentor;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
              <p className="text-gray-600 mt-2">{community.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {community.members?.length || 0} Members
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {community.category}
                </Badge>
              </div>
            </div>

            {!canAccess && (
              <Button
                onClick={handleJoin}
                disabled={joining || membershipStatus === 'pending'}
                size="lg"
              >
                {membershipStatus === 'pending' ? 'Request Pending' : 'Join Community'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-6 bg-green-50 text-green-900 border-green-200"><AlertDescription>{success}</AlertDescription></Alert>}

        {canAccess ? (
          <Tabs defaultValue="announcements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 lg:w-auto">
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="liveclass">Live Class</TabsTrigger>
            </TabsList>

            {/* ANNOUNCEMENTS TAB */}
            <TabsContent value="announcements" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Announcements</h2>
                {isMentor && (
                  <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                    <DialogTrigger asChild>
                      <Button><Megaphone className="w-4 h-4 mr-2" /> Post Announcement</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                      <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={announcementForm.title}
                            onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={announcementForm.content}
                            onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label>Priority</Label>
                            <Select
                              value={announcementForm.priority}
                              onValueChange={v => setAnnouncementForm({ ...announcementForm, priority: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={announcementForm.isPinned}
                              onChange={e => setAnnouncementForm({ ...announcementForm, isPinned: e.target.checked })}
                              id="pin"
                            />
                            <Label htmlFor="pin">Pin to top</Label>
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Post</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-4">
                {announcements.map(announcement => (
                  <Card key={announcement._id} className={announcement.isPinned ? "border-blue-200 bg-blue-50/30" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {announcement.isPinned && <Pin className="w-4 h-4 text-blue-500" />}
                            {announcement.title}
                          </CardTitle>
                          <CardDescription>
                            Posted by {announcement.createdBy.name} • {new Date(announcement.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          announcement.priority === 'high' ? 'destructive' :
                            announcement.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {announcement.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
                {announcements.length === 0 && <p className="text-center text-gray-500 py-8">No announcements yet</p>}
              </div>
            </TabsContent>

            {/* SCHEDULE TAB */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Class Schedule</h2>
                {isMentor && (
                  <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                    <DialogTrigger asChild>
                      <Button><Calendar className="w-4 h-4 mr-2" /> Schedule Class</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Schedule New Class</DialogTitle></DialogHeader>
                      <form onSubmit={handleCreateSchedule} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Class Number</Label>
                            <Input
                              type="number"
                              value={scheduleForm.classNumber}
                              onChange={e => setScheduleForm({ ...scheduleForm, classNumber: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Duration (mins)</Label>
                            <Input
                              type="number"
                              value={scheduleForm.duration}
                              onChange={e => setScheduleForm({ ...scheduleForm, duration: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={scheduleForm.title}
                            onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={scheduleForm.scheduledDate}
                            onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Meeting Link</Label>
                          <Input
                            value={scheduleForm.meetingLink}
                            onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                            placeholder="https://zoom.us/..."
                          />
                        </div>
                        <Button type="submit" className="w-full">Schedule</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid gap-4">
                {schedules.map(schedule => (
                  <Card key={schedule._id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-lg text-purple-600 text-center min-w-[80px]">
                          <div className="text-xs font-bold uppercase">{new Date(schedule.scheduledDate).toLocaleString('default', { month: 'short' })}</div>
                          <div className="text-2xl font-bold">{new Date(schedule.scheduledDate).getDate()}</div>
                          <div className="text-xs">{new Date(schedule.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Class {schedule.classNumber}: {schedule.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" /> {schedule.duration} minutes
                            {schedule.meetingLink && <span className="text-blue-600">• Online Class</span>}
                          </p>
                        </div>
                      </div>
                      {schedule.meetingLink && (
                        <Button asChild variant="outline">
                          <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="w-4 h-4 mr-2" /> Join Class
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {schedules.length === 0 && <p className="text-center text-gray-500 py-8">No classes scheduled</p>}
              </div>
            </TabsContent>

            {/* RESOURCES TAB */}
            <TabsContent value="resources" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Resources</h2>
                {isMentor && (
                  <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
                    <DialogTrigger asChild>
                      <Button><FileText className="w-4 h-4 mr-2" /> Upload Resource</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
                      <form onSubmit={handleUploadResource} className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={resourceForm.title}
                            onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={resourceForm.description}
                            onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>File</Label>
                          <Input
                            type="file"
                            onChange={e => setResourceForm({ ...resourceForm, file: e.target.files[0] })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">Upload</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {resources.map(resource => (
                  <Card key={resource._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{resource.title || resource.fileName}</h3>
                            <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(resource.createdAt).toLocaleDateString()} • {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`${BASE_URL}${resource.fileUrl}`} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {resources.length === 0 && <p className="text-center text-gray-500 py-8 col-span-2">No resources uploaded</p>}
              </div>
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="h-[600px] flex flex-col bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Community Chat
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === user.id || msg.sender?._id === user.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.sender?.avatar || msg.sender?.profile?.avatar} />
                          <AvatarFallback>{msg.sender?.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`p-3 rounded-lg ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}>
                            {!isMe && <p className="text-xs font-bold mb-1 opacity-75">{msg.sender?.name}</p>}
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* MEMBERS TAB */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" /> Community Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Mentor */}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <Avatar>
                        <AvatarImage src={community.mentor?.profile?.avatar} />
                        <AvatarFallback>{community.mentor?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-semibold truncate">{community.mentor?.name}</p>
                        <Badge variant="secondary" className="text-xs bg-purple-200 text-purple-800">Mentor</Badge>
                        <Link to={`/profile/${community.mentor?._id}`} className="text-xs text-blue-600 hover:underline block mt-1">
                          View Profile
                        </Link>
                      </div>
                    </div>
                    {/* Other Members */}
                    {members.map(member => (
                      <div key={member._id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                        <Avatar>
                          <AvatarImage src={member.profile?.avatar} />
                          <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="font-semibold truncate">{member.name}</p>
                          <Badge variant="outline" className="text-xs">Student</Badge>
                          <Link to={`/profile/${member._id}`} className="text-xs text-blue-600 hover:underline block mt-1">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="col-span-full text-center text-sm text-gray-500 py-4">
                        No other members yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TASKS TAB */}
            <TabsContent value="tasks" className="space-y-4">
              <TasksTab communityId={id} isMentor={isMentor} user={user} />
            </TabsContent>

            {/* LEADERBOARD TAB */}
            <TabsContent value="leaderboard" className="space-y-4">
              <LeaderboardTab communityId={id} />
            </TabsContent>

            {/* LIVE CLASS TAB */}
            <TabsContent value="liveclass" className="space-y-4">
              <LiveClassTab />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Join to Access Content</h2>
            <p className="text-gray-600 mb-6">Join this community to access announcements, classes, resources, and chat.</p>
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? "Joining..." : "Join Community"}
            </Button>
          </div>
        )
        }
      </div >
    </div >
  );
}