import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export default App;
