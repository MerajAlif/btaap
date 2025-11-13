import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { 
  User, 
  Mail, 
  Edit2, 
  Save, 
  X, 
  Lock, 
  Shield, 
  Briefcase,
  Award,
  Link2,
  DollarSign,
  Check
} from "lucide-react";

export default function Profile() {
  const { user: authUser, isMentor, isAdmin, loading: authLoading, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  
  // Edit modes
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");

  // Mentor-only fields
  const [expertiseInput, setExpertiseInput] = useState("");
  const [experience, setExperience] = useState("");
  const [credentials, setCredentials] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setLoading(true);
      setErr("");
      setOk("");

      try {
        let u = authUser;

        if (!u) {
          const res = await api("/api/auth/me");
          u = res.user || {};
        }

        if (ignore || !u) return;

        setName(u.name || "");
        setEmail(u.email || "");
        setRole(u.role || "");
        setApprovalStatus(u.approvalStatus || "");

        const p = u.profile || {};
        setExpertiseInput((p.expertise || []).join(", "));
        setExperience(p.experience || "");
        setCredentials(p.credentials || "");
        setLinkedIn(p.linkedIn || "");
        setPortfolio(p.portfolio || "");
        setHourlyRate(p.hourlyRate ?? "");
      } catch (e) {
        setErr(e.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProfile();
    return () => { ignore = true; };
  }, [authUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setOk("");

    try {
      const payload = { name };

      if (role === "mentor") {
        const expertise = (expertiseInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        payload.profile = {
          expertise,
          experience: experience || undefined,
          credentials: credentials || undefined,
          linkedIn: linkedIn || undefined,
          portfolio: portfolio || undefined,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        };
      }

      await api("/api/auth/updateprofile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await refreshUser();
      setOk("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => setOk(""), 3000);
    } catch (e) {
      setErr(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwdSaving(true);
    setErr("");
    setOk("");

    try {
      await api("/api/auth/updatepassword", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setOk("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
      
      setTimeout(() => setOk(""), 3000);
    } catch (e) {
      setErr(e.message || "Failed to update password");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErr("");
    // Reset to original values
    if (authUser) {
      setName(authUser.name || "");
      const p = authUser.profile || {};
      setExpertiseInput((p.expertise || []).join(", "));
      setExperience(p.experience || "");
      setCredentials(p.credentials || "");
      setLinkedIn(p.linkedIn || "");
      setPortfolio(p.portfolio || "");
      setHourlyRate(p.hourlyRate ?? "");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{name || "User"}</h1>
              <p className="text-teal-50 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-white/30 capitalize">
                  {role || "user"}
                </Badge>
                {isMentor && (
                  <Badge
                    className={
                      approvalStatus === "approved"
                        ? "bg-green-500/90 text-white"
                        : approvalStatus === "rejected"
                        ? "bg-red-500/90 text-white"
                        : "bg-yellow-500/90 text-white"
                    }
                  >
                    {approvalStatus || "pending"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/admin/mentors">Mentor Panel</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link to="/admin/payments">Payments</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <X className="w-5 h-5" />
          {err}
        </div>
      )}
      {ok && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-800">
          <Check className="w-5 h-5" />
          {ok}
        </div>
      )}

      {/* Account Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Account Information
            </CardTitle>
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 bg-teal-600 hover:bg-teal-700"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!isEditing ? (
            // View Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-gray-500 text-sm">Full Name</Label>
                <p className="text-lg font-medium">{name || "—"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-500 text-sm">Email Address</Label>
                <p className="text-lg font-medium">{email || "—"}</p>
              </div>
              
              {role === "mentor" && (
                <>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-gray-500 text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Expertise
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {expertiseInput ? expertiseInput.split(",").map((exp, i) => (
                        <Badge key={i} variant="secondary" className="bg-teal-50 text-teal-700">
                          {exp.trim()}
                        </Badge>
                      )) : <p className="text-gray-400">No expertise added</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-gray-500 text-sm">Experience</Label>
                    <p className="text-lg">{experience || "—"}</p>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-gray-500 text-sm flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Credentials
                    </Label>
                    <p className="text-lg">{credentials || "—"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-sm flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      LinkedIn
                    </Label>
                    {linkedIn ? (
                      <a href={linkedIn} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                        View Profile
                      </a>
                    ) : (
                      <p className="text-gray-400">—</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-sm flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Portfolio
                    </Label>
                    {portfolio ? (
                      <a href={portfolio} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                        View Portfolio
                      </a>
                    ) : (
                      <p className="text-gray-400">—</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Hourly Rate
                    </Label>
                    <p className="text-lg font-medium">{hourlyRate ? `$${hourlyRate}/hr` : "—"}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={email} 
                    disabled 
                    className="h-11 bg-gray-50"
                  />
                </div>
              </div>

              {role === "mentor" && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    Mentor Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Areas of Expertise</Label>
                    <Input
                      id="expertise"
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      placeholder="React, Node.js, MongoDB (comma separated)"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Separate multiple skills with commas</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g., 5+ years building full-stack applications"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="credentials">Credentials & Certifications</Label>
                    <Input
                      id="credentials"
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      placeholder="AWS Certified, Published author, etc."
                      className="h-11"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                      <Input
                        id="linkedIn"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio Website</Label>
                      <Input
                        id="portfolio"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="50"
                      className="h-11 max-w-xs"
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Security
            </CardTitle>
            {!showPasswordForm && (
              <Button 
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!showPasswordForm ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Lock className="w-5 h-5" />
              <div>
                <p className="font-medium text-gray-700">Password</p>
                <p className="text-sm">Last updated: Recently</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500">Must be at least 6 characters</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setErr("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={pwdSaving}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {pwdSaving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}