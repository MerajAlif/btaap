// src/pages/ApplyMentor.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { applyAsMentor } from "@/lib/profileApi";
import useAuth from "@/hooks/useAuth";
import { Award, CheckCircle, AlertCircle } from "lucide-react";

export default function ApplyMentor() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    expertise: "",
    experience: "",
    credentials: "",
    bio: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Build payload
      const payload = {
        expertise: form.expertise.split(",").map(s => s.trim()).filter(Boolean),
        experience: form.experience.trim(),
        credentials: form.credentials.trim() || undefined,
        bio: form.bio.trim() || undefined,
      };

      if (payload.expertise.length === 0) {
        throw new Error("Please provide at least one area of expertise");
      }

      if (!payload.experience) {
        throw new Error("Please provide your experience");
      }

      await applyAsMentor(payload);
      await refreshMe();

      setSuccess("Application submitted successfully! Awaiting admin approval.");

      setTimeout(() => {
        navigate("/pending-approval");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if already a mentor
  if (user?.role === "mentor") {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You're already a mentor! Your status: <strong>{user.approvalStatus}</strong>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check valid subscription (New Requirement)
  if (!user?.mentorSubscription?.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl bg-white">
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Mentor Subscription Required
              </h3>
              <p className="text-gray-500 mb-8 px-4">
                To become a mentor and create communities, you must have an active Mentor Subscription plan.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
                  <Link to="/pricing">
                    View Subscription Plans
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
            <Award className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-teal-900">Become a Mentor</h1>
          <p className="text-teal-700 max-w-2xl mx-auto">
            Share your knowledge and help students grow. Fill out this application to become an approved mentor on Btaap.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-teal-200">
            <CardHeader>
              <CardTitle>Mentor Application</CardTitle>
              <CardDescription>
                Tell us about your expertise and experience. Our admin team will review your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise">
                  Areas of Expertise <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expertise"
                  name="expertise"
                  value={form.expertise}
                  onChange={handleChange}
                  placeholder="Physics, Chemistry, Biology, Math, etc."
                  required
                />
                <p className="text-xs text-gray-500">
                  List your main areas of expertise, separated by commas
                </p>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">
                  Experience <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="For example: 5+ years of experience in physics, chemistry, biology, math, etc."
                  required
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  Describe your professional experience and background
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-2">
                <Label htmlFor="credentials">
                  Credentials & Certifications (optional)
                </Label>
                <Input
                  id="credentials"
                  name="credentials"
                  value={form.credentials}
                  onChange={handleChange}
                  placeholder="For example: Physics Olympiad, Chemistry Olympiad, Biology Olympiad, Math Olympiad, etc."
                />
                <p className="text-xs text-gray-500">
                  Any relevant certifications, awards, or achievements
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">
                  Bio (optional)
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell students about yourself and your teaching philosophy..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {form.bio.length}/500 characters
                </p>
              </div>

              {/* Info Box */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>What happens next?</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Your application will be reviewed by our admin team</li>
                    <li>• You'll receive an email notification once approved</li>
                    <li>• After approval, you can create communities and start mentoring</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}