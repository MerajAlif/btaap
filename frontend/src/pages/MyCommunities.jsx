// src/pages/MyCommunities.jsx - Redesigned
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMyMemberships, leaveCommunity } from "@/lib/communityApi";
import {
  Users,
  Calendar,
  LogOut,
  Search,
  CheckCircle,
  Sparkles,
  BookOpen,
  Crown,
  GraduationCap
} from "lucide-react";
import { BASE_URL, api } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function MyCommunities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leavingId, setLeavingId] = useState(null);

  useEffect(() => {
    loadMyCommunities();
  }, [user]);

  const loadMyCommunities = async () => {
    setLoading(true);
    try {
      // 1. Fetch joined communities (Memberships)
      const data = await getMyMemberships();
      const joined = data.memberships?.map(m => ({ ...m.community, isJoined: true, joinedAt: m.joinedAt })) || [];

      // 2. Fetch owned communities (Mentored)
      let owned = [];
      if (user?.role === "mentor") {
        const token = localStorage.getItem("token");
        const ownedRes = await fetch(`${BASE_URL}/api/communities?mentor=${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ownedData = await ownedRes.json();
        owned = ownedData.communities?.map(c => ({ ...c, isOwned: true })) || [];
      }

      // 3. Merge and deduplicate
      const all = [...owned];
      joined.forEach(j => {
        if (!all.find(c => c._id === j._id)) {
          all.push(j);
        }
      });

      setCommunities(all);
    } catch (err) {
      console.error("Failed to load communities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (communityId, communityName) => {
    if (!window.confirm(`Leave "${communityName}"? You'll need to rejoin to access it.`)) return;

    setLeavingId(communityId);
    try {
      await leaveCommunity(communityId);
      setCommunities(prev => prev.filter(c => c._id !== communityId || c.isOwned)); // Keep if owned
    } catch (err) {
      alert(err.message || "Failed to leave community");
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Communities</h1>
            <p className="text-gray-600 mt-1">Communities you manage or joined</p>
          </div>
        </div>

        {communities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No communities found</h3>
            <p className="text-gray-500 mb-6">Join a community to start learning</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              <Link to="/communities">Explore Communities</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {communities.map((community) => (
              <div key={community._id} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200">
                {/* Cover Image */}
                <Link to={`/communities/${community._id}`}>
                  <div className="h-40 bg-gradient-to-r from-emerald-500 to-teal-500 relative overflow-hidden">
                    {community.coverImage && (
                      <img
                        src={community.coverImage.startsWith("http") ? community.coverImage : `${BASE_URL}${community.coverImage}`}
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {/* Distinguish Student/Mentor community implicitly by ownership or if they are just a member */}
                      {/* The user said there are two types: student community and mentor community.
                           Currently the code checks isOwned or isJoined.
                           Let's trust the existing logic for badges for now, but ensure the UI looks good.
                       */}
                      {community.isOwned && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Owner</Badge>
                      )}
                      {community.isJoined && !community.isOwned && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Member</Badge>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <Link to={`/communities/${community._id}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {community.name}
                    </h3>
                  </Link>

                  {/* Show Mentor Name / Student Community Label */}
                  <div className="flex items-center gap-2 mb-4">
                    {community.creatorRole === 'mentor' ? (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={community.mentor?.profile?.avatar} />
                          <AvatarFallback className="text-[10px]">{community.mentor?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 truncate">{community.mentor?.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Student Community
                      </span>
                    )}

                  </div>

                  <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-100">
                    <Button asChild size="sm" className="bg-gray-900 text-white hover:bg-emerald-600 transition-colors rounded-xl px-6 h-9">
                      <Link to={`/communities/${community._id}`}>access</Link>
                    </Button>

                    {!community.isOwned && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeave(community._id, community.name)}
                        disabled={leavingId === community._id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-3 rounded-xl"
                      >
                        {leavingId === community._id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}