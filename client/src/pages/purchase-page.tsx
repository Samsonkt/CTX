import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { PlusIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Purchase } from "@shared/schema";
import { format } from "date-fns";

export default function PurchasePage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("local");

  const { data: allPurchases = [], isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const localPurchases = allPurchases.filter(p => p.purchaseType === "LOCAL");
  const importedPurchases = allPurchases.filter(p => p.purchaseType === "IMPORTED");
  const withoutReceiptPurchases = allPurchases.filter(p => p.purchaseType === "WITHOUT_RECEIPT");

  const purchaseColumns = [
    {
      header: "Invoice No",
      accessorKey: "invoiceNo" as keyof Purchase,
    },
    {
      header: "Date",
      accessorKey: "purchaseDate" as keyof Purchase,
      cell: (row: Purchase) => format(new Date(row.purchaseDate), "yyyy-MM-dd"),
    },
    {
      header: "Seller",
      accessorKey: "sellerName" as keyof Purchase,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount" as keyof Purchase,
      cell: (row: Purchase) => `$${row.totalAmount.toFixed(2)}`,
    },
    {
      header: "Status",
      accessorKey: "purchaseStatus" as keyof Purchase,
      cell: (row: Purchase) => (
        <StatusBadge 
          status={row.purchaseStatus === "complete" ? "Complete" : "Incomplete"} 
          variant={getStatusVariant(row.purchaseStatus)} 
        />
      ),
    },
  ];

  const purchaseActions = (row: Purchase) => (
    <div className="flex justify-end space-x-2">
      <Button variant="ghost" size="icon">
        <EyeIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <PencilIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Purchase Management</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusIcon className="h-4 w-4 mr-2" /> New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Purchase</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center text-gray-500">Purchase form would go here. This is a placeholder for the full form.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button>Save Purchase</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Purchase Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="local">Local Purchases</TabsTrigger>
            <TabsTrigger value="imported">Imported Purchases</TabsTrigger>
            <TabsTrigger value="without_receipt">Without Receipt</TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="pt-4">
            <DataTable 
              columns={purchaseColumns}
              data={localPurchases}
              searchable
              searchPlaceholder="Search local purchases..."
              searchKey="invoiceNo"
              actions={purchaseActions}
            />
          </TabsContent>
          
          <TabsContent value="imported" className="pt-4">
            <DataTable 
              columns={purchaseColumns}
              data={importedPurchases}
              searchable
              searchPlaceholder="Search imported purchases..."
              searchKey="invoiceNo"
              actions={purchaseActions}
            />
          </TabsContent>
          
          <TabsContent value="without_receipt" className="pt-4">
            <DataTable 
              columns={purchaseColumns}
              data={withoutReceiptPurchases}
              searchable
              searchPlaceholder="Search purchases without receipt..."
              searchKey="invoiceNo"
              actions={purchaseActions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
