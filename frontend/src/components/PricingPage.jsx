import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

const plans = [
  {
    name: "Basic",
    price: "৳100",
    priceNum: 100,
    credits: 250,
    validity: "1 month",
    description: "Perfect for getting started",
    features: ["250 Credits", "Valid for 1 month", "Basic support", "PDF viewer access"],
    featured: false,
  },
  {
    name: "Standard",
    price: "৳300",
    priceNum: 300,
    credits: 800,
    validity: "1 month",
    description: "Most popular choice",
    features: ["800 Credits", "Valid for 1 month", "Priority support", "Advanced features"],
    featured: true,
  },
  {
    name: "Premium",
    price: "৳550",
    priceNum: 550,
    credits: 1500,
    validity: "1 month",
    description: "Best value for money",
    features: ["1500 Credits", "Valid for 1 month", "Premium support", "All features unlocked"],
    featured: false,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBkashInstructions, setShowBkashInstructions] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [bkashAccount, setBkashAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleGetStarted = (plan) => {
    if (!user) {
      alert("Please login to purchase credits");
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayWithBkash = () => {
    if (!bkashAccount || bkashAccount.length < 11) {
      alert("Please enter a valid bKash number");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowPaymentModal(false);
      setShowBkashInstructions(true);
    }, 1000);
  };

  const handleTransactionSubmit = async () => {
    if (!transactionId) {
      alert("Please enter transaction ID");
      return;
    }
    
    setProcessing(true);
    
    try {
      const paymentData = {
        mobileNumber: bkashAccount,
        transactionId: transactionId,
        amount: selectedPlan?.priceNum,
        planName: selectedPlan?.name,
        credits: selectedPlan?.credits,
        reference: "MCJ053"
      };
      
      await api('/api/payments/submit', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      
      setProcessing(false);
      setShowBkashInstructions(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
        setBkashAccount("");
        setTransactionId("");
        setSelectedPlan(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert(error.message || 'Error submitting payment. Please try again.');
      setProcessing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else if (type === 'ref') {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Credit Packages</h1>
        <p className="text-xl text-muted-foreground">Choose the package that fits your needs</p>
        <p className="text-sm text-gray-500 mt-2">All credits valid for 1 month from purchase date</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${plan.featured ? "border-teal-500 shadow-lg" : ""}`}
          >
            {plan.featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <div className="text-teal-600 font-semibold mt-1">
                  {plan.credits} Credits
                </div>
                <div className="text-sm text-gray-500">
                  Valid for {plan.validity}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleGetStarted(plan)}
                className={`w-full py-2 rounded-md font-medium transition-colors ${
                  plan.featured
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Purchase Now
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Policy */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Credit Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Credits are valid for 1 month from the date of purchase</p>
          <p>• 1 Credit = 1 PDF view/download action</p>
          <p>• Unused credits will expire after the validity period</p>
          <p>• Credits are non-refundable once payment is approved</p>
          <p>• Contact support for any issues with credit deduction</p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-t-lg">
              <button
                onClick={() => !processing && setShowPaymentModal(false)}
                className="text-white mb-2"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-white text-lg font-semibold text-center">
                Pay with bKash
              </h3>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-teal-600">
                  {selectedPlan?.price}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedPlan?.credits} Credits
                </div>
              </div>

              <input
                type="text"
                placeholder="Your bKash Number (e.g., 01XXXXXXXXX)"
                value={bkashAccount}
                onChange={(e) => setBkashAccount(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={processing}
              />

              <p className="text-xs text-center text-gray-600 mb-4">
                After entering your number, you'll receive payment instructions
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !processing && setShowPaymentModal(false)}
                  disabled={processing}
                  className="py-3 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayWithBkash}
                  disabled={processing || !bkashAccount}
                  className="py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* bKash Instructions Modal */}
      {showBkashInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white p-3 rounded-t-lg border-b sticky top-0">
              <button
                onClick={() => !processing && setShowBkashInstructions(false)}
                className="text-gray-600 text-sm"
              >
                ← Back
              </button>
              <div className="text-center font-bold text-teal-600 mt-2">
                Payment Instructions
              </div>
            </div>

            <div className="p-4">
              <div className="bg-teal-50 border-l-4 border-teal-600 p-3 mb-4">
                <h3 className="font-semibold text-sm text-teal-800 mb-1">
                  Follow these steps:
                </h3>
                <ol className="text-xs text-teal-900 space-y-1">
                  <li>1. Open your bKash app</li>
                  <li>2. Go to "Send Money"</li>
                  <li>3. Send to: 01752525130</li>
                  <li>4. Amount: {selectedPlan?.price}</li>
                  <li>5. Reference: MCJ053</li>
                </ol>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Send to:</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold">01752525130</span>
                    <button
                      onClick={() => copyToClipboard("01752525130", "phone")}
                      className={`px-2.5 py-1 text-white text-xs rounded ${
                        copiedPhone ? 'bg-green-500' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      {copiedPhone ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Reference:</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold">MCJ053</span>
                    <button
                      onClick={() => copyToClipboard("MCJ053", "ref")}
                      className={`px-2.5 py-1 text-white text-xs rounded ${
                        copiedRef ? 'bg-green-500' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      {copiedRef ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Amount:</div>
                  <div className="font-mono font-bold">{selectedPlan?.price}</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-2.5 rounded-lg mb-3">
                <p className="text-xs text-yellow-800">
                  After completing payment, enter your Transaction ID below:
                </p>
              </div>

              <input
                type="text"
                placeholder="Transaction ID (e.g., 9A4B7C8D2E)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={processing}
              />

              <button
                onClick={handleTransactionSubmit}
                disabled={processing || !transactionId}
                className="w-full py-2.5 bg-teal-600 text-white text-sm rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Submitted!</h2>
            <p className="text-gray-600 mb-2">We're verifying your payment</p>
            <p className="text-sm text-gray-500">
              You'll receive your credits once the payment is approved by our team.
              This usually takes a few minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}