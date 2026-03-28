import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ScrollToTop from "./components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setNavigate = useAuthStore((state) => state.setNavigate);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  return (
    <>
      <Analytics />
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export default App;
