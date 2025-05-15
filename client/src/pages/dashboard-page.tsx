import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Stats from "@/components/dashboard/Stats";
import ClientList from "@/components/dashboard/ClientList";
import ClientAvatarGrid from "@/components/dashboard/ClientAvatarGrid";
import ActionButtons from "@/components/dashboard/ActionButtons";
import UpcomingSessions from "@/components/dashboard/UpcomingSessions";

export default function DashboardPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Handle redirects if user is a client
  useEffect(() => {
    if (!isLoadingUser && user) {
      if (user.role === "client") {
        setLocation("/log-data");
        toast({
          title: "Redirected",
          description: "Clients are redirected to the data entry page",
        });
      }
    }
  }, [user, isLoadingUser, setLocation, toast]);

  // Fetch statistics for the practitioner dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics"],
    enabled: !isLoadingUser && user?.role === "practitioner",
  });

  // Fetch clients for the practitioner
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: !isLoadingUser && user?.role === "practitioner",
  });

  // Fetch sessions for the practitioner
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: !isLoadingUser && user?.role === "practitioner",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main className="main-content min-h-screen pb-16">
        <div id="practitioner-dashboard" className="p-4 md:p-6">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name?.split(' ')[0]}</p>
          </header>

          {/* Stats */}
          <Stats 
            totalClients={stats?.totalClients || 0}
            pendingReviews={stats?.pendingReviews || 0}
            isLoading={isLoadingStats}
          />
          
          {/* Client Avatar Grid */}
          <ClientAvatarGrid 
            clients={clients || []} 
            isLoading={isLoadingClients} 
          />

          {/* Client List */}
          <ClientList 
            clients={clients || []} 
            isLoading={isLoadingClients} 
          />

          {/* Action Buttons */}
          <ActionButtons 
            onAddClient={() => setLocation("/add-client")}
            onGenerateReports={() => setLocation("/reports")}
          />

          {/* Upcoming Sessions */}
          <UpcomingSessions 
            sessions={sessions || []} 
            isLoading={isLoadingSessions} 
          />
        </div>
      </main>
    </div>
  );
}
