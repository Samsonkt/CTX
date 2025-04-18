<<<<<<< HEAD

import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
=======
import { Switch, Route } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { queryClient as initialQueryClient } from "./lib/queryClient"; // Assuming this is the original client
>>>>>>> 2f0d1f0ecab4bf72f122ee9bc0ff7a0e0756936b
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import MachineryPage from "@/pages/machinery-page";
import PurchasePage from "@/pages/purchase-page";
import InventoryPage from "@/pages/inventory-page";
import SalesPage from "@/pages/sales-page";
import DeliveryPage from "@/pages/delivery-page";
import DocumentsPage from "@/pages/documents-page";
import OperationsPage from "@/pages/operations-page";
import ReportsPage from "@/pages/reports-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

<<<<<<< HEAD
=======

>>>>>>> 2f0d1f0ecab4bf72f122ee9bc0ff7a0e0756936b
function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/machinery" component={MachineryPage} />
      <ProtectedRoute path="/purchase" component={PurchasePage} />
      <ProtectedRoute path="/inventory" component={InventoryPage} />
      <ProtectedRoute path="/sales" component={SalesPage} />
      <ProtectedRoute path="/delivery" component={DeliveryPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/operations" component={OperationsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
<<<<<<< HEAD
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
=======
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* AuthProvider needs to be added */}
>>>>>>> 2f0d1f0ecab4bf72f122ee9bc0ff7a0e0756936b
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
