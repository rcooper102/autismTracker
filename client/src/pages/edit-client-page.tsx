import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Client } from "@shared/schema";
import clientConfig from "@/config/client-config.json";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const editClientSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  treatmentGoals: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email("Invalid email address").optional(),
  notes: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EditClientFormValues = z.infer<typeof editClientSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function EditClientPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch client data
  const { data: client, isLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${id}`],
    enabled: !!id,
  });

  // Client info form
  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      diagnosis: "",
      treatmentPlan: "",
      treatmentGoals: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      guardianEmail: "",
      notes: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract avatar URL from client notes if available
  const getAvatarUrl = (clientData: any): string | null => {
    if (!clientData?.notes) return null;
    
    try {
      // Try to parse notes as JSON to get avatarUrl
      const notesObj = JSON.parse(clientData.notes);
      if (notesObj.avatarUrl) return notesObj.avatarUrl;
    } catch (e) {
      // Not JSON or no avatar URL
    }
    
    return null;
  };
  
  // Set form values when client data is loaded
  useEffect(() => {
    if (client) {
      // Format date of birth if exists
      let formattedDateOfBirth = "";
      if (client.dateOfBirth) {
        try {
          formattedDateOfBirth = format(new Date(client.dateOfBirth), "yyyy-MM-dd");
        } catch (e) {
          console.error("Error formatting date:", e);
        }
      }

      // Get email - try to fetch from related data first
      let userEmail = "";
      // @ts-ignore - we might get user data from the API
      if (client.user && client.user.email) {
        // @ts-ignore
        userEmail = client.user.email;
      }
      
      // Convert JSON treatment goals to string if available
      let goalString = "";
      if (client.treatmentGoals && Array.isArray(client.treatmentGoals)) {
        goalString = client.treatmentGoals.join(", ");
      }
      
      // Convert JSON treatment plan to string if available
      let planString = "";
      if (client.treatmentPlan) {
        planString = JSON.stringify(client.treatmentPlan);
      }
      
      // Check for avatar in notes
      const avatarUrl = getAvatarUrl(client);
      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
      }

      form.reset({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: userEmail,
        dateOfBirth: formattedDateOfBirth,
        diagnosis: client.diagnosis || "",
        treatmentPlan: planString,
        treatmentGoals: goalString,
        guardianName: client.guardianName || "",
        guardianRelation: client.guardianRelation || "",
        guardianPhone: client.guardianPhone || "",
        guardianEmail: client.guardianEmail || "",
        notes: client.notes || "",
      });
    }
  }, [client, form]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: EditClientFormValues) => {
      // Convert comma-separated goals to array
      const treatmentGoals = data.treatmentGoals 
        ? data.treatmentGoals.split(",").map(goal => goal.trim()).filter(Boolean) 
        : [];

      const clientData = {
        ...data,
        treatmentGoals,
      };

      const res = await apiRequest("PATCH", `/api/clients/${id}`, clientData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [`/api/clients/${id}`]});
      toast({
        title: "Client updated",
        description: "Client information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PATCH", `/api/clients/${id}/reset-password`, {
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Client password has been reset successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const res = await fetch(`/api/clients/${id}/avatar`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Failed to upload avatar");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [`/api/clients/${id}`]});
      toast({
        title: "Avatar uploaded",
        description: "Client avatar has been updated successfully.",
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload avatar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handlers
  const onSubmit = (values: EditClientFormValues) => {
    updateClientMutation.mutate(values);
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    resetPasswordMutation.mutate(values);
  };

  const handleUploadAvatar = () => {
    if (selectedFile) {
      uploadAvatarMutation.mutate(selectedFile);
    }
  };

  // Handle back button
  const handleBack = () => {
    setLocation(`/clients/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <button 
          className="text-primary flex items-center text-sm mb-4"
          onClick={handleBack}
        >
          <i className="ri-arrow-left-line mr-1"></i> Back to Client
        </button>
        <h1 className="text-2xl font-bold">Edit Client</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />
                <h3 className="text-md font-medium">Clinical Information</h3>

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => {
                    // Use asd-2 as default for this client
                    return (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue="asd-2"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select diagnosis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientConfig.diagnosisOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Plan</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="treatmentGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Goals (comma separated)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />
                <h3 className="text-md font-medium">Guardian Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="guardianEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateClientMutation.isPending}
                >
                  {updateClientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="w-32 h-32 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-gray-400">
                        {client?.firstName && client?.lastName 
                          ? `${client.firstName[0]}${client.lastName[0]}`
                          : "??"
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Image
                  </Button>

                  {selectedFile && (
                    <Button 
                      onClick={handleUploadAvatar}
                      disabled={uploadAvatarMutation.isPending}
                      className="ml-2"
                    >
                      {uploadAvatarMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Upload a profile picture for the client. JPG, PNG or GIF, max 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reset Password */}
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    variant="outline"
                    className="w-full" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}