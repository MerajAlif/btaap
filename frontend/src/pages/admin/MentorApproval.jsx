// src/pages/admin/MentorApproval.jsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function MentorApproval() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api("/api/auth/mentors/pending");
      const items = res.mentors || res.data || res; 
      setMentors(items || []);
    } catch (e) {
      setErr(e.message || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      const path = action === "approve"
        ? `/api/auth/mentors/${id}/approve`
        : `/api/auth/mentors/${id}/reject`;
      const body = action === "reject"
        ? { reason: window.prompt("Enter a rejection reason:") || "Not a fit" }
        : {};
      await api(path, { method: "PUT", body: JSON.stringify(body) });
      setMentors(prev => prev.filter(m => m._id !== id));
    } catch (e) {
      alert(e.message || `Failed to ${action}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Mentor Approval</h1>
        <p className="text-sm text-muted-foreground">
          Review mentor applications and approve or reject them.
        </p>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && mentors.length === 0 && (
        <Card><CardContent className="py-8 text-center">No pending mentors.</CardContent></Card>
      )}

      <div className="grid gap-4">
        {mentors.map(m => (
          <Card key={m._id} className="hover:shadow transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{m.name}</CardTitle>
                <Badge variant="secondary" className="capitalize">{m.approvalStatus}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.email}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Expertise: </span>
                {m.profile?.expertise?.length ? m.profile.expertise.join(", ") : "—"}
              </p>
              {m.profile?.experience && (
                <p className="text-sm"><span className="text-muted-foreground">Experience: </span>{m.profile.experience}</p>
              )}
              <div className="flex gap-2 pt-3">
                <Button onClick={() => act(m._id, "approve")} className="bg-teal-600 hover:bg-teal-700">Approve</Button>
                <Button variant="destructive" onClick={() => act(m._id, "reject")}>Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
