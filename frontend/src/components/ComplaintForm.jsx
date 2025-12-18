import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export function ComplaintForm({ reportedUserId, communityId, trigger }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        reason: "",
        description: "",
        type: "student_vs_mentor" // default, user should select
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/complaints`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    reportedUser: reportedUserId,
                    community: communityId
                })
            });
            const data = await res.json();

            if (data.success) {
                setSuccess("Complaint submitted successfully. Admins will review it.");
                setTimeout(() => setOpen(false), 2000);
                setForm({ reason: "", description: "", type: "student_vs_mentor" });
            } else {
                setError(data.error || "Failed to submit complaint");
            }
        } catch (err) {
            setError("Failed to submit complaint");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="destructive" size="sm">Report Issue</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Report Issue
                    </DialogTitle>
                </DialogHeader>

                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Issue Type</Label>
                        <Select
                            value={form.type}
                            onValueChange={(val) => setForm({ ...form, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student_vs_mentor">Complaint against Mentor</SelectItem>
                                <SelectItem value="mentor_vs_student">Complaint against Student</SelectItem>
                                <SelectItem value="content_issue">Inappropriate Content</SelectItem>
                                <SelectItem value="spam">Spam / Scam</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Reason</Label>
                        <Input
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            placeholder="Brief subject of the complaint"
                            required
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Please describe the issue in detail..."
                            required
                            rows={4}
                        />
                    </div>

                    <Button type="submit" disabled={loading} variant="destructive" className="w-full">
                        {loading ? "Submitting..." : "Submit Complaint"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
