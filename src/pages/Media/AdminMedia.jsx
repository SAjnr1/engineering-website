import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./../../supabaseClient";
import "./AdminMedia.css";
import Navbar from "../Navbar/Navbar";

const BUCKET = "media-files";
const MAX_IMAGE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Storage paths can't safely contain spaces or special characters.
const safeName = (text) => text.replace(/[^a-zA-Z0-9._-]/g, "_");

// Turns a public picture link back into its storage path so the file can be removed.
const pathFromUrl = (url) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
};

export default function AdminMedia() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Pictures chosen but not posted yet: { key, file, url }
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileRef = useRef(null);
  const selectedRef = useRef([]);
  selectedRef.current = selected;

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setListError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Free the browser memory used by the previews when leaving the page.
  useEffect(() => {
    return () => {
      selectedRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    };
  }, []);

  // Only pictures are accepted, and each one must be under the size limit.
  const handleChoose = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (only JPG, PNG, WebP or GIF)`);
      } else if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        rejected.push(`${file.name} (over ${MAX_IMAGE_MB} MB)`);
      } else {
        accepted.push({
          key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          url: URL.createObjectURL(file),
        });
      }
    });

    if (accepted.length > 0) setSelected((prev) => [...prev, ...accepted]);
    setError(rejected.length > 0 ? `Only pictures can be posted. Skipped: ${rejected.join(", ")}` : "");
  };

  const removeSelected = (key) => {
    const item = selected.find((s) => s.key === key);
    if (item) URL.revokeObjectURL(item.url);
    setSelected((prev) => prev.filter((s) => s.key !== key));
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (selected.length === 0) {
      setError("Choose at least one picture");
      return;
    }

    setSaving(true);
    setError("");

    const total = selected.length;
    const failed = [];

    for (let i = 0; i < total; i++) {
      const item = selected[i];
      setProgress(`Posting ${i + 1} of ${total}`);

      const path = `${Date.now()}-${i}-${safeName(item.file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, item.file);

      if (uploadError) {
        failed.push({ item, message: uploadError.message });
        continue;
      }

      const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const { error: insertError } = await supabase
        .from("media")
        .insert({ image_url: imageUrl });

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([path]);
        failed.push({ item, message: insertError.message });
        continue;
      }

      URL.revokeObjectURL(item.url);
    }

    // Anything that failed stays selected so it can be tried again.
    setSelected(failed.map((f) => f.item));
    setSaving(false);
    setProgress("");

    if (failed.length > 0) {
      setError(`${failed.length} of ${total} pictures couldn't be posted. ${failed[0].message}`);
    }

    loadItems();
  };

  // Deletes the picture from the gallery and from storage.
  const deleteItem = async (m) => {
    setDeletingId(m.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("media")
      .delete()
      .eq("id", m.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this picture. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    const path = pathFromUrl(m.image_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadItems();
  };

  return (
    <div className="am-page">
      <Navbar/>
      <div className="am-shell">
        <header className="am-header">
          <h1>Media</h1>
          <p className="am-count">
            {items.length === 1 ? "1 picture" : `${items.length} pictures`}
          </p>
        </header>

        <form className="am-form" onSubmit={handlePost}>
          <h2>Post pictures</h2>

          <div className="am-upload">
            <p className="am-upload__hint">
              Pictures only (JPG, PNG, WebP or GIF), up to {MAX_IMAGE_MB} MB each.
              You can choose several at once.
            </p>
            <button
              type="button"
              className="am-btn"
              onClick={() => fileRef.current.click()}
              disabled={saving}
            >
              Choose pictures
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              multiple
              hidden
              onChange={handleChoose}
            />
          </div>

          {selected.length > 0 && (
            <div className="am-preview-grid">
              {selected.map((s) => (
                <div key={s.key} className="am-preview">
                  <img src={s.url} alt={s.file.name} />
                  <button
                    type="button"
                    className="am-preview__remove"
                    onClick={() => removeSelected(s.key)}
                    disabled={saving}
                    aria-label={`Remove ${s.file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="am-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="am-btn am-btn--primary"
            disabled={saving || selected.length === 0}
          >
            {saving
              ? progress
              : selected.length === 0
              ? "Post pictures"
              : `Post ${selected.length} ${selected.length === 1 ? "picture" : "pictures"}`}
          </button>
        </form>

        {listError && <p className="am-error am-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="am-muted">Loading pictures...</p>
        ) : items.length === 0 ? (
          <p className="am-empty">Post your first picture above.</p>
        ) : (
          <div className="am-grid">
            {items.map((m) => (
              <div key={m.id} className="am-card">
                <div className="am-card__photo">
                  <img src={m.image_url} alt="Posted picture" loading="lazy" />
                </div>

                <div className="am-card__actions">
                  {confirmingId === m.id ? (
                    <>
                      <p className="am-card__confirm">Delete this picture?</p>
                      <button
                        type="button"
                        className="am-btn am-btn--danger am-btn--small"
                        onClick={() => deleteItem(m)}
                        disabled={deletingId === m.id}
                      >
                        {deletingId === m.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="am-btn am-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === m.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="am-delete"
                      onClick={() => setConfirmingId(m.id)}
                    >
                      Delete picture
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
