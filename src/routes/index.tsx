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
        children: [{ index: true, element: <InventoryManagerDashboard /> }],
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
