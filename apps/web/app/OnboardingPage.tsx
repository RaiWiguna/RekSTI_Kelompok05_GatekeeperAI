"use client";

import { useState, useEffect } from "react";
import AdminConsole from "./admin-console";
import SplashScreen from "./SplashScreen";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading selama 2 detik
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return <AdminConsole />;
}
