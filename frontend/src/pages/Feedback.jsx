import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Send, CheckCircle, MessageSquare, Lightbulb, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Feedback() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        content: "",
        rating: 0,
        category: "general"
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const categories = [
        { value: "general", label: "General Feedback", icon: MessageSquare },
        { value: "bug", label: "Bug Report", icon: AlertCircle },
        { value: "feature_request", label: "Feature Request", icon: Lightbulb },
        { value: "ui_ux", label: "UI/UX Improvement", icon: Star }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.content || formData.rating === 0) {
            alert("Please provide feedback and a rating");
            return;
        }

        setLoading(true);
        try {
            await api("/api/feedbacks", {
                method: "POST",
                body: JSON.stringify(formData)
            });

            setSuccess(true);
            setTimeout(() => {
                navigate("/");
            }, 3000);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert(error.message || "Failed to submit feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white selection:bg-emerald-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                        <p className="text-gray-600 mb-4">Please login to submit feedback</p>
                        <Button onClick={() => navigate("/login")}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white selection:bg-emerald-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                        <p className="text-gray-600 mb-2">Your feedback has been submitted successfully.</p>
                        <p className="text-sm text-gray-500">
                            We appreciate your input and will use it to improve Btaap.
                            You'll be redirected to the home page shortly.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white selection:bg-emerald-100">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-white" />

            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 text-sm font-medium rounded-full mb-4">
                        <Star className="w-4 h-4 mr-2 inline-block text-emerald-600" />
                        We Value Your Opinion
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900">
                        Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Feedback</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Help us improve Btaap! Your feedback helps us build a better learning platform for everyone.
                    </p>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-emerald-600" />
                            Your Feedback
                        </CardTitle>
                        <CardDescription>
                            Tell us what you think about Btaap - what's working well and what could be better
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Overall Rating <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating })}
                                            className="transition-all duration-200"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${rating <= formData.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                    } hover:scale-110`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {formData.rating > 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        {formData.rating === 5 && "Excellent! 🎉"}
                                        {formData.rating === 4 && "Great! 👍"}
                                        {formData.rating === 3 && "Good 👌"}
                                        {formData.rating === 2 && "Needs Improvement 🤔"}
                                        {formData.rating === 1 && "Poor 😞"}
                                    </p>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Feedback Category
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${formData.category === cat.value
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-gray-200 hover:border-emerald-200"
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 mx-auto mb-2 ${formData.category === cat.value ? "text-emerald-600" : "text-gray-400"
                                                    }`} />
                                                <p className={`text-sm font-medium ${formData.category === cat.value ? "text-emerald-700" : "text-gray-700"
                                                    }`}>
                                                    {cat.label}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Feedback Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Feedback <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Tell us what you think... What do you love? What could be better? Any suggestions?"
                                    rows={8}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    required
                                    maxLength={2000}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.content.length}/2000 characters
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit Feedback
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-8 border-0 shadow-md bg-emerald-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-emerald-600" />
                            Why Your Feedback Matters
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Helps us understand what features you love and what needs improvement</li>
                            <li>• Guides our development roadmap and feature prioritization</li>
                            <li>• Ensures we're building the best possible learning platform for you</li>
                            <li>• Your voice shapes the future of Btaap!</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
