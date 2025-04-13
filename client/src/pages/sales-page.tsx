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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { PlusIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sale, SaleItem, Inventory, Warehouse, insertSaleSchema, insertSaleItemSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Schema for sales form with calculated fields
const saleFormSchema = z.object({
  invoiceNo: z.string().optional(),
  saleDate: z.string(),
  customerName: z.string().min(1, "Customer name is required"),
  customerContact: z.string().optional(),
  customerLocation: z.string().optional(),
  salesperson: z.string().optional(),
  
  // Payment details
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  vat: z.number().min(0).default(15),
  totalAmount: z.number().min(0),
  paymentStatus: z.string(),
  paymentMethod: z.string().optional(),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  
  // Delivery info
  deliveryRequired: z.boolean().default(false),
  deliveryDate: z.string().optional(),
  warehouseId: z.number().optional(),
  
  // Items in the sale
  items: z.array(z.object({
    inventoryId: z.number(),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
    discount: z.number().min(0).default(0),
    totalPrice: z.number(),
  })).min(1, "At least one item is required"),
});

export default function SalesPage() {
  const [createSaleOpen, setCreateSaleOpen] = useState(false);
  const { toast } = useToast();

  // Fetch sales data
  const { data: sales = [], isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Fetch inventory for item selection
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch warehouses for delivery
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Form setup
  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      invoiceNo: `SALE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      saleDate: new Date().toISOString().split('T')[0],
      customerName: "",
      customerContact: "",
      customerLocation: "",
      salesperson: "",
      
      subtotal: 0,
      discount: 0,
      vat: 15,
      totalAmount: 0,
      paymentStatus: "paid",
      
      deliveryRequired: false,
      
      items: [
        {
          inventoryId: 0,
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          totalPrice: 0,
        }
      ]
    },
  });

  // Watch for changes to calculate totals
  const items = form.watch("items");
  const discount = form.watch("discount");
  const vat = form.watch("vat");
  const deliveryRequired = form.watch("deliveryRequired");

  // Calculate subtotal and total
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subtotal - discount + (subtotal * vat / 100);
    
    form.setValue("subtotal", subtotal);
    form.setValue("totalAmount", totalAmount);
  };

  // Update item total price when quantity or price changes
  const updateItemTotal = (index: number) => {
    const item = form.getValues(`items.${index}`);
    const totalPrice = item.quantity * item.unitPrice * (1 - item.discount / 100);
    form.setValue(`items.${index}.totalPrice`, totalPrice);
    calculateTotals();
  };

  // Add a new item to the sale
  const addSaleItem = () => {
    const currentItems = form.getValues().items;
    form.setValue("items", [
      ...currentItems, 
      { inventoryId: 0, quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0 }
    ]);
  };

  // Remove an item from the sale
  const removeSaleItem = (index: number) => {
    const currentItems = form.getValues().items;
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
      calculateTotals();
    }
  };

  // Set item details when inventory item is selected
  const onInventorySelect = (index: number, inventoryId: number) => {
    const selectedItem = inventory.find(item => item.id === inventoryId);
    if (selectedItem) {
      form.setValue(`items.${index}.unitPrice`, selectedItem.unitPrice);
      updateItemTotal(index);
    }
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof saleFormSchema>) => {
      // Format data for API
      const saleData = {
        sale: {
          invoiceNo: data.invoiceNo,
          saleDate: new Date(data.saleDate).toISOString(),
          customerName: data.customerName,
          customerContact: data.customerContact,
          customerLocation: data.customerLocation,
          salesperson: data.salesperson,
          subtotal: data.subtotal,
          discount: data.discount,
          vat: data.vat,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          bankName: data.bankName,
          accountNo: data.accountNo,
          deliveryRequired: data.deliveryRequired,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : undefined,
          deliveryStatus: "pending",
          warehouseId: data.warehouseId,
        },
        items: data.items.map(item => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice,
        })),
      };
      
      const res = await apiRequest("POST", "/api/sales", saleData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setCreateSaleOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sale",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof saleFormSchema>) => {
    createSaleMutation.mutate(values);
  };

  // DataTable columns
  const salesColumns = [
    {
      header: "Invoice No",
      accessorKey: "invoiceNo" as keyof Sale,
    },
    {
      header: "Date",
      accessorKey: "saleDate" as keyof Sale,
      cell: (row: Sale) => format(new Date(row.saleDate), "yyyy-MM-dd"),
    },
    {
      header: "Customer",
      accessorKey: "customerName" as keyof Sale,
    },
    {
      header: "Total",
      accessorKey: "totalAmount" as keyof Sale,
      cell: (row: Sale) => `$${row.totalAmount.toFixed(2)}`,
    },
    {
      header: "Payment",
      accessorKey: "paymentStatus" as keyof Sale,
      cell: (row: Sale) => (
        <StatusBadge 
          status={row.paymentStatus.charAt(0).toUpperCase() + row.paymentStatus.slice(1)} 
          variant={getStatusVariant(row.paymentStatus)} 
        />
      ),
    },
    {
      header: "Delivery",
      accessorKey: "deliveryStatus" as keyof Sale,
      cell: (row: Sale) => row.deliveryRequired ? (
        <StatusBadge 
          status={row.deliveryStatus.charAt(0).toUpperCase() + row.deliveryStatus.slice(1)} 
          variant={getStatusVariant(row.deliveryStatus)} 
        />
      ) : "N/A",
    },
  ];

  // Row actions
  const salesActions = (row: Sale) => (
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
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Sales Management</h2>
          <Dialog open={createSaleOpen} onOpenChange={setCreateSaleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusIcon className="h-4 w-4 mr-2" /> Create Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Sale</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Sale Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="invoiceNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice No.</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-slate-100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="saleDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sale Date*</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name*</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Contact</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="salesperson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salesperson</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Item Details */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-slate-700">Item Details</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSaleItem}
                        className="text-sm flex items-center"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </div>
                    
                    {items.map((_, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.inventoryId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : undefined}>Item*</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                    onInventorySelect(index, parseInt(value));
                                  }} 
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventory.map(item => (
                                      <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.itemName} ({item.quantity} {item.unit})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : undefined}>Quantity*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0.01" 
                                    step="0.01" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      updateItemTotal(index);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : undefined}>Unit Price*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      updateItemTotal(index);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : undefined}>Discount (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      updateItemTotal(index);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.totalPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : undefined}>Total</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    disabled 
                                    className="bg-slate-100" 
                                    value={field.value.toFixed(2)} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-1 flex justify-center">
                          {index > 0 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeSaleItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pricing & Payment */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Pricing & Payment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="subtotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtotal</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  disabled 
                                  className="bg-slate-100" 
                                  value={field.value.toFixed(2)} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value));
                                    calculateTotals();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="vat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value));
                                    calculateTotals();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  disabled 
                                  className="bg-slate-100 font-semibold" 
                                  value={field.value.toFixed(2)} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="paymentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Status*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                                  <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("paymentMethod") === "bank_transfer" && (
                          <>
                            <FormField
                              control={form.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="accountNo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account No.</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Section */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex items-center mb-4">
                      <FormField
                        control={form.control}
                        name="deliveryRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Delivery Required</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {deliveryRequired && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="deliveryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="warehouseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Source Warehouse</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select warehouse" />
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
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateSaleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSaleMutation.isPending}>
                      {createSaleMutation.isPending ? "Processing..." : "Create Sale"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Sales List */}
        <DataTable 
          columns={salesColumns}
          data={sales}
          searchable
          searchPlaceholder="Search sales..."
          searchKey="invoiceNo"
          actions={salesActions}
        />
      </div>
    </SidebarLayout>
  );
}
