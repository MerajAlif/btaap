// components/community/LeaderboardTab.jsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function LeaderboardTab({ communityId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [communityId]);

    const loadLeaderboard = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/leaderboard/${communityId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error("Failed to load leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeIcon = (badge) => {
        switch (badge) {
            case "gold":
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case "silver":
                return <Medal className="w-6 h-6 text-gray-400" />;
            case "bronze":
                return <Award className="w-6 h-6 text-orange-600" />;
            default:
                return null;
        }
    };

    const getBadgeColor = (badge) => {
        switch (badge) {
            case "gold":
                return "bg-gradient-to-r from-yellow-400 to-yellow-600";
            case "silver":
                return "bg-gradient-to-r from-gray-300 to-gray-500";
            case "bronze":
                return "bg-gradient-to-r from-orange-400 to-orange-600";
            default:
                return "bg-white";
        }
    };

    if (loading) return <div className="p-8 text-center">Loading leaderboard...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-purple-600" />
                    Leaderboard
                </h2>
                <p className="text-sm text-gray-500">{leaderboard.length} students ranked</p>
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center pt-8">
                        <div className="relative">
                            <Avatar className="w-20 h-20 border-4 border-gray-400">
                                <AvatarImage src={leaderboard[1]?.student?.avatar} />
                                <AvatarFallback>{leaderboard[1]?.student?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2">
                                {getBadgeIcon("silver")}
                            </div>
                        </div>
                        <p className="font-semibold mt-2 text-center">{leaderboard[1]?.student?.name}</p>
                        <p className="text-2xl font-bold text-gray-600">{leaderboard[1]?.totalMarks}</p>
                        <p className="text-xs text-gray-500">{leaderboard[1]?.tasksCompleted} tasks</p>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-yellow-500">
                                <AvatarImage src={leaderboard[0]?.student?.avatar} />
                                <AvatarFallback>{leaderboard[0]?.student?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2">
                                {getBadgeIcon("gold")}
                            </div>
                        </div>
                        <p className="font-bold mt-2 text-center">{leaderboard[0]?.student?.name}</p>
                        <p className="text-3xl font-bold text-yellow-600">{leaderboard[0]?.totalMarks}</p>
                        <p className="text-xs text-gray-500">{leaderboard[0]?.tasksCompleted} tasks</p>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center pt-8">
                        <div className="relative">
                            <Avatar className="w-20 h-20 border-4 border-orange-600">
                                <AvatarImage src={leaderboard[2]?.student?.avatar} />
                                <AvatarFallback>{leaderboard[2]?.student?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2">
                                {getBadgeIcon("bronze")}
                            </div>
                        </div>
                        <p className="font-semibold mt-2 text-center">{leaderboard[2]?.student?.name}</p>
                        <p className="text-2xl font-bold text-orange-600">{leaderboard[2]?.totalMarks}</p>
                        <p className="text-xs text-gray-500">{leaderboard[2]?.tasksCompleted} tasks</p>
                    </div>
                </div>
            )}

            {/* Full Rankings */}
            <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                    <Card
                        key={entry.student._id}
                        className={`${getBadgeColor(entry.badge)} ${entry.badge ? "text-white" : ""}`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold w-8 text-center">
                                    {entry.rank}
                                </div>
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={entry.student.avatar} />
                                    <AvatarFallback>{entry.student.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{entry.student.name}</p>
                                        {entry.badge && (
                                            <Badge variant="secondary" className="text-xs">
                                                {entry.badge.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className={`text-sm ${entry.badge ? "text-white/80" : "text-gray-500"}`}>
                                        {entry.tasksCompleted} tasks completed • Avg: {entry.averageMarks}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{entry.totalMarks}</p>
                                    <p className={`text-xs ${entry.badge ? "text-white/80" : "text-gray-500"}`}>
                                        total marks
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {leaderboard.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No rankings yet</p>
                    <p className="text-sm">Complete and grade tasks to see the leaderboard</p>
                </div>
            )}
        </div>
    );
}
