import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  DownloadIcon, 
  FilterIcon,
  BarChart2Icon,
  PieChartIcon,
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  TruckIcon
} from "lucide-react";
import { Purchase, Sale, Inventory } from "@shared/schema";
import { format } from "date-fns";

// Summary card component
interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const SummaryCard = ({ title, value, subtitle, icon, trend, trendLabel }: SummaryCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
              <span className="ml-1">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Color palette for charts
const COLORS = [
  '#2563eb', '#0891b2', '#4ade80', '#facc15', '#fb923c', 
  '#f87171', '#e879f9', '#818cf8', '#a3e635', '#14b8a6'
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("sales");
  
  // Fetch data for reports
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });
  
  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });
  
  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  // Calculate summaries
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const pendingDeliveries = sales.filter(sale => sale.deliveryRequired && sale.deliveryStatus === "pending").length;
  const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const lowStockItems = inventory.filter(item => item.minStock !== null && item.quantity <= (item.minStock || 0)).length;

  // Prepare data for charts based on report type
  const prepareSalesData = () => {
    // Group sales by month
    const salesByMonth: Record<string, number> = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate);
      const monthYear = format(date, "MMM yyyy");
      
      if (!salesByMonth[monthYear]) {
        salesByMonth[monthYear] = 0;
      }
      
      salesByMonth[monthYear] += sale.totalAmount;
    });
    
    // Convert to array for chart
    return Object.entries(salesByMonth).map(([month, total]) => ({
      name: month,
      value: total
    }));
  };
  
  const preparePurchaseData = () => {
    // Group purchases by type
    const purchasesByType: Record<string, number> = {
      "LOCAL": 0,
      "IMPORTED": 0,
      "WITHOUT_RECEIPT": 0
    };
    
    purchases.forEach(purchase => {
      purchasesByType[purchase.purchaseType] += purchase.totalAmount;
    });
    
    // Convert to array for chart
    return Object.entries(purchasesByType).map(([type, total]) => ({
      name: type.replace("_", " ").toLowerCase(),
      value: total
    }));
  };
  
  const prepareInventoryData = () => {
    // Group inventory by category
    const inventoryByCategory: Record<string, number> = {};
    
    inventory.forEach(item => {
      if (!inventoryByCategory[item.category]) {
        inventoryByCategory[item.category] = 0;
      }
      
      inventoryByCategory[item.category] += (item.quantity * item.unitPrice);
    });
    
    // Convert to array for chart
    return Object.entries(inventoryByCategory).map(([category, value]) => ({
      name: category,
      value
    }));
  };
  
  // Get chart data based on selected report type
  const getChartData = () => {
    switch (reportType) {
      case "sales":
        return prepareSalesData();
      case "purchases":
        return preparePurchaseData();
      case "inventory":
        return prepareInventoryData();
      default:
        return [];
    }
  };
  
  // Table columns for report data
  const getReportColumns = () => {
    switch (reportType) {
      case "sales":
        return [
          {
            header: "Invoice No",
            accessorKey: "invoiceNo",
          },
          {
            header: "Date",
            accessorKey: "saleDate",
            cell: (row: Sale) => format(new Date(row.saleDate), "yyyy-MM-dd"),
          },
          {
            header: "Customer",
            accessorKey: "customerName",
          },
          {
            header: "Total",
            accessorKey: "totalAmount",
            cell: (row: Sale) => `$${row.totalAmount.toFixed(2)}`,
          },
        ];
      case "purchases":
        return [
          {
            header: "Invoice No",
            accessorKey: "invoiceNo",
          },
          {
            header: "Date",
            accessorKey: "purchaseDate",
            cell: (row: Purchase) => format(new Date(row.purchaseDate), "yyyy-MM-dd"),
          },
          {
            header: "Type",
            accessorKey: "purchaseType",
            cell: (row: Purchase) => row.purchaseType.replace("_", " ").toLowerCase(),
          },
          {
            header: "Total",
            accessorKey: "totalAmount",
            cell: (row: Purchase) => `$${row.totalAmount.toFixed(2)}`,
          },
        ];
      case "inventory":
        return [
          {
            header: "Product ID",
            accessorKey: "productId",
          },
          {
            header: "Item Name",
            accessorKey: "itemName",
          },
          {
            header: "Category",
            accessorKey: "category",
          },
          {
            header: "Quantity",
            accessorKey: "quantity",
            cell: (row: Inventory) => `${row.quantity} ${row.unit}`,
          },
          {
            header: "Value",
            accessorKey: "value",
            cell: (row: Inventory) => `$${(row.quantity * row.unitPrice).toFixed(2)}`,
          },
        ];
      default:
        return [];
    }
  };
  
  // Get table data based on selected report type
  const getReportData = () => {
    switch (reportType) {
      case "sales":
        return sales;
      case "purchases":
        return purchases;
      case "inventory":
        return inventory;
      default:
        return [];
    }
  };
  
  const chartData = getChartData();
  
  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header with Export Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Reports & Insights</h2>
          <Button className="bg-primary hover:bg-primary/90">
            <DownloadIcon className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard 
            title="Total Sales" 
            value={`$${totalSales.toFixed(2)}`} 
            subtitle="Current period"
            icon={<DollarSignIcon className="h-5 w-5" />}
            trend={12.5}
            trendLabel="vs last period"
          />
          
          <SummaryCard 
            title="Total Purchases" 
            value={`$${totalPurchases.toFixed(2)}`} 
            subtitle="Current period"
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            trend={-3.2}
            trendLabel="vs last period"
          />
          
          <SummaryCard 
            title="Inventory Value" 
            value={`$${inventoryValue.toFixed(2)}`} 
            subtitle="Total stock value"
            icon={<PackageIcon className="h-5 w-5" />}
          />
          
          <SummaryCard 
            title="Low Stock Items" 
            value={lowStockItems} 
            subtitle="Items below min level"
            icon={<BarChart2Icon className="h-5 w-5" />}
          />
          
          <SummaryCard 
            title="Pending Deliveries" 
            value={pendingDeliveries} 
            subtitle="Awaiting delivery"
            icon={<TruckIcon className="h-5 w-5" />}
          />
        </div>
        
        {/* Report Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="w-[180px]">
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="purchases">Purchase Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range" className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="mt-auto">
              <FilterIcon className="h-4 w-4 mr-2" /> Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Chart Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-slate-800">
              {reportType === "sales" ? "Sales Trend" : 
               reportType === "purchases" ? "Purchase Analysis" : 
               "Inventory Distribution"}
            </h3>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <BarChart2Icon className="h-4 w-4 mr-2" /> Bar
              </Button>
              <Button variant="outline" size="sm">
                <PieChartIcon className="h-4 w-4 mr-2" /> Pie
              </Button>
              <Button variant="outline" size="sm">
                <LayoutDashboardIcon className="h-4 w-4 mr-2" /> Table
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, reportType === "sales" ? "Sales" : reportType === "purchases" ? "Purchases" : "Value"]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pie Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Tabular Data */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-slate-800 mb-4">
            {reportType === "sales" ? "Sales Details" : 
             reportType === "purchases" ? "Purchase Details" : 
             "Inventory Details"}
          </h3>
          
          <DataTable 
            columns={getReportColumns()}
            data={getReportData()}
            searchable
            searchPlaceholder={`Search ${reportType}...`}
            searchKey={reportType === "sales" ? "invoiceNo" : reportType === "purchases" ? "invoiceNo" : "itemName"}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
