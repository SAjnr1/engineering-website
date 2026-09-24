import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./AdminPresentation.css";
import Navbar from "../Navbar/Navbar";

const BUCKET = "presentation-files";
const MAX_PPTX_MB = 50;
const ALLOWED_EXTENSIONS = [".pptx", ".ppt"];
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // legacy .ppt
];

// Storage paths can't safely contain spaces or special characters.
const safeName = (text) => text.replace(/[^a-zA-Z0-9._-]/g, "_");

// Turns a public file link back into its storage path so the file can be removed.
const pathFromUrl = (url) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
};

export default function AdminPresentation() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileRef = useRef(null);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setListError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Only PowerPoint files are accepted, and they must be under the size limit.
  const handleFile = (e) => {
    const chosen = e.target.files[0] || null;

    if (!chosen) {
      setFile(null);
      return;
    }

    const lowerName = chosen.name.toLowerCase();
    const isPptx =
      ALLOWED_TYPES.includes(chosen.type) ||
      ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isPptx) {
      setError("Only PowerPoint files (.pptx or .ppt) can be uploaded");
      e.target.value = "";
      setFile(null);
      return;
    }

    if (chosen.size > MAX_PPTX_MB * 1024 * 1024) {
      setError(`The file must be smaller than ${MAX_PPTX_MB} MB`);
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(chosen);
    setError("");
  };

  const resetForm = () => {
    setTitle("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Enter a title for the presentation");
      return;
    }
    if (!file) {
      setError("Choose a PowerPoint file");
      return;
    }

    setSaving(true);
    setError("");

    const path = `${Date.now()}-${safeName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }

    const fileUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { error: insertError } = await supabase.from("presentations").insert({
      title: title.trim(),
      file_url: fileUrl,
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    loadItems();
  };

  // Deletes the presentation and its file from storage.
  const deleteItem = async (p) => {
    setDeletingId(p.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("presentations")
      .delete()
      .eq("id", p.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this presentation. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    const path = pathFromUrl(p.file_url);
    if (path) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
      if (removeError) {
        console.error("Failed to remove file from storage:", removeError.message);
      }
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadItems();
  };

  return (
    <div className="ax-page">
        <Navbar/>
      <div className="ax-shell">
        <header className="ax-header">
          <h1>Presentations</h1>
        </header>

        <form className="ax-form" onSubmit={handleSubmit}>
          <h2>Upload a presentation</h2>

          <label className="ax-field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="End of term assembly"
            />
          </label>

          <div className="ax-field">
            <span>PowerPoint file (.pptx or .ppt)</span>
            <div className="ax-upload">
              <div className="ax-upload__thumb">{file ? "PPT" : ""}</div>
              <span className="ax-upload__name">
                {file ? file.name : "No file chosen"}
              </span>
              <button
                type="button"
                className="ax-btn"
                onClick={() => fileRef.current.click()}
              >
                Choose file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                hidden
                onChange={handleFile}
              />
            </div>
          </div>

          {error && <p className="ax-error" role="alert">{error}</p>}

          <button type="submit" className="ax-btn ax-btn--primary" disabled={saving}>
            {saving ? "Uploading..." : "Upload presentation"}
          </button>
        </form>

        {listError && <p className="ax-error ax-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="ax-muted">Loading presentations...</p>
        ) : items.length === 0 ? (
          <p className="ax-empty">Upload your first presentation above.</p>
        ) : (
          <div className="ax-list">
            {items.map((p) => (
              <div key={p.id} className="ax-card">
                <div className="ax-card__icon">PPT</div>
                <div className="ax-card__body">
                  <h3 className="ax-card__title">{p.title}</h3>
                  <a
                    href={p.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-card__link"
                  >
                    Open file
                  </a>
                </div>

                <div className="ax-card__actions">
                  {confirmingId === p.id ? (
                    <>
                      <p className="ax-card__confirm">Delete {p.title}?</p>
                      <button
                        type="button"
                        className="ax-btn ax-btn--danger ax-btn--small"
                        onClick={() => deleteItem(p)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="ax-btn ax-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === p.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ax-delete"
                      onClick={() => setConfirmingId(p.id)}
                    >
                      Delete presentation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}