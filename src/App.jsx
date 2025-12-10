import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

import { Navbar } from "./features/ui/Navbar";
import { Dashboard } from "./features/dashBoard/Dashboard";
import { Inventory } from "./features/inventory/Inventory";
import { ProductCatalog } from "./features/productCatalog/ProductCatalog";
import { GenerateBill } from "./features/generateBill/GenerateBill";
import { BillProvider } from "./features/generateBill/contexts/billContext";
import { SearchItemsProvider } from "./features/generateBill/contexts/searchItemsContext";
import { ViewBills } from "./features/viewBills/ViewBills";
import { AuthProvider } from "./features/auth/contexts/AuthProvider";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { Login } from "./features/auth/Login";

function AppLayout() {
  return (
    <ProtectedRoute>
      <Navbar />

      <SearchItemsProvider>
        <Outlet />
      </SearchItemsProvider>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // { index: true, Component: Dashboard },
      { index: true, Component: Inventory },
      // { path: "inventory", element: <Inventory /> },
      { path: "productCatalog", element: <ProductCatalog /> },
      {
        path: "generateBill",
        element: (
          <BillProvider>
            <GenerateBill />,
          </BillProvider>
        ),
      },
      // {
      //   path: "invoice",
      //   element: (
      //     <BillProvider>
      //       <InvoiceFormat />
      //     </BillProvider>
      //   ),
      // },

      {
        path: "viewBills",
        element: <ViewBills />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
