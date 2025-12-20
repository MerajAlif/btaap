// src/pages/PublicProfile.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import {
    Calendar,
    Users,
    BookOpen,
    Award,
    Link2,
    Briefcase,
    Sparkles,
    UserPlus,
    UserCheck,
    UserMinus,
    Clock
} from "lucide-react";

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("none");
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
            const connectionsRes = await api("/api/connections");
            const isConnected = connectionsRes.some(c => c._id === id);
            if (isConnected) {
                setConnectionStatus("connected");
                return;
            }

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
            let res = await api(`/api/profiles/mentor/${id}`).catch(() => null);

            if (res && res.success) {
                setProfile({ ...res.mentor, type: "mentor" });
            } else {
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto p-4 mt-8">
                <Alert variant="destructive">
                    <AlertDescription>{error || "Profile not found"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const isOwnProfile = currentUser?._id === profile.id;

    return (
        <div className="min-h-screen bg-white selection:bg-emerald-100">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-white" />

            {/* HEADER SECTION */}
            <section className="relative">
                {/* Cover */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="relative -mt-20 md:-mt-24">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Avatar */}
                                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-lg flex-shrink-0">
                                    <AvatarImage src={profile.profile?.avatar || profile.avatar} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-emerald-100 text-emerald-700 font-bold">
                                        {profile.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                                                {profile.name}
                                            </h1>
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none capitalize">
                                                    {profile.role || profile.type}
                                                </Badge>
                                                {profile.profile?.title && (
                                                    <span className="text-gray-600 font-medium">
                                                        {profile.profile.title}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span>Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {isOwnProfile ? (
                                                <Button onClick={() => navigate("/profile")} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                    Edit Profile
                                                </Button>
                                            ) : (
                                                <>
                                                    {connectionStatus === "none" && (
                                                        <Button onClick={handleConnect} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                                                            <UserPlus className="w-4 h-4 mr-2" />
                                                            {actionLoading ? "Sending..." : "Connect"}
                                                        </Button>
                                                    )}
                                                    {connectionStatus === "pending_sent" && (
                                                        <Button disabled variant="secondary">
                                                            <Clock className="w-4 h-4 mr-2" />
                                                            Request Sent
                                                        </Button>
                                                    )}
                                                    {connectionStatus === "pending_received" && (
                                                        <Button onClick={handleAccept} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Accept Request
                                                        </Button>
                                                    )}
                                                    {connectionStatus === "connected" && (
                                                        <Button onClick={handleRemove} variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                                                            <UserMinus className="w-4 h-4 mr-2" />
                                                            Remove
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {profile.profile?.bio || profile.bio ? (
                                        <p className="text-gray-600 leading-relaxed">
                                            {profile.profile?.bio || profile.bio}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 italic">No bio available</p>
                                    )}

                                    {/* Expertise Tags */}
                                    {profile.type === "mentor" && profile.profile?.expertise && profile.profile.expertise.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {profile.profile.expertise.map((exp, i) => (
                                                <Badge key={i} variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-200">
                                                    {exp}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTENT SECTION */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <Card className="border-gray-200">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    Statistics
                                </h3>
                                <div className="space-y-3">
                                    {profile.type === "mentor" ? (
                                        <>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Communities</span>
                                                <span className="font-bold text-emerald-700">{profile.statistics?.communitiesOwned || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Students</span>
                                                <span className="font-bold text-teal-700">{profile.statistics?.totalStudents || 0}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Communities Joined</span>
                                                <span className="font-bold text-emerald-700">{profile.statistics?.communitiesJoined || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Posts</span>
                                                <span className="font-bold text-teal-700">{profile.statistics?.totalPosts || 0}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* About & Links (Mentor only) */}
                        {profile.type === "mentor" && (profile.profile?.linkedIn || profile.profile?.portfolio || profile.profile?.credentials || profile.profile?.experience) && (
                            <Card className="border-gray-200">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-lg mb-4">About</h3>
                                    <div className="space-y-4">
                                        {/* Credentials */}
                                        {profile.profile?.credentials && (
                                            <div className="pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-2 text-amber-600 mb-1.5">
                                                    <Award className="w-4 h-4" />
                                                    <span className="font-semibold text-sm">Credentials</span>
                                                </div>
                                                <p className="text-gray-700 text-sm pl-6">{profile.profile.credentials}</p>
                                            </div>
                                        )}

                                        {/* Experience */}
                                        {profile.profile?.experience && (
                                            <div className={`${(profile.profile?.linkedIn || profile.profile?.portfolio) ? 'pb-3 border-b border-gray-100' : ''}`}>
                                                <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span className="font-semibold text-sm">Experience</span>
                                                </div>
                                                <p className="text-gray-700 text-sm pl-6">{profile.profile.experience} years</p>
                                            </div>
                                        )}

                                        {/* Links */}
                                        {(profile.profile?.linkedIn || profile.profile?.portfolio) && (
                                            <div className="space-y-2">
                                                {profile.profile?.linkedIn && (
                                                    <a
                                                        href={profile.profile.linkedIn}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        <Link2 className="w-4 h-4" />
                                                        <span className="font-medium">LinkedIn</span>
                                                    </a>
                                                )}
                                                {profile.profile?.portfolio && (
                                                    <a
                                                        href={profile.profile.portfolio}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        <Briefcase className="w-4 h-4" />
                                                        <span className="font-medium">Portfolio</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Content - Communities */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Owned Communities (Mentor only) */}
                        {profile.type === "mentor" && profile.communities && profile.communities.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-emerald-600" />
                                    Communities ({profile.communities.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.communities.map((comm) => (
                                        <Link key={comm._id} to={`/communities/${comm._id}`}>
                                            <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 h-full">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-16 h-16 rounded-xl flex-shrink-0">
                                                            <AvatarImage src={comm.coverImage} />
                                                            <AvatarFallback className="rounded-xl bg-emerald-100 text-emerald-700 font-bold text-lg">
                                                                {comm.name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1 line-clamp-1">
                                                                {comm.name}
                                                            </h3>
                                                            {comm.description && (
                                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                                    {comm.description}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <Users className="w-3.5 h-3.5" />
                                                                    <span>{comm.statistics?.totalMembers || 0} members</span>
                                                                </div>
                                                                {comm.category && (
                                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">
                                                                        {comm.category}
                                                                    </Badge>
                                                                )}
                                                                {comm.mentorSettings?.monthlyFee > 0 && (
                                                                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">
                                                                        ৳{comm.mentorSettings.monthlyFee}/mo
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Joined Communities */}
                        {profile.joinedCommunities && profile.joinedCommunities.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-teal-600" />
                                    Joined Communities ({profile.joinedCommunities.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.joinedCommunities.map((comm) => (
                                        <Link key={comm._id} to={`/communities/${comm._id}`}>
                                            <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 h-full">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-16 h-16 rounded-xl flex-shrink-0">
                                                            <AvatarImage src={comm.coverImage} />
                                                            <AvatarFallback className="rounded-xl bg-teal-100 text-teal-700 font-bold text-lg">
                                                                {comm.name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1 line-clamp-1">
                                                                {comm.name}
                                                            </h3>
                                                            {comm.description && (
                                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                                    {comm.description}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                                {comm.category && (
                                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">
                                                                        {comm.category}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {(!profile.communities || profile.communities.length === 0) &&
                            (!profile.joinedCommunities || profile.joinedCommunities.length === 0) && (
                                <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Communities Yet</h3>
                                    <p className="text-gray-500">This user hasn't joined or created any communities</p>
                                </div>
                            )}
                    </div>
                </div>
            </section>
        </div>
    );
}
