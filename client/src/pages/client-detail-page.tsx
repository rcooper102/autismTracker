import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Trash2, Archive } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ClientHeader from "@/components/client-detail/ClientHeader";
import MoodChart from "@/components/client-detail/MoodChart";
import DataEntries from "@/components/client-detail/DataEntries";
import ClientInfo from "@/components/client-detail/ClientInfo";
import ClientNotes from "@/components/client-detail/ClientNotes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showArchiveConfirmation, setShowArchiveConfirmation] = useState(false);
  // Mobile navigation state (declare before any conditional returns)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Redirect if we don't have a valid ID
  useEffect(() => {
    if (!id) {
      setLocation("/");
    }
  }, [id, setLocation]);
  
  // Archive client mutation
  const archiveClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/clients/${id}/archive`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client archived",
        description: "Client has been archived successfully. They will no longer appear in your client list.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error archiving client",
        description: error.message || "Failed to archive client. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/clients/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "Client and all associated data have been deleted successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting client",
        description: error.message || "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="main-content min-h-screen pb-16">
        <div className="p-4 md:p-6">
          {/* Client Header with back button, name, etc. */}
          <ClientHeader 
            client={client} 
            onBack={() => setLocation("/")}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          {/* Main content grid with client details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 lg:col-span-2">
              {/* Mood Trends Chart */}
              <MoodChart dataEntries={dataEntries || []} isLoading={isLoadingData} />
              
              {/* Recent Data Entries */}
              <DataEntries dataEntries={dataEntries || []} isLoading={isLoadingData} />
              
              {/* Client Notes */}
              <ClientNotes clientId={parseInt(id)} />
            </div>
            
            <div className="col-span-1">
              {/* Client Details */}
              <ClientInfo client={client} />
            </div>
          </div>
          
          {/* Danger Zone Section - only visible to practitioners */}
          {user?.role === "practitioner" && (
            <div className="mt-12 border-t pt-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-6">
                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </h3>
                
                {/* Archive Client Option */}
                <div className="mt-4 mb-6 pb-6 border-b border-red-200">
                  <h4 className="font-medium text-red-800">Archive Client</h4>
                  <p className="mt-2 text-red-700">
                    Archiving a client will hide them from your client list, but keep all their data intact. You can unarchive them later if needed.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setShowArchiveConfirmation(true)}
                  >
                    <Archive className="h-4 w-4" />
                    Archive Client
                  </Button>
                </div>
                
                {/* Delete Client Option */}
                <h4 className="font-medium text-red-800">Delete Client</h4>
                <p className="mt-2 text-red-700">
                  Deleting this client will permanently remove all associated data including notes, data entries, and user account information. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  className="mt-4 flex items-center gap-2"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Client
                </Button>
              </div>
            </div>
          )}
          
          {/* Archive Confirmation Dialog */}
          <AlertDialog open={showArchiveConfirmation} onOpenChange={setShowArchiveConfirmation}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide <strong>{client?.firstName} {client?.lastName}</strong> from your client list, but all their data will be preserved. You can always access archived clients later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => archiveClientMutation.mutate()}
                >
                  {archiveClientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    "Archive Client"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete <strong>{client?.firstName} {client?.lastName}</strong> and all their associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteClientMutation.mutate()}
                >
                  {deleteClientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Client"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
