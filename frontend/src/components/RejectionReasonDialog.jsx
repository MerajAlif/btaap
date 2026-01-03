// src/components/RejectionReasonDialog.jsx
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RejectionReasonDialog({
    isOpen,
    onClose,
    onConfirm,
    studentName,
    isProcessing
}) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError("Please provide a reason for rejection");
            return;
        }
        if (reason.trim().length < 10) {
            setError("Reason must be at least 10 characters");
            return;
        }
        onConfirm(reason.trim());
        setReason("");
        setError("");
    };

    const handleClose = () => {
        setReason("");
        setError("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reject Join Request</DialogTitle>
                    <DialogDescription>
                        You are rejecting the join request from <span className="font-semibold text-gray-900">{studentName}</span>.
                        Please provide a reason that will be shown to the student.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                            Rejection Reason *
                        </label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why this request is being rejected..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                            rows={5}
                            maxLength={500}
                            className="resize-none"
                            disabled={isProcessing}
                        />
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                {reason.length}/500 characters
                            </p>
                            {reason.trim().length > 0 && reason.trim().length < 10 && (
                                <p className="text-xs text-amber-600">Minimum 10 characters</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isProcessing || !reason.trim() || reason.trim().length < 10}
                    >
                        {isProcessing ? "Rejecting..." : "Reject Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
