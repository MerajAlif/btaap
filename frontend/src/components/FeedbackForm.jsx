import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export function FeedbackForm() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        content: "",
        rating: 5,
        category: "general"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/feedbacks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (data.success) {
                setSuccess("Thank you for your feedback!");
                setTimeout(() => setOpen(false), 2000);
                setForm({ content: "", rating: 5, category: "general" });
            } else {
                setError(data.error || "Failed to submit feedback");
            }
        } catch (err) {
            setError("Failed to submit feedback");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 border border-emerald-500/50 text-emerald-100 hover:bg-transparent hover:text-white">
                    <MessageSquare className="w-4 h-4" />
                    Give Feedback
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send us Feedback</DialogTitle>
                </DialogHeader>

                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Rating</Label>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setForm({ ...form, rating: star })}
                                    className={`p-1 rounded transition-colors ${form.rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                    <Star className="w-6 h-6 fill-current" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Your Feedback</Label>
                        <Textarea
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            placeholder="Tell us what you think or report a bug..."
                            required
                            rows={4}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Sending..." : "Send Feedback"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
