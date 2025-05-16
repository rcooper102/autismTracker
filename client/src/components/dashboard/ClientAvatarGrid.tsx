import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientWithUser } from "@shared/schema";

interface ClientAvatarGridProps {
  clients: ClientWithUser[];
  isLoading: boolean;
}

export default function ClientAvatarGrid({ clients, isLoading }: ClientAvatarGridProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold">My Clients</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no clients, show empty state
  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold">My Clients</h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">
            No clients have been added yet. Add your first client to get started.
          </p>
          <Link href="/add-client" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg">
            <i className="ri-user-add-line mr-2"></i>
            Add Client
          </Link>
        </div>
      </div>
    );
  }

  // Generate colors for avatars
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-red-100 text-red-700",
    "bg-indigo-100 text-indigo-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">My Clients</h2>
        <Link href="/clients" className="text-primary text-sm flex items-center">
          <i className="ri-user-settings-line mr-1"></i> Manage Clients <i className="ri-arrow-right-s-line ml-1"></i>
        </Link>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {clients.map((client, index) => {
            const colorClass = colors[index % colors.length];
            const initials = `${client.firstName[0]}${client.lastName[0]}`;
            
            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <Avatar 
                    src={client.avatarUrl || null}
                    alt={`${client.firstName} ${client.lastName}`}
                    size="lg"
                    className="group-hover:shadow-md transition-all"
                  >
                    <AvatarFallback className={colorClass}>
                      <span className="text-lg font-medium">{initials}</span>
                    </AvatarFallback>
                  </Avatar>
                  <span className="mt-2 text-sm font-medium text-center truncate w-full">
                    {client.firstName} {client.lastName}
                  </span>
                </div>
              </Link>
            );
          })}
          
          {/* Add client button */}
          <Link href="/add-client">
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-all">
                <span className="text-white text-2xl font-semibold">+</span>
              </div>
              <span className="mt-2 text-sm font-medium text-center text-gray-700">
                Add Client
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}