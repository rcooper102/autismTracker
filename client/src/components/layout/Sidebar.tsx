import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: "ri-dashboard-line" },
    { label: "Clients", path: "/clients", icon: "ri-user-line" },
    { label: "Appointments", path: "/appointments", icon: "ri-calendar-line" },
    { label: "Reports", path: "/reports", icon: "ri-file-chart-line" },
    { label: "Settings", path: "/settings", icon: "ri-settings-line" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-md flex flex-col hidden md:flex">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <i className="ri-mental-health-line text-primary text-2xl"></i>
          <h1 className="text-xl font-semibold text-primary">AutiTrack</h1>
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary">
            <span className="font-medium">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'practitioner' ? 'Behavioral Therapist' : 'Client'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                  location === item.path 
                    ? "bg-primary-50 text-primary font-medium" 
                    : "hover:bg-gray-100 text-gray-700"
                )}>
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 w-full rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          <i className="ri-logout-box-line"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
