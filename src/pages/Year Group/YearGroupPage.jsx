import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./../../supabaseClient";
import "./YearGroupPage.css";
import Navbar from "../Navbar/Navbar";

const BUCKET = "student-photos";

// Storage paths can't safely contain spaces or special characters.
const safeName = (text) => text.replace(/[^a-zA-Z0-9._-]/g, "_");

// Turns a public picture link back into its storage path so the file can be removed.
const pathFromUrl = (url) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
};

export default function YearGroupPage() {
  const { year } = useParams();

  const [students, setStudents] = useState([]);
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

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("year", year)
      .order("created_at", { ascending: true });

    if (error) setListError(error.message);
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadStudents();
  }, [year]);

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
      setError("Enter the student's name");
      return;
    }
    if (!photo) {
      setError("Choose the student's picture");
      return;
    }

    setSaving(true);
    setError("");

    const path = `${safeName(year)}/${Date.now()}-${safeName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo);

    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }

    const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { error: insertError } = await supabase.from("students").insert({
      year,
      name: name.trim(),
      photo_url: photoUrl,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    resetForm();
    loadStudents();
  };

  // Deletes the student and their picture from storage.
  const deleteStudent = async (s) => {
    setDeletingId(s.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("students")
      .delete()
      .eq("id", s.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this student. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    const path = pathFromUrl(s.photo_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadStudents();
  };

  return (
    <div className="yg-page">
      <Navbar/>
      <div className="yg-shell">
        <header className="yg-header">
          <h1>{year} Year Group</h1>
          <p className="yg-count">
            {students.length === 1 ? "1 student" : `${students.length} students`}
          </p>
        </header>

        <form className="yg-form" onSubmit={handleSubmit}>
          <h2>Add a student</h2>

          <label className="yg-field">
            <span>Student name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Isaac Ampofo"
            />
          </label>

          <div className="yg-field">
            <span>Student picture</span>
            <div className="yg-upload">
              {photoPreview ? (
                <img className="yg-upload__thumb" src={photoPreview} alt="Student preview" />
              ) : (
                <div className="yg-upload__thumb" />
              )}
              <span className="yg-upload__name">
                {photo ? photo.name : "No picture chosen"}
              </span>
              <button
                type="button"
                className="yg-btn"
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

          {error && <p className="yg-error" role="alert">{error}</p>}

          <button type="submit" className="yg-btn yg-btn--primary" disabled={saving}>
            {saving ? "Adding..." : "Add student"}
          </button>
        </form>
        <Link to='/admin/year_group' className="link">
        <button className="yg-btn yg-btn--primary1">
          Back to year group
        </button>
        </Link>

        {listError && <p className="yg-error yg-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="yg-muted">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="yg-empty">Add the first student for the {year} year group above.</p>
        ) : (
          <div className="yg-grid">
            {students.map((s) => (
              <div key={s.id} className="yg-card">
                <div className="yg-card__photo">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} />
                  ) : (
                    <span className="yg-card__initial">{s.name.charAt(0)}</span>
                  )}
                </div>
                <p className="yg-card__name">{s.name}</p>

                <div className="yg-card__actions">
                  {confirmingId === s.id ? (
                    <>
                      <p className="yg-card__confirm">Delete {s.name}?</p>
                      <button
                        type="button"
                        className="yg-btn yg-btn--danger yg-btn--small"
                        onClick={() => deleteStudent(s)}
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="yg-btn yg-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === s.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="yg-delete"
                      onClick={() => setConfirmingId(s.id)}
                    >
                      Delete student
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
