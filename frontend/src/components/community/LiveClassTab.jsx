// components/community/LiveClassTab.jsx
import { Video, Calendar, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LiveClassTab() {
    return (
        <div className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-600 rounded-full blur-3xl opacity-20"></div>
                            <Video className="w-24 h-24 mx-auto text-purple-600 relative" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-purple-900">Live Classes</h2>
                            <p className="text-purple-700">Coming Soon!</p>
                        </div>

                        <p className="text-gray-600">
                            We're working on bringing you real-time interactive classes with video conferencing,
                            screen sharing, and live collaboration features.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="p-4 bg-white rounded-lg shadow-sm">
                                <Video className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium">HD Video</p>
                                <p className="text-xs text-gray-500">Crystal clear quality</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm">
                                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium">Scheduling</p>
                                <p className="text-xs text-gray-500">Plan ahead</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium">Reminders</p>
                                <p className="text-xs text-gray-500">Never miss a class</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button disabled className="bg-purple-600">
                                <Bell className="w-4 h-4 mr-2" />
                                Notify Me When Available
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Upcoming Features</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Real-time video and audio streaming</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Screen sharing and whiteboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Recording and playback</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Interactive polls and quizzes</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Breakout rooms for group discussions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Attendance tracking</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
