import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./../../supabaseClient";
import "./AdminStudent.css";
import Navbar from '../Navbar/Navbar'

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

export default function AdminStudent() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [newYear, setNewYear] = useState("");
  const [nickname, setNickname] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileRef = useRef(null);

  const loadYears = async () => {
    const { data, error } = await supabase
      .from("year_groups")
      .select("*")
      .order("year", { ascending: false });

    if (error) setListError(error.message);
    setYears(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadYears();
  }, []);

  // Free the browser memory used by the preview image.
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const handleCover = (e) => {
    const file = e.target.files[0] || null;
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
  };

  const resetForm = () => {
    setNewYear("");
    setNickname("");
    setCoverFile(null);
    setCoverPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const year = newYear.trim();
    if (!year) {
      setError("Enter a year group");
      return;
    }
    if (years.some((y) => y.year === year)) {
      setError("That year group already exists. Try another.");
      return;
    }

    setSaving(true);
    setError("");

    let coverUrl = null;
    if (coverFile) {
      const path = `covers/${safeName(year)}-${Date.now()}-${safeName(coverFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, coverFile);

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      coverUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { error: insertError } = await supabase.from("year_groups").insert({
      year,
      nickname: nickname.trim() || null,
      cover_url: coverUrl,
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That year group already exists. Try another."
          : insertError.message
      );
      return;
    }

    resetForm();
    loadYears();
  };

  // Deletes the card, every student in it (the database does this automatically),
  // and all of their pictures from storage.
  const deleteYear = async (y) => {
    setDeletingId(y.id);
    setListError("");

    // Collect the picture paths first, because the students disappear with the card.
    const { data: kids } = await supabase
      .from("students")
      .select("photo_url")
      .eq("year", y.year);

    const paths = [y.cover_url, ...(kids || []).map((k) => k.photo_url)]
      .map(pathFromUrl)
      .filter(Boolean);

    const { data: deleted, error: deleteError } = await supabase
      .from("year_groups")
      .delete()
      .eq("id", y.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this card. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadYears();
  };

  return (
    <div className="as-page">
      <Navbar/>
      <div className="as-shell">
        <header className="as-header">
          <h1>Student Year Groups</h1>
        </header>

        <form className="as-form" onSubmit={handleSubmit}>
          <h2>Create a year group card</h2>

          <div className="as-fields">
            <label className="as-field">
              <span>Year group</span>
              <input
                value={newYear}
                onChange={(e) => {
                  setNewYear(e.target.value);
                  setError("");
                }}
                placeholder="2026"
              />
            </label>

            <label className="as-field">
              <span>Class nickname</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Class of Innovators"
              />
            </label>
          </div>

          <div className="as-field">
            <span>Cover picture</span>
            <div className="as-upload">
              {coverPreview ? (
                <img className="as-upload__thumb" src={coverPreview} alt="Cover preview" />
              ) : (
                <div className="as-upload__thumb" />
              )}
              <span className="as-upload__name">
                {coverFile ? coverFile.name : "No picture chosen"}
              </span>
              <button
                type="button"
                className="as-btn"
                onClick={() => fileRef.current.click()}
              >
                Choose picture
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleCover}
              />
            </div>
          </div>

          {error && <p className="as-error" role="alert">{error}</p>}

          <button type="submit" className="as-btn as-btn--primary" disabled={saving}>
            {saving ? "Creating..." : "Create card"}
          </button>
        </form>

        {listError && <p className="as-error as-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="as-muted">Loading year groups...</p>
        ) : years.length === 0 ? (
          <p className="as-empty">Create your first year group card above.</p>
        ) : (
          <div className="as-grid">
            {years.map((y) => (
              <div key={y.id} className="as-card">
                <Link
                  to={`/admin/year_group/${encodeURIComponent(y.year)}`}
                  className="as-card__link"
                >
                  <div className="as-card__cover">
                    {y.cover_url && <img src={y.cover_url} alt="" />}
                    <span className="as-card__year">{y.year}</span>
                  </div>
                  <div className="as-card__body">
                    {y.nickname ? (
                      <span className="as-card__nick">{y.nickname}</span>
                    ) : (
                      <span className="as-card__nick as-card__nick--empty">No nickname</span>
                    )}
                  </div>
                </Link>

                <div className="as-card__actions">
                  {confirmingId === y.id ? (
                    <>
                      <p className="as-card__confirm">
                        Delete {y.year} and all its students?
                      </p>
                      <button
                        type="button"
                        className="as-btn as-btn--danger as-btn--small"
                        onClick={() => deleteYear(y)}
                        disabled={deletingId === y.id}
                      >
                        {deletingId === y.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="as-btn as-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === y.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="as-delete"
                      onClick={() => setConfirmingId(y.id)}
                    >
                      Delete card
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
