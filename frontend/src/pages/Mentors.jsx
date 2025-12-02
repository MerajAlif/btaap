import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Users, BookOpen, DollarSign } from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
            {/* Header Section */}
            <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                    <div className="text-center space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold">
                            Find Your Perfect Mentor
                        </h1>
                        <p className="text-xl md:text-2xl text-emerald-50 max-w-3xl mx-auto">
                            Connect with expert mentors and accelerate your learning journey
                        </p>

                        {/* Search and Filter - Centered */}
                        <div className="mt-8 max-w-3xl mx-auto">
                            <div className="flex flex-col md:flex-row bg-white/10 border-2 border-white/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg">
                                {/* Search Input */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100" />
                                    <Input
                                        placeholder="Search by name or bio..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="pl-12 h-14 border-0 bg-transparent text-white placeholder:text-white/80 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="h-[1px] md:h-auto md:w-[1px] bg-white/30" />

                                {/* Expertise Filter */}
                                <div className="relative md:w-72">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100 z-10 pointer-events-none" />
                                    <Select value={selectedExpertise || "all"} onValueChange={handleExpertiseChange}>
                                        <SelectTrigger className="pl-12 h-14 border-0 bg-transparent text-white focus:ring-0 focus:ring-offset-0 rounded-none">
                                            <SelectValue placeholder="Filter by subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Subjects</SelectItem>
                                            {allExpertise.map((exp) => (
                                                <SelectItem key={exp} value={exp}>
                                                    {exp}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mentors Grid */}
            <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {loading && page === 1 ? (
                    // Loading State
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Card key={i} className="animate-pulse border-emerald-200">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex justify-center">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-emerald-100 rounded w-3/4 mx-auto" />
                                        <div className="h-3 bg-emerald-100 rounded w-full" />
                                        <div className="h-3 bg-emerald-100 rounded w-2/3 mx-auto" />
                                    </div>
                                    <div className="h-8 bg-emerald-100 rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : mentors.length === 0 ? (
                    // Empty State
                    <Card className="border-emerald-200 bg-white/80 backdrop-blur">
                        <CardContent className="py-16 text-center space-y-4">
                            <Users className="w-16 h-16 mx-auto text-emerald-300" />
                            <h3 className="text-xl font-semibold text-emerald-900">
                                No mentors found
                            </h3>
                            <p className="text-emerald-700">
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
                        </CardContent>
                    </Card>
                ) : (
                    // Mentors Grid
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {mentors.map((mentor) => (
                                <Card
                                    key={mentor._id}
                                    className="group border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-300 overflow-hidden bg-white flex flex-col"
                                >
                                    <CardContent className="p-5 flex flex-col h-full">
                                        {/* Mentor Avatar - Smaller */}
                                        <div className="flex justify-center mb-3">
                                            <Avatar className="w-20 h-20 border-4 border-emerald-200 group-hover:border-emerald-400 transition-colors shadow-lg">
                                                <AvatarImage
                                                    src={mentor.profile?.avatar}
                                                    alt={mentor.name}
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl font-bold">
                                                    {mentor.name?.charAt(0) || "M"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Mentor Info - Flex grow to push button down */}
                                        <div className="text-center space-y-2 flex-1 flex flex-col">
                                            <h3 className="font-bold text-base text-emerald-900 line-clamp-1">
                                                {mentor.name}
                                            </h3>

                                            {/* Expertise */}
                                            {mentor.profile?.expertise?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {mentor.profile.expertise.slice(0, 2).map((exp, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="secondary"
                                                            className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5"
                                                        >
                                                            {exp}
                                                        </Badge>
                                                    ))}
                                                    {mentor.profile.expertise.length > 2 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5"
                                                        >
                                                            +{mentor.profile.expertise.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Bio - Compact */}
                                            {mentor.profile?.bio && (
                                                <p className="text-xs text-emerald-600 line-clamp-2">
                                                    {mentor.profile.bio}
                                                </p>
                                            )}

                                            {/* Stats - Compact */}
                                            <div className="flex items-center justify-center gap-3 text-xs text-emerald-600 pt-1">
                                                {mentor.communityCount > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        <span>{mentor.communityCount}</span>
                                                    </div>
                                                )}
                                                {mentor.profile?.hourlyRate && (
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        <span>${mentor.profile.hourlyRate}/hr</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Spacer to push button to bottom */}
                                            <div className="flex-1" />

                                            {/* View Profile Button - At bottom */}
                                            <Button
                                                asChild
                                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md mt-3"
                                                size="sm"
                                            >
                                                <Link to={`/profile/${mentor._id}`}>View Profile</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {page < totalPages && (
                            <div className="mt-8 text-center">
                                <Button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 shadow-lg"
                                >
                                    {loading ? "Loading..." : "Load More Mentors"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
