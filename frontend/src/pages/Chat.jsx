import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Chat() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Connections state
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
        console.log("[Chat] Component mounted, loading connections...");
        loadConnections();
        loadRequests();
    }, []);

    // Initialize socket connection
    useEffect(() => {
        console.log("[Chat] Socket effect triggered, user:", user);
        if (user) {
            console.log("[Chat] Initializing socket connection...");
            const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling']
            });

            newSocket.on("connect", () => {
                console.log("[Chat] ✅ Socket connected:", newSocket.id);
                newSocket.emit("user_online", user._id);
            });

            newSocket.on("connect_error", (error) => {
                console.error("[Chat] ❌ Socket connection error:", error);
            });

            newSocket.on("receive_direct_message", (message) => {
                console.log("[Chat] 📨 Received message:", message);
                setMessages((prev) => [...prev, message]);
            });

            setSocket(newSocket);

            return () => {
                console.log("[Chat] Cleaning up socket connection");
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
        console.log("[Chat] loadConnections() called");
        setLoading(true);
        try {
            console.log("[Chat] Fetching connections from API...");
            const data = await api("/api/connections");
            console.log("[Chat] ✅ Connections loaded:", data);
            setConnections(data);
        } catch (error) {
            console.error("[Chat] ❌ Failed to load connections:", error);
        } finally {
            setLoading(false);
            console.log("[Chat] Loading state set to false");
        }
    };

    const loadRequests = async () => {
        console.log("[Chat] loadRequests() called");
        try {
            console.log("[Chat] Fetching requests from API...");
            const data = await api("/api/connections/requests");
            console.log("[Chat] ✅ Requests loaded:", data);
            setRequests(data);
        } catch (error) {
            console.error("[Chat] ❌ Failed to load requests:", error);
        }
    };

    const handleAcceptRequest = async (userId) => {
        try {
            await api(`/api/connections/accept/${userId}`, { method: "POST" });
            loadConnections();
            loadRequests();
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
        console.log("[Chat] Selecting connection:", connection._id);
        setSelectedConnection(connection);
        setMessagesLoading(true);

        try {
            // Get or create conversation
            console.log("[Chat] Fetching conversation...");
            const convData = await api(`/api/messages/conversation/${connection._id}`);
            console.log("[Chat] Conversation:", convData);

            if (convData.success && convData.conversation) {
                setSelectedConversation(convData.conversation);

                // Load message history
                console.log("[Chat] Loading messages for conversation:", convData.conversation._id);
                const msgData = await api(`/api/messages/${convData.conversation._id}`);
                console.log("[Chat] Messages loaded:", msgData);

                if (msgData.success) {
                    setMessages(msgData.messages || []);
                }
            }
        } catch (error) {
            console.error("[Chat] Error loading conversation:", error);
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

        console.log("[Chat] Sending message:", messageData);
        socket.emit("send_direct_message", messageData);

        // Optimistically add to UI
        setMessages((prev) => [...prev, messageData]);
        setNewMessage("");
    };

    const filteredConnections = connections.filter((conn) =>
        conn.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const mentorConnections = filteredConnections.filter((c) => c.role === "mentor");
    const studentConnections = filteredConnections.filter((c) => c.role === "student");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                        Messages
                    </h1>
                    <p className="text-gray-600 mt-1">Chat with your connections</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - Connections List */}
                    <div className="lg:col-span-1">
                        <Tabs defaultValue="connections" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="connections">
                                    Connections ({connections.length})
                                </TabsTrigger>
                                <TabsTrigger value="requests">
                                    Requests ({requests.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="connections" className="mt-4 space-y-4">
                                {/* Search */}
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
                                    <Card>
                                        <CardContent className="p-8 text-center text-gray-500">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No connections yet</p>
                                            <p className="text-sm mt-2">
                                                Connect with mentors and students to start chatting
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        {/* Mentors */}
                                        {mentorConnections.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <UserPlus className="w-4 h-4" />
                                                    Mentors ({mentorConnections.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {mentorConnections.map((connection) => (
                                                        <Card
                                                            key={connection._id}
                                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedConnection?._id === connection._id
                                                                ? "ring-2 ring-purple-500 bg-purple-50"
                                                                : ""
                                                                }`}
                                                            onClick={() => handleSelectConnection(connection)}
                                                        >
                                                            <CardContent className="p-4 flex items-center gap-3">
                                                                <Avatar>
                                                                    <AvatarImage src={connection.profile?.avatar} />
                                                                    <AvatarFallback>{connection.name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm truncate">
                                                                        {connection.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {connection.profile?.expertise?.[0] || "Mentor"}
                                                                    </p>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Mentor
                                                                </Badge>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Students */}
                                        {studentConnections.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Students ({studentConnections.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {studentConnections.map((connection) => (
                                                        <Card
                                                            key={connection._id}
                                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedConnection?._id === connection._id
                                                                ? "ring-2 ring-purple-500 bg-purple-50"
                                                                : ""
                                                                }`}
                                                            onClick={() => handleSelectConnection(connection)}
                                                        >
                                                            <CardContent className="p-4 flex items-center gap-3">
                                                                <Avatar>
                                                                    <AvatarImage src={connection.profile?.avatar} />
                                                                    <AvatarFallback>{connection.name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm truncate">
                                                                        {connection.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">Student</p>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="requests" className="mt-4 space-y-4">
                                {requests.length === 0 ? (
                                    <Card>
                                        <CardContent className="p-8 text-center text-gray-500">
                                            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No pending requests</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {requests.map((request) => (
                                            <Card key={request._id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Avatar>
                                                            <AvatarImage src={request.from?.profile?.avatar} />
                                                            <AvatarFallback>{request.from?.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">
                                                                {request.from?.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 capitalize">
                                                                {request.from?.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleAcceptRequest(request.from._id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => handleRejectRequest(request.from._id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Main Chat Area */}
                    <div className="lg:col-span-2">
                        {!selectedConnection ? (
                            <Card className="h-[600px] flex items-center justify-center">
                                <CardContent className="text-center text-gray-500">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Select a connection to start chatting</p>
                                    <p className="text-sm mt-2">
                                        Choose from your mentors or students on the left
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="h-[600px] flex flex-col">
                                {/* Chat Header */}
                                <CardHeader className="border-b">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            className="cursor-pointer"
                                            onClick={() => navigate(`/profile/${selectedConnection._id}`)}
                                        >
                                            <AvatarImage src={selectedConnection.profile?.avatar} />
                                            <AvatarFallback>{selectedConnection.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{selectedConnection.name}</CardTitle>
                                            <p className="text-sm text-gray-500 capitalize">
                                                {selectedConnection.role}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/profile/${selectedConnection._id}`)}
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </CardHeader>

                                {/* Messages */}
                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
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
                                                className={`flex gap-3 ${msg.sender?.id === user?._id ? "flex-row-reverse" : ""
                                                    }`}
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
                                </CardContent>

                                {/* Message Input */}
                                <div className="p-4 border-t bg-white">
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
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
