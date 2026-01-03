import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function AdminFeedbackPanel() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const data = await api("/api/feedbacks");
            setFeedbacks(data.feedback || []);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsReviewed = async (id) => {
        try {
            await api(`/api/feedbacks/${id}/review`, {
                method: "PUT"
            });
            fetchFeedbacks();
        } catch (error) {
            console.error("Error marking feedback as reviewed:", error);
            alert("Failed to update feedback status");
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case "bug":
                return <AlertCircle className="w-4 h-4" />;
            case "feature_request":
                return <Lightbulb className="w-4 h-4" />;
            case "ui_ux":
                return <Star className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case "bug":
                return "bg-red-100 text-red-700";
            case "feature_request":
                return "bg-blue-100 text-blue-700";
            case "ui_ux":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const filteredFeedbacks = feedbacks.filter((feedback) => {
        if (filter === "all") return true;
        if (filter === "reviewed") return feedback.isReviewed;
        if (filter === "pending") return !feedback.isReviewed;
        return feedback.category === filter;
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">User Feedback</h1>
                <p className="text-gray-600">Review and manage user feedback submissions</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    size="sm"
                >
                    All ({feedbacks.length})
                </Button>
                <Button
                    variant={filter === "pending" ? "default" : "outline"}
                    onClick={() => setFilter("pending")}
                    size="sm"
                >
                    Pending ({feedbacks.filter((f) => !f.isReviewed).length})
                </Button>
                <Button
                    variant={filter === "reviewed" ? "default" : "outline"}
                    onClick={() => setFilter("reviewed")}
                    size="sm"
                >
                    Reviewed ({feedbacks.filter((f) => f.isReviewed).length})
                </Button>
                <div className="border-l border-gray-300 mx-2" />
                <Button
                    variant={filter === "general" ? "default" : "outline"}
                    onClick={() => setFilter("general")}
                    size="sm"
                >
                    General
                </Button>
                <Button
                    variant={filter === "bug" ? "default" : "outline"}
                    onClick={() => setFilter("bug")}
                    size="sm"
                >
                    Bugs
                </Button>
                <Button
                    variant={filter === "feature_request" ? "default" : "outline"}
                    onClick={() => setFilter("feature_request")}
                    size="sm"
                >
                    Features
                </Button>
                <Button
                    variant={filter === "ui_ux" ? "default" : "outline"}
                    onClick={() => setFilter("ui_ux")}
                    size="sm"
                >
                    UI/UX
                </Button>
            </div>

            {/* Feedback List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading feedback...</p>
                </div>
            ) : filteredFeedbacks.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No feedback found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredFeedbacks.map((feedback) => (
                        <Card key={feedback._id} className={feedback.isReviewed ? "bg-gray-50" : ""}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className={getCategoryColor(feedback.category)}>
                                                {getCategoryIcon(feedback.category)}
                                                <span className="ml-1 capitalize">{feedback.category.replace("_", " ")}</span>
                                            </Badge>
                                            {feedback.isReviewed && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Reviewed
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="font-medium">{feedback.user?.name || "Unknown User"}</span>
                                            <span>•</span>
                                            <span>{feedback.user?.email}</span>
                                            <span>•</span>
                                            <span>{format(new Date(feedback.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${star <= feedback.rating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap mb-4">{feedback.content}</p>
                                {!feedback.isReviewed && (
                                    <Button
                                        onClick={() => markAsReviewed(feedback._id)}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Reviewed
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
