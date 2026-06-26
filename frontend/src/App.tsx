import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { MerchantListPage } from "./merchants/pages/MerchantListPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/merchants" replace /> },
  { path: "/merchants", element: <MerchantListPage /> },
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
