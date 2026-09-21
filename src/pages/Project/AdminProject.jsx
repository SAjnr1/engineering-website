import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./../../supabaseClient";
import "./AdminProject.css";
import Navbar from "../Navbar/Navbar";

const BUCKET = "project-files";
const MAX_PDF_MB = 10;

// Storage paths can't safely contain spaces or special characters.
const safeName = (text) => text.replace(/[^a-zA-Z0-9._-]/g, "_");

// Turns a public file link back into its storage path so the file can be removed.
const pathFromUrl = (url) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
};

export default function AdminProject() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [pdf, setPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const imageRef = useRef(null);
  const pdfRef = useRef(null);

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setListError(error.message);
    setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Free the browser memory used by the preview image.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImage = (e) => {
    const file = e.target.files[0] || null;
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setError("");
  };

  // Only PDF files are accepted, and they must be under the size limit.
  const handlePdf = (e) => {
    const file = e.target.files[0] || null;

    if (!file) {
      setPdf(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files can be attached");
      e.target.value = "";
      setPdf(null);
      return;
    }

    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setError(`The PDF must be smaller than ${MAX_PDF_MB} MB`);
      e.target.value = "";
      setPdf(null);
      return;
    }

    setPdf(file);
    setError("");
  };

  const resetForm = () => {
    setName("");
    setImage(null);
    setImagePreview("");
    setPdf(null);
    if (imageRef.current) imageRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Enter the project name");
      return;
    }
    if (!image) {
      setError("Choose a picture of the project");
      return;
    }
    if (!pdf) {
      setError("Attach the project PDF");
      return;
    }

    setSaving(true);
    setError("");

    const stamp = Date.now();
    const imagePath = `images/${stamp}-${safeName(image.name)}`;
    const pdfPath = `pdfs/${stamp}-${safeName(pdf.name)}`;

    const { error: imageError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, image);

    if (imageError) {
      setError(imageError.message);
      setSaving(false);
      return;
    }

    const { error: pdfError } = await supabase.storage
      .from(BUCKET)
      .upload(pdfPath, pdf, { contentType: "application/pdf" });

    if (pdfError) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
      setError(pdfError.message);
      setSaving(false);
      return;
    }

    const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
    const fileUrl = supabase.storage.from(BUCKET).getPublicUrl(pdfPath).data.publicUrl;

    const { error: insertError } = await supabase.from("projects").insert({
      name: name.trim(),
      image_url: imageUrl,
      file_url: fileUrl,
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([imagePath, pdfPath]);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    loadProjects();
  };

  // Deletes the project and both of its files (picture and PDF) from storage.
  const deleteProject = async (p) => {
    setDeletingId(p.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", p.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this project. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    const paths = [p.image_url, p.file_url].map(pathFromUrl).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadProjects();
  };

  return (
    <div className="ap-page">
      <Navbar/>
      <div className="ap-shell">
        <header className="ap-header">
          <h1>Projects</h1>
        </header>

        <form className="ap-form" onSubmit={handleSubmit}>
          <h2>Upload a project</h2>

          <label className="ap-field">
            <span>Project name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Rainwater harvesting system"
            />
          </label>

          <div className="ap-field">
            <span>Project picture</span>
            <div className="ap-upload">
              {imagePreview ? (
                <img className="ap-upload__thumb" src={imagePreview} alt="Project preview" />
              ) : (
                <div className="ap-upload__thumb" />
              )}
              <span className="ap-upload__name">
                {image ? image.name : "No picture chosen"}
              </span>
              <button
                type="button"
                className="ap-btn"
                onClick={() => imageRef.current.click()}
              >
                Choose picture
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImage}
              />
            </div>
          </div>

          <div className="ap-field">
            <span>Project file (PDF only)</span>
            <div className="ap-upload">
              <div className="ap-upload__thumb ap-upload__thumb--file">
                {pdf ? "PDF" : ""}
              </div>
              <span className="ap-upload__name">
                {pdf ? pdf.name : "No PDF chosen"}
              </span>
              <button
                type="button"
                className="ap-btn"
                onClick={() => pdfRef.current.click()}
              >
                Choose PDF
              </button>
              <input
                ref={pdfRef}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={handlePdf}
              />
            </div>
          </div>

          {error && <p className="ap-error" role="alert">{error}</p>}

          <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
            {saving ? "Uploading..." : "Upload project"}
          </button>
        </form>

        {listError && <p className="ap-error ap-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="ap-muted">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="ap-empty">Upload your first project above.</p>
        ) : (
          <div className="ap-grid">
            {projects.map((p) => (
              <div key={p.id} className="ap-card">
                <div className="ap-card__cover">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} />
                  ) : (
                    <span className="ap-card__noimg">No picture</span>
                  )}
                </div>

                <div className="ap-card__body">
                  <h3 className="ap-card__name">{p.name}</h3>
                  {p.file_url ? (
                    <Link to={`/admin/project/${p.id}`} className="ap-read">
                      Read about project
                    </Link>
                  ) : (
                    <p className="ap-muted">No file attached</p>
                  )}
                </div>

                <div className="ap-card__actions">
                  {confirmingId === p.id ? (
                    <>
                      <p className="ap-card__confirm">
                        Delete {p.name} and its files?
                      </p>
                      <button
                        type="button"
                        className="ap-btn ap-btn--danger ap-btn--small"
                        onClick={() => deleteProject(p)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="ap-btn ap-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === p.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ap-delete"
                      onClick={() => setConfirmingId(p.id)}
                    >
                      Delete project
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
