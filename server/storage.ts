import { 
  User, InsertUser, 
  Machinery, InsertMachinery, 
  MachineryService, InsertMachineryService,
  Purchase, InsertPurchase,
  PurchaseItem, InsertPurchaseItem,
  Inventory, InsertInventory,
  Warehouse, InsertWarehouse,
  InventoryTransfer, InsertInventoryTransfer,
  TransferItem, InsertTransferItem,
  Sale, InsertSale,
  SaleItem, InsertSaleItem,
  Document, InsertDocument,
  Project, InsertProject,
  Task, InsertTask,
  ItemUsage, InsertItemUsage,
  Timesheet, InsertTimesheet
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Machinery operations
  getMachinery(id: number): Promise<Machinery | undefined>;
  getMachineryList(): Promise<Machinery[]>;
  createMachinery(machinery: InsertMachinery): Promise<Machinery>;
  updateMachinery(id: number, machinery: Partial<InsertMachinery>): Promise<Machinery | undefined>;
  deleteMachinery(id: number): Promise<boolean>;
  
  // Machinery Service operations
  getMachineryServices(machineryId: number): Promise<MachineryService[]>;
  createMachineryService(service: InsertMachineryService): Promise<MachineryService>;
  
  // Purchase operations
  getPurchase(id: number): Promise<Purchase | undefined>;
  getPurchaseList(type?: string): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: number): Promise<boolean>;
  
  // Purchase Items operations
  getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]>;
  
  // Inventory operations
  getInventory(id: number): Promise<Inventory | undefined>;
  getInventoryByProductId(productId: string): Promise<Inventory | undefined>;
  getInventoryList(warehouseId?: number): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, inventory: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventory(id: number): Promise<boolean>;
  
  // Warehouse operations
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  getWarehouseList(): Promise<Warehouse[]>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  
  // Inventory Transfer operations
  createInventoryTransfer(transfer: InsertInventoryTransfer, items: InsertTransferItem[]): Promise<InventoryTransfer>;
  getInventoryTransferList(): Promise<InventoryTransfer[]>;
  
  // Sales operations
  getSale(id: number): Promise<Sale | undefined>;
  getSaleList(): Promise<Sale[]>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByRelatedId(relatedId: number, relatedType: string): Promise<Document[]>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectList(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Task operations
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTaskStatus(id: number, status: string): Promise<Task | undefined>;
  
  // Item Usage operations
  recordItemUsage(usage: InsertItemUsage): Promise<ItemUsage>;
  
  // Timesheet operations
  recordTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  
  // Statistics for dashboard
  getDashboardStats(): Promise<any>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private machinery: Map<number, Machinery>;
  private machineryServices: Map<number, MachineryService>;
  private purchases: Map<number, Purchase>;
  private purchaseItems: Map<number, PurchaseItem[]>;
  private inventories: Map<number, Inventory>;
  private warehouses: Map<number, Warehouse>;
  private inventoryTransfers: Map<number, InventoryTransfer>;
  private transferItems: Map<number, TransferItem[]>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem[]>;
  private documents: Map<number, Document>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private itemUsages: Map<number, ItemUsage>;
  private timesheets: Map<number, Timesheet>;
  
  private userId: number;
  private machineryId: number;
  private machineryServiceId: number;
  private purchaseId: number;
  private purchaseItemId: number;
  private inventoryId: number;
  private warehouseId: number;
  private transferId: number;
  private transferItemId: number;
  private saleId: number;
  private saleItemId: number;
  private documentId: number;
  private projectId: number;
  private taskId: number;
  private itemUsageId: number;
  private timesheetId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.machinery = new Map();
    this.machineryServices = new Map();
    this.purchases = new Map();
    this.purchaseItems = new Map();
    this.inventories = new Map();
    this.warehouses = new Map();
    this.inventoryTransfers = new Map();
    this.transferItems = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.documents = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.itemUsages = new Map();
    this.timesheets = new Map();
    
    this.userId = 1;
    this.machineryId = 1;
    this.machineryServiceId = 1;
    this.purchaseId = 1;
    this.purchaseItemId = 1;
    this.inventoryId = 1;
    this.warehouseId = 1;
    this.transferId = 1;
    this.transferItemId = 1;
    this.saleId = 1;
    this.saleItemId = 1;
    this.documentId = 1;
    this.projectId = 1;
    this.taskId = 1;
    this.itemUsageId = 1;
    this.timesheetId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default warehouses
    this.createWarehouse({ name: "Main Warehouse", location: "Main Location" });
    this.createWarehouse({ name: "Warehouse B", location: "Secondary Location" });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, role: "user" };
    this.users.set(id, user);
    return user;
  }
  
  // Machinery operations
  async getMachinery(id: number): Promise<Machinery | undefined> {
    return this.machinery.get(id);
  }
  
  async getMachineryList(): Promise<Machinery[]> {
    return Array.from(this.machinery.values());
  }
  
  async createMachinery(insertMachinery: InsertMachinery): Promise<Machinery> {
    const id = this.machineryId++;
    const machinery: Machinery = { ...insertMachinery, id };
    this.machinery.set(id, machinery);
    return machinery;
  }
  
  async updateMachinery(id: number, machineryUpdate: Partial<InsertMachinery>): Promise<Machinery | undefined> {
    const machinery = this.machinery.get(id);
    if (!machinery) return undefined;
    
    const updatedMachinery = { ...machinery, ...machineryUpdate };
    this.machinery.set(id, updatedMachinery);
    return updatedMachinery;
  }
  
  async deleteMachinery(id: number): Promise<boolean> {
    return this.machinery.delete(id);
  }
  
  // Machinery Service operations
  async getMachineryServices(machineryId: number): Promise<MachineryService[]> {
    return Array.from(this.machineryServices.values())
      .filter(service => service.machineryId === machineryId);
  }
  
  async createMachineryService(insertService: InsertMachineryService): Promise<MachineryService> {
    const id = this.machineryServiceId++;
    const service: MachineryService = { ...insertService, id };
    this.machineryServices.set(id, service);
    return service;
  }
  
  // Purchase operations
  async getPurchase(id: number): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }
  
  async getPurchaseList(type?: string): Promise<Purchase[]> {
    const purchases = Array.from(this.purchases.values());
    if (type) {
      return purchases.filter(purchase => purchase.purchaseType === type);
    }
    return purchases;
  }
  
  async createPurchase(insertPurchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    const id = this.purchaseId++;
    
    // Auto-generate purchase status based on tracking statuses
    const purchaseStatus = (insertPurchase.itemPickupStatus === 'fully' && 
      insertPurchase.receiptStatus === 'fully' && 
      insertPurchase.paymentStatus === 'fully') ? 'complete' : 'incomplete';
    
    const purchase: Purchase = { ...insertPurchase, id, purchaseStatus };
    this.purchases.set(id, purchase);
    
    // Create purchase items
    const purchaseItemsList: PurchaseItem[] = [];
    for (const item of items) {
      const itemId = this.purchaseItemId++;
      const purchaseItem: PurchaseItem = { ...item, id: itemId, purchaseId: id };
      purchaseItemsList.push(purchaseItem);
    }
    
    this.purchaseItems.set(id, purchaseItemsList);
    
    return purchase;
  }
  
  async updatePurchase(id: number, purchaseUpdate: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase = { ...purchase, ...purchaseUpdate };
    
    // Update purchase status based on tracking statuses
    updatedPurchase.purchaseStatus = (updatedPurchase.itemPickupStatus === 'fully' && 
      updatedPurchase.receiptStatus === 'fully' && 
      updatedPurchase.paymentStatus === 'fully') ? 'complete' : 'incomplete';
    
    this.purchases.set(id, updatedPurchase);
    return updatedPurchase;
  }
  
  async deletePurchase(id: number): Promise<boolean> {
    this.purchaseItems.delete(id);
    return this.purchases.delete(id);
  }
  
  // Purchase Items operations
  async getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
    return this.purchaseItems.get(purchaseId) || [];
  }
  
  // Inventory operations
  async getInventory(id: number): Promise<Inventory | undefined> {
    return this.inventories.get(id);
  }
  
  async getInventoryByProductId(productId: string): Promise<Inventory | undefined> {
    return Array.from(this.inventories.values()).find(
      (inventory) => inventory.productId === productId,
    );
  }
  
  async getInventoryList(warehouseId?: number): Promise<Inventory[]> {
    const inventories = Array.from(this.inventories.values());
    if (warehouseId) {
      return inventories.filter(inventory => inventory.warehouseId === warehouseId);
    }
    return inventories;
  }
  
  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.inventoryId++;
    const inventory: Inventory = { ...insertInventory, id };
    this.inventories.set(id, inventory);
    return inventory;
  }
  
  async updateInventory(id: number, inventoryUpdate: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const inventory = this.inventories.get(id);
    if (!inventory) return undefined;
    
    const updatedInventory = { ...inventory, ...inventoryUpdate };
    this.inventories.set(id, updatedInventory);
    return updatedInventory;
  }
  
  async deleteInventory(id: number): Promise<boolean> {
    return this.inventories.delete(id);
  }
  
  // Warehouse operations
  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }
  
  async getWarehouseList(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }
  
  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.warehouseId++;
    const warehouse: Warehouse = { ...insertWarehouse, id };
    this.warehouses.set(id, warehouse);
    return warehouse;
  }
  
  // Inventory Transfer operations
  async createInventoryTransfer(insertTransfer: InsertInventoryTransfer, items: InsertTransferItem[]): Promise<InventoryTransfer> {
    const id = this.transferId++;
    const transfer: InventoryTransfer = { ...insertTransfer, id };
    this.inventoryTransfers.set(id, transfer);
    
    // Create transfer items
    const transferItemsList: TransferItem[] = [];
    for (const item of items) {
      const itemId = this.transferItemId++;
      const transferItem: TransferItem = { ...item, id: itemId, transferId: id };
      transferItemsList.push(transferItem);
      
      // Update inventory quantities
      const inventory = await this.getInventory(item.inventoryId);
      if (inventory) {
        // Reduce quantity from source warehouse
        await this.updateInventory(item.inventoryId, { 
          quantity: inventory.quantity - item.quantity 
        });
        
        // Check if item exists in destination warehouse
        const sameItemDifferentWarehouse = Array.from(this.inventories.values()).find(
          inv => inv.itemName === inventory.itemName && inv.warehouseId === transfer.toWarehouseId
        );
        
        if (sameItemDifferentWarehouse) {
          // Add to existing inventory in destination warehouse
          await this.updateInventory(sameItemDifferentWarehouse.id, { 
            quantity: sameItemDifferentWarehouse.quantity + item.quantity 
          });
        } else {
          // Create new inventory entry in destination warehouse
          await this.createInventory({
            productId: `${inventory.productId}-${transfer.toWarehouseId}`,
            category: inventory.category,
            itemName: inventory.itemName,
            description: inventory.description,
            quantity: item.quantity,
            unit: inventory.unit,
            unitPrice: inventory.unitPrice,
            minStock: inventory.minStock,
            maxStock: inventory.maxStock,
            warehouseId: transfer.toWarehouseId
          });
        }
      }
    }
    
    this.transferItems.set(id, transferItemsList);
    
    return transfer;
  }
  
  async getInventoryTransferList(): Promise<InventoryTransfer[]> {
    return Array.from(this.inventoryTransfers.values());
  }
  
  // Sales operations
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async getSaleList(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }
  
  async createSale(insertSale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    const id = this.saleId++;
    const sale: Sale = { ...insertSale, id };
    this.sales.set(id, sale);
    
    // Create sale items
    const saleItemsList: SaleItem[] = [];
    for (const item of items) {
      const itemId = this.saleItemId++;
      const saleItem: SaleItem = { ...item, id: itemId, saleId: id };
      saleItemsList.push(saleItem);
      
      // Update inventory quantities
      const inventory = await this.getInventory(item.inventoryId);
      if (inventory) {
        await this.updateInventory(item.inventoryId, { 
          quantity: inventory.quantity - item.quantity 
        });
      }
    }
    
    this.saleItems.set(id, saleItemsList);
    
    return sale;
  }
  
  // Document operations
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const document: Document = { ...insertDocument, id };
    this.documents.set(id, document);
    return document;
  }
  
  async getDocumentsByRelatedId(relatedId: number, relatedType: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.relatedId === relatedId && doc.relatedType === relatedType);
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectList(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }
  
  // Task operations
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTaskStatus(id: number, status: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, status };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Item Usage operations
  async recordItemUsage(insertUsage: InsertItemUsage): Promise<ItemUsage> {
    const id = this.itemUsageId++;
    const usage: ItemUsage = { ...insertUsage, id };
    this.itemUsages.set(id, usage);
    
    // Update inventory quantity
    const inventory = await this.getInventory(insertUsage.inventoryId);
    if (inventory) {
      await this.updateInventory(inventory.id, { 
        quantity: inventory.quantity - insertUsage.quantity 
      });
    }
    
    return usage;
  }
  
  // Timesheet operations
  async recordTimesheet(insertTimesheet: InsertTimesheet): Promise<Timesheet> {
    const id = this.timesheetId++;
    const timesheet: Timesheet = { ...insertTimesheet, id };
    this.timesheets.set(id, timesheet);
    return timesheet;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    return {
      totalMachinery: this.machinery.size,
      pendingPurchases: Array.from(this.purchases.values()).filter(p => p.purchaseStatus === 'incomplete').length,
      lowStockItems: Array.from(this.inventories.values()).filter(i => i.minStock && i.quantity <= i.minStock).length,
      pendingDeliveries: Array.from(this.sales.values()).filter(s => s.deliveryRequired && s.deliveryStatus === 'pending').length,
      recentActivities: [
        { type: 'purchase', message: 'New Purchase Order Created', timestamp: new Date() },
        { type: 'document', message: 'Service Report Uploaded', timestamp: new Date(Date.now() - 86400000) },
        { type: 'inventory', message: 'Inventory Transfer Completed', timestamp: new Date(Date.now() - 86400000) },
        { type: 'delivery', message: 'Delivery Status Updated', timestamp: new Date(Date.now() - 432000000) }
      ],
      tasks: [
        { id: 1, title: 'Complete machinery service report', dueDate: new Date(), priority: 'urgent', status: 'pending' },
        { id: 2, title: 'Review pending purchase orders', dueDate: new Date(Date.now() + 86400000), priority: 'medium', status: 'pending' },
        { id: 3, title: 'Update inventory count for warehouse B', dueDate: new Date(Date.now() + 432000000), priority: 'normal', status: 'pending' },
        { id: 4, title: 'Schedule delivery for pending orders', dueDate: new Date(Date.now() + 259200000), priority: 'medium', status: 'pending' }
      ]
    };
  }
}

export const storage = new MemStorage();
