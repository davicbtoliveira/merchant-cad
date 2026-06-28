import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { MerchantDetailPage } from "./pages/Detail";
import { MerchantListPage } from "./pages/List";
import { MerchantNewPage } from "./pages/New";
import { MerchantEditPage } from "./pages/Edit";

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
