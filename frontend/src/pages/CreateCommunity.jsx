import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCommunity } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import { Plus, ArrowLeft, CheckCircle, AlertCircle, Shield, GraduationCap } from "lucide-react";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (CREATION_COST > 0 && user.credits < CREATION_COST) {
      setError(`You need ${CREATION_COST} credits to create a community. You have ${user.credits} credits.`);
      setSaving(false);
      return;
    }

    if (CREATION_COST > 0) {
      const confirmed = window.confirm(
        `Creating a community will cost ${CREATION_COST} credits. You currently have ${user.credits} credits. Continue?`
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
        mentorSettings: user.role === "mentor" ? {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 flex items-center gap-3">
              <Plus className="w-8 h-8" />
              Create Community
            </h1>
            <p className="text-purple-700 mt-1">
              Build a space for your {user?.role === "mentor" ? "students" : "peers"} to learn and grow
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Cost: {CREATION_COST === 0 ? "Free" : `${CREATION_COST} credits`}
              </Badge>
              <span className="text-sm text-gray-600">
                Your balance: <strong className={user?.credits >= CREATION_COST ? "text-green-600" : "text-red-600"}>
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

        {user?.credits < CREATION_COST && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Insufficient Credits!</strong> You need {CREATION_COST} credits to create a community.
              You currently have {user.credits} credits.{" "}
              <Link to="/pricing" className="underline font-semibold">
                Purchase credits here
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle>Community Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {user?.role === "mentor" ? <Shield className="w-4 h-4 text-purple-600" /> : <GraduationCap className="w-4 h-4 text-blue-600" />}
                  Included Features ({user?.role === "mentor" ? "Mentor" : "Student"} Plan)
                </h3>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-3 h-3" /> Real-time Chat
                  </li>
                  <li className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-3 h-3" /> Resource Sharing
                  </li>
                  {user?.role === "mentor" ? (
                    <>
                      <li className="flex items-center gap-2 text-purple-700 font-medium">
                        <CheckCircle className="w-3 h-3" /> Live Classes
                      </li>
                      <li className="flex items-center gap-2 text-purple-700 font-medium">
                        <CheckCircle className="w-3 h-3" /> Announcements
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-gray-400">
                        <span className="w-3 h-3 rounded-full border border-gray-300 block"></span> Live Classes (Mentor only)
                      </li>
                      <li className="flex items-center gap-2 text-gray-400">
                        <span className="w-3 h-3 rounded-full border border-gray-300 block"></span> Announcements (Mentor only)
                      </li>
                    </>
                  )}
                </ul>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What will members learn in this community?"
                  required
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {form.description.length}/1000 characters
                </p>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members (optional)</Label>
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={handleChange}
                  placeholder="Leave blank for unlimited"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Privacy Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPrivate">Private community</Label>
                    <p className="text-xs text-gray-500">Only visible to members</p>
                  </div>
                  <Switch
                    id="isPrivate"
                    checked={form.isPrivate}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, isPrivate: checked }))}
                  />
                </div>
              </div>

              {user?.role === "mentor" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-purple-900">Mentor Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bkashNumber">Bkash Number (for payments)</Label>
                      <Input
                        id="bkashNumber"
                        name="bkashNumber"
                        value={form.bkashNumber}
                        onChange={handleChange}
                        placeholder="017..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyFee">Monthly Fee (BDT)</Label>
                      <Input
                        id="monthlyFee"
                        name="monthlyFee"
                        type="number"
                        min="0"
                        value={form.monthlyFee}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classesPerMonth">Classes per Month</Label>
                      <Input
                        id="classesPerMonth"
                        name="classesPerMonth"
                        type="number"
                        min="1"
                        value={form.classesPerMonth}
                        onChange={handleChange}
                        placeholder="e.g. 8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="curriculumDescription">Month's Plan (Curriculum)</Label>
                    <Textarea
                      id="curriculumDescription"
                      name="curriculumDescription"
                      value={form.curriculumDescription}
                      onChange={handleChange}
                      placeholder="Outline what students will learn this month..."
                      rows={4}
                      maxLength={2000}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
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
              disabled={saving || user?.credits < CREATION_COST}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {saving ? "Creating..." : `Create Community (${CREATION_COST === 0 ? "Free" : `${CREATION_COST} credits`})`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}