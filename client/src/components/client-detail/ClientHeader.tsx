import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ClientHeaderProps {
  client: Client & { user?: any };
  onBack: () => void;
}

export default function ClientHeader({ client, onBack }: ClientHeaderProps) {
  const fullName = `${client.firstName} ${client.lastName}`;
  
  // Calculate age if date of birth is available
  const getAge = () => {
    if (!client.dateOfBirth) return "N/A";
    const birthDate = new Date(client.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Calculate client since date
  const clientSince = client.createdAt 
    ? format(new Date(client.createdAt), "MMMM yyyy")
    : "N/A";
  
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <button 
          className="mb-2 text-primary flex items-center text-sm"
          onClick={onBack}
        >
          <i className="ri-arrow-left-line mr-1"></i> Back to Dashboard
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">{fullName}</h1>
        <div className="flex items-center mt-1 text-gray-500">
          <span className="text-sm mr-4">Age: {getAge()}</span>
          <span className="text-sm">Client since: {clientSince}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" className="flex items-center justify-center">
          <i className="ri-file-download-line mr-2"></i> <span className="mr-2">Export</span>
        </Button>
        <Button className="flex items-center justify-center">
          <i className="ri-user-settings-line mr-2"></i> <span className="mr-2">Manage</span>
        </Button>
      </div>
    </div>
  );
}
