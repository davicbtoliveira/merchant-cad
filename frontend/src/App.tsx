import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { MerchantDetailPage } from "./merchants/pages/MerchantDetailPage";
import { MerchantListPage } from "./merchants/pages/MerchantListPage";
import { MerchantNewPage } from "./merchants/pages/MerchantNewPage";
import { MerchantEditPage } from "./merchants/pages/MerchantEditPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/merchants" replace /> },
  { path: "/merchants", element: <MerchantListPage /> },
  { path: "/merchants/new", element: <MerchantNewPage /> },
  { path: "/merchants/:id/edit", element: <MerchantEditPage /> },
  { path: "/merchants/:id", element: <MerchantDetailPage /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
