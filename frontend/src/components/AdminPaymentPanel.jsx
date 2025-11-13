import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api"; // Use your API helper

export default function AdminPaymentPanel() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'pending' 
        ? '/api/payments/pending' 
        : filter === 'all'
        ? '/api/payments/all'
        : `/api/payments/all?status=${filter}`;
      
      const data = await api(endpoint);
      
      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert(error.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus, rejectionReason = '') => {
    setProcessing(paymentId);
    try {
      const data = await api(`/api/payments/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined
        })
      });

      if (data.success) {
        fetchPayments();
        alert(`Payment ${newStatus} successfully!`);
      } else {
        alert(`Failed to update payment: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert(error.message || 'Failed to update payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (paymentId) => {
    if (window.confirm('Are you sure you want to approve this payment?')) {
      handleStatusUpdate(paymentId, 'approved');
    }
  };

  const handleReject = (paymentId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason !== null) {
      handleStatusUpdate(paymentId, 'rejected', reason || 'Rejected by admin');
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.mobileNumber?.includes(searchTerm) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={`${styles[status]} capitalize`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-gray-600">Manage and approve credit purchase requests</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone, TxID, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={fetchPayments}
            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{payment.planName} Plan</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {formatDate(payment.createdAt)}
                    </p>
                    {payment.userId && (
                      <p className="text-xs text-gray-500 mt-1">
                        User: {payment.userId.name} ({payment.userId.email})
                      </p>
                    )}
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Mobile Number</p>
                    <p className="font-semibold">{payment.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono font-semibold">{payment.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-lg text-teal-600">৳{payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="font-semibold text-teal-600">{payment.credits} credits</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-semibold">{payment.reference}</p>
                  </div>
                  {payment.approvedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Processed At</p>
                      <p className="text-sm">{formatDate(payment.approvedAt)}</p>
                      {payment.approvedBy && (
                        <p className="text-xs text-gray-500">
                          By: {payment.approvedBy.name}
                        </p>
                      )}
                    </div>
                  )}
                  {payment.rejectionReason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Rejection Reason</p>
                      <p className="text-sm text-red-600">{payment.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {payment.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleApprove(payment._id)}
                      disabled={processing === payment._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === payment._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Approve & Add Credits
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(payment._id)}
                      disabled={processing === payment._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === payment._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}