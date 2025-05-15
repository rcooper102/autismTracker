import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileNav from "./MobileNav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BrainCog,
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BrainCog className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">AutiTrack</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {user.role === "practitioner" && (
              <>
                <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/add-client" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Add Client
                </Link>
                <Button variant="ghost" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Reports
                </Button>
              </>
            )}
            {user.role === "client" && (
              <>
                <Link href="/log-data" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Log Data
                </Link>
                <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Progress
                </Link>
              </>
            )}
          </nav>

          {/* User dropdown */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                  {user.role === "practitioner" ? "Healthcare Provider" : "Client"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "practitioner" && (
                  <>
                    <DropdownMenuItem>
                      <Link href="/" className="flex items-center w-full">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/add-client">
                        <a className="flex items-center w-full">
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Add Client</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex items-center w-full">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        <span>Schedule</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex items-center w-full">
                        <PieChart className="mr-2 h-4 w-4" />
                        <span>Reports</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === "client" && (
                  <>
                    <DropdownMenuItem>
                      <Link href="/log-data">
                        <a className="flex items-center w-full">
                          <PieChart className="mr-2 h-4 w-4" />
                          <span>Log Data</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/">
                        <a className="flex items-center w-full">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          <span>Sessions</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
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