import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCommunity } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import {
  Plus, ArrowLeft, CheckCircle, AlertCircle, Shield, GraduationCap,
  Sparkles, Lock, Globe, Image as ImageIcon, CreditCard
} from "lucide-react";

export default function CreateCommunity() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    maxMembers: "",
    coverImage: "",
    isPrivate: false,
    // Mentor specific
    bkashNumber: "",
    monthlyFee: "",
    classesPerMonth: "",
    curriculumDescription: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const CREATION_COST = user?.role === "student" ? 0 : 10;
  const isMentor = user?.role === "mentor";

  // Subscription & Limits Check
  const subscriptionActive = user?.mentorSubscription?.isActive;
  const maxCommunities = user?.mentorSubscription?.maxCommunities || 0;
  // Fallback to 0 if communities array not yet populated in context
  const currentCommunities = user?.communities?.length || 0;
  const limitReached = isMentor && (currentCommunities >= maxCommunities);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (isMentor && !subscriptionActive) {
      setError("You need an active mentor subscription to create communities.");
      setSaving(false);
      return;
    }

    if (isMentor && limitReached) {
      setError(`You have reached your limit of ${maxCommunities} communities. Please upgrade your plan.`);
      setSaving(false);
      return;
    }


    if (CREATION_COST > 0 && user.credits < CREATION_COST) {
      setError(`You need ${CREATION_COST} credits to create a community. You have ${user.credits} credits.`);
      setSaving(false);
      return;
    }

    if (CREATION_COST > 0) {
      const confirmed = window.confirm(
        `Creating a community will cost ${CREATION_COST} credits.\nCurrent Balance: ${user.credits}\n\nContinue?`
      );

      if (!confirmed) {
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
        coverImage: form.coverImage.trim(),
        settings: {
          isPrivate: form.isPrivate,
          allowPosts: true,
        },
        mentorSettings: isMentor ? {
          bkashNumber: form.bkashNumber,
          monthlyFee: Number(form.monthlyFee),
          classesPerMonth: Number(form.classesPerMonth),
          curriculumDescription: form.curriculumDescription,
        } : {},
      };

      const data = await createCommunity(payload);
      setSuccess(data.message || "Community created successfully!");

      await refreshMe();

      setTimeout(() => {
        navigate(`/communities/${data.community._id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create community");
    } finally {
      setSaving(false);
    }
  };

  // BLOCKING VIEW: No Subscription
  if (isMentor && !subscriptionActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl bg-white overflow-hidden">
          <div className="h-2 bg-red-500 w-full" />
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Subscription Expired
              </h3>
              <p className="text-gray-500 mb-8 px-4">
                Your mentor subscription is not active. Please renew to create new communities.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full">
                  <Link to="/pricing">
                    Renew Subscription
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // BLOCKING VIEW: Limit Reached
  if (isMentor && limitReached) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl bg-white overflow-hidden">
          <div className="h-2 bg-amber-500 w-full" />
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Community Limit Reached
              </h3>
              <p className="text-gray-500 mb-2 px-4">
                You have created <strong>{currentCommunities}</strong> out of <strong>{maxCommunities}</strong> allowed communities.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Upgrade your plan to create more.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full">
                  <Link to="/pricing">
                    Upgrade Plan
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Community</h1>
            <p className="text-gray-500">Launch your new learning space in seconds.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/communities")} className="hidden sm:flex rounded-full border-gray-300 hover:border-gray-400">
            Cancel
          </Button>
        </div>

        {/* Status Alerts */}
        {error && (
          <Alert variant="destructive" className="animate-in zoom-in-95">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-emerald-50 border-emerald-200 animate-in zoom-in-95">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Info */}
        <div className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl shadow-sm border border-emerald-100/50">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-gray-600">Creation Cost: </span>
            <span className="font-semibold text-gray-900">{CREATION_COST === 0 ? "Free" : `${CREATION_COST} credits`}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-600">Your Balance: </span>
            <span className={`font-bold ${user?.credits >= CREATION_COST ? "text-emerald-600" : "text-red-500"}`}>
              {user?.credits || 0}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Main Info Card */}
          <Card className="border-0 shadow-lg shadow-emerald-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Basic Details
              </CardTitle>
              <CardDescription>Tell people what your community is about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required maxLength={100} placeholder="e.g. Full Stack Developers Hub" className="h-11 focus-visible:ring-emerald-500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea id="description" name="description" value={form.description} onChange={handleChange} required rows={4} maxLength={1000} placeholder="Describe the purpose/goals of your community..." className="resize-none focus-visible:ring-emerald-500" />
                <p className="text-xs text-gray-400 text-right">{form.description.length}/1000</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Input id="category" name="category" value={form.category} onChange={handleChange} required placeholder="e.g. Technology" className="h-11 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="react, nodejs, ui/ux" className="h-11 focus-visible:ring-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage" className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Cover Image URL</Label>
                <Input id="coverImage" name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://..." type="url" className="h-11 focus-visible:ring-emerald-500" />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Settings Card */}
          <Card className="border-0 shadow-md shadow-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-gray-500" />
                Access & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {form.isPrivate ? <Lock className="w-4 h-4 text-gray-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                    <span className="font-medium text-gray-900">Private Community</span>
                  </div>
                  <p className="text-sm text-gray-500 pl-6">
                    {form.isPrivate ? "Only approved members can see content." : "Anyone can see content and join."}
                  </p>
                </div>
                <Switch checked={form.isPrivate} onCheckedChange={(c) => setForm(p => ({ ...p, isPrivate: c }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members (Leave blank for unlimited)</Label>
                <Input id="maxMembers" name="maxMembers" type="number" min="1" value={form.maxMembers} onChange={handleChange} placeholder="Unlimited" className="h-11" />
              </div>
            </CardContent>
          </Card>

          {/* Mentor Settings (Conditional) */}
          {isMentor && (
            <Card className="border-0 shadow-lg shadow-purple-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 bg-purple-100 rounded-bl-3xl opacity-50">
                <GraduationCap className="w-8 h-8 text-purple-300" />
              </div>
              <CardHeader>
                <CardTitle className="text-purple-900">Mentor Settings</CardTitle>
                <CardDescription>Monetize your community and set curriculum.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Fee (BDT)</Label>
                    <Input name="monthlyFee" type="number" min="0" value={form.monthlyFee} onChange={handleChange} placeholder="0 for Free" className="h-11 border-purple-200 focus-visible:ring-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bkash Number</Label>
                    <Input name="bkashNumber" value={form.bkashNumber} onChange={handleChange} placeholder="017..." className="h-11 border-purple-200 focus-visible:ring-purple-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Classes per Month</Label>
                  <Input name="classesPerMonth" type="number" min="0" value={form.classesPerMonth} onChange={handleChange} className="h-11 border-purple-200 focus-visible:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Curriculum</Label>
                  <Textarea name="curriculumDescription" value={form.curriculumDescription} onChange={handleChange} rows={3} placeholder="What will be covered this month?" className="border-purple-200 focus-visible:ring-purple-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 pb-8">
            <Button type="button" variant="ghost" onClick={() => navigate("/communities")} className="flex-1 h-12 rounded-full text-gray-500 hover:text-gray-900">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!isMentor && user?.credits < CREATION_COST)} className="flex-[2] h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-lg shadow-lg shadow-emerald-200">
              {saving ? "Creating..." : "Create Community"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}