import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { label: "Dashboard", path: "/", icon: "ri-dashboard-line" },
    { label: "Clients", path: "/clients", icon: "ri-user-line" },
    { label: "Calendar", path: "/appointments", icon: "ri-calendar-line" },
    { label: "Reports", path: "/reports", icon: "ri-file-chart-line" },
  ];
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-10 flex justify-around items-center h-16 px-2 md:hidden">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3",
            location === item.path ? "text-primary" : "text-gray-500"
          )}
        >
          <i className={`${item.icon} text-xl`}></i>
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
