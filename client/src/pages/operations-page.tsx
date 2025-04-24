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
import { 
  PlusIcon, 
  ClipboardListIcon, 
  ClockIcon, 
  PackageIcon,
  CheckIcon,
  XIcon, 
  AlertTriangleIcon 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Project, Task, Inventory, ItemUsage, Timesheet, insertProjectSchema, insertTaskSchema, insertItemUsageSchema, insertTimesheetSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

// Schema for project form
const projectFormSchema = insertProjectSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for task form
const taskFormSchema = insertTaskSchema.extend({
  projectId: z.coerce.number(),
  dueDate: z.string().optional(),
  assignedTo: z.coerce.number().optional(),
});

// Schema for item usage form
const itemUsageFormSchema = insertItemUsageSchema.extend({
  projectId: z.coerce.number().optional(),
  taskId: z.coerce.number().optional(),
  usageDate: z.string(),
});

// Schema for timesheet form
const timesheetFormSchema = insertTimesheetSchema.extend({
  workDate: z.string(),
});

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [itemUsageDialogOpen, setItemUsageDialogOpen] = useState(false);
  const [timesheetDialogOpen, setTimesheetDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch operational data
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/projects", selectedProject?.id, "tasks"],
    enabled: !!selectedProject,
  });

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Forms
  const projectForm = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: new Date().toISOString().split('T')[0],
      status: "pending",
    },
  });

  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: 0,
      title: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0],
      status: "pending",
      priority: "normal",
    },
  });

  const itemUsageForm = useForm<z.infer<typeof itemUsageFormSchema>>({
    resolver: zodResolver(itemUsageFormSchema),
    defaultValues: {
      inventoryId: 0,
      projectId: 0,
      taskId: 0,
      quantity: 1,
      usageDate: new Date().toISOString().split('T')[0],
    },
  });

  const timesheetForm = useForm<z.infer<typeof timesheetFormSchema>>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: {
      projectId: 0,
      taskId: 0,
      workDate: new Date().toISOString().split('T')[0],
      hours: 1,
      description: "",
    },
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectFormSchema>) => {
      const projectData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      const res = await apiRequest("POST", "/api/projects", projectData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setProjectDialogOpen(false);
      projectForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskFormSchema>) => {
      const taskData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };
      const res = await apiRequest("POST", `/api/projects/${data.projectId}/tasks`, taskData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "tasks"] });
      setTaskDialogOpen(false);
      taskForm.reset({
        projectId: selectedProject?.id ?? 0,
        title: "",
        description: "",
        dueDate: new Date().toISOString().split('T')[0],
        status: "pending",
        priority: "normal",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const recordItemUsageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemUsageFormSchema>) => {
      const usageData = {
        ...data,
        recordedBy: user?.id || 1,
        usageDate: new Date(data.usageDate).toISOString(),
      };
      const res = await apiRequest("POST", "/api/itemusage", usageData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item usage recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setItemUsageDialogOpen(false);
      itemUsageForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record item usage",
        variant: "destructive",
      });
    },
  });

  const recordTimesheetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timesheetFormSchema>) => {
      const timesheetData = {
        ...data,
        userId: user?.id || 1,
        workDate: new Date(data.workDate).toISOString(),
      };
      const res = await apiRequest("POST", "/api/timesheet", timesheetData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Timesheet recorded successfully",
      });
      setTimesheetDialogOpen(false);
      timesheetForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record timesheet",
        variant: "destructive",
      });
    },
  });

  // Task status update mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "tasks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onProjectSubmit = (values: z.infer<typeof projectFormSchema>) => {
    createProjectMutation.mutate(values);
  };

  const onTaskSubmit = (values: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(values);
  };

  const onItemUsageSubmit = (values: z.infer<typeof itemUsageFormSchema>) => {
    recordItemUsageMutation.mutate(values);
  };

  const onTimesheetSubmit = (values: z.infer<typeof timesheetFormSchema>) => {
    recordTimesheetMutation.mutate(values);
  };

  // Handle task selection
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    
    // Reset task form with selected project
    taskForm.reset({
      projectId: project.id,
      title: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0],
      status: "pending",
      priority: "normal",
    });
    
    // Reset item usage form with selected project
    itemUsageForm.setValue("projectId", project.id);
    
    // Reset timesheet form with selected project
    timesheetForm.setValue("projectId", project.id);
  };

  // DataTable columns
  const projectColumns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Project,
    },
    {
      header: "Location",
      accessorKey: "location" as keyof Project,
      cell: (row: Project) => row.location || "N/A",
    },
    {
      header: "Start Date",
      accessorKey: "startDate" as keyof Project,
      cell: (row: Project) => row.startDate ? format(new Date(row.startDate), "yyyy-MM-dd") : "Not set",
    },
    {
      header: "End Date",
      accessorKey: "endDate" as keyof Project,
      cell: (row: Project) => row.endDate ? format(new Date(row.endDate), "yyyy-MM-dd") : "Not set",
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Project,
      cell: (row: Project) => (
        <StatusBadge 
          status={row.status.charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ')} 
          variant={getStatusVariant(row.status)} 
        />
      ),
    },
  ];

  const taskColumns = [
    {
      header: "Title",
      accessorKey: "title" as keyof Task,
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Task,
      cell: (row: Task) => row.description || "N/A",
    },
    {
      header: "Due Date",
      accessorKey: "dueDate" as keyof Task,
      cell: (row: Task) => row.dueDate ? format(new Date(row.dueDate), "yyyy-MM-dd") : "Not set",
    },
    {
      header: "Priority",
      accessorKey: "priority" as keyof Task,
      cell: (row: Task) => {
        const priorityColors: Record<string, string> = {
          "low": "bg-blue-100 text-blue-600",
          "normal": "bg-green-100 text-green-600",
          "high": "bg-orange-100 text-orange-600",
          "urgent": "bg-red-100 text-red-600",
        };
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[row.priority] || ""}`}>
            {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Task,
      cell: (row: Task) => (
        <StatusBadge 
          status={row.status.charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ')} 
          variant={getStatusVariant(row.status)} 
        />
      ),
    },
  ];

  // Task actions
  const taskActions = (row: Task) => (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => updateTaskStatusMutation.mutate({ id: row.id, status: "completed" })}
        disabled={row.status === "completed"}
        className="text-green-500 hover:text-green-700"
      >
        <CheckIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => updateTaskStatusMutation.mutate({ id: row.id, status: "in_progress" })}
        disabled={row.status === "in_progress"}
        className="text-blue-500 hover:text-blue-700"
      >
        <ClockIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => updateTaskStatusMutation.mutate({ id: row.id, status: "pending" })}
        disabled={row.status === "pending"}
        className="text-orange-500 hover:text-orange-700"
      >
        <AlertTriangleIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header with Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-800">Operations Management</h2>
          <div className="flex flex-wrap gap-2">
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4 mr-2" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <Form {...projectForm}>
                  <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                    <FormField
                      control={projectForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Location"
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={projectForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={projectForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={projectForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!selectedProject}>
                  <ClipboardListIcon className="h-4 w-4 mr-2" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Add Task</DialogTitle>
                </DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                    <FormField
                      control={taskForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={taskForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
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
                      control={taskForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={taskForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={taskForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={itemUsageDialogOpen} onOpenChange={setItemUsageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PackageIcon className="h-4 w-4 mr-2" /> Record Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Record Item Usage</DialogTitle>
                </DialogHeader>
                <Form {...itemUsageForm}>
                  <form onSubmit={itemUsageForm.handleSubmit(onItemUsageSubmit)} className="space-y-4">
                    <FormField
                      control={itemUsageForm.control}
                      name="inventoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item*</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
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
                    
                    <FormField
                      control={itemUsageForm.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemUsageForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity*</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.01" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemUsageForm.control}
                      name="usageDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Date*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setItemUsageDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={recordItemUsageMutation.isPending}>
                        {recordItemUsageMutation.isPending ? "Recording..." : "Record Usage"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={timesheetDialogOpen} onOpenChange={setTimesheetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ClockIcon className="h-4 w-4 mr-2" /> Add Timesheet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Record Work Hours</DialogTitle>
                </DialogHeader>
                <Form {...timesheetForm}>
                  <form onSubmit={timesheetForm.handleSubmit(onTimesheetSubmit)} className="space-y-4">
                    <FormField
                      control={timesheetForm.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timesheetForm.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours Worked*</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.5" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timesheetForm.control}
                      name="workDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Date*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timesheetForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the work performed" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setTimesheetDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={recordTimesheetMutation.isPending}>
                        {recordTimesheetMutation.isPending ? "Recording..." : "Record Hours"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Operations Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="pt-4">
            <DataTable 
              columns={projectColumns}
              data={projects}
              searchable
              searchPlaceholder="Search projects..."
              searchKey="name"
              onRowClick={handleProjectSelect}
            />
          </TabsContent>
          
          <TabsContent value="tasks" className="pt-4">
            {selectedProject ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg">
                    Tasks for: <span className="text-primary">{selectedProject.name}</span>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Status: <StatusBadge 
                      status={selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1).replace('_', ' ')} 
                      variant={getStatusVariant(selectedProject.status)} 
                    />
                  </p>
                </div>
                
                <DataTable 
                  columns={taskColumns}
                  data={tasks}
                  searchable
                  searchPlaceholder="Search tasks..."
                  searchKey="title"
                  actions={taskActions}
                />
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <ClipboardListIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-xl font-medium text-slate-800 mb-2">No Project Selected</h3>
                <p className="text-slate-600">Select a project from the Projects tab to view and manage its tasks.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
