// src/pages/Communities.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCommunities } from "@/lib/communityApi";
import useAuth from "@/hooks/useAuth";
import { Search, Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, mentor, student

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
      setCommunities(data.communities || []);
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-black flex items-center gap-3">
              <Users className="w-10 h-10" />
              Btaap Communities
            </h1>
            <p className="text-gray-600 mt-2">
              Join mentor-led communities and student peer groups
            </p>
          </div>

          <Button asChild className="bg-black hover:bg-gray-800 text-white">
            <Link to="/communities/create">Create Community</Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 bg-gray-50 p-4 rounded-t-lg">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 px-4 font-medium transition-colors ${activeTab === "all"
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            All Communities
          </button>
          <button
            onClick={() => setActiveTab("mentor")}
            className={`pb-2 px-4 font-medium transition-colors ${activeTab === "mentor"
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Mentor Communities
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`pb-2 px-4 font-medium transition-colors ${activeTab === "student"
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
              }`}
          >
            Student Communities
          </button>
        </div>

        {/* Search & Filter */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black h-12"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory("")}
                className={!category ? "bg-black hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50 hover:text-black"}
              >
                All
              </Button>
              {["Technology", "Design", "Business", "Science", "Arts"].map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={category === cat ? "bg-black hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50 hover:text-black"}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-gray-200">
                <div className="h-48 bg-gray-100" />
                <CardContent className="py-4 space-y-3">
                  <div className="h-6 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="py-16 text-center text-gray-700">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-black">No communities found</h3>
              <p>Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link key={community._id} to={`/communities/${community._id}`}>
                <Card className="group h-full border-gray-200 hover:shadow-2xl hover:border-black transition-all duration-300 overflow-hidden bg-white">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-800 to-black overflow-hidden">
                    {community.coverImage ? (
                      <img
                        src={
                          community.coverImage.startsWith("http")
                            ? community.coverImage
                            : `${BASE_URL}${community.coverImage}`
                        }
                        alt={community.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Users className="w-20 h-20 opacity-50" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <Badge className="absolute top-3 right-3 bg-white/90 text-black border border-gray-300">
                      {community.creatorRole === "mentor" ? "Mentor" : "Student"}
                    </Badge>

                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-black/80 text-white border-0">
                      {community.category}
                    </Badge>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    {/* Community Name */}
                    <h3 className="text-lg font-bold text-black line-clamp-1 group-hover:text-gray-700 transition-colors">
                      {community.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {community.description}
                    </p>

                    {/* Creator Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={community.mentor?.profile?.avatar} />
                        <AvatarFallback className="bg-gray-100 text-black text-xs">
                          {community.mentor?.name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {community.mentor?.name}
                        </p>
                      </div>
                    </div>

                    {/* Stats and Pricing */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-sm">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">
                            {community.statistics?.totalMembers || 0}
                          </span>
                        </div>
                        {community.mentorSettings?.classesPerMonth > 0 && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">
                              {community.mentorSettings.classesPerMonth}/mo
                            </span>
                          </div>
                        )}
                      </div>

                      {community.creatorRole === "mentor" && community.mentorSettings?.monthlyFee > 0 ? (
                        <div className="text-black font-bold flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ৳{community.mentorSettings.monthlyFee}/mo
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-900 border border-gray-300 font-semibold">
                          Free
                        </Badge>
                      )}
                    </div>

                    {/* View Button */}
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}