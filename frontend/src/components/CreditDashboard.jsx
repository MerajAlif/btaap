import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, History, AlertCircle, RefreshCcw } from "lucide-react";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function CreditDashboard() {
  const { user, refreshMe } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const data = await api("/api/payments/my-payments");
      setPayments(data.data || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCredits = async () => {
    setRefreshing(true);
    await refreshMe();
    setTimeout(() => setRefreshing(false), 600);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const daysUntilExpiry = user?.creditExpiry
    ? Math.ceil(
        (new Date(user.creditExpiry) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Credit Dashboard</h1>
          <p className="text-sm text-gray-500">
            Manage your credits, check validity, and review payment history.
          </p>
        </div>
        <Button
          onClick={handleRefreshCredits}
          variant="outline"
          className="flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Credit Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="col-span-2 shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Available Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-teal-600">
              {user?.credits ?? 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Credits available for use
            </p>
            <Link
              to="/pricing"
              className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Buy More Credits
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="w-5 h-5 text-teal-600" />
              Validity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.creditExpiry ? (
              isExpired ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Expired</span>
                </div>
              ) : (
                <>
                  <div
                    className={`text-2xl font-bold ${
                      isExpiringSoon ? "text-orange-600" : "text-teal-600"
                    }`}
                  >
                    {daysUntilExpiry} days
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {formatDate(user.creditExpiry)}
                  </p>
                  {isExpiringSoon && (
                    <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Expiring soon!
                    </div>
                  )}
                </>
              )
            ) : (
              <p className="text-sm text-gray-500">No active credits</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <History className="w-5 h-5 text-teal-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No payment history</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium">{payment.planName} Plan</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      TxID: {payment.transactionId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-teal-600">
                      +{payment.credits} credits
                    </div>
                    <div className="text-sm text-gray-500">
                      ৳{payment.amount}
                    </div>
                    <Badge className={`mt-1 capitalize ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Info */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 leading-relaxed">
          <p>• <strong>1 Credit = 1 PDF Action</strong> (view or download)</p>
          <p>• Credits are valid for <strong>1 month</strong> from purchase</p>
          <p>• Unused credits expire automatically after the validity period</p>
          <p>• Credits are deducted automatically on each PDF action</p>
          <p>• Monitor your balance and transactions right here anytime</p>
        </CardContent>
      </Card>
    </div>
  );
}
