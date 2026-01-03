import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import {
    MessageSquare,
    Send,
    Users,
    UserPlus,
    Check,
    X,
    Search,
    AlertCircle,
    Crown,
    GraduationCap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Chat() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Connections state
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userSearchQuery, setUserSearchQuery] = useState("");

    // Chat state
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Load connections and requests on mount
    useEffect(() => {
        loadConnections();
        loadRequests();
        loadAllUsers();
    }, []);

    // Initialize socket connection
    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling']
            });

            newSocket.on("connect", () => {
                newSocket.emit("user_online", user._id);
            });

            newSocket.on("receive_direct_message", (message) => {
                setMessages((prev) => [...prev, message]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.emit("user_offline", user._id);
                newSocket.disconnect();
            };
        }
    }, [user]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadConnections = async () => {
        try {
            const data = await api("/api/connections");
            setConnections(data);
        } catch (error) {
            console.error("Failed to load connections:", error);
        }
    };

    const loadRequests = async () => {
        try {
            const data = await api("/api/connections/requests");
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests:", error);
        }
    };

    const loadAllUsers = async () => {
        setLoading(true);
        try {
            // Fetch ALL mentors and students
            const [mentorsRes, studentsRes] = await Promise.all([
                api("/api/profiles/mentors"),
                api("/api/profiles/students")
            ]);

            const mentors = mentorsRes.mentors || [];
            const students = studentsRes.students || [];

            // Filter out current user and existing connections
            const connectionIds = connections.map(c => c._id);
            const allUsersList = [...mentors, ...students].filter(
                u => u._id !== user._id && !connectionIds.includes(u._id)
            );

            setAllUsers(allUsersList);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendConnectionRequest = async (userId) => {
        try {
            await api(`/api/connections/send/${userId}`, { method: "POST" });
            setAllUsers(prev => prev.filter(u => u._id !== userId));
            alert("Connection request sent!");
        } catch (error) {
            console.error("Failed to send connection request:", error);
            alert(error.message || "Failed to send request");
        }
    };

    const handleAcceptRequest = async (userId) => {
        try {
            await api(`/api/connections/accept/${userId}`, { method: "POST" });
            loadConnections();
            loadRequests();
            loadAllUsers();
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleRejectRequest = async (userId) => {
        try {
            await api(`/api/connections/reject/${userId}`, { method: "POST" });
            loadRequests();
        } catch (error) {
            console.error("Failed to reject request:", error);
        }
    };

    const handleSelectConnection = async (connection) => {
        setSelectedConnection(connection);
        setMessagesLoading(true);

        try {
            const convData = await api(`/api/messages/conversation/${connection._id}`);

            if (convData.success && convData.conversation) {
                setSelectedConversation(convData.conversation);
                const msgData = await api(`/api/messages/${convData.conversation._id}`);

                if (msgData.success) {
                    setMessages(msgData.messages || []);
                }
            }
        } catch (error) {
            console.error("Error loading conversation:", error);
            if (error.message?.includes("403") || error.message?.includes("not connected")) {
                setMessages([]);
                alert("You are no longer connected with this user");
            }
        } finally {
            setMessagesLoading(false);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !selectedConnection) return;

        const messageData = {
            to: selectedConnection._id,
            from: user._id,
            conversationId: selectedConversation?._id,
            sender: {
                name: user.name,
                avatar: user.profile?.avatar,
                id: user._id
            },
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        socket.emit("send_direct_message", messageData);
        setMessages((prev) => [...prev, messageData]);
        setNewMessage("");
    };

    const filteredConnections = connections.filter((conn) =>
        conn.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers.filter((u) =>
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const mentorConnections = filteredConnections.filter((c) => c.role === "mentor");
    const studentConnections = filteredConnections.filter((c) => c.role === "student");
    const mentorUsers = filteredUsers.filter(u => u.role === "mentor");
    const studentUsers = filteredUsers.filter(u => u.role === "student");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* SIDEBAR */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                    </div>
                    <p className="text-sm text-gray-600">Chat with your connections</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="connections" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 px-4 pt-4">
                        <TabsTrigger value="connections" className="text-xs">
                            <Users className="w-4 h-4 mr-1" />
                            Connections
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="text-xs">
                            <UserPlus className="w-4 h-4 mr-1" />
                            Requests
                        </TabsTrigger>
                        <TabsTrigger value="find" className="text-xs">
                            <Search className="w-4 h-4 mr-1" />
                            Find
                        </TabsTrigger>
                    </TabsList>

                    {/* Connections Tab */}
                    <TabsContent value="connections" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {connections.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No connections yet</p>
                            </div>
                        ) : (
                            <>
                                {mentorConnections.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Crown className="w-3 h-3 text-emerald-600" />
                                            Mentors ({mentorConnections.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {mentorConnections.map((connection) => (
                                                <div
                                                    key={connection._id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selectedConnection?._id === connection._id ? "bg-purple-50 border border-purple-200" : "border border-transparent"
                                                        }`}
                                                    onClick={() => handleSelectConnection(connection)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src={connection.profile?.avatar} />
                                                            <AvatarFallback>{connection.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{connection.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {connection.profile?.expertise?.[0] || "Mentor"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {studentConnections.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <GraduationCap className="w-3 h-3 text-blue-600" />
                                            Students ({studentConnections.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {studentConnections.map((connection) => (
                                                <div
                                                    key={connection._id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${selectedConnection?._id === connection._id ? "bg-purple-50 border border-purple-200" : "border border-transparent"
                                                        }`}
                                                    onClick={() => handleSelectConnection(connection)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src={connection.profile?.avatar} />
                                                            <AvatarFallback>{connection.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{connection.name}</p>
                                                            <p className="text-xs text-gray-500">Student</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* Requests Tab */}
                    <TabsContent value="requests" className="flex-1 overflow-y-auto p-4 space-y-3 mt-0">
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No pending requests</p>
                            </div>
                        ) : (
                            requests.map((request) => (
                                <Card key={request._id}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar>
                                                <AvatarImage src={request.from?.profile?.avatar} />
                                                <AvatarFallback>{request.from?.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{request.from?.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{request.from?.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-green-600 hover:bg-green-700 h-8"
                                                onClick={() => handleAcceptRequest(request.from._id)}
                                            >
                                                <Check className="w-3 h-3 mr-1" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-8"
                                                onClick={() => handleRejectRequest(request.from._id)}
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Find Tab - Show ALL Users */}
                    <TabsContent value="find" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Mentors */}
                        {mentorUsers.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Crown className="w-3 h-3 text-emerald-600" />
                                    Mentors ({mentorUsers.length})
                                </h3>
                                <div className="space-y-2">
                                    {mentorUsers.map((mentor) => (
                                        <Card key={mentor._id}>
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={mentor.profile?.avatar} />
                                                        <AvatarFallback>{mentor.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{mentor.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {mentor.profile?.expertise?.[0] || "Mentor"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-purple-600 hover:bg-purple-700 h-8"
                                                    onClick={() => handleSendConnectionRequest(mentor._id)}
                                                >
                                                    <UserPlus className="w-3 h-3 mr-1" />
                                                    Connect
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Students */}
                        {studentUsers.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <GraduationCap className="w-3 h-3 text-blue-600" />
                                    Students ({studentUsers.length})
                                </h3>
                                <div className="space-y-2">
                                    {studentUsers.map((student) => (
                                        <Card key={student._id}>
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={student.profile?.avatar} />
                                                        <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{student.name}</p>
                                                        <p className="text-xs text-gray-500">Student</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-purple-600 hover:bg-purple-700 h-8"
                                                    onClick={() => handleSendConnectionRequest(student._id)}
                                                >
                                                    <UserPlus className="w-3 h-3 mr-1" />
                                                    Connect
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No users found</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </aside>

            {/* MAIN CHAT AREA */}
            <main className="flex-1 flex flex-col">
                {!selectedConnection ? (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <div className="text-center text-gray-500">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a connection to start chatting</p>
                            <p className="text-sm mt-2">Choose from your mentors or students on the left</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    className="cursor-pointer w-10 h-10"
                                    onClick={() => navigate(`/profile/${selectedConnection._id}`)}
                                >
                                    <AvatarImage src={selectedConnection.profile?.avatar} />
                                    <AvatarFallback>{selectedConnection.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="font-semibold text-gray-900">{selectedConnection.name}</h2>
                                    <p className="text-sm text-gray-500 capitalize">{selectedConnection.role}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/profile/${selectedConnection._id}`)}
                                >
                                    View Profile
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="text-center">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No messages yet</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${msg.sender?.id === user?._id ? "flex-row-reverse" : ""}`}
                                    >
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={msg.sender?.avatar} />
                                            <AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div
                                            className={`max-w-[70%] p-3 rounded-lg ${msg.sender?.id === user?._id
                                                ? "bg-purple-600 text-white"
                                                : "bg-white border"
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <p className="text-[10px] mt-1 opacity-70 text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
