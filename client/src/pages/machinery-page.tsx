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
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PlusIcon, PencilIcon, EyeIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Machinery, MachineryService, insertMachinerySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const machineryFormSchema = insertMachinerySchema.extend({
  purchaseDate: z.string().optional(),
});

export default function MachineryPage() {
  const [open, setOpen] = useState(false);
  const [selectedMachinery, setSelectedMachinery] = useState<Machinery | null>(null);
  const { toast } = useToast();

  const { data: machineryList = [], isLoading: isLoadingMachinery } = useQuery<Machinery[]>({
    queryKey: ["/api/machinery"],
  });

  const { data: serviceHistory = [], isLoading: isLoadingServices } = useQuery<MachineryService[]>({
    queryKey: ["/api/machinery", selectedMachinery?.id, "services"],
    enabled: !!selectedMachinery,
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof machineryFormSchema>) => {
      const res = await apiRequest("POST", "/api/machinery", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Machinery added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/machinery"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add machinery",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof machineryFormSchema>>({
    resolver: zodResolver(machineryFormSchema),
    defaultValues: {
      name: "",
      category: "",
      model: "",
      brand: "",
      serialNo: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof machineryFormSchema>) {
    createMutation.mutate(values);
  }

  const machineryColumns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Machinery,
    },
    {
      header: "Category",
      accessorKey: "category" as keyof Machinery,
    },
    {
      header: "Model",
      accessorKey: "model" as keyof Machinery,
    },
    {
      header: "Brand",
      accessorKey: "brand" as keyof Machinery,
    },
    {
      header: "Serial No.",
      accessorKey: "serialNo" as keyof Machinery,
    },
    {
      header: "Purchase Date",
      accessorKey: "purchaseDate" as keyof Machinery,
      cell: (row: Machinery) => row.purchaseDate ? format(new Date(row.purchaseDate), "yyyy-MM-dd") : "-",
    },
  ];

  const serviceColumns = [
    {
      header: "Machinery",
      accessorKey: "machineryId" as keyof MachineryService,
      cell: (row: MachineryService) => {
        const machinery = machineryList.find(m => m.id === row.machineryId);
        return machinery ? machinery.name : "";
      }
    },
    {
      header: "Service Date",
      accessorKey: "serviceDate" as keyof MachineryService,
      cell: (row: MachineryService) => format(new Date(row.serviceDate), "yyyy-MM-dd"),
    },
    {
      header: "Service Type",
      accessorKey: "serviceType" as keyof MachineryService,
    },
    {
      header: "Cost",
      accessorKey: "cost" as keyof MachineryService,
      cell: (row: MachineryService) => row.cost ? `$${row.cost.toFixed(2)}` : "-",
    },
    {
      header: "Vendor",
      accessorKey: "vendor" as keyof MachineryService,
    },
  ];

  const machineryActions = (row: Machinery) => (
    <div className="flex justify-end space-x-2">
      <Button variant="ghost" size="icon" onClick={() => setSelectedMachinery(row)}>
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
          <h2 className="text-xl font-semibold text-slate-800">Machinery Management</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusIcon className="h-4 w-4 mr-2" /> Add Machinery
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Machinery</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machinery Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. DRILL A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Drilling Equipment">Drilling Equipment</SelectItem>
                              <SelectItem value="Excavation Equipment">Excavation Equipment</SelectItem>
                              <SelectItem value="Lifting Equipment">Lifting Equipment</SelectItem>
                              <SelectItem value="Transport Equipment">Transport Equipment</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. XD-500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. PowerDrill" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serialNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. PD-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter any additional information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving..." : "Save Machinery"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Machinery List */}
        <Tabs defaultValue="machinery">
          <TabsList className="mb-4">
            <TabsTrigger value="machinery">Machinery List</TabsTrigger>
            <TabsTrigger value="services">Service History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="machinery">
            <DataTable 
              columns={machineryColumns}
              data={machineryList}
              searchable
              searchPlaceholder="Search machinery..."
              searchKey="name"
              actions={machineryActions}
              onRowClick={setSelectedMachinery}
            />
          </TabsContent>
          
          <TabsContent value="services">
            <DataTable 
              columns={serviceColumns}
              data={serviceHistory}
              searchable
              searchPlaceholder="Search services..."
              searchKey="serviceType"
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
