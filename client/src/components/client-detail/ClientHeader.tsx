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
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center md:block">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <button 
          className="mb-2 text-primary flex items-center text-sm"
          onClick={onBack}
        >
          <i className="ri-arrow-left-line mr-1"></i> Back to Dashboard
        </button>
        <div className="flex items-center">
          <Avatar 
            src={client.avatarUrl ? `${client.avatarUrl}?t=${Date.now()}` : null} 
            alt={fullName}
            size="lg"
            className="mr-4"
          >
            <AvatarFallback />
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{fullName}</h1>
            <div className="flex items-center mt-1 text-gray-500">
              <span className="text-sm mr-4">Age: {getAge()}</span>
              <span className="text-sm">Client since: {clientSince}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex">
        <Button variant="outline" className="gap-0 px-2 h-9 mr-1">
          <i className="ri-file-download-line mr-1"></i> Export
        </Button>
        <Link href={`/clients/${client.id}/edit`}>
          <Button variant="outline" className="gap-0 px-2 h-9 mr-1">
            <i className="ri-edit-line mr-1"></i> Edit
          </Button>
        </Link>
        <Button className="gap-0 px-2 h-9">
          <i className="ri-user-settings-line mr-1"></i> Manage
        </Button>
      </div>
    </div>
  );
}
