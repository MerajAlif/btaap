import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    Clock,
    Star,
    MessageSquare,
    Globe
} from "lucide-react";

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewsStats, setReviewsStats] = useState({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("none");
    const [actionLoading, setActionLoading] = useState(false);

    // Review Form State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [id]);

    useEffect(() => {
        if (currentUser && profile && currentUser._id !== profile.id) {
            checkConnectionStatus();
        }
        if (profile?.type === 'mentor') {
            loadReviews();
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

    const loadReviews = async () => {
        try {
            const res = await api(`/api/reviews/mentor/${id}`);
            if (res.success) {
                setReviews(res.reviews);
                setReviewsStats(res.stats);
            }
        } catch (error) {
            console.error("Failed to load reviews:", error);
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

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const res = await api("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mentorId: id,
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                })
            });

            if (res.success) {
                setReviews([res.review, ...reviews]);
                setIsReviewOpen(false);
                setReviewForm({ rating: 5, comment: "" });
                loadReviews(); // Refresh stats
            }
        } catch (error) {
            alert(error.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
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
    const isMentor = profile.type === "mentor";
    // Check if current user is a student member of this mentor's communities
    const canReview = currentUser?.role === "student" && profile.mutualCommunities?.length > 0;

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
                                                {isMentor && (
                                                    <div className="flex items-center gap-1 text-amber-500 ml-2">
                                                        <Star className="w-4 h-4 fill-current" />
                                                        <span className="font-bold text-gray-900">{profile.ratings?.average || "New"}</span>
                                                        {profile.ratings?.count > 0 && <span className="text-gray-500 text-xs">({profile.ratings.count})</span>}
                                                    </div>
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
                        <Card className="border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    Statistics
                                </h3>
                                <div className="space-y-3">
                                    {isMentor ? (
                                        <>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Online Experience</span>
                                                <div className="text-right">
                                                    <span className="font-bold text-emerald-700 flex items-center justify-end gap-1">
                                                        {profile.onlineExperience || 0}
                                                        <Globe className="w-3 h-3 text-emerald-500" />
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 block">Unique Students</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Communities</span>
                                                <span className="font-bold text-emerald-700">{profile.statistics?.communitiesOwned || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Rating</span>
                                                <span className="font-bold text-amber-600 flex items-center gap-1">
                                                    {profile.ratings?.average || 0}
                                                    <Star className="w-3 h-3 fill-current" />
                                                </span>
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
                        {isMentor && (profile.profile?.linkedIn || profile.profile?.portfolio || profile.profile?.credentials || profile.profile?.experience) && (
                            <Card className="border-gray-200 shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-lg mb-4">About</h3>
                                    <div className="space-y-4">
                                        {profile.profile?.credentials && (
                                            <div className="pb-3 border-b border-gray-100">
                                                <div className="flex items-center gap-2 text-amber-600 mb-1.5">
                                                    <Award className="w-4 h-4" />
                                                    <span className="font-semibold text-sm">Credentials</span>
                                                </div>
                                                <p className="text-gray-700 text-sm pl-6">{profile.profile.credentials}</p>
                                            </div>
                                        )}

                                        {profile.profile?.experience && (
                                            <div className={`${(profile.profile?.linkedIn || profile.profile?.portfolio) ? 'pb-3 border-b border-gray-100' : ''}`}>
                                                <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span className="font-semibold text-sm">Experience</span>
                                                </div>
                                                <p className="text-gray-700 text-sm pl-6">{profile.profile.experience}</p>
                                            </div>
                                        )}

                                        {(profile.profile?.linkedIn || profile.profile?.portfolio) && (
                                            <div className="space-y-2">
                                                {profile.profile?.linkedIn && (
                                                    <a href={profile.profile.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors text-sm">
                                                        <Link2 className="w-4 h-4" />
                                                        <span className="font-medium">LinkedIn</span>
                                                    </a>
                                                )}
                                                {profile.profile?.portfolio && (
                                                    <a href={profile.profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-colors text-sm">
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

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Communities */}
                        {isMentor && profile.communities && profile.communities.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
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
                                                            <AvatarFallback className="rounded-xl bg-emerald-100 text-emerald-700 font-bold text-lg">{comm.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1 line-clamp-1">{comm.name}</h3>
                                                            {comm.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{comm.description}</p>}
                                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <Users className="w-3.5 h-3.5" />
                                                                    <span>{comm.statistics?.totalMembers || 0} members</span>
                                                                </div>
                                                                {comm.category && <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">{comm.category}</Badge>}
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
                        {/* Joined Communities (for students/mentors both) */}
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
                                                            <AvatarFallback className="rounded-xl bg-teal-100 text-teal-700 font-bold text-lg">{comm.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1 line-clamp-1">{comm.name}</h3>
                                                            {comm.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{comm.description}</p>}
                                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                                {comm.category && <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">{comm.category}</Badge>}
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


                        {/* REVIEWS SECTION (New) */}
                        {isMentor && (
                            <div className="pt-8 border-t border-gray-200" id="reviews">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-6 h-6 text-emerald-600" />
                                        Reviews & Feedback
                                    </h2>

                                    {canReview && (
                                        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                                                    Write a Review
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Write a Review for {profile.name}</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Rating</Label>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                                    className={`p-1 rounded-full transition-colors ${reviewForm.rating >= star ? "text-amber-500" : "text-gray-300"
                                                                        }`}
                                                                >
                                                                    <Star className="w-8 h-8 fill-current" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Comment</Label>
                                                        <Textarea
                                                            value={reviewForm.comment}
                                                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                            placeholder="Share your experience..."
                                                            rows={4}
                                                            required
                                                        />
                                                    </div>
                                                    <Button type="submit" disabled={submittingReview} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                                        {submittingReview ? "Submitting..." : "Submit Review"}
                                                    </Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div key={review._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="w-10 h-10 border border-white shadow-sm">
                                                        <AvatarImage src={review.student?.profile?.avatar} />
                                                        <AvatarFallback>{review.student?.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-semibold text-gray-900">{review.student?.name}</h4>
                                                            <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex text-amber-500 mb-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-gray-300 fill-none"}`} />
                                                            ))}
                                                        </div>
                                                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            No reviews yet. Be the first to review!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
