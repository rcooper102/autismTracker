import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import MoodSelector from "@/components/data-entry/MoodSelector";
import AnxietySlider from "@/components/data-entry/AnxietySlider";
import SleepQuality from "@/components/data-entry/SleepQuality";
import ChallengeSelector from "@/components/data-entry/ChallengeSelector";
import NotesField from "@/components/data-entry/NotesField";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const dataEntrySchema = z.object({
  mood: z.enum(["great", "good", "okay", "not-good", "bad"]),
  anxietyLevel: z.number().min(1).max(5),
  sleepQuality: z.number().min(1).max(5),
  challenges: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type DataEntryFormValues = z.infer<typeof dataEntrySchema>;

export default function DataEntryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState<number | null>(null);
  
  // Get client ID for the logged-in user (if they are a client)
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["/api/clients"],
    enabled: user?.role === "client",
    queryFn: async () => {
      // If user is a client, we need to find their associated client profile
      const res = await fetch("/api/clients", { credentials: "include" });
      if (!res.ok) throw new Error("Could not fetch client profile");
      const clients = await res.json();
      return clients.find((c: any) => c.userId === user?.id);
    }
  });

  useEffect(() => {
    if (client) {
      setClientId(client.id);
    }
  }, [client]);

  const form = useForm<DataEntryFormValues>({
    resolver: zodResolver(dataEntrySchema),
    defaultValues: {
      mood: "good",
      anxietyLevel: 2,
      sleepQuality: 3,
      challenges: [],
      notes: "",
    },
  });

  const dataEntryMutation = useMutation({
    mutationFn: async (data: DataEntryFormValues) => {
      if (!clientId) throw new Error("No client profile found");
      
      const res = await apiRequest("POST", `/api/clients/${clientId}/data`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry saved successfully",
        description: "Thank you for logging your data today.",
      });
      form.reset({
        mood: "good",
        anxietyLevel: 2,
        sleepQuality: 3,
        challenges: [],
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/data`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: DataEntryFormValues) => {
    dataEntryMutation.mutate(values);
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav />

      <main className="main-content min-h-screen pb-16">
        <div className="p-4 md:p-6">
          {/* Header with user info */}
          <header className="mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary">
                <span className="font-medium">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-semibold text-gray-800">Hello, {user?.name?.split(' ')[0]}</h1>
                <p className="text-gray-500">Let's track how you're feeling today</p>
              </div>
            </div>
          </header>

          {/* Data Entry Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Mood Selector */}
              <MoodSelector 
                value={form.watch("mood")} 
                onChange={(value) => form.setValue("mood", value)} 
              />
              
              {/* Anxiety Level Slider */}
              <AnxietySlider 
                value={form.watch("anxietyLevel")} 
                onChange={(value) => form.setValue("anxietyLevel", value)} 
              />
              
              {/* Sleep Quality Star Rating */}
              <SleepQuality 
                value={form.watch("sleepQuality")} 
                onChange={(value) => form.setValue("sleepQuality", value)} 
              />
              
              {/* Challenge Selector Checkboxes */}
              <ChallengeSelector 
                value={form.watch("challenges") || []} 
                onChange={(values) => form.setValue("challenges", values)} 
              />
              
              {/* Notes Textarea */}
              <NotesField 
                value={form.watch("notes") || ""} 
                onChange={(value) => form.setValue("notes", value)} 
              />
              
              {/* Form Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  type="submit" 
                  className="bg-primary text-white rounded-lg py-3 px-4 flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
                  disabled={dataEntryMutation.isPending}
                >
                  {dataEntryMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saving Entry...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      <span>Save Entry</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="text-primary border border-primary rounded-lg py-3 px-4 flex items-center justify-center hover:bg-primary-50 transition-colors"
                >
                  <i className="ri-calendar-line mr-2"></i>
                  <span>View Previous Entries</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
