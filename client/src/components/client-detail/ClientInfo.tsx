import { Client } from "@shared/schema";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import clientConfig from "@/config/client-config.json";
import { ReactNode } from "react";

interface ClientInfoProps {
  client: Client & { user?: any };
}

export default function ClientInfo({ client }: ClientInfoProps) {
  // Function to get diagnosis label from value
  const getDiagnosisLabel = (value: string | null) => {
    if (!value) return "Not specified";
    
    const diagnosis = clientConfig.diagnosisOptions.find(d => d.value === value);
    return diagnosis ? diagnosis.label : value;
  };
  
  // Function to get guardian relation label from value
  const getGuardianRelationLabel = (value: string | null) => {
    if (!value) return "Not specified";
    
    const relation = clientConfig.guardianRelationOptions.find(r => r.value === value);
    return relation ? relation.label : value;
  };
  
  // Function to get treatment plan label from value
  const getTreatmentPlanLabel = (plan: string) => {
    const planOption = clientConfig.treatmentPlanOptions.find(p => p.value === plan);
    return planOption ? planOption.label : plan;
  };
  
  // Format treatment plan array to list items
  const formatTreatmentPlan = (plan: string[] | null): ReactNode => {
    if (!plan || plan.length === 0) return "Not specified";
    
    return plan.map((p, index) => getTreatmentPlanLabel(p));
  };
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Client Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian</label>
          <p className="text-gray-900">{client.guardianName || "Not specified"} 
            {client.guardianRelation && (
              <span className="text-gray-500 text-sm ml-1">
                ({getGuardianRelationLabel(client.guardianRelation)})
              </span>
            )}
          </p>
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
          <p className="text-gray-900">{getDiagnosisLabel(client.diagnosis)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
          {client.treatmentPlan && Array.isArray(client.treatmentPlan) && client.treatmentPlan.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 text-gray-900">
              {client.treatmentPlan.map((plan, index) => (
                <li key={index}>{getTreatmentPlanLabel(plan)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-900">Not specified</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goals</label>
          {client.treatmentGoals && Array.isArray(client.treatmentGoals) && client.treatmentGoals.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 text-gray-900">
              {client.treatmentGoals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-900">Not specified</p>
          )}
        </div>
        <div className="pt-3">
          <Link href={`/clients/${client.id}/edit`}>
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
