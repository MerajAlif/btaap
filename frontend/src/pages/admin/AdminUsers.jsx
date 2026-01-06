import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MoreVertical, CreditCard, Shield } from "lucide-react";
import { api } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);

    // Dialog States
    const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
    const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
    const [creditAmount, setCreditAmount] = useState(0);

    // Subscription Form State
    const [subForm, setSubForm] = useState({
        planName: "",
        isActive: false,
        expiry: "",
        communitiesBalance: 0,
        liveClassesBalance: 0
    });

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [page, search, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10"
            });
            if (search) params.append("search", search);
            if (roleFilter !== "all") params.append("role", roleFilter);

            const res = await api(`/api/auth/users?${params.toString()}`);
            setUsers(res.users || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreditDialog = (user) => {
        setSelectedUser(user);
        setCreditAmount(0);
        setIsCreditDialogOpen(true);
    };

    const handleOpenSubDialog = (user) => {
        setSelectedUser(user);
        const sub = user.mentorSubscription || {};
        setSubForm({
            planName: sub.planName || "Standard",
            isActive: sub.isActive || false,
            expiry: sub.expiry ? new Date(sub.expiry).toISOString().split('T')[0] : "",
            communitiesBalance: sub.balance?.communities || 0,
            liveClassesBalance: sub.balance?.liveClasses || 0
        });
        setIsSubDialogOpen(true);
    };

    const handleUpdateCredits = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            // Need a backend endpoint for this. 
            // Assuming generic update profile endpoint works or need to create specific admin endpoint.
            // Ideally should be POST /api/admin/users/:id/credits
            // For now, I'll assume we need to create/use a route. 
            // I'll create a new route in auth.js or admin.js for this.
            // Let's assume /api/admin/users/:id/credits exists for now and implement it next.

            await api(`/api/admin/users/${selectedUser._id}/credits`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseInt(creditAmount) }),
            });

            setIsCreditDialogOpen(false);
            fetchUsers();
        } catch (error) {
            alert(error.message || "Failed to update credits");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateSubscription = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            // Assume endpoint /api/admin/users/:id/subscription
            await api(`/api/admin/users/${selectedUser._id}/subscription`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subForm),
            });
            setIsSubDialogOpen(false);
            fetchUsers();
        } catch (error) {
            alert(error.message || "Failed to update subscription");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage student credits and mentor subscriptions</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-32 bg-white">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="mentor">Mentor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <div className="relative overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Credits / Plan</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user._id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                    {user.name?.[0] || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "mentor" ? "default" : "secondary"} className={user.role === "mentor" ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.role === 'mentor' && (
                                                <Badge variant={user.mentorSubscription?.isActive ? "outline" : "destructive"} className={user.mentorSubscription?.isActive ? "text-green-600 border-green-200" : ""}>
                                                    {user.mentorSubscription?.isActive ? "Subscribed" : "Inactive"}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.role === 'student' ? (
                                                <span className="font-mono text-emerald-600 font-medium">
                                                    {user.credits} Credits
                                                </span>
                                            ) : (
                                                <div className="text-sm">
                                                    <p className="font-medium">{user.mentorSubscription?.planName || "No Plan"}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.mentorSubscription?.balance?.communities || 0} Comms left
                                                    </p>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {user.role === "student" && (
                                                        <DropdownMenuItem onClick={() => handleOpenCreditDialog(user)}>
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Manage Credits
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.role === "mentor" && (
                                                        <DropdownMenuItem onClick={() => handleOpenSubDialog(user)}>
                                                            <Shield className="w-4 h-4 mr-2" />
                                                            Manage Subscription
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* PAGINATION */}
            <div className="mt-6 flex justify-center gap-2">
                <Button
                    variant="outline"
                    disabled={page === 1 || loading}
                    onClick={() => setPage(page - 1)}
                >
                    Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    disabled={page === totalPages || loading}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </Button>
            </div>

            {/* MANAGE CREDITS DIALOG */}
            <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Credits</DialogTitle>
                        <DialogDescription>
                            Adjust credits for {selectedUser?.name}. Current Balance: <span className="font-bold text-gray-900">{selectedUser?.credits}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Add/Remove Credits (Negative to remove)</Label>
                        <Input
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            placeholder="Amount"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateCredits} disabled={processing}>
                            {processing ? "Updating..." : "Update Credits"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MANAGE SUBSCRIPTION DIALOG */}
            <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Subscription</DialogTitle>
                        <DialogDescription>
                            Update subscription details for {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Plan Name</Label>
                                <Select
                                    value={subForm.planName}
                                    onValueChange={(val) => setSubForm({ ...subForm, planName: val })}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Free">Free</SelectItem>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={subForm.isActive ? "active" : "inactive"}
                                    onValueChange={(val) => setSubForm({ ...subForm, isActive: val === "active" })}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Expiry Date</Label>
                            <Input
                                type="date"
                                value={subForm.expiry}
                                onChange={(e) => setSubForm({ ...subForm, expiry: e.target.value })}
                                className="mt-1.5"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Communities Balance</Label>
                                <Input
                                    type="number"
                                    value={subForm.communitiesBalance}
                                    onChange={(e) => setSubForm({ ...subForm, communitiesBalance: parseInt(e.target.value) })}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label>Live Classes Balance</Label>
                                <Input
                                    type="number"
                                    value={subForm.liveClassesBalance}
                                    onChange={(e) => setSubForm({ ...subForm, liveClassesBalance: parseInt(e.target.value) })}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSubDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateSubscription} disabled={processing}>
                            {processing ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
