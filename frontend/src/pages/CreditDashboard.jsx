import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useAuth from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";
import { Coins, Clock, TrendingUp, ShoppingCart } from "lucide-react";

export default function CreditDashboard() {
    const { user, refreshMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCreditTypeColor = (type) => {
        switch (type) {
            case "purchase":
                return "text-green-600 bg-green-50";
            case "usage":
                return "text-red-600 bg-red-50";
            case "refund":
                return "text-blue-600 bg-blue-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Credit Dashboard</h1>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Credit Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                                <Coins className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Current Balance</p>
                                <p className="text-3xl font-bold text-purple-600">{user?.credits || 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Expires On</p>
                                <p className="text-lg font-bold">
                                    {user?.creditExpiry
                                        ? new Date(user.creditExpiry).toLocaleDateString()
                                        : "Never"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-3xl font-bold">{user?.creditHistory?.length || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Purchase Credits Button */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Purchase Credits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Need more credits? Visit the pricing page to purchase more.
                        </p>
                        <Button onClick={() => (window.location.href = "/pricing")}>
                            Go to Pricing
                        </Button>
                    </CardContent>
                </Card>

                {/* Credit History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Credit History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user?.creditHistory && user.creditHistory.length > 0 ? (
                            <div className="space-y-3">
                                {user.creditHistory
                                    .slice()
                                    .reverse()
                                    .map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{entry.description}</p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(entry.createdAt)}
                                                </p>
                                            </div>
                                            <div
                                                className={`px-3 py-1 rounded-full font-semibold ${getCreditTypeColor(
                                                    entry.type
                                                )}`}
                                            >
                                                {entry.amount > 0 ? "+" : ""}
                                                {entry.amount} credits
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Coins className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No credit history yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
