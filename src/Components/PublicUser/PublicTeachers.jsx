import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";

export default function PublicTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }
      setTeachers(data || []);
      setStatus("ready");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pub-page">
      <div className="pub-shell">
        <header className="pub-header">
          <h1>Teachers</h1>
        </header>

        {status === "loading" && <p className="pub-muted">Loading teachers...</p>}

        {status === "error" && (
          <p className="pub-empty">We couldn't load the teachers. Please try again later.</p>
        )}

        {status === "ready" && teachers.length === 0 && (
          <p className="pub-empty">No teachers have been added yet.</p>
        )}

        {status === "ready" && teachers.length > 0 && (
          <div className="pub-grid pub-grid--students">
            {teachers.map((t) => (
              <div key={t.id} className="pub-card">
                <div className="pub-student__photo">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name} loading="lazy" />
                  ) : (
                    <span className="pub-student__initial">{t.name.charAt(0)}</span>
                  )}
                </div>
                <p className="pub-student__name">{t.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}