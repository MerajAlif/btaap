// src/pages/Home.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Search, BookOpen, Users, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function Home() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved mentors
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await api("/api/profiles/mentors?limit=4");
        setMentors(res.mentors || []);
      } catch (error) {
        console.error("Failed to fetch mentors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Hero Section */}
      <section className="relative py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Hero Image */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
                  alt="Student learning"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/800x600/10b981/ffffff?text=Btaap+Learning";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
              </div>
            </div>

            {/* Right: Action Cards */}
            <div className="order-1 lg:order-2 space-y-6">
              <Link to="/mentors">
                <Card className="group border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur">
                  <CardContent className="p-8 text-center space-y-2">
                    <Users className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-2xl font-bold text-emerald-900">
                      Search your MENTOR
                    </h3>
                    <p className="text-emerald-700">
                      Connect with expert mentors who can guide your learning journey
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/library">
                <Card className="group border-2 border-teal-200 hover:border-teal-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur">
                  <CardContent className="p-8 text-center space-y-2">
                    <BookOpen className="w-12 h-12 text-teal-600 mx-auto" />
                    <h3 className="text-2xl font-bold text-teal-900">
                      Your Favorite E-BOOKS
                    </h3>
                    <p className="text-teal-700">
                      Access thousands of PDFs across all subjects
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/communities">
                <Card className="group border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur">
                  <CardContent className="p-8 text-center space-y-2">
                    <Search className="w-12 h-12 text-cyan-600 mx-auto" />
                    <h3 className="text-2xl font-bold text-cyan-900">
                      Discover Btaap COMMUNITY
                    </h3>
                    <p className="text-cyan-700">
                      Join discussions, ask questions, and help others learn
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section className="py-12 px-4 md:px-8 bg-white/40 backdrop-blur">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900">
              Btaap Mentors
            </h2>
            <Button
              asChild
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-900"
            >
              <Link to="/mentors">
                see all
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse border-emerald-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full h-48 bg-emerald-100 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 bg-emerald-100 rounded w-3/4" />
                      <div className="h-3 bg-emerald-100 rounded w-full" />
                      <div className="h-3 bg-emerald-100 rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <Card className="border-emerald-200">
              <CardContent className="py-12 text-center text-emerald-700">
                No mentors available yet. Check back soon!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentors.map((mentor) => (
                <Card
                  key={mentor._id}
                  className="group border-emerald-200 hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 overflow-hidden bg-white"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Mentor Avatar */}
                    <div className="flex justify-center">
                      <Avatar className="w-32 h-32 border-4 border-emerald-200 group-hover:border-emerald-400 transition-colors">
                        <AvatarImage
                          src={mentor.profile?.avatar}
                          alt={mentor.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl font-bold">
                          {mentor.name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Mentor Info */}
                    <div className="text-center space-y-2">
                      <h3 className="font-bold text-lg text-emerald-900">
                        {mentor.name}
                      </h3>
                      {mentor.profile?.expertise?.length > 0 && (
                        <p className="text-sm text-emerald-700">
                          <span className="font-semibold">Expert: </span>
                          {mentor.profile.expertise.slice(0, 2).join(", ")}
                        </p>
                      )}
                      {mentor.profile?.education && (
                        <p className="text-sm text-emerald-600">
                          <span className="font-semibold">Education: </span>
                          {mentor.profile.education}
                        </p>
                      )}
                      {mentor.profile?.experience && (
                        <p className="text-xs text-emerald-600 line-clamp-2">
                          {mentor.profile.experience}
                        </p>
                      )}
                    </div>

                    {/* View Profile Button */}
                    <Button
                      asChild
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <Link to={`/profile/${mentor._id}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-600 to-teal-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

              <CardContent className="relative p-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Start Learning?
                </h2>
                <p className="text-xl text-emerald-50">
                  Join thousands of students achieving their goals with Btaap
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg text-lg px-8"
                  >
                    <Link to="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 text-lg px-8"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}