import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ProtectedRoute() {
  // undefined = still checking, null = logged out, object = logged in
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <p>Loading...</p>;
  if (!session) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
