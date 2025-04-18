import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { z } from "zod";
import {
  insertMachinerySchema,
  insertMachineryServiceSchema,
  insertPurchaseSchema,
  insertPurchaseItemSchema,
  insertInventorySchema,
  insertInventoryTransferSchema,
  insertTransferItemSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertDocumentSchema,
  insertProjectSchema,
  insertTaskSchema,
  insertItemUsageSchema,
  insertTimesheetSchema,
} from "../shared/schema.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Dashboard stats
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Machinery routes
  app.get("/api/machinery", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const machineryList = await storage.getMachineryList();
    res.json(machineryList);
  });

  app.get("/api/machinery/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const machinery = await storage.getMachinery(Number(req.params.id));
    if (!machinery) return res.status(404).send("Machinery not found");
    res.json(machinery);
  });

  app.post("/api/machinery", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertMachinerySchema.parse(req.body);
      const machinery = await storage.createMachinery(validatedData);
      res.status(201).json(machinery);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.put("/api/machinery/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertMachinerySchema.partial().parse(req.body);
      const updatedMachinery = await storage.updateMachinery(Number(req.params.id), validatedData);
      if (!updatedMachinery) return res.status(404).send("Machinery not found");
      res.json(updatedMachinery);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.delete("/api/machinery/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const success = await storage.deleteMachinery(Number(req.params.id));
    if (!success) return res.status(404).send("Machinery not found");
    res.sendStatus(204);
  });

  // Machinery Service routes
  app.get("/api/machinery/:id/services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const services = await storage.getMachineryServices(Number(req.params.id));
    res.json(services);
  });

  app.post("/api/machinery/:id/services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertMachineryServiceSchema.parse({
        ...req.body,
        machineryId: Number(req.params.id),
      });
      const service = await storage.createMachineryService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const type = req.query.type as string | undefined;
    const purchases = await storage.getPurchaseList(type);
    res.json(purchases);
  });

  app.get("/api/purchases/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const purchase = await storage.getPurchase(Number(req.params.id));
    if (!purchase) return res.status(404).send("Purchase not found");
    res.json(purchase);
  });

  app.get("/api/purchases/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getPurchaseItems(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/purchases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { purchase, items } = req.body;
      const validatedPurchase = insertPurchaseSchema.parse(purchase);
      const validatedItems = z.array(insertPurchaseItemSchema).parse(items);
      
      const newPurchase = await storage.createPurchase(validatedPurchase, validatedItems);
      res.status(201).json(newPurchase);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.put("/api/purchases/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertPurchaseSchema.partial().parse(req.body);
      const updatedPurchase = await storage.updatePurchase(Number(req.params.id), validatedData);
      if (!updatedPurchase) return res.status(404).send("Purchase not found");
      res.json(updatedPurchase);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
    const inventory = await storage.getInventoryList(warehouseId);
    res.json(inventory);
  });

  app.get("/api/inventory/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.getInventory(Number(req.params.id));
    if (!item) return res.status(404).send("Inventory item not found");
    res.json(item);
  });

  app.post("/api/inventory", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventory(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const updatedItem = await storage.updateInventory(Number(req.params.id), validatedData);
      if (!updatedItem) return res.status(404).send("Inventory item not found");
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Warehouse routes
  app.get("/api/warehouses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const warehouses = await storage.getWarehouseList();
    res.json(warehouses);
  });

  // Inventory Transfer routes
  app.post("/api/inventory/transfers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { transfer, items } = req.body;
      const validatedTransfer = insertInventoryTransferSchema.parse(transfer);
      const validatedItems = z.array(insertTransferItemSchema).parse(items);
      
      const newTransfer = await storage.createInventoryTransfer(validatedTransfer, validatedItems);
      res.status(201).json(newTransfer);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/inventory/transfers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transfers = await storage.getInventoryTransferList();
    res.json(transfers);
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sales = await storage.getSaleList();
    res.json(sales);
  });

  app.get("/api/sales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sale = await storage.getSale(Number(req.params.id));
    if (!sale) return res.status(404).send("Sale not found");
    res.json(sale);
  });

  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { sale, items } = req.body;
      const validatedSale = insertSaleSchema.parse(sale);
      const validatedItems = z.array(insertSaleItemSchema).parse(items);
      
      const newSale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(newSale);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Document routes
  app.post("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        uploadedBy: req.user!.id,
        uploadDate: new Date(),
      });
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const relatedId = req.query.relatedId ? Number(req.query.relatedId) : undefined;
    const relatedType = req.query.relatedType as string | undefined;
    
    if (!relatedId || !relatedType) {
      return res.status(400).send("relatedId and relatedType are required");
    }
    
    const documents = await storage.getDocumentsByRelatedId(relatedId, relatedType);
    res.json(documents);
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projects = await storage.getProjectList();
    res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Task routes
  app.get("/api/projects/:id/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasksByProject(Number(req.params.id));
    res.json(tasks);
  });

  app.post("/api/projects/:id/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        projectId: Number(req.params.id),
      });
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.put("/api/tasks/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { status } = req.body;
      if (!status) return res.status(400).send("Status is required");
      
      const updatedTask = await storage.updateTaskStatus(Number(req.params.id), status);
      if (!updatedTask) return res.status(404).send("Task not found");
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Item Usage routes
  app.post("/api/itemusage", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertItemUsageSchema.parse({
        ...req.body,
        recordedBy: req.user!.id,
      });
      const usage = await storage.recordItemUsage(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Timesheet routes
  app.post("/api/timesheet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertTimesheetSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const timesheet = await storage.recordTimesheet(validatedData);
      res.status(201).json(timesheet);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
