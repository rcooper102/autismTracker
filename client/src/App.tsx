import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ClientDetailPage from "@/pages/client-detail-page";
import DataEntryPage from "@/pages/data-entry-page";
import AddClientPage from "@/pages/add-client-page";
import ClientsPage from "@/pages/clients-page";
import ArchivedClientsPage from "@/pages/archived-clients-page";
import AccountSettingsPage from "@/pages/account-settings-page";
import ClientAccountSettingsPage from "@/pages/client-account-settings-page";
import EditClientPage from "@/pages/edit-client-page";
import NoteDetailPage from "@/pages/note-detail-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/archived" component={ArchivedClientsPage} />
      <ProtectedRoute path="/clients/:id" component={ClientDetailPage} />
      <ProtectedRoute path="/clients/:id/edit" component={EditClientPage} />
      <ProtectedRoute path="/notes/:noteId" component={NoteDetailPage} />
      <ProtectedRoute path="/log-data" component={DataEntryPage} />
      <ProtectedRoute path="/add-client" component={AddClientPage} />
      <ProtectedRoute path="/account" component={({ user }) => 
        user?.role === "client" ? <ClientAccountSettingsPage /> : <AccountSettingsPage />
      } />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className={`flex-1 p-4 md:p-6 ${location === "/auth" ? "" : "md:ml-[240px]"}`} id="main-content">
                <Router />
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
