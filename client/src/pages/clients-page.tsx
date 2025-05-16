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
    staleTime: 0, // Always revalidate data when navigating to this page
    refetchOnWindowFocus: true, // Refetch when window regains focus
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
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setLocation("/clients/archived")}
                className="hidden md:flex items-center"
              >
                <i className="ri-archive-line mr-2"></i>
                Archived
              </Button>
              <Button 
                onClick={() => setLocation("/add-client")}
                className="hidden md:flex items-center"
              >
                <i className="ri-user-add-line mr-2"></i>
                Add New Client
              </Button>
            </div>
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
                  const initials = `${client.firstName[0]}${client.lastName[0]}`;
                  
                  return (
                    <Link key={client.id} href={`/clients/${client.id}`} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer block">
                      <div className="flex items-center">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10" src={client.avatarUrl}>
                            <AvatarFallback className={colorClass}>
                              <span className="font-medium">{initials}</span>
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{`${client.firstName} ${client.lastName}`}</p>
                            <p className="text-xs text-gray-500">
                              Last entry: {getRandomTimeAgo()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile buttons (visible only on small screens) */}
          <div className="fixed bottom-6 right-6 md:hidden flex flex-col gap-2">
            <Button 
              variant="outline"
              onClick={() => setLocation("/clients/archived")}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white"
            >
              <i className="ri-archive-line text-xl"></i>
            </Button>
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