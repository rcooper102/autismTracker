import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ClientHeader from "@/components/client-detail/ClientHeader";
import MoodChart from "@/components/client-detail/MoodChart";
import DataEntries from "@/components/client-detail/DataEntries";
import ClientInfo from "@/components/client-detail/ClientInfo";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Redirect if we don't have a valid ID
  useEffect(() => {
    if (!id) {
      setLocation("/");
    }
  }, [id, setLocation]);

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${id}`],
    enabled: !!id,
  });

  // Fetch client data entries
  const { data: dataEntries, isLoading: isLoadingData } = useQuery({
    queryKey: [`/api/clients/${id}/data`],
    enabled: !!id,
  });

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium">Client not found</h2>
          <p className="text-gray-500 mt-2">The client you're looking for doesn't exist or you don't have access.</p>
          <button 
            onClick={() => setLocation("/")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav />

      <main className="main-content min-h-screen pb-16">
        <div className="p-4 md:p-6">
          {/* Client Header with back button, name, etc. */}
          <ClientHeader 
            client={client} 
            onBack={() => setLocation("/")} 
          />

          {/* Main content grid with client details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 lg:col-span-2">
              {/* Mood Trends Chart */}
              <MoodChart dataEntries={dataEntries || []} isLoading={isLoadingData} />
              
              {/* Recent Data Entries */}
              <DataEntries dataEntries={dataEntries || []} isLoading={isLoadingData} />
            </div>
            
            <div className="col-span-1">
              {/* Client Details */}
              <ClientInfo client={client} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
