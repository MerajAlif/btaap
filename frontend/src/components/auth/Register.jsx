// src/components/auth/Register.jsx - UPDATED WITH BTAAP BRANDING
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { 
  BookOpen, 
  Users, 
  Sparkles, 
  Award, 
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); 
    setOk(''); 
    setLoading(true);

    try {
      // Validate password match
      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password length
      if (form.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'student', // Always register as student
      };

      const res = await register(payload);

      setOk('Registration successful! Welcome to Btaap! 🎉');
      setTimeout(() => nav('/', { replace: true }), 1500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Benefits */}
          <div className="space-y-8">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-emerald-900">Join Btaap</h1>
                  <p className="text-emerald-700">Your Learning Journey Starts Here</p>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                alt="Students learning together"
                className="w-full h-[400px] object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600/10b981/ffffff?text=Btaap+Learning";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Learn. Connect. Grow.</h3>
                <p className="text-emerald-100">Join thousands of students achieving their goals</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-emerald-900">What you'll get:</h3>
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-emerald-100">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900">Access PDF Library</h4>
                    <p className="text-sm text-gray-600">Thousands of educational resources at your fingertips</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-teal-100">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-teal-900">Join Communities</h4>
                    <p className="text-sm text-gray-600">Connect with mentors and fellow learners</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-cyan-100">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-900">Ask Questions</h4>
                    <p className="text-sm text-gray-600">Get help from our community of experts</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-amber-100">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900">Become a Mentor</h4>
                    <p className="text-sm text-gray-600">Share your knowledge and earn rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div>
            <Card className="border-emerald-200 shadow-xl">
              <CardHeader className="space-y-1 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="text-2xl text-emerald-900">Create Your Account</CardTitle>
                <CardDescription className="text-emerald-700">
                  Start your learning journey today - it's free!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Messages */}
                {err && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration failed</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}
                {ok && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Success!</AlertTitle>
                    <AlertDescription className="text-green-800">{ok}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={form.name} 
                      onChange={onChange} 
                      placeholder="John Doe"
                      required 
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={form.email} 
                      onChange={onChange}
                      placeholder="john@example.com"
                      required 
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      value={form.password} 
                      onChange={onChange}
                      placeholder="At least 6 characters"
                      required 
                      minLength={6}
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      value={form.confirmPassword} 
                      onChange={onChange}
                      placeholder="Re-enter your password"
                      required 
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900">
                          Want to become a mentor?
                        </p>
                        <p className="text-xs text-blue-700">
                          You can apply to become a mentor after registration from your profile settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Sign In Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Terms */}
                <p className="mt-6 text-xs text-center text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="underline hover:text-gray-700">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}