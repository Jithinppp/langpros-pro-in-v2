import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setNavigate = useAuthStore((state) => state.setNavigate);
  const navigate = useNavigate();

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    initializeAuth().then((fn) => {
      cleanupFn = fn;
    });
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [initializeAuth]);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export default App;
