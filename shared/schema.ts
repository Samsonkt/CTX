import { pgTable, text, serial, integer, boolean, json, timestamp, varchar, real, foreignKey, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Machinery schema
export const machinery = pgTable("machinery", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  model: text("model"),
  brand: text("brand"),
  serialNo: text("serial_no"),
  purchaseDate: timestamp("purchase_date"),
  notes: text("notes"),
});

export const insertMachinerySchema = createInsertSchema(machinery).omit({
  id: true,
});

// Machinery Service schema
export const machineryService = pgTable("machinery_service", {
  id: serial("id").primaryKey(),
  machineryId: integer("machinery_id").notNull(),
  serviceDate: timestamp("service_date").notNull(),
  serviceType: text("service_type").notNull(),
  cost: real("cost"),
  vendor: text("vendor"),
  notes: text("notes"),
});

export const insertMachineryServiceSchema = createInsertSchema(machineryService).omit({
  id: true,
});

// Purchase schema
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull().unique(),
  purchaseType: text("purchase_type").notNull(), // LOCAL, IMPORTED, WITHOUT_RECEIPT
  purchaseDate: timestamp("purchase_date").notNull(),
  sellerName: text("seller_name").notNull(),
  sellerLocation: text("seller_location"),
  totalAmount: real("total_amount").notNull(),
  transportFees: real("transport_fees").default(0),
  handlingFees: real("handling_fees").default(0),
  commissionFees: real("commission_fees").default(0),
  itemPickupStatus: text("item_pickup_status").notNull().default("not"), // fully, partially, not
  receiptStatus: text("receipt_status").notNull().default("not"), // fully, partially, not
  paymentStatus: text("payment_status").notNull().default("not"), // fully, partially, not
  purchaseStatus: text("purchase_status").notNull().default("incomplete"), // complete, incomplete
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchaseStatus: true,
});

// Purchase Items schema
export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull(),
  category: text("category"),
  itemName: text("item_name").notNull(),
  model: text("model"),
  brand: text("brand"),
  color: text("color"),
  serialNo: text("serial_no"),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  unitPrice: real("unit_price").notNull(),
  vat: real("vat").default(15),
  totalPrice: real("total_price").notNull(),
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
});

// Inventory schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(),
  category: text("category").notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  unitPrice: real("unit_price").notNull(),
  minStock: real("min_stock"),
  maxStock: real("max_stock"),
  warehouseId: integer("warehouse_id").notNull(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
});

// Warehouse schema
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
});

// Inventory Transfers schema
export const inventoryTransfers = pgTable("inventory_transfers", {
  id: serial("id").primaryKey(),
  fromWarehouseId: integer("from_warehouse_id").notNull(),
  toWarehouseId: integer("to_warehouse_id").notNull(),
  transferDate: timestamp("transfer_date").notNull(),
  reference: text("reference"),
  notes: text("notes"),
});

export const insertInventoryTransferSchema = createInsertSchema(inventoryTransfers).omit({
  id: true,
});

// Transfer Items schema
export const transferItems = pgTable("transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull(),
  inventoryId: integer("inventory_id").notNull(),
  quantity: real("quantity").notNull(),
});

export const insertTransferItemSchema = createInsertSchema(transferItems).omit({
  id: true,
});

// Sales schema
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull().unique(),
  saleDate: timestamp("sale_date").notNull(),
  customerName: text("customer_name").notNull(),
  customerContact: text("customer_contact"),
  customerLocation: text("customer_location"),
  salesperson: text("salesperson"),
  subtotal: real("subtotal").notNull(),
  discount: real("discount").default(0),
  vat: real("vat").default(15),
  totalAmount: real("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull(), // paid, partial, credit
  paymentMethod: text("payment_method"), // cash, bank_transfer, direct_deposit, cheque
  bankName: text("bank_name"),
  accountNo: text("account_no"),
  deliveryRequired: boolean("delivery_required").default(false),
  deliveryDate: timestamp("delivery_date"),
  deliveryStatus: text("delivery_status").default("pending"), // pending, completed
  warehouseId: integer("warehouse_id"),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
});

// Sale Items schema
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  inventoryId: integer("inventory_id").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").default(0),
  totalPrice: real("total_price").notNull(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

// Documents schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(), // PURCHASE_RECEIPT, BANK_RECEIPT, SERVICE_REPORT, PROJECT_DOCUMENT
  relatedId: integer("related_id"), // ID of the related entity
  relatedType: text("related_type"), // Type of the related entity (purchase, sale, etc.)
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  uploadDate: timestamp("upload_date").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  priority: text("priority").default("normal"), // low, normal, high, urgent
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Item Usage schema
export const itemUsage = pgTable("item_usage", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull(),
  projectId: integer("project_id"),
  taskId: integer("task_id"),
  quantity: real("quantity").notNull(),
  usageDate: timestamp("usage_date").notNull(),
  recordedBy: integer("recorded_by").notNull(),
});

export const insertItemUsageSchema = createInsertSchema(itemUsage).omit({
  id: true,
});

// Timesheet schema
export const timesheet = pgTable("timesheet", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  taskId: integer("task_id"),
  workDate: timestamp("work_date").notNull(),
  hours: real("hours").notNull(),
  description: text("description"),
});

export const insertTimesheetSchema = createInsertSchema(timesheet).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Machinery = typeof machinery.$inferSelect;
export type InsertMachinery = z.infer<typeof insertMachinerySchema>;

export type MachineryService = typeof machineryService.$inferSelect;
export type InsertMachineryService = z.infer<typeof insertMachineryServiceSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type InventoryTransfer = typeof inventoryTransfers.$inferSelect;
export type InsertInventoryTransfer = z.infer<typeof insertInventoryTransferSchema>;

export type TransferItem = typeof transferItems.$inferSelect;
export type InsertTransferItem = z.infer<typeof insertTransferItemSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ItemUsage = typeof itemUsage.$inferSelect;
export type InsertItemUsage = z.infer<typeof insertItemUsageSchema>;

export type Timesheet = typeof timesheet.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
