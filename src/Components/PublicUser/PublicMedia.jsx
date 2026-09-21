import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";

export default function PublicMedia() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [openIndex, setOpenIndex] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("media")
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

  const isOpen = openIndex !== null;

  // While the viewer is open: Escape closes it, the arrow keys move between
  // pictures, and the page behind it doesn't scroll.
  useEffect(() => {
    if (!isOpen) return;

    const total = items.length;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i - 1 + total) % total);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i + 1) % total);
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (closeRef.current) closeRef.current.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, items.length]);

  const close = () => setOpenIndex(null);
  const showPrev = () => setOpenIndex((i) => (i - 1 + items.length) % items.length);
  const showNext = () => setOpenIndex((i) => (i + 1) % items.length);

  return (
    <div className="pub-page">
      <div className="pub-shell">
        <header className="pub-header">
          <h1>Media</h1>
          <p>Pictures of what we do</p>
        </header>

        {status === "loading" && <p className="pub-muted">Loading pictures...</p>}

        {status === "error" && (
          <p className="pub-empty">We couldn't load the pictures. Please try again later.</p>
        )}

        {status === "ready" && items.length === 0 && (
          <p className="pub-empty">No pictures have been posted yet.</p>
        )}

        {status === "ready" && items.length > 0 && (
          <div className="pub-grid pub-grid--media">
            {items.map((m, index) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                className="pub-media__item"
                onClick={() => setOpenIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenIndex(index);
                  }
                }}
                aria-label={`View picture ${index + 1} of ${items.length}`}
              >
                <img src={m.image_url} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {openIndex !== null && items[openIndex] && (
        <div
          className="pub-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Picture viewer"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            className="pub-lightbox__close"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>

          <img
            className="pub-lightbox__img"
            src={items[openIndex].image_url}
            alt={`Picture ${openIndex + 1} of ${items.length}`}
            onClick={(e) => e.stopPropagation()}
          />

          {items.length > 1 && (
            <div className="pub-lightbox__bar" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="pub-lightbox__btn" onClick={showPrev}>
                Previous
              </button>
              <span>
                {openIndex + 1} / {items.length}
              </span>
              <button type="button" className="pub-lightbox__btn" onClick={showNext}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}