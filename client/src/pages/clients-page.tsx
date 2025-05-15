import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ClientWithUser } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Fetch all clients for the practitioner
  const { data: clients, isLoading } = useQuery<ClientWithUser[]>({
    queryKey: ["/api/clients"],
    enabled: !!user && user.role === "practitioner",
  });
  
  // Add logging when clients data changes
  useEffect(() => {
    if (clients && clients.length > 0) {
      console.log("Full clients data structure:", JSON.stringify(clients, null, 2));
      // Check if any clients have avatarUrl
      const clientsWithAvatars = clients.filter(client => client.avatarUrl);
      console.log("Clients with avatars:", clientsWithAvatars);
      // Log each avatar URL
      clients.forEach((client, index) => {
        console.log(`Client #${index+1} (${client.firstName} ${client.lastName}) - avatarUrl:`, client.avatarUrl || "none");
      });
    }
  }, [clients]);
  
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

  // Helper function to generate random time ago strings for demo purposes
  const getRandomTimeAgo = () => {
    const options = [
      "2 hours ago",
      "Yesterday",
      "2 days ago",
      "3 days ago",
      "1 week ago",
    ];
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main className="main-content min-h-screen pb-16">
        <div className="p-4 md:p-6">
          {/* Header with back button */}
          <header className="mb-6 flex items-center justify-between">
            <div>
              <button 
                className="mb-2 text-primary flex items-center text-sm"
                onClick={() => setLocation("/")}
              >
                <i className="ri-arrow-left-line mr-1"></i> Back to Dashboard
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">All Clients</h1>
              <p className="text-gray-500">View and manage all your clients</p>
            </div>
            <Button 
              onClick={() => setLocation("/add-client")}
              className="hidden md:flex items-center"
            >
              <i className="ri-user-add-line mr-2"></i>
              Add New Client
            </Button>
          </header>

          {/* Client list */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">All Clients ({clients?.length || 0})</h2>
            </div>

            {isLoading ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
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
            ) : clients?.length === 0 ? (
              <div className="p-6 text-center">
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
            ) : (
              <div className="divide-y">
                {clients?.map((client, index) => {
                  const colorClass = colors[index % colors.length];
                  const { label, color } = getStatusLabel(client);
                  const initials = `${client.firstName[0]}${client.lastName[0]}`;
                  
                  return (
                    <Link key={client.id} href={`/clients/${client.id}`} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={colorClass}>
                              <span className="font-medium">{initials}</span>
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Display avatar directly for debugging */}
                          {client.avatarUrl && (
                            <div className="mt-2 text-xs flex flex-col items-center">
                              <div className="text-gray-500 mb-1">Avatar URL:</div>
                              <div className="border p-2 text-xs overflow-auto max-w-[150px]">
                                {client.avatarUrl}
                              </div>
                              <div className="mt-2 border p-1 bg-gray-50">
                                <img 
                                  src={client.avatarUrl} 
                                  alt="Direct avatar test"
                                  className="w-20 h-20 object-cover"
                                  onError={(e) => {
                                    console.error("Error loading image:", client.avatarUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => console.log("Image loaded successfully:", client.avatarUrl)}
                                />
                              </div>
                            </div>
                          )}
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
            )}
          </div>

          {/* Mobile add button (visible only on small screens) */}
          <div className="fixed bottom-6 right-6 md:hidden">
            <Button 
              onClick={() => setLocation("/add-client")}
              className="w-12 h-12 rounded-full flex items-center justify-center"
            >
              <i className="ri-add-line text-xl"></i>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}