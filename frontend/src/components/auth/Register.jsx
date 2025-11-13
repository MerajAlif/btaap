// src/components/auth/Register.jsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  // default role must match backend enum: 'student' | 'mentor' | 'admin'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    // Mentor-only UI fields (front-end helpers)
    expertiseInput: '',     // comma-separated text -> array for payload
    experience: '',
    credentials: '',
    linkedIn: '',
    portfolio: '',
    hourlyRate: ''
  });

  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const buildPayload = () => {
    // Always send primitive fields
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    // If mentor, include profile with at least one expertise
    if (form.role === 'mentor') {
      const expertise = (form.expertiseInput || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      payload.profile = {
        expertise,                         // REQUIRED by your backend for mentor
        experience: form.experience?.trim() || undefined,
        credentials: form.credentials?.trim() || undefined,
        linkedIn: form.linkedIn?.trim() || undefined,
        portfolio: form.portfolio?.trim() || undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      };
    }

    return payload;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setOk(''); setLoading(true);

    try {
      // Front-end guard: mentor must enter at least one expertise
      if (form.role === 'mentor') {
        const hasExpertise = (form.expertiseInput || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean).length > 0;

        if (!hasExpertise) {
          throw new Error('Mentors must provide at least one area of expertise');
        }
      }

      const payload = buildPayload();
      const res = await register(payload);

      const user = res.user || res?.data?.user;
      if (user?.role === 'mentor' && user?.approvalStatus !== 'approved') {
        setOk('Registration successful. Your mentor account is pending admin approval.');
        setTimeout(() => nav('/pending-approval', { replace: true }), 800);
      } else {
        setOk('Registration successful!');
        setTimeout(() => nav('/', { replace: true }), 800);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Choose a role. Mentors require admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {err && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Registration failed</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
          {ok && (
            <Alert className="mb-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{ok}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" value={form.name} onChange={onChange} required />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={onChange} required />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
              {form.role === 'mentor' && (
                <p className="text-xs text-amber-600 mt-1">
                  Mentor accounts must be approved by an admin before using mentor-only features.
                </p>
              )}
            </div>

            {form.role === 'mentor' && (
              <>
                <div>
                  <Label htmlFor="expertise">Areas of expertise <span className="text-red-500">*</span></Label>
                  <Input
                    id="expertise"
                    name="expertiseInput"
                    placeholder="e.g., React, Node.js, MongoDB"
                    value={form.expertiseInput}
                    onChange={onChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter one or more, separated by commas.
                  </p>
                </div>

                <div>
                  <Label htmlFor="experience">Experience (optional)</Label>
                  <Input
                    id="experience"
                    name="experience"
                    placeholder="e.g., 3+ years building MERN apps"
                    value={form.experience}
                    onChange={onChange}
                  />
                </div>

                <div>
                  <Label htmlFor="credentials">Credentials (optional)</Label>
                  <Input
                    id="credentials"
                    name="credentials"
                    placeholder="e.g., Certifications, notable work"
                    value={form.credentials}
                    onChange={onChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
                    <Input
                      id="linkedIn"
                      name="linkedIn"
                      placeholder="https://linkedin.com/in/username"
                      value={form.linkedIn}
                      onChange={onChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio (optional)</Label>
                    <Input
                      id="portfolio"
                      name="portfolio"
                      placeholder="https://your-portfolio.com"
                      value={form.portfolio}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly rate (optional)</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g., 20"
                    value={form.hourlyRate}
                    onChange={onChange}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
