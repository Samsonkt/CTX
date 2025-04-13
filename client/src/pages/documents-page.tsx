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
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileUpIcon, FileTextIcon, DownloadIcon, EyeIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Document, Purchase, Machinery, Project, insertDocumentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

// Schema for document upload
const documentFormSchema = z.object({
  documentType: z.string(),
  relatedType: z.string(),
  relatedId: z.coerce.number(),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
});

export default function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch related entities for the dropdown
  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: machinery = [] } = useQuery<Machinery[]>({
    queryKey: ["/api/machinery"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Form for document upload
  const form = useForm<z.infer<typeof documentFormSchema>>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentType: "",
      relatedType: "",
      relatedId: 0,
      fileName: "",
      filePath: "",
    },
  });

  // Watch form values for conditional fields
  const documentType = form.watch("documentType");
  const relatedType = form.watch("relatedType");

  // Filter documents by type
  const getFilteredDocuments = () => {
    if (activeTab === "all") return documents;
    return documents.filter(doc => doc.documentType === activeTab.toUpperCase());
  };

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof documentFormSchema>) => {
      const documentData = {
        documentType: data.documentType,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        fileName: data.fileName,
        filePath: data.filePath,
        uploadDate: new Date().toISOString(),
        uploadedBy: user?.id || 1,
      };
      
      const res = await apiRequest("POST", "/api/documents", documentData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setUploadOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof documentFormSchema>) => {
    uploadDocumentMutation.mutate(values);
  };

  // DataTable columns
  const documentColumns = [
    {
      header: "Document Type",
      accessorKey: "documentType" as keyof Document,
      cell: (row: Document) => {
        const typeMap: Record<string, string> = {
          "PURCHASE_RECEIPT": "Purchase Receipt",
          "BANK_RECEIPT": "Bank Receipt",
          "SERVICE_REPORT": "Service Report",
          "PROJECT_DOCUMENT": "Project Document"
        };
        return typeMap[row.documentType] || row.documentType;
      },
    },
    {
      header: "File Name",
      accessorKey: "fileName" as keyof Document,
    },
    {
      header: "Related To",
      accessorKey: "relatedType" as keyof Document,
      cell: (row: Document) => {
        const typeMap: Record<string, string> = {
          "purchase": "Purchase",
          "machinery": "Machinery",
          "project": "Project"
        };
        return typeMap[row.relatedType || ""] || row.relatedType;
      },
    },
    {
      header: "Upload Date",
      accessorKey: "uploadDate" as keyof Document,
      cell: (row: Document) => format(new Date(row.uploadDate), "yyyy-MM-dd"),
    },
    {
      header: "Path",
      accessorKey: "filePath" as keyof Document,
      cell: (row: Document) => (
        <div className="max-w-xs truncate">{row.filePath}</div>
      ),
    },
  ];

  // Row actions
  const documentActions = (row: Document) => (
    <div className="flex justify-end space-x-2">
      <Button variant="ghost" size="icon">
        <DownloadIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <EyeIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );

  // Get document icon for document cards
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "PURCHASE_RECEIPT":
        return <FileTextIcon className="h-10 w-10 text-primary" />;
      case "BANK_RECEIPT":
        return <FileTextIcon className="h-10 w-10 text-green-500" />;
      case "SERVICE_REPORT":
        return <FileTextIcon className="h-10 w-10 text-orange-500" />;
      case "PROJECT_DOCUMENT":
        return <FileTextIcon className="h-10 w-10 text-purple-500" />;
      default:
        return <FileTextIcon className="h-10 w-10 text-slate-500" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header with Upload Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Document Management</h2>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <FileUpIcon className="h-4 w-4 mr-2" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PURCHASE_RECEIPT">Purchase Receipt</SelectItem>
                            <SelectItem value="BANK_RECEIPT">Bank Receipt</SelectItem>
                            <SelectItem value="SERVICE_REPORT">Service Report</SelectItem>
                            <SelectItem value="PROJECT_DOCUMENT">Project Document</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="relatedType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related To*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related entity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="machinery">Machinery</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {relatedType && (
                    <FormField
                      control={form.control}
                      name="relatedId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select {relatedType.charAt(0).toUpperCase() + relatedType.slice(1)}*</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${relatedType}`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relatedType === "purchase" && purchases.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.invoiceNo}
                                </SelectItem>
                              ))}
                              
                              {relatedType === "machinery" && machinery.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                              
                              {relatedType === "project" && projects.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="fileName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter file name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="filePath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Path*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter file path or URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploadDocumentMutation.isPending}>
                      {uploadDocumentMutation.isPending ? "Uploading..." : "Upload Document"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Document Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Purchase Receipts</p>
              <p className="text-2xl font-semibold text-slate-800">
                {documents.filter(doc => doc.documentType === "PURCHASE_RECEIPT").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-primary">
              <FileTextIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Bank Receipts</p>
              <p className="text-2xl font-semibold text-slate-800">
                {documents.filter(doc => doc.documentType === "BANK_RECEIPT").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <FileTextIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Service Reports</p>
              <p className="text-2xl font-semibold text-slate-800">
                {documents.filter(doc => doc.documentType === "SERVICE_REPORT").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <FileTextIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Project Documents</p>
              <p className="text-2xl font-semibold text-slate-800">
                {documents.filter(doc => doc.documentType === "PROJECT_DOCUMENT").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
              <FileTextIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        {/* Document Tabs and Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="purchase_receipt">Purchase Receipts</TabsTrigger>
            <TabsTrigger value="bank_receipt">Bank Receipts</TabsTrigger>
            <TabsTrigger value="service_report">Service Reports</TabsTrigger>
            <TabsTrigger value="project_document">Project Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="pt-4">
            <DataTable 
              columns={documentColumns}
              data={getFilteredDocuments()}
              searchable
              searchPlaceholder="Search documents..."
              searchKey="fileName"
              actions={documentActions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
