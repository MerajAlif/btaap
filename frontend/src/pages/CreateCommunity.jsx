// src/pages/CreateCommunity.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCommunity } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import { Plus, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateCommunity() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    joinCost: 0,
    maxMembers: "",
    coverImage: "",
    autoApprove: false,
    isPrivate: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // ✅ Check credits before submitting
    const CREATION_COST = 25;
    if (user.credits < CREATION_COST) {
      setError(`You need ${CREATION_COST} credits to create a community. You have ${user.credits} credits.`);
      setSaving(false);
      return;
    }

    // Confirm with user
    const confirmed = window.confirm(
      `Creating a community will cost ${CREATION_COST} credits. You currently have ${user.credits} credits. Continue?`
    );
    
    if (!confirmed) {
      setSaving(false);
      return;
    }

    try {
      // Build payload
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        joinCost: Number(form.joinCost) || 0,
        maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
        coverImage: form.coverImage.trim(),
        settings: {
          autoApprove: form.autoApprove,
          isPrivate: form.isPrivate,
          allowPosts: true,
        },
      };

      const data = await createCommunity(payload);
      setSuccess(data.message || "Community created successfully!");
      
      // Refresh user data to update credits
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

  // Check authorization
  if (user?.role !== "mentor" || user?.approvalStatus !== "approved") {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Only approved mentors can create communities.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 flex items-center gap-3">
              <Plus className="w-8 h-8" />
              Create Community
            </h1>
            <p className="text-purple-700 mt-1">
              Build a space for your students to learn and grow
            </p>
            {/* ✅ Credit Info */}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Cost: 25 credits
              </Badge>
              <span className="text-sm text-gray-600">
                Your balance: <strong className={user?.credits >= 25 ? "text-green-600" : "text-red-600"}>
                  {user?.credits || 0} credits
                </strong>
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/communities")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        </div>

        {/* Messages */}
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

        {/* ✅ Insufficient Credits Warning */}
        {user?.credits < 25 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Insufficient Credits!</strong> You need 25 credits to create a community. 
              You currently have {user.credits} credits.{" "}
              <Link to="/pricing" className="underline font-semibold">
                Purchase credits here
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle>Community Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Community Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Advanced React Mastery"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What will students learn in this community?"
                  required
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {form.description.length}/1000 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g., Technology, Design, Business"
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="React, JavaScript, Frontend (comma separated)"
                />
                <p className="text-xs text-gray-500">
                  Separate tags with commas
                </p>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  value={form.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>

              {/* Join Cost */}
              <div className="space-y-2">
                <Label htmlFor="joinCost">Join Cost (Credits)</Label>
                <Input
                  id="joinCost"
                  name="joinCost"
                  type="number"
                  min="0"
                  value={form.joinCost}
                  onChange={handleChange}
                  placeholder="0 for free"
                />
                <p className="text-xs text-gray-500">
                  Set to 0 for a free community
                </p>
              </div>

              {/* Max Members */}
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members (optional)</Label>
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Settings */}
              <div className="space-y-4 pt-4 border-t border-purple-100">
                <h3 className="font-semibold text-gray-900">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoApprove">Auto-approve join requests</Label>
                    <p className="text-xs text-gray-500">
                      Students join instantly without your approval
                    </p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={form.autoApprove}
                    onCheckedChange={(checked) =>
                      setForm(prev => ({ ...prev, autoApprove: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPrivate">Private community</Label>
                    <p className="text-xs text-gray-500">
                      Only visible to invited members
                    </p>
                  </div>
                  <Switch
                    id="isPrivate"
                    checked={form.isPrivate}
                    onCheckedChange={(checked) =>
                      setForm(prev => ({ ...prev, isPrivate: checked }))
                    }
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/communities")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}