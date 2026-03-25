import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Navbar } from "./ui/Navbar";
import { Dashboard } from "./features/Dashboard";
import { Inventory } from "./features/Inventory";
import { ProductCatalog } from "./features/ProductCatalog";
import { GenerateBill } from "./features/generateBill/GenerateBill";
import { BillProvider } from "./features/generateBill/contexts/billContext";
import { SearchItemsProvider } from "./features/generateBill/contexts/searchItemsContext";
import { ViewBills } from "./features/ViewBills";
import { AuthProvider } from "./auth/contexts/AuthProvider";
import { ProtectedRoute } from "./auth/components/ProtectedRoute";
import { Login } from "./auth/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Navbar />
        <SearchItemsProvider>
          <Outlet />
        </SearchItemsProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      // { index: true, Component: Inventory },
      { path: "inventory", element: <Inventory /> },
      { path: "productCatalog", element: <ProductCatalog /> },
      {
        path: "generateBill",
        element: (
          <BillProvider>
            <GenerateBill />,
          </BillProvider>
        ),
      },
      {
        path: "viewBills",
        element: <ViewBills />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
