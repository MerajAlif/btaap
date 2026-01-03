import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, Users, Sparkles, ShieldCheck, MessageSquare, Star, AlertCircle, Coins, Crown, Zap, Video, Database } from "lucide-react";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

const creditPlans = [
  {
    id: "mini_credit",
    type: "credit",
    name: "Mini",
    price: "৳50",
    priceNum: 50,
    credits: 50,
    amountStr: "50 Credits",
    validity: "30 days",
    description: "Quick update for students",
    features: ["50 Credits", "Valid for 30 days", "Instant Access"],
    featured: false,
    color: "emerald",
  },
  {
    id: "standard_credit",
    type: "credit",
    name: "Standard",
    price: "৳100",
    priceNum: 100,
    credits: 105,
    amountStr: "105 Credits",
    validity: "30 days",
    description: "Best for regular students",
    features: ["105 Credits (5% Bonus)", "Valid for 30 days", "Standard Support"],
    featured: true,
    color: "teal",
  },
  {
    id: "premium_credit",
    type: "credit",
    name: "Premium",
    price: "৳200",
    priceNum: 200,
    credits: 220,
    amountStr: "220 Credits",
    validity: "30 days",
    description: "Maximum value pack",
    features: ["220 Credits (10% Bonus)", "Valid for 30 days", "Priority Support"],
    featured: false,
    color: "blue",
  },
];

const subscriptionPlans = [
  {
    id: "starter_sub",
    type: "subscription",
    name: "Starter",
    price: "৳500",
    priceNum: 500,
    features: ["1 Community Created", "8 Live Classes/month", "Access other mentor communities", "Standard Support"],
    description: "Perfect for new mentors",
    featured: false,
    color: "purple",
  },
  {
    id: "pro_sub",
    type: "subscription",
    name: "Professional",
    price: "৳1,500",
    priceNum: 1500,
    features: ["3 Communities Created", "25 Live Classes/month", "Access other mentor communities", "Analytics Dashboard"],
    description: "For serious community builders",
    featured: true,
    color: "indigo",
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
      alert("Please login to purchase plans");
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
        type: selectedPlan?.type,
        planId: selectedPlan?.id,
        credits: selectedPlan?.credits || 0,
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
    <div className="min-h-screen bg-gray-50/50 selection:bg-emerald-100 pb-20">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-blue-50/20 to-white" />

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-1">
            Student Friendly & Mentor Focused
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900 tracking-tight">
            Plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Everyone</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Affordable credits for students and powerful subscription tools for mentors.
          </p>
        </div>

        <Tabs defaultValue="credits" className="w-full max-w-5xl mx-auto">
          <div className="flex justify-center mb-10">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-white border shadow-sm">
              <TabsTrigger value="credits" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-gray-600">
                <Coins className="w-4 h-4 mr-2" />
                Student Credits
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-gray-600">
                <Crown className="w-4 h-4 mr-2" />
                Mentor Subscriptions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="credits">
            <div className="mb-8 text-center">
              <p className="text-gray-600 mb-2">Credits used for accessing premium content. Any user can purchase these.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0">
              {creditPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative border-2 transition-all hover:shadow-lg ${plan.featured ? "border-teal-500 shadow-xl scale-105 z-10" : "border-gray-100 hover:border-gray-200"}`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Best Value
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {plan.name}
                      <Badge variant="secondary" className="bg-gray-100">{plan.amountStr}</Badge>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 flex-shrink-0 text-${plan.color}-500`} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <button
                      onClick={() => handleGetStarted(plan)}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${plan.featured
                        ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-lg hover:opacity-90"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                    >
                      Buy Credits
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="mb-8 text-center">
              <p className="text-gray-600">Monthly subscriptions for Mentors to manage communities and live classes.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative border-2 transition-all hover:shadow-lg ${plan.featured ? "border-indigo-500 shadow-xl scale-105 z-10" : "border-gray-100 hover:border-gray-200"}`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Recommended
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 font-medium">/ month</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 flex-shrink-0 text-${plan.color}-600`} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <button
                      onClick={() => handleGetStarted(plan)}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${plan.featured
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
                        : "bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50"
                        }`}
                    >
                      Subscribe Now
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Pay with bKash</h3>
                  <p className="text-gray-300 text-sm mt-1">Complete your purchase securely</p>
                </div>
                <button onClick={() => !processing && setShowPaymentModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <div className="text-sm font-medium text-emerald-800 mb-1">Total Amount</div>
                  <div className="text-3xl font-bold text-emerald-600">{selectedPlan?.price}</div>
                  <div className="text-xs text-emerald-600 mt-1">{selectedPlan?.name} {selectedPlan?.type === 'credit' ? 'Credit Package' : 'Subscription'}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your bKash Number</label>
                    <input
                      type="text"
                      placeholder="e.g., 01XXXXXXXXX"
                      value={bkashAccount}
                      onChange={(e) => setBkashAccount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => !processing && setShowPaymentModal(false)}
                    disabled={processing}
                    className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayWithBkash}
                    disabled={processing || !bkashAccount}
                    className="py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing</> : "Continue"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* bKash Instructions Modal */}
        {showBkashInstructions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-pink-600 p-4 text-white flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => !processing && setShowBkashInstructions(false)} className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-medium">
                  ← Back
                </button>
                <span className="font-bold">Payment Instructions</span>
                <div className="w-8"></div> {/* Spacer */}
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                  <h3 className="font-bold text-pink-700 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Steps to Follow
                  </h3>
                  <ol className="text-sm text-pink-900 space-y-1.5 ml-1">
                    <li>1. Open bKash App & tap <strong>Send Money</strong></li>
                    <li>2. Enter Number: <strong>01752525130</strong></li>
                    <li>3. Enter Amount: <strong>{selectedPlan?.price}</strong></li>
                    <li>4. Reference: <strong>MCJ053</strong></li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div><p className="text-xs text-gray-500">Send Money To</p><p className="font-mono font-bold text-gray-900">01752525130</p></div>
                    <button onClick={() => copyToClipboard("01752525130", "phone")} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600">
                      {copiedPhone ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div><p className="text-xs text-gray-500">Amount</p><p className="font-mono font-bold text-gray-900">{selectedPlan?.price}</p></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g., 9A4B7C8D2E"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={processing}
                  />
                </div>

                <button
                  onClick={handleTransactionSubmit}
                  disabled={processing || !transactionId}
                  className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                >
                  {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                We have received your payment information. Your {selectedPlan?.type === 'credit' ? 'credits' : 'subscription'} will be activated shortly after verification.
              </p>
              <button onClick={() => setShowSuccessMessage(false)} className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}