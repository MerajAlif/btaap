import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/lib/api";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminPaymentPanel() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/payments/admin/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setPayments(data.payments);
            } else {
                setError(data.error || "Failed to fetch payments");
            }
        } catch (err) {
            setError("Failed to fetch payments");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (paymentId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/payments/admin/approve/${paymentId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setSuccess("Payment approved successfully");
                fetchPayments();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to approve payment");
            }
        } catch (err) {
            setError("Failed to approve payment");
        }
    };

    const handleReject = async (paymentId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/payments/admin/reject/${paymentId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setSuccess("Payment rejected");
                fetchPayments();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to reject payment");
            }
        } catch (err) {
            setError("Failed to reject payment");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-500">Approved</Badge>;
            case "rejected":
                return <Badge className="bg-red-500">Rejected</Badge>;
            case "pending":
                return <Badge className="bg-yellow-500">Pending</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            All Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length > 0 ? (
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <div
                                        key={payment._id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {payment.user?.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-gray-500">{payment.user?.email}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Amount: <strong>৳{payment.amount}</strong> | Credits:{" "}
                                                <strong>{payment.credits}</strong>
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(payment.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(payment.status)}
                                            {payment.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(payment._id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(payment._id)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No payments found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
