import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./../../supabaseClient";
import "./AdminAnnouncement.css";
import Navbar from "../Navbar/Navbar"

const MAX_LENGTH = 1000;

// Today's date as YYYY-MM-DD in the admin's own time zone (the format a date input uses).
const todayString = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

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

export default function AdminAnnouncement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [message, setMessage] = useState("");
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("announcement_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setListError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Write the announcement");
      return;
    }
    if (!date) {
      setError("Choose a date");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("announcements").insert({
      message: message.trim(),
      announcement_date: date,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("");
    setDate(todayString());
    loadItems();
  };

  const deleteItem = async (a) => {
    setDeletingId(a.id);
    setListError("");

    const { data: deleted, error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", a.id)
      .select();

    if (deleteError || !deleted || deleted.length === 0) {
      setListError(
        deleteError
          ? deleteError.message
          : "Couldn't delete this announcement. Check that you're logged in and the delete permissions are set up."
      );
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    setConfirmingId(null);
    loadItems();
  };

  return (
    <div className="an-page">
      <Navbar/>
      <div className="an-shell">
        <header className="an-header">
          <h1>Events</h1>
          <p className="an-count">
            {items.length === 1 ? "1 announcement" : `${items.length} announcements`}
          </p>
        </header>

        <form className="an-form" onSubmit={handlePost}>
          <h2>Post an event</h2>

          <label className="an-field">
            <span>Event</span>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
              }}
              rows={5}
              maxLength={MAX_LENGTH}
              placeholder="Write the event here"
            />
            <span className="an-counter">
              {message.length} / {MAX_LENGTH}
            </span>
          </label>

          <label className="an-field an-field--date">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
            />
          </label>

          {error && <p className="an-error" role="alert">{error}</p>}

          <button type="submit" className="an-btn an-btn--primary" disabled={saving}>
            {saving ? "Posting..." : "Post event"}
          </button>
        </form>

        {listError && <p className="an-error an-error--list" role="alert">{listError}</p>}

        {loading ? (
          <p className="an-muted">Loading events...</p>
        ) : items.length === 0 ? (
          <p className="an-empty">Post your first event above.</p>
        ) : (
          <div className="an-list">
            {items.map((a) => (
              <article key={a.id} className="an-card">
                <p className="an-card__date">{formatDate(a.announcement_date)}</p>
                <p className="an-card__message">{a.message}</p>

                <div className="an-card__actions">
                  {confirmingId === a.id ? (
                    <>
                      <span className="an-card__confirm">Delete this event?</span>
                      <button
                        type="button"
                        className="an-btn an-btn--danger an-btn--small"
                        onClick={() => deleteItem(a)}
                        disabled={deletingId === a.id}
                      >
                        {deletingId === a.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        className="an-btn an-btn--small"
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === a.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="an-delete"
                      onClick={() => setConfirmingId(a.id)}
                    >
                      Delete event
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
