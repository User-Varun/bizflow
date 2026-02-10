// import { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
