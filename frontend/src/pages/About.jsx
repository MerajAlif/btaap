import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  Target,
  Heart,
  Sparkles,
  BookOpen,
  GraduationCap,
  Shield,
  Zap,
  Globe,
  Award
} from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To democratize quality education by connecting learners with expert mentors and creating thriving learning communities across Bangladesh.",
      color: "emerald"
    },
    {
      icon: Heart,
      title: "Our Vision",
      description: "To become the leading platform where every student can access personalized mentorship and collaborative learning experiences.",
      color: "teal"
    },
    {
      icon: Sparkles,
      title: "Our Values",
      description: "Excellence, Accessibility, Community, Innovation, and Continuous Growth drive everything we do.",
      color: "blue"
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Expert Mentors",
      description: "Connect with verified industry professionals and experienced educators"
    },
    {
      icon: GraduationCap,
      title: "Thriving Communities",
      description: "Join learning groups led by mentors or create your own study communities"
    },
    {
      icon: BookOpen,
      title: "Rich Resources",
      description: "Access comprehensive study materials, PDFs, and curated learning paths"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Admin-monitored platform ensuring quality and safety for all users"
    },
    {
      icon: Zap,
      title: "Interactive Learning",
      description: "Live classes, real-time chat, tasks, and leaderboards for engagement"
    },
    {
      icon: Globe,
      title: "Accessible Anywhere",
      description: "Learn at your own pace from anywhere with our user-friendly platform"
    }
  ];

  const stats = [
    { number: "5,000+", label: "Active Students" },
    { number: "200+", label: "Expert Mentors" },
    { number: "500+", label: "Communities" },
    { number: "10,000+", label: "Resources Shared" }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-white" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 text-sm font-medium rounded-full mb-6">
            <Sparkles className="w-4 h-4 mr-2 inline-block text-emerald-600" />
            About Btaap
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
            Empowering Learners,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Building Futures
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Btaap is Bangladesh's premier learning platform that bridges the gap between ambitious learners and experienced mentors.
            We're building a community where knowledge flows freely and everyone can achieve their educational goals.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300">
              <Link to="/communities">
                Explore Communities
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700">
              <Link to="/mentors">Find a Mentor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-emerald-600 to-teal-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-emerald-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-bold tracking-wide uppercase mb-2 text-sm">Our Foundation</p>
            <h2 className="text-4xl font-extrabold text-gray-900">What Drives Us</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon;
              const colorClasses = {
                emerald: "bg-emerald-100 text-emerald-600",
                teal: "bg-teal-100 text-teal-600",
                blue: "bg-blue-100 text-blue-600"
              };

              return (
                <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl ${colorClasses[value.color]} flex items-center justify-center mb-6`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-4 md:px-8 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-bold tracking-wide uppercase mb-2 text-sm">Platform Features</p>
            <h2 className="text-4xl font-extrabold text-gray-900">Why Choose Btaap?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex gap-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OUR STORY SECTION */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-bold tracking-wide uppercase mb-2 text-sm">Our Journey</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">The Btaap Story</h2>
          </div>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Btaap was born from a simple observation: talented students in Bangladesh often struggle to find the right guidance
                  and mentorship to unlock their full potential. We saw a gap between ambitious learners and experienced professionals
                  who wanted to give back.
                </p>
                <p className="text-lg">
                  Our platform brings together the best of both worlds - creating a space where students can access personalized mentorship,
                  join vibrant learning communities, and access premium educational resources. Whether you're preparing for competitive exams,
                  learning new skills, or seeking career guidance, Btaap is your trusted companion.
                </p>
                <p className="text-lg">
                  Today, we're proud to serve thousands of students and hundreds of mentors across Bangladesh. Our community continues to
                  grow, driven by our commitment to making quality education accessible to everyone.
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-emerald-200">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Award className="w-6 h-6" />
                  <p className="font-semibold text-lg">
                    Trusted by students, educators, and professionals nationwide
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute inset-0 bg-emerald-600 rounded-[3rem] rotate-1 opacity-20 blur-xl" />
          <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2.5rem] p-12 md:p-20 text-center text-white overflow-hidden shadow-2xl">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-20 -mt-20 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/20 rounded-full -mr-20 -mb-20 blur-2xl" />

            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Join the Btaap Community</h2>
              <p className="text-emerald-50 text-xl max-w-2xl mx-auto">
                Whether you're a student seeking guidance or a professional ready to mentor, there's a place for you here.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="h-14 px-10 text-lg bg-white text-emerald-700 hover:bg-emerald-50 rounded-full font-bold shadow-lg">
                  <Link to="/register">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg border-2 border-emerald-400/30 bg-emerald-800/20 text-white hover:bg-emerald-800/40 rounded-full backdrop-blur-sm">
                  <Link to="/apply-mentor">Become a Mentor</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="py-12 text-center text-gray-500 text-sm bg-gray-50">
        <p>© {new Date().getFullYear()} Btaap Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}