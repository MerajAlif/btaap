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
import { Search, Users, DollarSign, Star, TrendingUp } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadCommunities();
  }, [search, category]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      
      const data = await getCommunities(params);
      setCommunities(data.communities || []);
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 flex items-center gap-3">
              <Users className="w-10 h-10" />
              Btaap Communities
            </h1>
            <p className="text-purple-700 mt-2">
              Join mentor-led communities and accelerate your learning
            </p>
          </div>
          
          {user?.role === "mentor" && user?.approvalStatus === "approved" && (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to="/communities/create">Create Community</Link>
            </Button>
          )}
        </div>

        {/* Search & Filter */}
        <Card className="border-purple-200 bg-white/80 backdrop-blur">
          <CardContent className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
              <Input
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500 h-12"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory("")}
                className={!category ? "bg-purple-600" : ""}
              >
                All
              </Button>
              {["Technology", "Design", "Business", "Science", "Arts"].map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={category === cat ? "bg-purple-600" : ""}
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
              <Card key={i} className="animate-pulse border-purple-200">
                <div className="h-48 bg-purple-100" />
                <CardContent className="py-4 space-y-3">
                  <div className="h-6 bg-purple-100 rounded w-3/4" />
                  <div className="h-4 bg-purple-100 rounded w-full" />
                  <div className="h-4 bg-purple-100 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <Card className="border-purple-200">
            <CardContent className="py-16 text-center text-purple-700">
              <Users className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No communities found</h3>
              <p>Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link key={community._id} to={`/communities/${community._id}`}>
                <Card className="group h-full border-purple-200 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300 overflow-hidden bg-white">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-400 to-indigo-500 overflow-hidden">
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
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-purple-700">
                      {community.category}
                    </Badge>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    {/* Community Name */}
                    <h3 className="text-lg font-bold text-purple-900 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {community.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {community.description}
                    </p>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={community.mentor?.profile?.avatar} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                          {community.mentor?.name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {community.mentor?.name}
                        </p>
                        <p className="text-xs text-gray-500">Mentor</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-2 text-sm">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {community.statistics?.totalMembers || 0}
                        </span>
                      </div>
                      
                      {community.joinCost > 0 ? (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span>{community.joinCost} credits</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Free
                        </Badge>
                      )}
                    </div>

                    {/* Join Button */}
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
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