import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useAuth from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/api";
import { Coins, Clock, TrendingUp, ShoppingCart, Crown, Users, Video } from "lucide-react";

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

                {/* Active Mentor Subscription Status */}
                {user?.mentorSubscription?.isActive && (
                    <div className="animate-in slide-in-from-top-4 duration-700">
                        <Card className="border-emerald-200 bg-emerald-50/50 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-700 font-bold tracking-wide text-sm uppercase">
                                            <Crown className="w-4 h-4" />
                                            Active Subscription
                                        </div>
                                        <h3 className="text-3xl font-extrabold text-gray-900">
                                            {user.mentorSubscription.planName} Plan
                                        </h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-emerald-600" />
                                                <span>
                                                    <strong>{user.mentorSubscription.maxCommunities >= 99 ? "Unlimited" : user.mentorSubscription.maxCommunities}</strong> Communities
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Video className="w-4 h-4 text-emerald-600" />
                                                <span>
                                                    <strong>{user.mentorSubscription.maxLiveClasses}</strong> Live Classes/mo
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right bg-white p-4 rounded-xl shadow-sm border border-emerald-100 min-w-[200px]">
                                        <p className="text-sm text-gray-500 mb-1">Valid Until</p>
                                        <p className="text-lg font-bold text-gray-900 mb-2">
                                            {new Date(user.mentorSubscription.expiry).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </p>
                                        {(() => {
                                            const daysLeft = Math.ceil((new Date(user.mentorSubscription.expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                            return (
                                                <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${daysLeft < 7 ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80" : "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                                                    {daysLeft > 0 ? `${daysLeft} Days Remaining` : "Expiring Soon"}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

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
