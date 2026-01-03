import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { UserCheck, UserPlus, UserX, Loader2 } from "lucide-react";

export default function Connections() {
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of user being acted upon

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [connRes, reqRes] = await Promise.all([
                api("/api/connections"),
                api("/api/connections/requests"),
            ]);
            setConnections(connRes);
            setRequests(reqRes);
        } catch (error) {
            console.error("Failed to fetch connections:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (userId) => {
        setActionLoading(userId);
        try {
            await api.post(`/api/connections/accept/${userId}`);
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error("Failed to accept request:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId) => {
        setActionLoading(userId);
        try {
            await api.post(`/api/connections/reject/${userId}`);
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error("Failed to reject request:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemove = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this connection?")) return;
        setActionLoading(userId);
        try {
            await api.delete(`/api/connections/${userId}`);
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error("Failed to remove connection:", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">My Connections</h1>
                </div>

                <Tabs defaultValue="connections" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="connections">
                            Connections ({connections.length})
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="relative">
                            Requests
                            {requests.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {requests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="connections" className="mt-6">
                        {connections.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-gray-500">
                                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>You haven't connected with anyone yet.</p>
                                    <Button asChild className="mt-4" variant="outline">
                                        <Link to="/posts">Find People</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {connections.map((user) => (
                                    <Card key={user._id}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.profile?.avatar} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-semibold truncate">{user.name}</h3>
                                                <p className="text-sm text-gray-500 capitalize">
                                                    {user.role}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link to={`/profile/${user._id}`}>View</Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemove(user._id)}
                                                    disabled={actionLoading === user._id}
                                                >
                                                    {actionLoading === user._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserX className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="requests" className="mt-6">
                        {requests.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-gray-500">
                                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No pending connection requests.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {requests.map((req) => (
                                    <Card key={req.from._id}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={req.from.profile?.avatar} />
                                                <AvatarFallback>{req.from.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className="font-semibold truncate">
                                                    {req.from.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 capitalize">
                                                    {req.from.role}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Sent {new Date(req.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAccept(req.from._id)}
                                                    disabled={actionLoading === req.from._id}
                                                >
                                                    {actionLoading === req.from._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        "Accept"
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 border-red-200"
                                                    onClick={() => handleReject(req.from._id)}
                                                    disabled={actionLoading === req.from._id}
                                                >
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
        </div>
    );
}
