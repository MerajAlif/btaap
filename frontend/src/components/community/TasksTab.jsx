// components/community/TasksTab.jsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Plus, Upload, Download, CheckCircle, Clock } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function TasksTab({ communityId, isMentor, user }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        type: "assignment",
        tags: "",
        dueDate: "",
        totalMarks: 100,
        instructionFiles: [],
    });

    const [submissionFiles, setSubmissionFiles] = useState([]);
    const [gradeForm, setGradeForm] = useState({ marksObtained: "", feedback: "" });

    useEffect(() => {
        loadTasks();
    }, [communityId]);

    const loadTasks = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/tasks/${communityId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("title", taskForm.title);
            formData.append("description", taskForm.description);
            formData.append("type", taskForm.type);
            formData.append("tags", JSON.stringify(taskForm.tags.split(",").map(t => t.trim()).filter(Boolean)));
            formData.append("dueDate", taskForm.dueDate);
            formData.append("totalMarks", taskForm.totalMarks);

            Array.from(taskForm.instructionFiles).forEach((file) => {
                formData.append("instructionFiles", file);
            });

            const res = await fetch(`${BASE_URL}/api/tasks/${communityId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setTasks([data.task, ...tasks]);
                setIsCreateOpen(false);
                setTaskForm({
                    title: "",
                    description: "",
                    type: "assignment",
                    tags: "",
                    dueDate: "",
                    totalMarks: 100,
                    instructionFiles: [],
                });
                setSuccess("Task created successfully!");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to create task");
            }
        } catch (error) {
            setError("Failed to create task");
        }
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();

            Array.from(submissionFiles).forEach((file) => {
                formData.append("submittedFiles", file);
            });

            const res = await fetch(`${BASE_URL}/api/tasks/${communityId}/${selectedTask._id}/submit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setIsSubmitOpen(false);
                setSubmissionFiles([]);
                setSuccess("Task submitted successfully!");
                loadTasks();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to submit task");
            }
        } catch (error) {
            setError("Failed to submit task");
        }
    };

    const loadSubmissions = async (taskId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/tasks/${communityId}/${taskId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
            }
        } catch (error) {
            console.error("Failed to load submissions:", error);
        }
    };

    const handleGradeSubmission = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${BASE_URL}/api/tasks/${communityId}/${selectedTask._id}/submissions/${selectedSubmission._id}/grade`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(gradeForm),
                }
            );

            const data = await res.json();
            if (data.success) {
                setIsGradeOpen(false);
                setGradeForm({ marksObtained: "", feedback: "" });
                setSuccess("Submission graded successfully!");
                loadSubmissions(selectedTask._id);
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error || "Failed to grade submission");
            }
        } catch (error) {
            setError("Failed to grade submission");
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "assignment":
                return "bg-blue-100 text-blue-800";
            case "classwork":
                return "bg-green-100 text-green-800";
            case "test":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) return <div className="p-8 text-center">Loading tasks...</div>;

    return (
        <div className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="bg-green-50 text-green-900 border-green-200"><AlertDescription>{success}</AlertDescription></Alert>}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                {isMentor && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> Create Task</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Type</Label>
                                        <Select value={taskForm.type} onValueChange={(v) => setTaskForm({ ...taskForm, type: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="assignment">Assignment</SelectItem>
                                                <SelectItem value="classwork">Classwork</SelectItem>
                                                <SelectItem value="test">Test</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Total Marks</Label>
                                        <Input
                                            type="number"
                                            value={taskForm.totalMarks}
                                            onChange={(e) => setTaskForm({ ...taskForm, totalMarks: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Tags (comma separated)</Label>
                                    <Input
                                        value={taskForm.tags}
                                        onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                                        placeholder="e.g., Chapter 1, Important, Practice"
                                    />
                                </div>
                                <div>
                                    <Label>Due Date</Label>
                                    <Input
                                        type="datetime-local"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Instruction Files (PDF, DOC, Images)</Label>
                                    <Input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => setTaskForm({ ...taskForm, instructionFiles: e.target.files })}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Create Task</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Tasks List */}
            <div className="grid gap-4">
                {tasks.map((task) => (
                    <Card key={task._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{task.title}</h3>
                                        <Badge className={getTypeColor(task.type)}>{task.type}</Badge>
                                        {!isMentor && task.submissionStatus && (
                                            <Badge variant={task.submissionStatus === "graded" ? "default" : "secondary"}>
                                                {task.submissionStatus === "graded" ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Graded: {task.marksObtained}/{task.totalMarks}
                                                    </>
                                                ) : task.submissionStatus === "pending" ? (
                                                    <>
                                                        <Clock className="w-3 h-3 mr-1" /> Pending
                                                    </>
                                                ) : (
                                                    "Not Submitted"
                                                )}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mb-3">{task.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {task.tags?.map((tag, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Due: {new Date(task.dueDate).toLocaleString()}</span>
                                        <span>Total Marks: {task.totalMarks}</span>
                                        {task.instructionFiles?.length > 0 && (
                                            <span>{task.instructionFiles.length} file(s) attached</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!isMentor && task.submissionStatus !== "graded" && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsSubmitOpen(true);
                                            }}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {task.submissionStatus === "pending" ? "Resubmit" : "Submit"}
                                        </Button>
                                    )}
                                    {isMentor && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedTask(task);
                                                loadSubmissions(task._id);
                                                setIsGradeOpen(true);
                                            }}
                                        >
                                            View Submissions
                                        </Button>
                                    )}
                                    {task.instructionFiles?.map((file, idx) => (
                                        <Button
                                            key={idx}
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                        >
                                            <a href={`${BASE_URL}${file.fileUrl}`} download target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4 mr-2" /> {file.fileName}
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No tasks yet</p>
                    </div>
                )}
            </div>

            {/* Submit Task Dialog */}
            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Submit Task</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmitTask} className="space-y-4">
                        <div>
                            <Label>Upload Files</Label>
                            <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => setSubmissionFiles(e.target.files)}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 5 files, 10MB each</p>
                        </div>
                        <Button type="submit" className="w-full">Submit Task</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Grade Submissions Dialog */}
            <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Submissions for {selectedTask?.title}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        {submissions.map((submission) => (
                            <Card key={submission._id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{submission.student?.name}</p>
                                            <p className="text-sm text-gray-500">
                                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                            </p>
                                            {submission.status === "graded" && (
                                                <p className="text-sm font-medium text-green-600 mt-1">
                                                    Marks: {submission.marksObtained}/{selectedTask?.totalMarks}
                                                </p>
                                            )}
                                            {submission.feedback && (
                                                <p className="text-sm text-gray-600 mt-1">Feedback: {submission.feedback}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {submission.submittedFiles?.map((file, idx) => (
                                                <Button
                                                    key={idx}
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <a href={`${BASE_URL}${file.fileUrl}`} download target="_blank" rel="noopener noreferrer">
                                                        <Download className="w-4 h-4 mr-2" /> {file.fileName}
                                                    </a>
                                                </Button>
                                            ))}
                                            {submission.status === "pending" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSubmission(submission);
                                                        setGradeForm({ marksObtained: "", feedback: "" });
                                                    }}
                                                >
                                                    Grade
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {selectedSubmission?._id === submission._id && (
                                        <form onSubmit={handleGradeSubmission} className="mt-4 pt-4 border-t space-y-3">
                                            <div>
                                                <Label>Marks Obtained (out of {selectedTask?.totalMarks})</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={selectedTask?.totalMarks}
                                                    value={gradeForm.marksObtained}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, marksObtained: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>Feedback (optional)</Label>
                                                <Textarea
                                                    value={gradeForm.feedback}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit">Submit Grade</Button>
                                                <Button type="button" variant="outline" onClick={() => setSelectedSubmission(null)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {submissions.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No submissions yet</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
