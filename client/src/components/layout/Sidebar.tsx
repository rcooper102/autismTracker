import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import {
  BrainCog,
  LayoutDashboard,
  UserPlus,
  CalendarDays,
  PieChart,
  Settings,
  LogOut,
  User,
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();

  // Fetch practitioner data to get avatarUrl if user is a practitioner
  const { data: practitioner } = useQuery({
    queryKey: ["/api/practitioners/me"],
    queryFn: async () => {
      console.log("Fetching practitioner data for avatar");
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const res = await fetch(`/api/practitioners/me?t=${timestamp}`);
      if (!res.ok) throw new Error("Failed to fetch practitioner details");
      const data = await res.json();
      console.log("Received practitioner data:", data);
      console.log("Avatar URL in sidebar:", data.avatarUrl);
      return data;
    },
    enabled: !!user && user.role === "practitioner",
    // Force refetch every time component mounts
    staleTime: 0,
    refetchOnMount: true,
  });

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden md:flex flex-col h-[calc(100vh-4rem)] bg-[rgb(32,148,243)] text-white w-[240px] fixed top-16 left-0 py-6 px-4 overflow-y-auto">
      <div className="flex flex-col space-y-2">
        <div className="py-4 px-4 mb-2 bg-white/10 rounded-md flex flex-col items-center">
          <Avatar className="h-16 w-16 mb-3 border-2 border-white/30">
            {/* Always try to render the avatar image with fallback handling */}
            {practitioner?.avatarUrl ? (
              <AvatarImage 
                src={practitioner.avatarUrl.includes('?') ? 
                  `${practitioner.avatarUrl}&_t=${Date.now()}` : 
                  `${practitioner.avatarUrl}?_t=${Date.now()}`} 
                alt={user.name || "User"} 
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.error("Sidebar avatar failed to load:", e);
                  const target = e.target as HTMLImageElement;
                  console.error("Failed URL in sidebar:", target.src);
                }}
              />
            ) : (
              <AvatarImage src="" alt={user.name || "User"} />
            )}
            <AvatarFallback className="bg-white/20 text-white">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-sm text-white/70">{user.email}</p>
          </div>
        </div>
        
        {user.role === "practitioner" && (
          <>
            <Link href="/" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
              <LayoutDashboard className="mr-3 h-5 w-5 text-white" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/clients" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
              <UserPlus className="mr-3 h-5 w-5 text-white" />
              <span>Clients</span>
            </Link>
            
            <Link href="/add-client" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
              <UserPlus className="mr-3 h-5 w-5 text-white" />
              <span>Add Client</span>
            </Link>
            
            <Button 
              variant="ghost" 
              className="flex items-center justify-start py-2 px-3 rounded-md hover:bg-white/10 text-white w-full"
            >
              <CalendarDays className="mr-3 h-5 w-5 text-white" />
              <span>Schedule</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex items-center justify-start py-2 px-3 rounded-md hover:bg-white/10 text-white w-full"
            >
              <PieChart className="mr-3 h-5 w-5 text-white" />
              <span>Reports</span>
            </Button>
          </>
        )}
        
        {user.role === "client" && (
          <>
            <Link href="/log-data" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
              <PieChart className="mr-3 h-5 w-5 text-white" />
              <span>Log Data</span>
            </Link>
            
            <Link href="/" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
              <CalendarDays className="mr-3 h-5 w-5 text-white" />
              <span>Sessions</span>
            </Link>
          </>
        )}
        
        <div className="border-t border-white/20 my-2"></div>
        
        <Link href="/account" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
          <Settings className="mr-3 h-5 w-5 text-white" />
          <span>Account Settings</span>
        </Link>
        
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="flex items-center justify-start py-2 px-3 rounded-md hover:bg-white/10 text-white w-full"
        >
          <LogOut className="mr-3 h-5 w-5 text-white" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  );
}