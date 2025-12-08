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

function AppLayout() {
  return (
    <>
      <Navbar />

      <SearchItemsProvider>
        <Outlet />
      </SearchItemsProvider>
    </>
  );
}

const router = createBrowserRouter([
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
  return <RouterProvider router={router} />;
}

export default App;
