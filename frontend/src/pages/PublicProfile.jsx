// src/pages/PublicProfile.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import {
    User,
    Mail,
    Briefcase,
    Award,
    Link2,
    DollarSign,
    Calendar,
    Users,
    MessageSquare
} from "lucide-react";

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("none"); // none, connected, pending_sent, pending_received
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [id]);

    useEffect(() => {
        if (currentUser && profile && currentUser._id !== profile.id) {
            checkConnectionStatus();
        }
    }, [currentUser, profile, id]);

    const checkConnectionStatus = async () => {
        try {
            // Check connections
            const connectionsRes = await api("/api/connections");
            const isConnected = connectionsRes.some(c => c._id === id);
            if (isConnected) {
                setConnectionStatus("connected");
                return;
            }

            // Check sent requests (we don't have an endpoint for sent requests yet, but we can check received requests on the other side if we were them, but we are us)
            // Actually, we need to know if WE sent a request to THEM.
            // The current backend implementation for `GET /requests` only returns requests received BY the user.
            // We might need to update the backend to return sent requests or just check the user object if we populate it.
            // For now, let's assume we can't easily check "sent" requests without an endpoint.
            // Let's add an endpoint or update the `GET /requests` to include sent ones?
            // Or, we can just try to send a request and if it says "already sent", we know.
            // But for UI state, we need to know.

            // Let's update the backend to return sent requests too? 
            // Or better, let's just fetch the target user's profile and see if our ID is in their requests? 
            // We can't see their requests array if we are not them (privacy).

            // So we need an endpoint `GET /api/connections/status/:userId` that tells us the status.
            // This is the cleanest way.

            const statusRes = await api(`/api/connections/status/${id}`);
            setConnectionStatus(statusRes.status);
        } catch (err) {
            console.error("Failed to check connection status", err);
        }
    };

    const handleConnect = async () => {
        setActionLoading(true);
        try {
            await api(`/api/connections/request/${id}`, { method: 'POST' });
            setConnectionStatus("pending_sent");
        } catch (err) {
            console.error("Failed to send request", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            await api(`/api/connections/accept/${id}`, { method: 'POST' });
            setConnectionStatus("connected");
        } catch (err) {
            console.error("Failed to accept request", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm("Are you sure you want to remove this connection?")) return;
        setActionLoading(true);
        try {
            await api(`/api/connections/${id}`, { method: 'DELETE' });
            setConnectionStatus("none");
        } catch (err) {
            console.error("Failed to remove connection", err);
        } finally {
            setActionLoading(false);
        }
    };

    const loadProfile = async () => {
        setLoading(true);
        setError("");
        try {
            // Try fetching as mentor first
            let res = await api(`/api/profiles/mentor/${id}`).catch(() => null);

            if (res && res.success) {
                setProfile({ ...res.mentor, type: "mentor" });
            } else {
                // If not mentor, try student
                res = await api(`/api/profiles/student/${id}`);
                if (res.success) {
                    setProfile({ ...res.student, type: "student" });
                } else {
                    setError("User not found");
                }
            }
        } catch (err) {
            console.error("Failed to load profile:", err);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <Alert variant="destructive">
                    <AlertDescription>{error || "Profile not found"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const isOwnProfile = currentUser?._id === profile.id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <Card className="border-none shadow-lg overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                    <CardContent className="relative pt-0 pb-8 px-8">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12">
                            <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                                <AvatarImage src={profile.profile?.avatar || profile.avatar} />
                                <AvatarFallback className="text-3xl bg-purple-100 text-purple-700">
                                    {profile.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="capitalize">
                                        {profile.role || profile.type}
                                    </Badge>
                                    <span className="text-gray-500 text-sm flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Joined {new Date(profile.joinedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-2">
                                {isOwnProfile ? (
                                    <Button onClick={() => navigate("/profile")} variant="outline">
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        {connectionStatus === "none" && (
                                            <Button onClick={handleConnect} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
                                                {actionLoading ? "Sending..." : "Connect"}
                                            </Button>
                                        )}
                                        {connectionStatus === "pending_sent" && (
                                            <Button disabled variant="secondary">
                                                Request Sent
                                            </Button>
                                        )}
                                        {connectionStatus === "pending_received" && (
                                            <Button onClick={handleAccept} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                                                Accept Request
                                            </Button>
                                        )}
                                        {connectionStatus === "connected" && (
                                            <Button onClick={handleRemove} variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                                                Remove Connection
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.profile?.bio || profile.bio ? (
                            <p className="mt-6 text-gray-600 leading-relaxed max-w-2xl">
                                {profile.profile?.bio || profile.bio}
                            </p>
                        ) : (
                            <p className="mt-6 text-gray-400 italic">No bio available</p>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.type === "mentor" ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Communities</span>
                                            <span className="font-bold">{profile.statistics?.communitiesOwned || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Students</span>
                                            <span className="font-bold">{profile.statistics?.totalStudents || 0}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Joined</span>
                                            <span className="font-bold">{profile.statistics?.communitiesJoined || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Posts</span>
                                            <span className="font-bold">{profile.statistics?.totalPosts || 0}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Mentor Details */}
                        {profile.type === "mentor" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {profile.profile?.hourlyRate && (
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            <span>${profile.profile.hourlyRate}/hr</span>
                                        </div>
                                    )}
                                    {profile.profile?.linkedIn && (
                                        <a
                                            href={profile.profile.linkedIn}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-blue-600 hover:underline"
                                        >
                                            <Link2 className="w-5 h-5" />
                                            LinkedIn Profile
                                        </a>
                                    )}
                                    {profile.profile?.portfolio && (
                                        <a
                                            href={profile.profile.portfolio}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-purple-600 hover:underline"
                                        >
                                            <Briefcase className="w-5 h-5" />
                                            Portfolio
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Content Tabs */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="communities" className="w-full">
                            <TabsList className="w-full justify-start bg-white p-1 rounded-lg shadow-sm">
                                <TabsTrigger value="communities">Communities</TabsTrigger>
                                {profile.type === "mentor" && (
                                    <TabsTrigger value="expertise">Expertise & Experience</TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="communities" className="mt-6 space-y-6">
                                {/* Owned Communities (Mentor only) */}
                                {profile.type === "mentor" && profile.communities?.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            Communities Owned
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {profile.communities.map((comm) => (
                                                <Card key={comm._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/communities/${comm._id}`)}>
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 rounded-lg">
                                                            <AvatarImage src={comm.coverImage} />
                                                            <AvatarFallback className="rounded-lg">{comm.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium truncate">{comm.name}</p>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                                <span>{comm.statistics?.totalMembers || 0} members</span>
                                                                {comm.mentorSettings?.classesPerMonth > 0 && (
                                                                    <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {comm.mentorSettings.classesPerMonth} Classes/mo
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Joined Communities */}
                                {profile.joinedCommunities?.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            Communities Joined
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {profile.joinedCommunities.map((comm) => (
                                                <Card key={comm._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/communities/${comm._id}`)}>
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 rounded-lg">
                                                            <AvatarImage src={comm.coverImage} />
                                                            <AvatarFallback className="rounded-lg">{comm.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium truncate">{comm.name}</p>
                                                            <p className="text-xs text-gray-500">{comm.category}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mutual Communities */}
                                {profile.mutualCommunities?.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5 text-green-600" />
                                            Mutual Communities
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {profile.mutualCommunities.map((comm) => (
                                                <Card key={comm._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/communities/${comm._id}`)}>
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 rounded-lg">
                                                            <AvatarImage src={comm.coverImage} />
                                                            <AvatarFallback className="rounded-lg">{comm.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium truncate">{comm.name}</p>
                                                            <p className="text-xs text-gray-500">You are both members</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {(!profile.communities?.length && !profile.joinedCommunities?.length) && (
                                    <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No communities found</p>
                                    </div>
                                )}
                            </TabsContent>

                            {profile.type === "mentor" && (
                                <TabsContent value="expertise" className="mt-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Expertise</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.profile?.expertise?.map((exp, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700">
                                                        {exp}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {profile.profile?.experience && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Experience</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-700">{profile.profile.experience}</p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {profile.profile?.credentials && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Credentials</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Award className="w-5 h-5 text-amber-500" />
                                                    <span>{profile.profile.credentials}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
