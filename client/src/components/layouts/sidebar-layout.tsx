import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  HomeIcon, 
  Drill, 
  ShoppingCartIcon, 
  PackageIcon, 
  DollarSignIcon, 
  TruckIcon, 
  FileTextIcon, 
  SettingsIcon, 
  BarChart2Icon,
  MenuIcon,
  XIcon,
  BellIcon,
  LogOutIcon
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

type SidebarItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", path: "/", icon: <HomeIcon className="mr-3 h-5 w-5" /> },
  { name: "Machinery", path: "/machinery", icon: <Drill className="mr-3 h-5 w-5" /> },
  { name: "Purchase", path: "/purchase", icon: <ShoppingCartIcon className="mr-3 h-5 w-5" /> },
  { name: "Inventory", path: "/inventory", icon: <PackageIcon className="mr-3 h-5 w-5" /> },
  { name: "Sales", path: "/sales", icon: <DollarSignIcon className="mr-3 h-5 w-5" /> },
  { name: "Delivery & Tracking", path: "/delivery", icon: <TruckIcon className="mr-3 h-5 w-5" /> },
  { name: "Documents", path: "/documents", icon: <FileTextIcon className="mr-3 h-5 w-5" /> },
  { name: "Operations", path: "/operations", icon: <SettingsIcon className="mr-3 h-5 w-5" /> },
  { name: "Reports", path: "/reports", icon: <BarChart2Icon className="mr-3 h-5 w-5" /> }
];

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  
  const currentPath = location === "" ? "/" : location;
  
  // Auto-close sidebar on mobile
  if (isMobile && sidebarOpen) {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 border-r border-slate-200 bg-white`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary">CTX SOFTWARE</span>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="ml-auto md:hidden text-slate-500 hover:text-slate-700"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div 
                  className={`flex items-center px-3 py-2 rounded-md w-full text-left cursor-pointer ${
                    currentPath === item.path 
                      ? 'bg-slate-100 text-primary' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
          
          {/* User profile */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span>{user?.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.role || "User"}</p>
              </div>
              <button 
                onClick={() => logoutMutation.mutate()} 
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <LogOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="md:hidden text-slate-500 hover:text-slate-700 mr-3"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-slate-800 capitalize">
                {currentPath === "/" ? "Dashboard" : currentPath.substring(1)}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <BellIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {children}
        </main>
      </div>
      
      {/* Small screen message */}
      <div className="fixed bottom-0 left-0 right-0 bg-white md:hidden p-4 shadow-md border-t border-slate-200 text-center text-sm">
        <p className="text-slate-600">For best experience, use landscape orientation on mobile devices.</p>
      </div>
    </div>
  );
}
