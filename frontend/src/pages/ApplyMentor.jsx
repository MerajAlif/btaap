// src/pages/ApplyMentor.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
                  placeholder="React, Node.js, MongoDB, Python (comma separated)"
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
                  placeholder="e.g., 5+ years building full-stack applications, worked at major tech companies, led development teams..."
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
                  placeholder="AWS Certified, Published author, Conference speaker..."
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