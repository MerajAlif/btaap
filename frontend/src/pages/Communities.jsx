// src/pages/Communities.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCommunities } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import { Search, Users, Sparkles, Plus, Filter } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, mentor, student
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    loadCommunities();
  }, [search, category, activeTab]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (activeTab !== "all") params.creatorRole = activeTab;

      const data = await getCommunities(params);
      const fetchedCommunities = data.communities || [];
      setCommunities(fetchedCommunities);

      // Extract unique categories from all communities (not just filtered ones)
      if (!category && !search && activeTab === "all") {
        const uniqueCategories = [...new Set(
          fetchedCommunities
            .map(c => c.category)
            .filter(Boolean) // Remove null/undefined
        )].sort();
        setAvailableCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-teal-50/30 to-white" />

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-12 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 text-sm font-medium rounded-full">
              <Sparkles className="w-4 h-4 mr-2 inline-block text-emerald-600" />
              Learning Communities
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              Discover Amazing
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Communities
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join mentor-led communities and student peer groups to accelerate your learning journey
            </p>

            {/* Create Community Button */}
            {user && (
              <div className="pt-4">
                <Button asChild size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg">
                  <Link to="/communities/create">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Community
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("all")}
            variant={activeTab === "all" ? "default" : "outline"}
            className={activeTab === "all"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "border-gray-300 hover:bg-emerald-50 hover:text-emerald-700"}
          >
            All Communities
          </Button>
          <Button
            onClick={() => setActiveTab("mentor")}
            variant={activeTab === "mentor" ? "default" : "outline"}
            className={activeTab === "mentor"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "border-gray-300 hover:bg-emerald-50 hover:text-emerald-700"}
          >
            Mentor Communities
          </Button>
          <Button
            onClick={() => setActiveTab("student")}
            variant={activeTab === "student" ? "default" : "outline"}
            className={activeTab === "student"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "border-gray-300 hover:bg-emerald-50 hover:text-emerald-700"}
          >
            Student Communities
          </Button>
        </div>

        {/* Search & Category Filter - Same Row */}
        <div className="bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
              <Input
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-10 border border-gray-300 focus-visible:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-lg"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative sm:w-72">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 z-10 pointer-events-none" />
              <Select value={category || "all"} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
                <SelectTrigger className="pl-12 h-12 border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITIES GRID SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            {user && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/communities/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Community
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-emerald-700">{communities.length}</span> communit{communities.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>

            {/* Communities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <Link key={community._id} to={`/communities/${community._id}`}>
                  <Card className="group h-full border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-white">
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-emerald-500 to-teal-500 overflow-hidden">
                      <img
                        src={
                          community.coverImage?.startsWith("http")
                            ? community.coverImage
                            : community.coverImage
                              ? `${BASE_URL}${community.coverImage}`
                              : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop"
                        }
                        alt={community.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop";
                        }}
                      />

                      {/* Badges on Cover */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {/* Member Count Badge */}
                        <Badge className="bg-white/90 text-gray-700 border-0 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {community.statistics?.totalMembers || 0} Members
                        </Badge>

                        {/* Type Badge */}
                        <Badge className={`${community.creatorRole === "mentor"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                          } border`}>
                          {community.creatorRole === "mentor" ? "Mentor Lead" : "Student"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      {/* Community Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {community.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[40px]">
                        {community.description || "No description available"}
                      </p>

                      {/* Footer with Creator and Price */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        {/* Creator Info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarImage src={community.mentor?.profile?.avatar} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {community.mentor?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700 truncate font-medium">
                            {community.mentor?.name || "Unknown"}
                          </span>
                        </div>

                        {/* Pricing */}
                        {community.creatorRole === "mentor" && community.mentorSettings?.monthlyFee > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold flex-shrink-0">
                            ৳{community.mentorSettings.monthlyFee}/mo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border border-gray-300 font-bold flex-shrink-0">
                            Free
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}