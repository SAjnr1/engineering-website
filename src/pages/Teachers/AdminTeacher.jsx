import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./AdminTeacher.css";
import Navbar from "../Navbar/Navbar";

const BUCKET = "teacher-photos";

// Storage paths can't safely contain spaces or special characters.
const safeName = (text) => text.replace(/[^a-zA-Z0-9._-]/g, "_");

// Turns a public picture link back into its storage path so the file can be removed.
const pathFromUrl = (url) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
};

export default function AdminTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileRef = useRef(null);

  const loadTeachers = async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) setListError(error.message);
    setTeachers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // Free the browser memory used by the preview image.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhoto = (e) => {
    const file = e.target.files[0] || null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : "");
    setError("");
  };

  const resetForm = () => {
    setName("");
    setPhoto(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Enter the teacher's name");
      return;
    }
    if (!photo) {
      setError("Choose the teacher's picture");
      return;
    }

    setSaving(true);
    setError("");

    const path = `${Date.now()}-${safeName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo);

    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }

    const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { error: insertError } = await supabase.from("teachers").insert({
      name: name.trim(),
      photo_url: photoUrl,
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    loadTeachers();
  };

  // Deletes the teacher and their picture from storage.
  const deleteTeacher = async (t) => {
    setDeletingId(t.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("teachers")
      .delete()
      .eq("id", t.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this teacher. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    const path = pathFromUrl(t.photo_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadTeachers();
  };

  return (
    <div className="at-page">
      <Navbar/>
      <div className="at-shell">
        <header className="at-header">
          <h1>Teachers</h1>
          <p className="at-count">
            {teachers.length === 1 ? "1 teacher" : `${teachers.length} teachers`}
          </p>
        </header>

        <form className="at-form" onSubmit={handleSubmit}>
          <h2>Add a teacher</h2>

          <label className="at-field">
            <span>Teacher name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Mrs. Adeyemi"
            />
          </label>

          <div className="at-field">
            <span>Teacher picture</span>
            <div className="at-upload">
              {photoPreview ? (
                <img className="at-upload__thumb" src={photoPreview} alt="Teacher preview" />
              ) : (
                <div className="at-upload__thumb" />
              )}
              <span className="at-upload__name">
                {photo ? photo.name : "No picture chosen"}
              </span>
              <button
                type="button"
                className="at-btn"
                onClick={() => fileRef.current.click()}
              >
                Choose picture
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhoto}
              />
            </div>
          </div>

          {error && <p className="at-error" role="alert">{error}</p>}

          <button type="submit" className="at-btn at-btn--primary" disabled={saving}>
            {saving ? "Adding..." : "Add teacher"}
          </button>
        </form>

        {listError && <p className="at-error at-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="at-muted">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="at-empty">Add your first teacher above.</p>
        ) : (
          <div className="at-grid">
            {teachers.map((t) => (
              <div key={t.id} className="at-card">
                <div className="at-card__photo">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name} />
                  ) : (
                    <span className="at-card__initial">{t.name.charAt(0)}</span>
                  )}
                </div>
                <p className="at-card__name">{t.name}</p>

                <div className="at-card__actions">
                  {confirmingId === t.id ? (
                    <>
                      <p className="at-card__confirm">Delete {t.name}?</p>
                      <button
                        type="button"
                        className="at-btn at-btn--danger at-btn--small"
                        onClick={() => deleteTeacher(t)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="at-btn at-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === t.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="at-delete"
                      onClick={() => setConfirmingId(t.id)}
                    >
                      Delete teacher
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