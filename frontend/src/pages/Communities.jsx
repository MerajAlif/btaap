// src/pages/Communities.jsx - Sidebar Version
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCommunities } from "@/lib/communityApi";
import { api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { Search, Users, Sparkles, Plus, Filter, BookOpen, Crown, Clock, ArrowRight, GraduationCap, TrendingUp } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, mentor, student, my
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    if (activeFilter === "my" && user) {
      loadMyCommunities();
    } else {
      loadCommunities();
    }
  }, [search, category, activeFilter, user]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (activeFilter !== "all" && activeFilter !== "my") params.creatorRole = activeFilter;

      const data = await getCommunities(params);
      const fetchedCommunities = data.communities || [];
      setCommunities(fetchedCommunities);

      if (!category && !search && activeFilter === "all") {
        const uniqueCategories = [...new Set(
          fetchedCommunities.map(c => c.category).filter(Boolean)
        )].sort();
        setAvailableCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCommunities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const ownedRes = await fetch(`${BASE_URL}/api/communities?mentor=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ownedData = await ownedRes.json();

      const profileRes = await api(`/api/profiles/${user.role}/${user._id}`);
      const joinedCommunities = profileRes.success ?
        (profileRes[user.role]?.joinedCommunities || []) : [];

      let allMyCommunities = [
        ...(ownedData.communities || []),
        ...joinedCommunities
      ];

      allMyCommunities = allMyCommunities.filter((comm, index, self) =>
        index === self.findIndex((c) => c._id === comm._id)
      );

      if (search) {
        allMyCommunities = allMyCommunities.filter(comm =>
          comm.name.toLowerCase().includes(search.toLowerCase()) ||
          comm.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (category) {
        allMyCommunities = allMyCommunities.filter(comm => comm.category === category);
      }

      setMyCommunities(allMyCommunities);
    } catch (error) {
      console.error("Failed to load my communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayCommunities = activeFilter === "my" ? myCommunities : communities;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section with Title and Create Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            </div>
            <p className="text-gray-600">Discover and join learning communities</p>
          </div>

          {user && (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 shadow-lg shadow-emerald-200">
              <Link to="/communities/create">
                <Plus className="w-5 h-5 mr-2" />
                Create Community
              </Link>
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-emerald-500"
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${activeFilter === "all"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              All
            </button>
            <button
              onClick={() => setActiveFilter("mentor")}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${activeFilter === "mentor"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Mentor-Led
            </button>
            <button
              onClick={() => setActiveFilter("student")}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${activeFilter === "student"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Student Groups
            </button>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="w-full md:w-48">
              <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {activeFilter === "mentor" ? "Mentor Communities" : activeFilter === "student" ? "Student Communities" : "All Communities"}
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            {displayCommunities.length} results
          </span>
        </div>


        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : displayCommunities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500">No communities found</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            <Button variant="link" onClick={() => { setSearch(""); setCategory(""); setActiveFilter("all"); }} className="mt-2 text-emerald-600 font-semibold">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayCommunities.map((community) => (
              <Link key={community._id} to={`/communities/${community._id}`} className="group block h-full">
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full border border-gray-200 flex flex-col">
                  {/* Cover Image */}
                  <div className="h-40 bg-gradient-to-r from-emerald-500 to-teal-500 relative overflow-hidden shrink-0">
                    <img
                      src={community.coverImage
                        ? (community.coverImage.startsWith("http") ? community.coverImage : `${BASE_URL}${community.coverImage}`)
                        : "/default-community.png"
                      }
                      alt={community.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { e.target.src = "/default-community.png"; }}
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-gray-800 hover:bg-white backdrop-blur-sm shadow-sm border border-emerald-100">
                        {community.category || "General"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px] flex-1">
                      {community.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span>{community.statistics?.totalMembers || 0}</span>
                      </div>

                      {community.joinCost > 0 ? (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-bold">
                          ৳{community.joinCost}/mo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">Free</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}