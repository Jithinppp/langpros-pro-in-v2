import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFoundPage";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";

// admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";

// inventory-manager pages
import InventoryManagerDashboard from "../pages/inventory-manager/InventoryManagerDashboard";
import AddEquipment from "../pages/inventory-manager/AddEquipment";
import AddStorageLocation from "../pages/inventory-manager/AddStorageLocation";
import ManageCategories from "../pages/inventory-manager/ManageCategories";
import ManageSubcategories from "../pages/inventory-manager/ManageSubcategories";
import ManageModels from "../pages/inventory-manager/ManageModels";
import Equipments from "../pages/inventory-manager/Equipments";
import SingleEquipment from "../pages/inventory-manager/SingleEquipment";
import Reports from "../pages/inventory-manager/Reports";

// project-manager pages
import ProjectManagerDashboard from "../pages/project-manager/ProjectManagerDashboard";

// tech pages
import TechDashboard from "../pages/tech/TechDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // unauthorized page
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },

      // 404
      {
        path: "*",
        element: <NotFoundPage />,
      },

      // admin - protected with Layout
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout />
          </ProtectedRoute>
        ),
        children: [{ index: true, element: <AdminDashboard /> }],
      },

      // inventory-manager - protected with Layout
      {
        path: "inventory-manager",
        element: (
          <ProtectedRoute allowedRoles={["inventory-manager"]}>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <InventoryManagerDashboard /> },
          { path: "add-equipment", element: <AddEquipment /> },
          { path: "manage-categories", element: <ManageCategories /> },
          { path: "manage-subcategories", element: <ManageSubcategories /> },
          { path: "manage-models", element: <ManageModels /> },
          { path: "add-storage-location", element: <AddStorageLocation /> },
          { path: "equipments", element: <Equipments /> },
          { path: "equipments/:id", element: <SingleEquipment /> },
          { path: "reports", element: <Reports /> },
        ],
      },

      // project-manager - protected with Layout
      {
        path: "project-manager",
        element: (
          <ProtectedRoute allowedRoles={["project-manager"]}>
            <Layout />
          </ProtectedRoute>
        ),
        children: [{ index: true, element: <ProjectManagerDashboard /> }],
      },

      // tech - protected with Layout
      {
        path: "tech",
        element: (
          <ProtectedRoute allowedRoles={["tech"]}>
            <Layout />
          </ProtectedRoute>
        ),
        children: [{ index: true, element: <TechDashboard /> }],
      },
    ],
  },
]);
