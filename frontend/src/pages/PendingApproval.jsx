import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Mail } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function PendingApproval() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        Pending Approval
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertDescription className="text-yellow-800">
                            Your mentor application is currently under review by our admin team.
                        </AlertDescription>
                    </Alert>

                    <div className="text-center space-y-3">
                        <Mail className="w-16 h-16 mx-auto text-gray-400" />
                        <p className="text-gray-600">
                            We'll notify you via email at <strong>{user?.email}</strong> once your
                            application has been reviewed.
                        </p>
                        <p className="text-sm text-gray-500">
                            This usually takes 1-2 business days.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
