// src/pages/admin/AdminJoinRequestsPanel.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAllJoinRequests } from "@/lib/communityApi";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import {
    Users,
    Search,
    Filter,
    CreditCard,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Check,
    X,
    Loader2
} from "lucide-react";

export default function AdminJoinRequestsPanel() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [requests, statusFilter, searchTerm]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllJoinRequests();
            setRequests(data.requests || []);
        } catch (error) {
            console.error("Failed to load requests:", error);
            alert(error.message || "Failed to load join requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = requests;

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                req.student?.name.toLowerCase().includes(searchLower) ||
                req.student?.email.toLowerCase().includes(searchLower) ||
                req.community?.name.toLowerCase().includes(searchLower) ||
                req.transactionId?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleApproveRequest = async (requestId, communityId) => {
        if (!window.confirm("Are you sure you want to approve this join request?")) return;

        setProcessing(requestId);
        try {
            await api(`/api/communities/${communityId}/requests/${requestId}`, {
                method: "PUT",
                body: JSON.stringify({ action: "approve" })
            });

            // Update local state
            setRequests(prev => prev.map(r =>
                r._id === requestId ? { ...r, status: "approved" } : r
            ));
            alert("Request approved successfully!");
        } catch (error) {
            alert(error.message || "Failed to approve request");
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectRequest = async (requestId, communityId) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setProcessing(requestId);
        try {
            await api(`/api/communities/${communityId}/requests/${requestId}`, {
                method: "PUT",
                body: JSON.stringify({
                    action: "reject",
                    rejectionReason: reason
                })
            });

            // Update local state
            setRequests(prev => prev.map(r =>
                r._id === requestId ? { ...r, status: "rejected", rejectionReason: reason } : r
            ));
            alert("Request rejected successfully!");
        } catch (error) {
            alert(error.message || "Failed to reject request");
        } finally {
            setProcessing(null);
        }
    };

    const handleVerifyPayment = async (requestId) => {
        if (!window.confirm("Mark this payment as verified?")) return;

        setProcessing(requestId);
        try {
            // Update membership payment status
            await api(`/api/admin/memberships/${requestId}/verify-payment`, {
                method: "PATCH"
            });

            // Update local state
            setRequests(prev => prev.map(r =>
                r._id === requestId ? { ...r, paymentStatus: "verified" } : r
            ));
            alert("Payment verified!");
        } catch (error) {
            alert(error.message || "Failed to verify payment");
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: "secondary", icon: Clock, color: "text-amber-600" },
            approved: { variant: "default", icon: CheckCircle, color: "text-green-600" },
            rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" },
            left: { variant: "outline", icon: AlertCircle, color: "text-gray-600" },
            removed: { variant: "outline", icon: AlertCircle, color: "text-gray-600" },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="capitalize">
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        if (!paymentStatus || paymentStatus === "free") return null;

        const colors = {
            pending: "bg-amber-100 text-amber-800",
            verified: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
        };

        return (
            <span className={`text-xs px-2 py-1 rounded ${colors[paymentStatus] || "bg-gray-100 text-gray-800"}`}>
                {paymentStatus}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded">
                                    <Users className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold">{requests.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold">
                                        {requests.filter(r => r.status === "pending").length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Approved</p>
                                    <p className="text-2xl font-bold">
                                        {requests.filter(r => r.status === "approved").length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Rejected</p>
                                    <p className="text-2xl font-bold">
                                        {requests.filter(r => r.status === "rejected").length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Paid</p>
                                    <p className="text-2xl font-bold">
                                        {requests.filter(r => r.transactionId).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by student, email, community, or transaction ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="removed">Removed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Join Requests ({filteredRequests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No requests found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredRequests.map((request) => (
                                    <Card key={request._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-lg">{request.student?.name || "N/A"}</h3>
                                                        {getStatusBadge(request.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{request.student?.email || "N/A"}</p>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                                        <span>Community: <span className="font-medium text-gray-900">{request.community?.name}</span></span>
                                                        <span>Mentor: <span className="font-medium">{request.community?.mentor?.name || "N/A"}</span></span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(request.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transaction & Payment Info */}
                                            <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                                {request.transactionId ? (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="w-4 h-4 text-blue-600" />
                                                            <span className="font-mono text-sm font-medium">{request.transactionId}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                                                        <span className="text-gray-400 text-sm">No transaction</span>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="text-xs text-gray-600 mb-1">Payment Status</p>
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentStatusBadge(request.paymentStatus) || (
                                                            <span className="text-sm text-gray-500">Free/Not applicable</span>
                                                        )}
                                                        {request.paymentStatus === "pending" && request.transactionId && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleVerifyPayment(request._id)}
                                                                disabled={processing === request._id}
                                                                className="h-6 text-xs"
                                                            >
                                                                {processing === request._id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Check className="w-3 h-3 mr-1" />
                                                                        Verify
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rejection Reason */}
                                            {request.rejectionReason && (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                                                    <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                                </div>
                                            )}

                                            {/* Request History */}
                                            {request.history && request.history.length > 0 && (
                                                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <p className="text-xs font-medium text-gray-800 mb-2">Request History:</p>
                                                    <div className="space-y-2">
                                                        {request.history.map((item, idx) => (
                                                            <div key={idx} className="flex flex-col gap-1 text-xs text-gray-600 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={`h-5 text-[10px] capitalize ${item.status === 'rejected' ? 'text-red-500 border-red-200' :
                                                                            item.status === 'approved' ? 'text-green-500 border-green-200' : 'text-gray-500'
                                                                        }`}>
                                                                        {item.status}
                                                                    </Badge>
                                                                    <span className="text-gray-400">{new Date(item.updatedAt).toLocaleDateString()}</span>
                                                                </div>
                                                                {item.rejectionReason && (
                                                                    <p className="text-red-600 pl-1">{item.rejectionReason}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Admin Actions */}
                                            {request.status === "pending" && (
                                                <div className="flex gap-2 pt-4 border-t">
                                                    <Button
                                                        onClick={() => handleApproveRequest(request._id, request.community?._id)}
                                                        disabled={processing === request._id}
                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                    >
                                                        {processing === request._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        ) : (
                                                            <Check className="w-4 h-4 mr-2" />
                                                        )}
                                                        Approve Request
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleRejectRequest(request._id, request.community?._id)}
                                                        disabled={processing === request._id}
                                                        variant="destructive"
                                                        className="flex-1"
                                                    >
                                                        {processing === request._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        ) : (
                                                            <X className="w-4 h-4 mr-2" />
                                                        )}
                                                        Reject Request
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
