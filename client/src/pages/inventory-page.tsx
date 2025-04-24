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
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { PlusIcon, ArrowLeftRightIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Inventory, insertInventorySchema, Warehouse, insertInventoryTransferSchema, insertTransferItemSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for inventory item form
const inventoryFormSchema = insertInventorySchema.extend({
  minStock: z.coerce.number().optional(),
  maxStock: z.coerce.number().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be at least 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be at least 0"),
});

// Schema for inventory transfer form
const transferFormSchema = z.object({
  fromWarehouseId: z.coerce.number(),
  toWarehouseId: z.coerce.number().refine(val => val !== 0, "Please select a destination warehouse"),
  transferDate: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    inventoryId: z.coerce.number(),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one item must be selected"),
});

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("current");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const { toast } = useToast();

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch warehouses for dropdown
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Get low stock items for the "Low Stock Items" tab
  const lowStockItems = inventoryItems.filter(
    item => item.minStock !== null && item.quantity <= (item.minStock || 0)
  );

  // Form for adding inventory items
  const inventoryForm = useForm<z.infer<typeof inventoryFormSchema>>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      productId: "",
      category: "",
      itemName: "",
      description: "",
      quantity: 0,
      unit: "",
      unitPrice: 0,
      warehouseId: 0,
    },
  });

  // Form for inventory transfers
  const transferForm = useForm<z.infer<typeof transferFormSchema>>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWarehouseId: 0,
      toWarehouseId: 0,
      transferDate: new Date().toISOString().split('T')[0],
      reference: "",
      notes: "",
      items: [{ inventoryId: 0, quantity: 1 }],
    },
  });

  // Mutation for adding inventory items
  const addInventoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inventoryFormSchema>) => {
      // Generate a product ID if not provided
      if (!data.productId) {
        data.productId = `ITM-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      }
      const res = await apiRequest("POST", "/api/inventory", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setAddItemOpen(false);
      inventoryForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });

  // Mutation for inventory transfers
  const transferInventoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof transferFormSchema>) => {
      const transferData = {
        transfer: {
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          transferDate: new Date(data.transferDate).toISOString(),
          reference: data.reference,
          notes: data.notes,
        },
        items: data.items,
      };
      
      const res = await apiRequest("POST", "/api/inventory/transfers", transferData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory transfer completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setTransferOpen(false);
      transferForm.reset({
        fromWarehouseId: 0,
        toWarehouseId: 0,
        transferDate: new Date().toISOString().split('T')[0],
        reference: "",
        notes: "",
        items: [{ inventoryId: 0, quantity: 1 }],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer inventory",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAddItemSubmit = (values: z.infer<typeof inventoryFormSchema>) => {
    addInventoryMutation.mutate(values);
  };

  const onTransferSubmit = (values: z.infer<typeof transferFormSchema>) => {
    transferInventoryMutation.mutate(values);
  };

  // Helper to get warehouse name by ID
  const getWarehouseName = (id: number) => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : "Unknown";
  };

  // Add a new transfer item field
  const addTransferItem = () => {
    const currentItems = transferForm.getValues().items;
    transferForm.setValue("items", [...currentItems, { inventoryId: 0, quantity: 1 }]);
  };

  // Remove a transfer item field
  const removeTransferItem = (index: number) => {
    const currentItems = transferForm.getValues().items;
    if (currentItems.length > 1) {
      transferForm.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  // DataTable columns for inventory
  const inventoryColumns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Inventory,
    },
    {
      header: "Item Name",
      accessorKey: "itemName" as keyof Inventory,
    },
    {
      header: "Category",
      accessorKey: "category" as keyof Inventory,
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Inventory,
      cell: (row: Inventory) => row.description || "-",
    },
    {
      header: "Quantity",
      accessorKey: "quantity" as keyof Inventory,
    },
    {
      header: "Unit",
      accessorKey: "unit" as keyof Inventory,
    },
    {
      header: "Unit Price",
      accessorKey: "unitPrice" as keyof Inventory,
    },
    {
      header: "Product ID",
      accessorKey: "productId" as keyof Inventory,
    },
    {
      header: "Min Stock",
      accessorKey: "minStock" as keyof Inventory,
      cell: (row: Inventory) => row.minStock || "-",
    },
    {
      header: "Max Stock",
      accessorKey: "maxStock" as keyof Inventory,
      cell: (row: Inventory) => row.maxStock || "-",
    },
    {
      header: "Warehouse",
      accessorKey: "warehouseId" as keyof Inventory,
      cell: (row: Inventory) => getWarehouseName(row.warehouseId),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Inventory) => {
        const isLowStock = row.minStock !== null && row.quantity <= (row.minStock || 0);
        return (
          <StatusBadge 
            status={isLowStock ? "Low Stock" : "In Stock"} 
            variant={isLowStock ? "warning" : "success"} 
          />
        );
      },
    },
  ];

  // Actions for inventory items
  const inventoryActions = (row: Inventory) => (
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
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-800">Inventory / Stock</h2>
          <div className="flex gap-2">
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <Form {...inventoryForm}>
                  <form onSubmit={inventoryForm.handleSubmit(onAddItemSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={inventoryForm.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-generated if empty" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
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
                                <SelectItem value="Machinery Parts">Machinery Parts</SelectItem>
                                <SelectItem value="Tools">Tools</SelectItem>
                                <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                                <SelectItem value="Consumables">Consumables</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="itemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Description"
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity*</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Piece">Piece</SelectItem>
                                <SelectItem value="Box">Box</SelectItem>
                                <SelectItem value="Kg">Kilogram</SelectItem>
                                <SelectItem value="Liter">Liter</SelectItem>
                                <SelectItem value="Meter">Meter</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price*</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse*</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map(warehouse => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={inventoryForm.control}
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Stock Level</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={inventoryForm.control}
                        name="maxStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Stock Level</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAddItemOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addInventoryMutation.isPending}>
                        {addInventoryMutation.isPending ? "Adding..." : "Add Item"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <ArrowLeftRightIcon className="h-4 w-4 mr-2" /> Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Transfer Inventory Items</DialogTitle>
                </DialogHeader>
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={transferForm.control}
                        name="fromWarehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Warehouse*</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Source Warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map(warehouse => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={transferForm.control}
                        name="toWarehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Warehouse*</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Destination Warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map(warehouse => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={transferForm.control}
                        name="transferDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transfer Date*</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={transferForm.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional reference" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-slate-600">Items to Transfer</h4>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addTransferItem}
                          className="text-sm flex items-center"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </div>
                      
                      {transferForm.getValues().items.map((_, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <div className="col-span-6">
                            <FormField
                              control={transferForm.control}
                              name={`items.${index}.inventoryId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index !== 0 ? "sr-only" : undefined}>Item*</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    value={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Item" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {inventoryItems
                                        .filter(item => item.warehouseId === transferForm.getValues().fromWarehouseId)
                                        .map(item => (
                                          <SelectItem key={item.id} value={item.id.toString()}>
                                            {item.itemName} ({item.quantity} {item.unit})
                                          </SelectItem>
                                        ))
                                      }
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="col-span-5">
                            <FormField
                              control={transferForm.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={index !== 0 ? "sr-only" : undefined}>Quantity*</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="col-span-1 flex items-end">
                            {index > 0 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeTransferItem(index)}
                                className="text-red-500 hover:text-red-700 mb-1"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <FormField
                      control={transferForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any additional notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={transferInventoryMutation.isPending}>
                        {transferInventoryMutation.isPending ? "Processing..." : "Complete Transfer"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Inventory Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current">Current Stock</TabsTrigger>
            <TabsTrigger value="low">Low Stock Items</TabsTrigger>
            <TabsTrigger value="history">Stock History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="pt-4">
            <DataTable 
              columns={inventoryColumns}
              data={inventoryItems}
              searchable
              searchPlaceholder="Search items..."
              searchKey="itemName"
              actions={inventoryActions}
            />
          </TabsContent>
          
          <TabsContent value="low" className="pt-4">
            <DataTable 
              columns={inventoryColumns}
              data={lowStockItems}
              searchable
              searchPlaceholder="Search low stock items..."
              searchKey="itemName"
              actions={inventoryActions}
            />
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            <div className="bg-white rounded-lg p-8 text-center text-slate-500">
              <p>Transfer history records will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
