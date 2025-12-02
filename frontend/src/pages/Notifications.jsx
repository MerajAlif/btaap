import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2 } from "lucide-react";
import { BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notifications/read-all`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all read:", error);
        }
    };

    const handleClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6" /> Notifications
                </h1>
                {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                    <Button variant="outline" onClick={markAllRead}>
                        <Check className="w-4 h-4 mr-2" /> Mark all as read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`cursor-pointer transition-colors hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                            onClick={() => handleClick(notification)}
                        >
                            <CardContent className="p-4 flex gap-4">
                                <div className={`mt-1 p-2 rounded-full ${!notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-500"
                                    onClick={(e) => deleteNotification(notification._id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
