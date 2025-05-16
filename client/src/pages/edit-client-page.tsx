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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  treatmentPlan: z.array(z.string()).or(z.string()).optional(),
  treatmentGoals: z.array(z.string()).or(z.string()).optional(),
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
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Fetch client data
  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${id}`],
    enabled: !!id
  });
  
  // Set avatar preview when client data changes
  useEffect(() => {
    if (client?.avatarUrl) {
      console.log("Found avatarUrl in client data:", client.avatarUrl);
      setAvatarPreview(client.avatarUrl);
    }
  }, [client?.avatarUrl]);

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

  // Get avatar URL directly from client data
  const getAvatarUrl = (clientData: any): string => {
    if (clientData?.avatarUrl) {
      console.log("Using avatarUrl from client:", clientData.avatarUrl);
      return clientData.avatarUrl;
    }
    return '';
  };
  
  // Get the client's avatar URL or preview
  const getClientAvatar = (): string => {
    // Priority order: 1. Local preview, 2. Client avatarUrl
    if (avatarPreview) {
      console.log("Using avatar preview:", avatarPreview);
      return avatarPreview;
    }
    
    if (client?.avatarUrl) {
      console.log("Getting client avatar:", client.avatarUrl);
      return client.avatarUrl;
    }
    
    return '';
  };
  
  // This was moved to the onSuccess callback in the useQuery hook
  
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
      
      // Ensure treatment goals is an array
      let treatmentGoals = [];
      if (client.treatmentGoals && Array.isArray(client.treatmentGoals)) {
        treatmentGoals = client.treatmentGoals;
      }
      
      // Ensure treatment plan is an array
      let treatmentPlan = [];
      if (client.treatmentPlan && Array.isArray(client.treatmentPlan)) {
        treatmentPlan = client.treatmentPlan;
      }
      
      // Check for avatar in notes
      const avatarUrl = getAvatarUrl(client);
      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
      }
      
      // Debug client data 
      console.log("Client data:", JSON.stringify(client, null, 2));
      console.log("Setting treatment plan:", treatmentPlan);
      console.log("Setting treatment goals:", treatmentGoals);
      console.log("Setting guardian relation:", client.guardianRelation);

      // Create form values object with all the client data
      const formValues = {
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: userEmail,
        dateOfBirth: formattedDateOfBirth,
        diagnosis: client.diagnosis || "",
        treatmentPlan: treatmentPlan,
        treatmentGoals: treatmentGoals,
        guardianName: client.guardianName || "",
        guardianRelation: client.guardianRelation || "",
        guardianPhone: client.guardianPhone || "",
        guardianEmail: client.guardianEmail || "",
        notes: client.notes || "",
      };

      console.log("Resetting form with values:", formValues);
      
      // Reset the form with the values
      form.reset(formValues);
      
      // Explicitly set the guardian relation field value
      form.setValue("guardianRelation", client.guardianRelation || "");
    }
  }, [client, form]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: EditClientFormValues) => {
      // Ensure treatment goals is an array
      let treatmentGoals = [];
      if (Array.isArray(data.treatmentGoals)) {
        treatmentGoals = data.treatmentGoals;
      } else if (typeof data.treatmentGoals === 'string') {
        treatmentGoals = data.treatmentGoals.split(",").map(goal => goal.trim()).filter(Boolean);
      }
      
      // Ensure treatment plan is an array
      let treatmentPlan = [];
      if (Array.isArray(data.treatmentPlan)) {
        treatmentPlan = data.treatmentPlan;
      } else if (typeof data.treatmentPlan === 'string') {
        try {
          const parsed = JSON.parse(data.treatmentPlan);
          treatmentPlan = Array.isArray(parsed) ? parsed : [data.treatmentPlan];
        } catch {
          treatmentPlan = [data.treatmentPlan]; 
        }
      }

      // Log what we're sending to the server
      console.log("Sending treatment plan:", treatmentPlan);
      console.log("Sending treatment goals:", treatmentGoals);

      const clientData = {
        ...data,
        treatmentGoals,
        treatmentPlan,
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
    onSuccess: (data) => {
      // Update the avatar preview with the new URL
      if (data?.avatarUrl) {
        // Add timestamp to ensure the browser gets the latest image
        const timestampedUrl = `${data.avatarUrl}${data.avatarUrl.includes('?') ? '&' : '?'}ts=${Date.now()}`;
        setAvatarPreview(timestampedUrl);
      }
      
      // Invalidate the client query to refresh data from server
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      
      // Clear the selected file to reset the upload button state
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
      
      // Create preview URL immediately using URL.createObjectURL
      // This is faster and more reliable than FileReader for image previews
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      console.log("Created temporary preview URL:", objectUrl);
    }
  };
  
  // Handle upload completion
  const handleUploadComplete = () => {
    // We'll keep the current preview visible and set a flag to inform the app
    // that a new avatar has been uploaded
    console.log("Upload completed successfully!");
  };

  // Manual helper to force reload the avatar whenever needed
  const refreshAvatarIfNeeded = () => {
    if (client?.avatarUrl && !avatarPreview) {
      console.log("Refreshing avatar from client data:", client.avatarUrl);
      setAvatarPreview(client.avatarUrl);
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
      uploadAvatarMutation.mutate(selectedFile, {
        onSuccess: (data) => {
          console.log("Upload successful, received data:", data);
          
          // Invalidate client queries to force fresh data
          queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
          
          // Update imagePreview with the new URL from the server response
          if (data?.avatarUrl) {
            // Add timestamp to ensure the browser gets the latest image
            const timestampedUrl = `${data.avatarUrl}${data.avatarUrl.includes('?') ? '&' : '?'}ts=${Date.now()}`;
            setAvatarPreview(timestampedUrl);
            console.log("Setting new avatar preview:", timestampedUrl);
            
            // Clear the file input to allow selecting the same file again if needed
            setSelectedFile(null);
            
            // Show success toast
            toast({
              title: "Avatar updated",
              description: "The client's profile picture has been updated successfully.",
            });
          }
        }
      });
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
                          value={field.value || ""}
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
                  render={({ field }) => {
                    // Ensure field.value is an array, if it's a string (from database) convert it
                    const treatmentPlans = Array.isArray(field.value) 
                      ? field.value 
                      : field.value ? [field.value] : [];

                    const handlePlanChange = (checked: boolean, plan: string) => {
                      if (checked) {
                        field.onChange([...treatmentPlans, plan]);
                      } else {
                        field.onChange(treatmentPlans.filter((p: string) => p !== plan));
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>Treatment Plans</FormLabel>
                        <div className="space-y-2">
                          {clientConfig.treatmentPlanOptions.map((plan) => {
                            const isChecked = treatmentPlans.includes(plan.value);
                            
                            return (
                              <div key={plan.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`plan-${plan.value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked: boolean | "indeterminate") => 
                                    handlePlanChange(checked === true, plan.value)
                                  }
                                />
                                <label
                                  htmlFor={`plan-${plan.value}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {plan.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="treatmentGoals"
                  render={({ field }) => {
                    // Ensure field.value is an array, if it's a string (from database) convert it
                    const treatmentGoals = Array.isArray(field.value) 
                      ? field.value 
                      : field.value ? field.value.split(",").map(g => g.trim()) : [];

                    const handleGoalChange = (checked: boolean, goal: string) => {
                      if (checked) {
                        field.onChange([...treatmentGoals, goal]);
                      } else {
                        field.onChange(treatmentGoals.filter((g: string) => g !== goal));
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>Treatment Goals</FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                          {clientConfig.treatmentGoalOptions.map((goal, index) => {
                            const isChecked = treatmentGoals.includes(goal);
                            
                            return (
                              <div key={`goal-${index}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`goal-${index}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked: boolean | "indeterminate") => 
                                    handleGoalChange(checked === true, goal)
                                  }
                                />
                                <label
                                  htmlFor={`goal-${index}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {goal}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientConfig.guardianRelationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                    {avatarPreview ? (
                      <img 
                        src={`${avatarPreview}?t=${new Date().getTime()}`} 
                        alt="Client Avatar"
                        className="w-full h-full object-cover"
                        key={`avatar-preview-${Date.now()}`} 
                      />
                    ) : (client?.avatarUrl ? (
                      <img 
                        src={`${client.avatarUrl}?t=${new Date().getTime()}`} 
                        alt="Client Avatar"
                        className="w-full h-full object-cover"
                        key={`client-avatar-${Date.now()}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ))}
                  </div>
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