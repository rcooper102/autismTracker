import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  BrainCog,
  LayoutDashboard,
  UserPlus,
  CalendarDays,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden md:flex flex-col h-[calc(100vh-4rem)] bg-[rgb(32,148,243)] text-white w-[240px] fixed top-16 left-0 py-6 px-4 overflow-y-auto">
      <div className="flex flex-col space-y-2">
        <div className="py-2 px-4 mb-2 bg-white/10 rounded-md">
          <p className="font-medium text-white">{user.name}</p>
          <p className="text-sm text-white/70">{user.email}</p>
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