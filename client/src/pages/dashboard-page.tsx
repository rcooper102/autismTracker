import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Stats from "@/components/dashboard/Stats";
import ClientList from "@/components/dashboard/ClientList";
import ActionButtons from "@/components/dashboard/ActionButtons";
import UpcomingSessions from "@/components/dashboard/UpcomingSessions";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch statistics for the practitioner dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics"],
    enabled: user?.role === "practitioner",
  });

  // Fetch clients for the practitioner
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: user?.role === "practitioner",
  });

  // Fetch sessions for the practitioner
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: user?.role === "practitioner",
  });

  // If user is a client, redirect to data entry page
  if (user?.role === "client") {
    return <Redirect to="/log-data" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav />

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
            activeSessions={stats?.activeSessions || 0}
            pendingReviews={stats?.pendingReviews || 0}
            isLoading={isLoadingStats}
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
