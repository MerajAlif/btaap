// src/components/auth/PendingApproval.jsx
import useAuth from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PendingApproval() {
  const { user } = useAuth();
  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mentor Approval Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Hi {user?.name || 'there'}, your mentor account is awaiting admin review.
            You'll get access to mentor features once approved.
          </p>
          <Badge variant="secondary">Status: {user?.approvalStatus || 'pending'}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
