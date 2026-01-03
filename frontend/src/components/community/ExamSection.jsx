import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { GraduationCap, Plus, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ExamSection({ communityId, isMentor, isMember }) {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Create Exam Form State
    const [newExam, setNewExam] = useState({
        title: "",
        description: "",
        questionPdf: "",
        deadline: "",
        totalPoints: 100,
    });

    // Submission State
    const [answerPdf, setAnswerPdf] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Grading State
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeData, setGradeData] = useState({ points: 0, feedback: "" });

    useEffect(() => {
        if (communityId) {
            loadExams();
        }
    }, [communityId]);

    const loadExams = async () => {
        setLoading(true);
        try {
            const data = await api(`/api/exams/community/${communityId}`);
            setExams(data);
        } catch (error) {
            console.error("Failed to load exams:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/exams", { ...newExam, communityId });
            setCreateDialogOpen(false);
            loadExams();
            setNewExam({ title: "", description: "", questionPdf: "", deadline: "", totalPoints: 100 });
        } catch (error) {
            console.error("Failed to create exam:", error);
        }
    };

    const handleViewExam = async (examId) => {
        try {
            const data = await api(`/api/exams/${examId}`);
            setSelectedExam(data);
            if (isMentor) {
                loadSubmissions(examId);
            }
        } catch (error) {
            console.error("Failed to load exam details:", error);
        }
    };

    const loadSubmissions = async (examId) => {
        try {
            const data = await api(`/api/exams/${examId}/submissions`);
            setSubmissions(data);
        } catch (error) {
            console.error("Failed to load submissions:", error);
        }
    };

    const handleSubmitExam = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/api/exams/${selectedExam._id}/submit`, { answerPdf });
            handleViewExam(selectedExam._id); // Refresh details
            setAnswerPdf("");
        } catch (error) {
            console.error("Failed to submit exam:", error);
            alert("Submission failed: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGradeSubmission = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/exams/submissions/${gradingSubmission._id}/grade`, {
                obtainedPoints: gradeData.points,
                feedback: gradeData.feedback,
            });
            setGradingSubmission(null);
            loadSubmissions(selectedExam._id);
        } catch (error) {
            console.error("Failed to grade submission:", error);
        }
    };

    if (loading) return <div>Loading exams...</div>;

    return (
        <div className="space-y-6">
            {/* Header & Create Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                    Exams & Assignments
                </h2>
                {isMentor && (
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" /> Create Exam
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Exam</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateExam} className="space-y-4">
                                <Input
                                    placeholder="Exam Title"
                                    value={newExam.title}
                                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                                    required
                                />
                                <Input
                                    placeholder="Description"
                                    value={newExam.description}
                                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                                />
                                <Input
                                    placeholder="Question PDF URL"
                                    value={newExam.questionPdf}
                                    onChange={(e) => setNewExam({ ...newExam, questionPdf: e.target.value })}
                                    required
                                />
                                <Input
                                    type="datetime-local"
                                    placeholder="Deadline"
                                    value={newExam.deadline}
                                    onChange={(e) => setNewExam({ ...newExam, deadline: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Total Points"
                                    value={newExam.totalPoints}
                                    onChange={(e) => setNewExam({ ...newExam, totalPoints: e.target.value })}
                                    required
                                />
                                <Button type="submit" className="w-full">Create Exam</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Exam List */}
            {!selectedExam ? (
                <div className="grid gap-4">
                    {exams.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-gray-500">
                                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No exams available yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        exams.map((exam) => (
                            <Card key={exam._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewExam(exam._id)}>
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">{exam.title}</h3>
                                        <p className="text-sm text-gray-500">{exam.description}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Deadline: {exam.deadline ? new Date(exam.deadline).toLocaleDateString() : "No deadline"}
                                            </span>
                                            <span>Points: {exam.totalPoints}</span>
                                        </div>
                                    </div>
                                    <Button variant="outline">View Details</Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                // Exam Detail View
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => setSelectedExam(null)} className="mb-4">
                        ← Back to Exams
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedExam.title}</CardTitle>
                            <div className="flex gap-2 text-sm text-gray-500">
                                <Badge variant="outline">Points: {selectedExam.totalPoints}</Badge>
                                {selectedExam.deadline && (
                                    <Badge variant={new Date(selectedExam.deadline) < new Date() ? "destructive" : "secondary"}>
                                        Deadline: {new Date(selectedExam.deadline).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p>{selectedExam.description}</p>

                            <div className="p-4 bg-slate-50 rounded-lg border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div>
                                        <p className="font-medium">Question Paper</p>
                                        <a href={selectedExam.questionPdf} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            View PDF
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Student View */}
                            {!isMentor && (
                                <div className="mt-6 border-t pt-6">
                                    <h3 className="font-bold mb-4">Your Submission</h3>
                                    {selectedExam.submission ? (
                                        <div className="space-y-4">
                                            <Alert className="bg-green-50 border-green-200">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <AlertDescription className="text-green-800">
                                                    Submitted on {new Date(selectedExam.submission.submittedAt).toLocaleDateString()}
                                                </AlertDescription>
                                            </Alert>

                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Status:</span>
                                                <Badge className={selectedExam.submission.status === "graded" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                    {selectedExam.submission.status.toUpperCase()}
                                                </Badge>
                                            </div>

                                            {selectedExam.submission.status === "graded" && (
                                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                    <p className="font-bold text-purple-900">Grade: {selectedExam.submission.obtainedPoints} / {selectedExam.totalPoints}</p>
                                                    {selectedExam.submission.feedback && (
                                                        <p className="mt-2 text-purple-800 text-sm">Feedback: {selectedExam.submission.feedback}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitExam} className="space-y-4">
                                            <Input
                                                placeholder="Paste your Answer PDF URL here"
                                                value={answerPdf}
                                                onChange={(e) => setAnswerPdf(e.target.value)}
                                                required
                                            />
                                            <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700">
                                                {submitting ? "Submitting..." : "Submit Answer"}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Mentor View - Submissions List */}
                            {isMentor && (
                                <div className="mt-6 border-t pt-6">
                                    <h3 className="font-bold mb-4">Student Submissions ({submissions.length})</h3>
                                    <div className="space-y-4">
                                        {submissions.map((sub) => (
                                            <Card key={sub._id}>
                                                <CardContent className="p-4 flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                            <img src={sub.student?.profile?.avatar} alt={sub.student?.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{sub.student?.name}</p>
                                                            <a href={sub.answerPdf} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> View Answer Script
                                                            </a>
                                                            <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        {sub.status === "graded" ? (
                                                            <div>
                                                                <Badge className="bg-green-100 text-green-800 mb-2">Graded</Badge>
                                                                <p className="font-bold">{sub.obtainedPoints} / {selectedExam.totalPoints}</p>
                                                            </div>
                                                        ) : (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" onClick={() => {
                                                                        setGradingSubmission(sub);
                                                                        setGradeData({ points: 0, feedback: "" });
                                                                    }}>
                                                                        Grade
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Grade Submission</DialogTitle>
                                                                    </DialogHeader>
                                                                    <form onSubmit={handleGradeSubmission} className="space-y-4">
                                                                        <div>
                                                                            <label className="text-sm font-medium">Points (Max {selectedExam.totalPoints})</label>
                                                                            <Input
                                                                                type="number"
                                                                                max={selectedExam.totalPoints}
                                                                                value={gradeData.points}
                                                                                onChange={(e) => setGradeData({ ...gradeData, points: e.target.value })}
                                                                                required
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-sm font-medium">Feedback</label>
                                                                            <Input
                                                                                value={gradeData.feedback}
                                                                                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                                                                placeholder="Optional feedback..."
                                                                            />
                                                                        </div>
                                                                        <Button type="submit" className="w-full">Submit Grade</Button>
                                                                    </form>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
