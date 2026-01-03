import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Users, BookOpen, Sparkles, Star, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExpertise, setSelectedExpertise] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allExpertise, setAllExpertise] = useState([]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMentors();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedExpertise, page]);

    // Fetch all unique expertise areas for filter
    useEffect(() => {
        fetchExpertise();
    }, []);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "12",
            });

            if (searchQuery) params.append("search", searchQuery);
            if (selectedExpertise) params.append("expertise", selectedExpertise);

            const res = await api(`/api/profiles/mentors?${params.toString()}`);
            setMentors(res.mentors || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch mentors:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpertise = async () => {
        try {
            // Fetch all mentors to extract unique expertise
            const res = await api("/api/profiles/mentors?limit=1000");
            const expertise = new Set();
            res.mentors?.forEach((mentor) => {
                mentor.profile?.expertise?.forEach((exp) => expertise.add(exp));
            });
            setAllExpertise(Array.from(expertise).sort());
        } catch (error) {
            console.error("Failed to fetch expertise:", error);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleExpertiseChange = (value) => {
        setSelectedExpertise(value === "all" ? "" : value);
        setPage(1); // Reset to first page on filter
    };

    const handleLoadMore = () => {
        setPage((prev) => prev + 1);
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
                            Expert Mentorship
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                            Find Your Perfect
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                                Mentor
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Connect with verified expert mentors and accelerate your learning journey with personalized guidance
                        </p>

                        {/* Search and Filter */}
                        <div className="mt-8 max-w-4xl mx-auto">
                            <div className="bg-white">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search Input */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                                        <Input
                                            placeholder="Search mentor's by name or bio..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            className="pl-12 h-10 border border-gray-300 focus-visible:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-lg"
                                        />
                                    </div>

                                    {/* Expertise Filter */}
                                    <div className="relative sm:w-72">
                                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 z-10 pointer-events-none" />
                                        <Select value={selectedExpertise || "all"} onValueChange={handleExpertiseChange}>
                                            <SelectTrigger className="pl-12 h-12 border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg">
                                                <SelectValue placeholder="All Expertise Areas" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-80">
                                                <SelectItem value="all">All Expertise Areas</SelectItem>
                                                {allExpertise.length > 0 ? (
                                                    allExpertise.map((exp) => (
                                                        <SelectItem key={exp} value={exp}>
                                                            {exp}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="loading" disabled>
                                                        Loading...
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {(searchQuery || selectedExpertise) && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-gray-500 font-medium">Active:</span>
                                        {searchQuery && (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs">
                                                "{searchQuery}"
                                            </Badge>
                                        )}
                                        {selectedExpertise && (
                                            <Badge variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 text-xs">
                                                {selectedExpertise}
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-500 hover:text-gray-700 h-6 px-2 text-xs"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setSelectedExpertise("");
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MENTORS GRID SECTION */}
            <section className="py-16 px-4 md:px-8 bg-white/50">
                <div className="max-w-7xl mx-auto">
                    {loading && page === 1 ? (
                        // Loading State
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : mentors.length === 0 ? (
                        // Empty State
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                No mentors found
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || selectedExpertise
                                    ? "Try adjusting your search or filters"
                                    : "No mentors available yet. Check back soon!"}
                            </p>
                            {(searchQuery || selectedExpertise) && (
                                <Button
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedExpertise("");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Results Count */}
                            <div className="mb-8">
                                <p className="text-gray-600">
                                    Showing <span className="font-semibold text-emerald-700">{mentors.length}</span> mentor{mentors.length !== 1 ? 's' : ''}
                                    {(searchQuery || selectedExpertise) && (
                                        <span className="ml-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSelectedExpertise("");
                                                }}
                                            >
                                                Clear filters
                                            </Button>
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Mentors Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {mentors.map((mentor) => (
                                    <div key={mentor._id} className="group flex flex-col">
                                        <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full border border-gray-100">
                                            {/* Avatar Background */}
                                            <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500 flex-shrink-0" />

                                            <div className="px-6 pb-6 -mt-12 text-center flex flex-col flex-1">
                                                <Avatar className="w-24 h-24 border-4 border-white shadow-md mx-auto mb-4 flex-shrink-0">
                                                    <AvatarImage
                                                        src={mentor.profile?.avatar || "/default-avatar.png"}
                                                        alt={mentor.name}
                                                        className="object-cover"
                                                        onError={(e) => { e.target.src = "/default-avatar.png"; }}
                                                    />
                                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">{mentor.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>

                                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                                    {mentor.name}
                                                </h3>

                                                {mentor.profile?.title && (
                                                    <p className="text-sm text-emerald-600 font-medium mb-3 line-clamp-1">
                                                        {mentor.profile.title}
                                                    </p>
                                                )}

                                                {/* Expertise Tags */}
                                                {mentor.profile?.expertise && mentor.profile.expertise.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                                                        {mentor.profile.expertise.slice(0, 3).map((skill, idx) => (
                                                            <span key={idx} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {mentor.profile.expertise.length > 3 && (
                                                            <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                                                +{mentor.profile.expertise.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Bio */}
                                                {mentor.profile?.bio && (
                                                    <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                                                        {mentor.profile.bio}
                                                    </p>
                                                )}

                                                {/* Spacer to push content to bottom */}
                                                <div className="flex-1" />

                                                {/* Stats */}
                                                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4 pt-2">
                                                    {mentor.communityCount > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <BookOpen className="w-3.5 h-3.5" />
                                                            <span>{mentor.communityCount} {mentor.communityCount === 1 ? 'Community' : 'Communities'}</span>
                                                        </div>
                                                    )}
                                                    {!mentor.communityCount && (
                                                        <div className="text-gray-400">
                                                            New Mentor
                                                        </div>
                                                    )}
                                                </div>

                                                <Button asChild size="sm" className="w-full bg-gray-900 text-white group-hover:bg-emerald-600 transition-colors rounded-xl flex-shrink-0">
                                                    <Link to={`/profile/${mentor._id}`}>
                                                        View Profile
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {page < totalPages && (
                                <div className="mt-12 text-center">
                                    <Button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        size="lg"
                                        className="h-14 px-10 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? (
                                            "Loading..."
                                        ) : (
                                            <>
                                                Load More Mentors
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 text-center text-gray-500 text-sm bg-gray-50">
                <p>© {new Date().getFullYear()} Btaap Learning Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}
