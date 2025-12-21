// src/components/auth/Login.jsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import {
  BookOpen,
  ArrowRight,
  AlertCircle,
  LogIn
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      const from = loc.state?.from || '/';
      nav(from, { replace: true });
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
          {/* Left Side - Branding & Illustration */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-emerald-900">Welcome Back</h1>
                  <p className="text-emerald-700">Continue Your Learning Journey</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop"
                alt="Student studying"
                className="w-full h-[400px] object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600/10b981/ffffff?text=Welcome+Back";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Ready to learn?</h3>
                <p className="text-emerald-100">Pick up right where you left off.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div>
            <Card className="border-emerald-200 shadow-xl">
              <CardHeader className="space-y-1 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="text-2xl text-emerald-900">Sign In</CardTitle>
                <CardDescription className="text-emerald-700">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {err && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login failed</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="hello@example.com"
                      required
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700">Password</Label>
                      <Link to="#" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <LogIn className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">
                      Create one
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
