import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import clientConfig from "@/config/client-config.json";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ClientInfoForm from "@/components/add-client/ClientInfoForm";
import GuardianInfoForm from "@/components/add-client/GuardianInfoForm";
import TreatmentInfoForm from "@/components/add-client/TreatmentInfoForm";
import AccountSetupForm from "@/components/add-client/AccountSetupForm";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const addClientSchema = z.object({
  // Client Information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().optional(),
  diagnosis: z.string().optional(),
  
  // Guardian Information
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianRelation: z.string().min(2, "Relation is required"),
  guardianEmail: z.string().email("Invalid email address"),
  guardianPhone: z.string().min(10, "Valid phone number is required"),
  
  // Treatment Information
  treatmentPlan: z.array(z.string()).min(1, "At least one treatment plan is required"),
  treatmentGoals: z.array(z.string()).optional(),
  notes: z.string().optional(),
  
  // Account Setup
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AddClientFormValues = z.infer<typeof addClientSchema>;

export default function AddClientPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if user is practitioner
  useEffect(() => {
    if (!isLoadingUser && user) {
      if (user.role !== "practitioner") {
        setLocation("/");
        toast({
          title: "Access denied",
          description: "Only practitioners can add clients",
          variant: "destructive",
        });
      }
    }
  }, [user, isLoadingUser, setLocation, toast]);
  
  const form = useForm<AddClientFormValues>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      diagnosis: "",
      guardianName: "",
      guardianRelation: "parent",
      guardianEmail: "",
      guardianPhone: "",
      treatmentPlan: [],
      treatmentGoals: [],
      notes: "",
      username: "",
      password: "",
    },
  });
  
  const createClientMutation = useMutation({
    mutationFn: async (data: AddClientFormValues) => {
      // Instead of using /api/register which logs us in as the new user,
      // we'll update the server-side API to have a special endpoint that doesn't log in
      try {
        // First create the client user account (but don't log in as them)
        const clientUser = {
          username: data.username,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`,
          email: data.guardianEmail,
          role: "client",
        };
        
        // Next create the client profile in a single request
        const clientData = {
          user: clientUser, // Send the user data to be created
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          diagnosis: data.diagnosis,
          guardianName: data.guardianName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail,
          treatmentPlan: data.treatmentPlan,
          treatmentGoals: data.treatmentGoals,
          notes: data.notes,
        };
        
        // This will create both the user and client profile in one request
        const clientResponse = await apiRequest("POST", "/api/clients/with-user", clientData);
        return await clientResponse.json();
      } catch (error) {
        console.error("Error creating client:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Client added successfully",
        description: "The client account has been created.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to add client",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: AddClientFormValues) => {
    createClientMutation.mutate(values);
  };
  
  const handleCancel = () => {
    setLocation("/");
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav />

      <main className="main-content min-h-screen pb-16">
        <div className="p-4 md:p-6">
          {/* Header with back button */}
          <header className="mb-6">
            <button 
              className="mb-2 text-primary flex items-center text-sm"
              onClick={() => setLocation("/")}
            >
              <i className="ri-arrow-left-line mr-1"></i> Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">Add New Client</h1>
            <p className="text-gray-500">Create a new client account and profile</p>
          </header>

          {/* Add Client Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Client Information Form */}
                  <ClientInfoForm form={form} />
                  
                  {/* Guardian Information Form */}
                  <GuardianInfoForm form={form} />
                </div>
                
                {/* Treatment Information Form */}
                <TreatmentInfoForm form={form} />
                
                {/* Account Setup Form */}
                <AccountSetupForm form={form} />
                
                {/* Form Buttons */}
                <div className="border-t pt-6 flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createClientMutation.isPending}
                  >
                    {createClientMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Client Account...
                      </>
                    ) : (
                      "Create Client Account"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
