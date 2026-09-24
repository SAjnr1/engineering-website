import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";

// Microsoft's free viewer displays Office files inline; it needs a public https link.
const officeViewerUrl = (fileUrl) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

// Shown at /presentations: one preview card per presentation.
function PresentationList() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
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
    <>
      <header className="pub-header">
        <h1>Presentations</h1>
      </header>

      {status === "loading" && <p className="pub-muted">Loading presentations...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load the presentations. Please try again later.</p>
      )}

      {status === "ready" && items.length === 0 && (
        <p className="pub-empty">No presentations have been added yet.</p>
      )}

      {status === "ready" && items.length > 0 && (
        <div className="pub-grid pub-grid--presentations">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/presentations/${p.id}`}
              className="pub-card pub-presentation-card"
            >
              <div className="pub-presentation-card__icon">PPT</div>
              <span className="pub-presentation-card__title">{p.title}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// Shown at /presentations/<id>: the PowerPoint file, opened for viewing.
function PresentationViewer({ id }) {
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStatus("loading");

      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }
      if (!data) {
        setStatus("missing");
        return;
      }

      setItem(data);
      setStatus("ready");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <header className="pub-header">
        <Link to="/presentations" className="pub-back">Back to presentations</Link>
        {item && <h1>{item.title}</h1>}
      </header>

      {status === "loading" && <p className="pub-muted">Loading presentation...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load this presentation. Please try again later.</p>
      )}

      {status === "missing" && (
        <p className="pub-empty">We couldn't find that presentation.</p>
      )}

      {status === "ready" && item.file_url && (
        <>
          <iframe
            className="pub-viewer"
            src={officeViewerUrl(item.file_url)}
            title={`${item.title} presentation`}
          />
          <p className="pub-fallback">
            Trouble viewing it here? <a href={item.file_url}>Download the file</a>
          </p>
        </>
      )}
    </>
  );
}

// One file for both views: with no id in the address it shows the preview cards,
// with an id it opens that presentation.
export default function PublicPresentations() {
  const { id } = useParams();

  return (
    <div className="pub-page">
      <div className="pub-shell">
        {id ? <PresentationViewer id={id} /> : <PresentationList />}
      </div>
    </div>
  );
}