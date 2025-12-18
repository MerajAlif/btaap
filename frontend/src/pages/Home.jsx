import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Search, BookOpen, Users, ArrowRight, Star, ShieldCheck, Sparkles, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { api, BASE_URL } from "@/lib/api";

export default function Home() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved mentors and popular communities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mentorsRes, communitiesRes] = await Promise.all([
          api("/api/profiles/mentors?limit=4"),
          api("/api/communities?limit=6&sort=-statistics.totalMembers")
        ]);
        setMentors(mentorsRes.mentors || []);
        setCommunities(communitiesRes.communities || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-white" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 fade-in order-2 lg:order-1">
              <div className="space-y-4">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 text-sm font-medium rounded-full mb-4">
                  <Sparkles className="w-4 h-4 mr-2 inline-block text-emerald-600" />
                  #1 Learning Community in Bangladesh
                </Badge>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                  Master Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Dream Skills
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Connect with expert mentors, join thriving communities, and access premium resources to accelerate your career growth.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300">
                  <Link to={user ? "/communities" : "/register"}>
                    Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700">
                  <Link to="/mentors">Find a Mentor</Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4 text-sm font-medium text-gray-500">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p>Trusted by <span className="text-emerald-700 font-bold">5,000+</span> students</p>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative order-1 lg:order-2 animate-in slide-in-from-right-4 duration-1000 fade-in delay-200">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-200/50 border-8 border-white bg-white rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                  alt="Study Group"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="font-bold text-xl">Interactive Learning</p>
                    <p className="text-emerald-200">Live classes & Real-time chat</p>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute top-10 -right-6 z-20 animate-bounce delay-700">
                <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">4.9/5</p>
                    <p className="text-xs text-gray-500">User Rating</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-6 rotate-3 z-20">
                <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Verified</p>
                    <p className="text-xs text-gray-500">Expert Mentors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-4 md:px-8 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/mentors" className="group">
              <Card className="h-full border-0 shadow-lg shadow-emerald-100 hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-emerald-50/50">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Find Mentors</h3>
                  <p className="text-gray-500 leading-relaxed">Connect with industry experts for 1-on-1 guidance and career advice.</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/communities" className="group">
              <Card className="h-full border-0 shadow-lg shadow-teal-100 hover:shadow-xl hover:shadow-teal-200/50 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-teal-50/50">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Communities</h3>
                  <p className="text-gray-500 leading-relaxed">Engage in peer-to-peer learning, share resources, and grow together.</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/library" className="group">
              <Card className="h-full border-0 shadow-lg shadow-blue-100 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/50">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Resource Library</h3>
                  <p className="text-gray-500 leading-relaxed">Access a vast collection of study materials, PDFs, and roadmaps.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* MENTORS SECTION */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-emerald-600 font-bold tracking-wide uppercase mb-2 text-sm">Expert Guidance</p>
              <h2 className="text-4xl font-extrabold text-gray-900">Meet Our Top Mentors</h2>
            </div>
            <Button asChild variant="outline" className="group border-emerald-200 hover:bg-emerald-50 text-emerald-700">
              <Link to="/mentors">
                View All Mentors <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-500">No mentors available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {mentors.map((mentor) => (
                <Link key={mentor._id} to={`/profile/${mentor._id}`} className="group">
                  <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full border border-gray-100">
                    {/* Avatar Background */}
                    <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500" />

                    <div className="px-6 pb-6 -mt-12 text-center">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-md mx-auto mb-4">
                        <AvatarImage src={mentor.profile?.avatar} alt={mentor.name} className="object-cover" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">{mentor.name?.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">{mentor.name}</h3>
                      <p className="text-sm text-emerald-600 font-medium mb-3">{mentor.profile?.title || "Mentor"}</p>

                      <div className="flex flex-wrap justify-center gap-1 mb-4">
                        {mentor.profile?.expertise?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{skill}</span>
                        ))}
                      </div>

                      <Button size="sm" className="w-full bg-gray-900 text-white group-hover:bg-emerald-600 transition-colors rounded-xl">View Profile</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COMMUNITIES SECTION */}
      <section className="py-24 px-4 md:px-8 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-emerald-600 font-bold tracking-wide uppercase mb-2 text-sm">Community</p>
              <h2 className="text-4xl font-extrabold text-gray-900">Popular Communities</h2>
            </div>
            <Button asChild variant="outline" className="group border-gray-200">
              <Link to="/communities">
                Explore All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((community) => (
                <Link key={community._id} to={`/communities/${community._id}`} className="group">
                  <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white">
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <img
                        src={community.coverImage?.startsWith("http") ? community.coverImage : `${BASE_URL}${community.coverImage}`}
                        alt={community.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop"; }}
                      />
                      <div className="absolute bottom-4 left-4 right-4 z-20">
                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{community.name}</h3>
                        <div className="flex items-center text-white/90 text-sm gap-4">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {community.statistics?.totalMembers || 0} Members</span>
                          {community.creatorRole === 'mentor' && (
                            <Badge variant="secondary" className="bg-emerald-500/80 text-white border-0 text-[10px] backdrop-blur-sm">Mentor Lead</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 line-clamp-2 mb-4 text-sm h-10">{community.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={community.mentor?.profile?.avatar} />
                            <AvatarFallback>{community.mentor?.name?.[0] || 'C'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">{community.mentor?.name || 'Admin'}</span>
                        </div>
                        <div className="font-bold text-emerald-600">
                          {community.mentorSettings?.monthlyFee > 0 ? `৳${community.mentorSettings.monthlyFee}/mo` : 'Free'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      {!user && (
        <section className="py-24 px-4 md:px-8">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-emerald-600 rounded-[3rem] rotate-1 opacity-20 blur-xl" />
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2.5rem] p-12 md:p-20 text-center text-white overflow-hidden shadow-2xl">
              {/* Decor */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-20 -mt-20 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/20 rounded-full -mr-20 -mb-20 blur-2xl" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Ready to Start Your Journey?</h2>
                <p className="text-emerald-50 text-xl max-w-2xl mx-auto">Join a community of lifelong learners and take the next step in your career today.</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button asChild size="lg" className="h-14 px-10 text-lg bg-white text-emerald-700 hover:bg-emerald-50 rounded-full font-bold shadow-lg">
                    <Link to="/register">Join for Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg border-2 border-emerald-400/30 bg-emerald-800/20 text-white hover:bg-emerald-800/40 rounded-full backdrop-blur-sm">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER SIMPLE (for consistency) */}
      <footer className="py-12 text-center text-gray-500 text-sm bg-gray-50">
        <p>© {new Date().getFullYear()} Btaap Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}