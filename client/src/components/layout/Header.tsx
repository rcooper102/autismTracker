import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileNav from "./MobileNav";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserPlus,
  CalendarDays,
  PieChart,
} from "lucide-react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800">
      <div className="px-4 md:px-6 max-w-[1600px] mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Logo size={32} variant="white" />
              <span className="text-xl font-bold text-white">AutiTrack</span>
            </Link>
          </div>

          {/* Desktop Navigation is now in the Sidebar */}
          <div className="hidden md:block"></div>

          {/* User actions */}
          <div className="flex items-center gap-4">

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white hover:bg-gray-800" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}