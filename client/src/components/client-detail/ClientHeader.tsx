import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Link } from "wouter";
import { Menu } from "lucide-react";

interface ClientHeaderProps {
  client: Client & { user?: any };
  onBack: () => void;
  onOpenMobileMenu?: () => void;
}

export default function ClientHeader({ client, onBack, onOpenMobileMenu }: ClientHeaderProps) {
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
    <div className="mb-6">
      {/* Back button row */}
      <div className="mb-2">
        <button 
          className="text-primary flex items-center text-sm"
          onClick={onBack}
        >
          <i className="ri-arrow-left-line mr-1"></i> Back to Dashboard
        </button>
      </div>
      
      {/* Client info and edit button row */}
      <div className="flex flex-col md:flex-row justify-between">
        <div className="flex items-center mb-3 md:mb-0">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm mr-4 bg-gray-100">
            {client.avatarUrl ? (
              <img 
                src={`${client.avatarUrl}?t=${new Date().getTime()}`} 
                alt={fullName}
                className="w-full h-full object-cover"
                key={`${client.avatarUrl}?t=${new Date().getTime()}`} // Force remount on URL change
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{fullName}</h1>
            <div className="flex items-center mt-1 text-gray-500">
              <span className="text-sm mr-4">Age: {getAge()}</span>
              <span className="text-sm">Client since: {clientSince}</span>
            </div>
          </div>
        </div>
        <div className="flex">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" className="gap-0 px-2 h-9">
              <i className="ri-edit-line mr-1"></i> Edit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
