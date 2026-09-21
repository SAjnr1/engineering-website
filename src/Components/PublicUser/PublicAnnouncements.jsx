import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";

// Turns 2026-09-20 into "20 September 2026" without any time zone shifting.
const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PublicAnnouncements() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("announcement_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }
      setItems(data || []);
      setStatus("ready");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pub-page">
      <div className="pub-shell pub-shell--narrow">
        <header className="pub-header">
          <h1>Events</h1>
        </header>

        {status === "loading" && <p className="pub-muted">Loading events...</p>}

        {status === "error" && (
          <p className="pub-empty">We couldn't load the events. Please try again later.</p>
        )}

        {status === "ready" && items.length === 0 && (
          <p className="pub-empty">There are no event right now.</p>
        )}

        {status === "ready" && items.length > 0 && (
          <div className="pub-list">
            {items.map((a) => (
              <article key={a.id} className="pub-announcement">
                <p className="pub-announcement__date">{formatDate(a.announcement_date)}</p>
                <p className="pub-announcement__message">{a.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
