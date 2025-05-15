import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { ClientWithUser } from "@shared/schema";

interface ClientListProps {
  clients: ClientWithUser[];
  isLoading: boolean;
}

export default function ClientList({ clients, isLoading }: ClientListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Recent Client Activity</h2>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no clients, show empty state
  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow mb-6 p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <i className="ri-user-line text-gray-500 text-xl"></i>
        </div>
        <h3 className="text-lg font-medium mb-2">No Clients Yet</h3>
        <p className="text-gray-500 mb-4">
          You don't have any clients at the moment. Add your first client to get started.
        </p>
        <Link href="/add-client" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg">
          <i className="ri-user-add-line mr-2"></i>
          Add Your First Client
        </Link>
      </div>
    );
  }

  // Generate colors for initials circles
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-red-100 text-red-700",
  ];

  // Get status label and color
  const getStatusLabel = (client: ClientWithUser) => {
    // This is simplified - in a real app, you would have more logic to determine status
    const lastActiveIndex = client.id % 4; // Just for demo purposes
    
    if (lastActiveIndex === 0) return { label: "New data", color: "bg-green-100 text-green-800" };
    if (lastActiveIndex === 1) return { label: "Review needed", color: "bg-yellow-100 text-yellow-800" };
    if (lastActiveIndex === 2) return { label: "Stable", color: "bg-gray-100 text-gray-800" };
    return { label: "Flagged", color: "bg-red-100 text-red-800" };
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Recent Client Activity</h2>
        <Link href="/clients" className="text-primary text-sm flex items-center">
          View All Clients <i className="ri-arrow-right-s-line ml-1"></i>
        </Link>
      </div>
      <div className="divide-y">
        {clients.slice(0, 4).map((client, index) => {
          const colorClass = colors[index % colors.length];
          const { label, color } = getStatusLabel(client);
          const initials = `${client.firstName[0]}${client.lastName[0]}`;
          
          return (
            <Link key={client.id} href={`/clients/${client.id}`} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer block">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar 
                    src={client.avatarUrl || null}
                    alt={`${client.firstName} ${client.lastName}`}
                    fallback={
                      <div className={`h-full w-full ${colorClass} flex items-center justify-center`}>
                        <span className="font-medium">{initials}</span>
                      </div>
                    }
                  />
                  <div>
                    <p className="font-medium">{`${client.firstName} ${client.lastName}`}</p>
                    <p className="text-xs text-gray-500">
                      Last entry: {getRandomTimeAgo()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 ${color} rounded-full text-xs`}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to generate random time ago strings for demo purposes
function getRandomTimeAgo() {
  const options = [
    "2 hours ago",
    "Yesterday",
    "2 days ago",
    "3 days ago",
    "1 week ago",
  ];
  return options[Math.floor(Math.random() * options.length)];
}
