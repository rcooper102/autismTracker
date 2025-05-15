import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  BrainCog,
  LayoutDashboard,
  UserPlus,
  CalendarDays,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] sm:w-[350px] bg-[rgb(32,148,243)] text-white border-r border-gray-800">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center space-x-2 text-white">
            <BrainCog className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">AutiTrack</span>
          </SheetTitle>
          <SheetDescription className="text-white/70">
            {user.role === "practitioner" ? "Healthcare Provider" : "Client"} Portal
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col space-y-2">
          <div className="py-2 px-4 mb-2 bg-white/10 rounded-md">
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-sm text-white/70">{user.email}</p>
          </div>
          
          {user.role === "practitioner" && (
            <>
              <SheetClose asChild>
                <Link href="/" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-white" />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>
              
              <SheetClose asChild>
                <Link href="/add-client" className="flex items-center py-2 px-3 rounded-md hover:bg-white/10 text-white">
                  <UserPlus className="mr-3 h-5 w-5 text-white" />
                  <span>Add Client</span>
                </Link>
              </SheetClose>
              
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
              <SheetClose asChild>
                <Link href="/log-data" className="flex items-center py-2 px-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white">
                  <PieChart className="mr-3 h-5 w-5 text-gray-400" />
                  <span>Log Data</span>
                </Link>
              </SheetClose>
              
              <SheetClose asChild>
                <Link href="/" className="flex items-center py-2 px-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white">
                  <CalendarDays className="mr-3 h-5 w-5 text-gray-400" />
                  <span>Sessions</span>
                </Link>
              </SheetClose>
            </>
          )}
          
          <div className="border-t border-gray-700 my-2"></div>
          
          <SheetClose asChild>
            <Link href="/account" className="flex items-center py-2 px-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white">
              <Settings className="mr-3 h-5 w-5 text-gray-400" />
              <span>Account Settings</span>
            </Link>
          </SheetClose>
          
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="flex items-center justify-start py-2 px-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            <span>Log out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}