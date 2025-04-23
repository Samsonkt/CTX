import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { TruckIcon, EyeIcon, CheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sale } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Schema for updating delivery status
const updateDeliverySchema = z.object({
  id: z.number(),
  deliveryStatus: z.string(),
});

export default function DeliveryPage() {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Sale | null>(null);
  const { toast } = useToast();

  // Fetch sales with delivery required
  const { data: deliveries = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
    select: (data) => data.filter(sale => sale.deliveryRequired),
  });

  // Form for updating delivery status
  const form = useForm<z.infer<typeof updateDeliverySchema>>({
    resolver: zodResolver(updateDeliverySchema),
    defaultValues: {
      id: 0,
      deliveryStatus: "",
    },
  });

  // Update delivery status mutation
  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateDeliverySchema>) => {
      const res = await apiRequest("PUT", `/api/sales/${data.id}`, {
        deliveryStatus: data.deliveryStatus,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setUpdateDialogOpen(false);
      setSelectedDelivery(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof updateDeliverySchema>) => {
    updateDeliveryMutation.mutate(values);
  };

  // Handle opening the update dialog
  const handleUpdateDelivery = (delivery: Sale) => {
    setSelectedDelivery(delivery);
    form.reset({
      id: delivery.id,
      deliveryStatus: delivery.deliveryStatus,
    });
    setUpdateDialogOpen(true);
  };

  // DataTable columns
  const deliveryColumns = [
    {
      header: "Invoice No",
      accessorKey: "invoiceNo" as keyof Sale,
    },
    {
      header: "Customer",
      accessorKey: "customerName" as keyof Sale,
    },
    {
      header: "Customer Location",
      accessorKey: "customerLocation" as keyof Sale,
      cell: (row: Sale) => row.customerLocation || "N/A",
    },
    {
      header: "Delivery Date",
      accessorKey: "deliveryDate" as keyof Sale,
      cell: (row: Sale) => row.deliveryDate ? format(new Date(row.deliveryDate), "yyyy-MM-dd") : "Not scheduled",
    },
    {
      header: "Sale Date",
      accessorKey: "saleDate" as keyof Sale,
      cell: (row: Sale) => format(new Date(row.saleDate), "yyyy-MM-dd"),
    },
    {
      header: "Status",
      accessorKey: "deliveryStatus" as keyof Sale,
      cell: (row: Sale) => (
        <StatusBadge 
          status={row.deliveryStatus.charAt(0).toUpperCase() + row.deliveryStatus.slice(1)} 
          variant={getStatusVariant(row.deliveryStatus)} 
        />
      ),
    },
  ];

  // Row actions
  const deliveryActions = (row: Sale) => (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleUpdateDelivery(row)}
      >
        <CheckIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  // Get pending vs. completed deliveries
  const pendingDeliveries = deliveries.filter(delivery => delivery.deliveryStatus === "pending");
  const completedDeliveries = deliveries.filter(delivery => delivery.deliveryStatus === "completed");

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Delivery & Tracking</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Deliveries</p>
                <p className="text-2xl font-semibold text-slate-800">{pendingDeliveries.length}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <TruckIcon className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed Deliveries</p>
                <p className="text-2xl font-semibold text-slate-800">{completedDeliveries.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <CheckIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-medium">Delivery List</h3>
          </div>
          <div className="p-4">
            <DataTable 
              columns={deliveryColumns}
              data={deliveries}
              searchable
              searchPlaceholder="Search deliveries..."
              searchKey="invoiceNo"
              actions={deliveryActions}
            />
          </div>
        </div>
        
        {/* Update Delivery Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Delivery Status</DialogTitle>
            </DialogHeader>
            {selectedDelivery && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Invoice No.</label>
                        <p className="mt-1">{selectedDelivery.invoiceNo}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Customer</label>
                        <p className="mt-1">{selectedDelivery.customerName}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Delivery Date</label>
                        <p className="mt-1">
                          {selectedDelivery.deliveryDate 
                            ? format(new Date(selectedDelivery.deliveryDate), "yyyy-MM-dd") 
                            : "Not scheduled"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Location</label>
                        <p className="mt-1">{selectedDelivery.customerLocation || "N/A"}</p>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="deliveryStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateDeliveryMutation.isPending}>
                      {updateDeliveryMutation.isPending ? "Updating..." : "Update Status"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
