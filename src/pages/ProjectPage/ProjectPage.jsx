import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./ProjectPage.css";
import Navbar from "../Navbar/Navbar";

export default function ProjectPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewerMessage, setViewerMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    const load = async () => {
      setStatus("loading");
      setPdfUrl("");
      setViewerMessage("");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setStatus("missing");
        return;
      }

      setProject(data);
      setStatus("ready");

      if (!data.file_url) {
        setViewerMessage("No PDF is attached to this project.");
        return;
      }

      // Download the PDF and show it from a local link, so it displays inside this page.
      try {
        const res = await fetch(data.file_url);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        if (!cancelled) setPdfUrl(objectUrl);
      } catch {
        if (!cancelled) setViewerMessage("The PDF couldn't be displayed here.");
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return (
    <div className="pp-page">
      <Navbar/>
      <div className="pp-shell">
        <header className="pp-header">
          {project && <h1>{project.name}</h1>}
        </header>

        {status === "loading" && <p className="pp-muted">Loading project...</p>}

        {status === "missing" && (
          <p className="pp-empty">
            We couldn't find that project. Go back to the projects page and try again.
          </p>
        )}

        {status === "ready" && (
          <>
            <div className="pp-viewer-wrap">
              {pdfUrl ? (
                <iframe
                  className="pp-viewer"
                  src={pdfUrl}
                  title={`${project.name} PDF`}
                />
              ) : viewerMessage ? (
                <p className="pp-empty">{viewerMessage}</p>
              ) : (
                <p className="pp-muted">Loading PDF...</p>
              )}
            </div>

            {project.file_url && (
              <p className="pp-fallback">
                Trouble viewing the PDF? <a href={project.file_url}>Open it directly</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
