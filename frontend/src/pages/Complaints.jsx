import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, Send, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Complaints() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: "",
        reason: "",
        description: "",
        reportedUser: "",
        community: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const complaintTypes = [
        { value: "student_vs_mentor", label: "Issue with Mentor" },
        { value: "mentor_vs_student", label: "Issue with Student" },
        { value: "content_issue", label: "Inappropriate Content" },
        { value: "spam", label: "Spam or Abuse" },
        { value: "other", label: "Other" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.type || !formData.reason || !formData.description) {
            alert("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await api("/api/complaints", {
                method: "POST",
                body: JSON.stringify(formData)
            });

            setSuccess(true);
            setTimeout(() => {
                navigate("/");
            }, 3000);
        } catch (error) {
            console.error("Error submitting complaint:", error);
            alert(error.message || "Failed to submit complaint. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white selection:bg-emerald-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                        <p className="text-gray-600 mb-4">Please login to submit a complaint</p>
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
                        <h2 className="text-2xl font-bold mb-2">Complaint Submitted!</h2>
                        <p className="text-gray-600 mb-2">Thank you for reporting this issue.</p>
                        <p className="text-sm text-gray-500">
                            Our admin team will review your complaint and take appropriate action.
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
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-100/50 via-orange-50/30 to-white" />

            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none px-4 py-1.5 text-sm font-medium rounded-full mb-4">
                        <AlertCircle className="w-4 h-4 mr-2 inline-block" />
                        Report an Issue
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900">
                        Submit a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Complaint</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        We take all complaints seriously. Our admin team will review your submission and take appropriate action.
                    </p>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-red-600" />
                            Complaint Details
                        </CardTitle>
                        <CardDescription>
                            Please provide as much detail as possible to help us address your concern
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Complaint Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Complaint Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                >
                                    <option value="">Select a type</option>
                                    {complaintTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brief Reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="e.g., Inappropriate behavior in community chat"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Detailed Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Please provide a detailed description of the issue..."
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    required
                                    maxLength={2000}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.description.length}/2000 characters
                                </p>
                            </div>

                            {/* Optional: Reported User ID (if applicable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reported User ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.reportedUser}
                                    onChange={(e) => setFormData({ ...formData, reportedUser: e.target.value })}
                                    placeholder="User ID if reporting a specific user"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can find user IDs in their profile URL
                                </p>
                            </div>

                            {/* Optional: Community ID (if applicable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Community ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.community}
                                    onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                                    placeholder="Community ID if issue is related to a specific community"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can find community IDs in the community URL
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
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit Complaint
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-8 border-0 shadow-md bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            What Happens Next?
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Our admin team will review your complaint within 24-48 hours</li>
                            <li>• We may contact you for additional information if needed</li>
                            <li>• Appropriate action will be taken based on our platform policies</li>
                            <li>• You'll be notified of the outcome via email or platform notification</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
