import { Link, useLocation } from "react-router-dom";
import { Users, DollarSign, MessageSquare, UserCheck } from "lucide-react";

export default function AdminLayout({ children }) {
    const location = useLocation();

    const tabs = [
        { path: "/admin/mentors", label: "Mentor Approval", icon: UserCheck },
        { path: "/admin/payments", label: "Payments", icon: DollarSign },
        { path: "/admin/join-requests", label: "Join Requests", icon: Users },
        { path: "/admin/complaints", label: "Complaints", icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-16 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    </div>
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = location.pathname === tab.path;
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${isActive
                                            ? "border-teal-600 text-teal-600 font-medium"
                                            : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="container mx-auto py-6">{children}</div>
        </div>
    );
}
