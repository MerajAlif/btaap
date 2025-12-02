import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { io } from "socket.io-client";

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        // Load initial notifications
        fetchNotifications();
        fetchUnreadCount();

        // Connect to socket
        socketRef.current = io("http://localhost:5000");
        socketRef.current.emit("user_online", user.id);

        // Listen for new notifications
        socketRef.current.on("new_notification", (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Optional: Play sound or show toast
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/notifications?limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error("Failed to load unread count:", error);
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
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
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
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read:", error);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 text-blue-600"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification._id}
                                    className={`flex flex-col items-start p-3 cursor-pointer ${!notification.isRead ? "bg-blue-50/50" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex w-full justify-between gap-2">
                                        <span className="font-medium text-sm">{notification.title}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {new Date(notification.createdAt || Date.now()).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    {notification.community && (
                                        <Badge variant="outline" className="mt-2 text-[10px] h-5">
                                            {notification.community.name}
                                        </Badge>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="justify-center text-xs text-blue-600 cursor-pointer"
                    onClick={() => {
                        setIsOpen(false);
                        navigate("/notifications");
                    }}
                >
                    View all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
