import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");

            const [complaintsRes, feedbackRes] = await Promise.all([
                fetch(`${BASE_URL}/api/complaints`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/api/feedbacks`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const complaintsData = await complaintsRes.json();
            const feedbackData = await feedbackRes.json();

            if (complaintsData.success) setComplaints(complaintsData.complaints);
            if (feedbackData.success) setFeedbacks(feedbackData.feedback);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveComplaint = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/complaints/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            // Refresh local state
            setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
        } catch (error) {
            console.error("Failed to update complaint", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading admin panel...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard: Issues & Feedback</h1>

            <Tabs defaultValue="complaints" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="complaints">User Complaints ({complaints.filter(c => c.status === 'pending').length} New)</TabsTrigger>
                    <TabsTrigger value="feedback">Platform Feedback ({feedbacks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="complaints" className="space-y-4">
                    {complaints.length === 0 ? (
                        <p className="text-gray-500">No complaints found.</p>
                    ) : (
                        complaints.map(complaint => (
                            <Card key={complaint._id} className="border-l-4 border-l-red-500">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                                {complaint.type.replace(/_/g, " ").toUpperCase()}
                                            </CardTitle>
                                            <CardDescription>
                                                Reported by <strong>{complaint.complainant?.name}</strong> • {new Date(complaint.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={complaint.status === 'resolved' ? 'default' : 'destructive'}>
                                            {complaint.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 p-3 rounded">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Against</p>
                                            <p>{complaint.reportedUser?.name || "N/A"}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Community</p>
                                            <p>{complaint.community?.name || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="font-semibold">{complaint.reason}</p>
                                        <p className="text-gray-700 mt-1">{complaint.description}</p>
                                    </div>

                                    {complaint.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleResolveComplaint(complaint._id, 'resolved')}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleResolveComplaint(complaint._id, 'dismissed')}>
                                                <XCircle className="w-4 h-4 mr-2" /> Dismiss
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feedbacks.map(feedback => (
                            <Card key={feedback._id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <Badge variant="outline">{feedback.category}</Badge>
                                        <div className="flex text-yellow-400">
                                            {[...Array(feedback.rating || 0)].map((_, i) => <span key={i}>★</span>)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-800 min-h-[60px]">{feedback.content}</p>
                                    <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex justify-between">
                                        <span>{feedback.user?.name || "Anonymous"}</span>
                                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
