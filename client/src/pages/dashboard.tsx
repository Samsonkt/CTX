import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  HomeIcon, 
  Drill, 
  AlertTriangleIcon, 
  TruckIcon,
  ShoppingCartIcon, 
  FileTextIcon, 
  PackageIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type Activity = {
  type: string;
  message: string;
  timestamp: string;
};

type Task = {
  id: number;
  title: string;
  dueDate: string;
  priority: 'urgent' | 'medium' | 'normal';
  status: string;
};

type DashboardStats = {
  totalMachinery: number;
  pendingPurchases: number;
  lowStockItems: number;
  pendingDeliveries: number;
  recentActivities: Activity[];
  tasks: Task[];
};

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    placeholderData: {
      totalMachinery: 0,
      pendingPurchases: 0,
      lowStockItems: 0,
      pendingDeliveries: 0,
      recentActivities: [],
      tasks: []
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCartIcon className="h-5 w-5 text-primary" />;
      case 'document':
        return <FileTextIcon className="h-5 w-5 text-green-500" />;
      case 'inventory':
        return <PackageIcon className="h-5 w-5 text-purple-500" />;
      case 'delivery':
        return <TruckIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <HomeIcon className="h-5 w-5 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <StatusBadge status="Urgent" variant="error" />;
      case 'medium':
        return <StatusBadge status="Medium" variant="warning" />;
      default:
        return <StatusBadge status="Normal" variant="info" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome to CTX Software System</h2>
            <p className="text-slate-600">Your internal business management tool. Use the navigation menu to access different modules.</p>
          </CardContent>
        </Card>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Machinery */}
          <Card>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Machinery</p>
                    <Skeleton className="h-8 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Machinery</p>
                    <p className="text-2xl font-semibold text-slate-800">{stats?.totalMachinery || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                    <Drill className="h-6 w-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pending Purchases */}
          <Card>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Purchases</p>
                    <Skeleton className="h-8 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Purchases</p>
                    <p className="text-2xl font-semibold text-slate-800">{stats?.pendingPurchases || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                    <ShoppingCartIcon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Low Stock Items */}
          <Card>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                    <Skeleton className="h-8 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                    <p className="text-2xl font-semibold text-slate-800">{stats?.lowStockItems || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <AlertTriangleIcon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pending Deliveries */}
          <Card>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Deliveries</p>
                    <Skeleton className="h-8 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Deliveries</p>
                    <p className="text-2xl font-semibold text-slate-800">{stats?.pendingDeliveries || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                    <TruckIcon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activities & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activities</h3>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="ml-3 space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.recentActivities?.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                        <p className="text-xs text-slate-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-slate-500">No recent activities</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-center">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">View All Activities</button>
              </div>
            </CardContent>
          </Card>
          
          {/* Tasks To Do */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Tasks To Do</h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center p-2 hover:bg-slate-50 rounded-md">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="ml-3 flex-1 space-y-1">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.tasks?.map((task) => (
                    <div key={task.id} className="flex items-start p-2 hover:bg-slate-50 rounded-md">
                      <Checkbox id={`task-${task.id}`} className="mt-1" />
                      <div className="ml-3 flex-1">
                        <label htmlFor={`task-${task.id}`} className="text-sm font-medium text-slate-800 cursor-pointer">{task.title}</label>
                        <p className="text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  )) || (
                    <p className="text-sm text-slate-500">No tasks to do</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-center">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">View All Tasks</button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
