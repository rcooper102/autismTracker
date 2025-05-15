import { Client } from "@shared/schema";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ClientInfoProps {
  client: Client & { user?: any };
}

export default function ClientInfo({ client }: ClientInfoProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Client Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian</label>
          <p className="text-gray-900">{client.guardianName || "Not specified"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
          <p className="text-gray-900">{client.guardianPhone || "Not specified"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-gray-900">{client.guardianEmail || "Not specified"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
          <p className="text-gray-900">{client.diagnosis || "Not specified"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
          <p className="text-gray-900">{client.treatmentPlan || "Not specified"}</p>
        </div>
        <div className="pt-3">
          <Link href={`/edit-client/${client.id}`}>
            <Button 
              variant="outline"
              className="w-full flex items-center justify-center"
            >
              <i className="ri-edit-line mr-2"></i> Edit Client
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
