import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";
import { ArrowLeftIcon } from "lucide-react";

// Shown at /projects: one card for every project.
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }
      setProjects(data || []);
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
        <h1>Projects</h1>
        <p>Some of our projects</p>
      </header>

      {status === "loading" && <p className="pub-muted">Loading projects...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load the projects. Please try again later.</p>
      )}

      {status === "ready" && projects.length === 0 && (
        <p className="pub-empty">No projects have been added yet.</p>
      )}

      {status === "ready" && projects.length > 0 && (
        <div className="pub-grid pub-grid--projects">
          {projects.map((p) => (
            <div key={p.id} className="pub-card">
              <div className="pub-project__cover">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" />
                ) : (
                  <span className="pub-project__noimg">No picture</span>
                )}
              </div>
              <div className="pub-project__body">
                <h2 className="pub-project__name">{p.name}</h2>
                {p.file_url && (
                  <Link to={`/project/${p.id}`} className="pub-read">
                    Read about project
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Shown at /projects/<id>: the project's PDF, displayed inside the page.
function ProjectReader({ id }) {
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
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

      if (error) {
        setStatus("error");
        return;
      }
      if (!data) {
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
    <>
      <header className="pub-header">
        <div className="pub-backs">
          <ArrowLeftIcon/>
          <Link to="/project" className="pub-back">Back to project</Link>
        </div>
        {project && <h1>{project.name}</h1>}
      </header>

      {status === "loading" && <p className="pub-muted">Loading project...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load this project. Please try again later.</p>
      )}

      {status === "missing" && (
        <p className="pub-empty">We couldn't find that project.</p>
      )}

      {status === "ready" && (
        <>
          {pdfUrl ? (
            <iframe
              className="pub-viewer"
              src={pdfUrl}
              title={`${project.name} PDF`}
            />
          ) : viewerMessage ? (
            <p className="pub-empty">{viewerMessage}</p>
          ) : (
            <p className="pub-muted">Loading PDF...</p>
          )}

          {project.file_url && (
            <p className="pub-fallback">
              Trouble viewing the PDF? <a href={project.file_url}>Open it directly</a>
            </p>
          )}
        </>
      )}
    </>
  );
}

// One file for both views: with no id in the address it shows the project cards,
// with an id it shows that project's PDF.
export default function PublicProjects() {
  const { id } = useParams();

  return (
    <div className="pub-page">
      <div className="pub-shell">
        {id ? <ProjectReader id={id} /> : <ProjectList />}
      </div>
    </div>
  );
}
