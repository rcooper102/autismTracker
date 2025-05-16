import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ClientWithUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeftIcon, ArchiveRestoreIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function ArchivedClientsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Fetch archived clients for the practitioner
  const { data: clients, isLoading, refetch } = useQuery<ClientWithUser[]>({
    queryKey: ["/api/clients/archived"],
    enabled: !!user && user.role === "practitioner",
    staleTime: 0, // Always revalidate data when navigating to this page
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
  
  // Effect to refetch archived clients when this page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  // Mutation for unarchiving a client
  const unarchiveMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/clients/${clientId}/unarchive`,
        {}
      );
      return await res.json();
    },
    onSuccess: (data, clientId) => {
      // Remove this client from the current archived clients list in the cache
      const previousArchivedClients = queryClient.getQueryData<ClientWithUser[]>(["/api/clients/archived"]);
      if (previousArchivedClients) {
        queryClient.setQueryData(
          ["/api/clients/archived"],
          previousArchivedClients.filter(client => client.id !== clientId)
        );
      }
      
      // Add the unarchived client to the active clients list
      const previousClients = queryClient.getQueryData<ClientWithUser[]>(["/api/clients"]);
      if (previousClients && data.client) {
        queryClient.setQueryData(
          ["/api/clients"],
          [...previousClients, data.client]
        );
      }
      
      // Also invalidate the queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/clients/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "Client unarchived",
        description: "Client has been successfully restored to active clients.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unarchive client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUnarchive = (clientId: number) => {
    unarchiveMutation.mutate(clientId);
  };

  const goToClientDetails = (clientId: number) => {
    setLocation(`/clients/${clientId}`);
  };

  const goToClients = () => {
    setLocation("/clients");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 p-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="mr-4"
                onClick={goToClients}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Archived Clients</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Archived Clients List</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : clients && clients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => goToClientDetails(client.id)}
                          >
                            <Avatar className="h-9 w-9 mr-3">
                              <AvatarImage
                                src={client.avatarUrl || ""}
                                alt={`${client.firstName} ${client.lastName}`}
                              />
                              <AvatarFallback>
                                {client.firstName?.[0]}
                                {client.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {client.firstName} {client.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client.diagnosis || "Not specified"}</TableCell>
                        <TableCell>
                          {client.guardianName || "Not specified"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnarchive(client.id)}
                            disabled={unarchiveMutation.isPending}
                            className="flex items-center justify-center"
                          >
                            <ArchiveRestoreIcon className="h-4 w-4 mr-2" />
                            Unarchive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No archived clients found.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}