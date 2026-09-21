import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./PublicPages.css";
import { ArrowLeftIcon } from "lucide-react";

// Shown at /year-groups: one card for every year group.
function YearGroupList() {
  const [years, setYears] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("year_groups")
        .select("*")
        .order("year", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }
      setYears(data || []);
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
        <h1>Year Groups</h1>
      </header>

      {status === "loading" && <p className="pub-muted">Loading year groups...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load the year groups. Please try again later.</p>
      )}

      {status === "ready" && years.length === 0 && (
        <p className="pub-empty">No year groups have been added yet.</p>
      )}

      {status === "ready" && years.length > 0 && (
        <div className="pub-grid pub-grid--years">
          {years.map((y) => (
            <Link
              key={y.id}
              to={`/student/${encodeURIComponent(y.year)}`}
              className="pub-card"
            >
              <div className="pub-card__cover">
                {y.cover_url && <img src={y.cover_url} alt="" loading="lazy" />}
                <span className="pub-card__year">{y.year}</span>
              </div>
              <div className="pub-card__body">
                {y.nickname ? (
                  <span>{y.nickname}</span>
                ) : (
                  <span className="pub-card__nick--empty">No nickname</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// Shown at /year-groups/<year>: the students in that year group.
function YearGroupDetail({ year }) {
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStatus("loading");

      const [groupResult, studentsResult] = await Promise.all([
        supabase.from("year_groups").select("*").eq("year", year).maybeSingle(),
        supabase
          .from("students")
          .select("*")
          .eq("year", year)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;

      if (groupResult.error || studentsResult.error) {
        setStatus("error");
        return;
      }
      if (!groupResult.data) {
        setStatus("missing");
        return;
      }

      setGroup(groupResult.data);
      setStudents(studentsResult.data || []);
      setStatus("ready");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <>
      <header className="pub-header">
        <div className="pub-backs">
          <ArrowLeftIcon/>
          <Link to="/student" className="pub-back">Back to year groups</Link>
        </div>
        <h1>{year} Year Group</h1>
        {group && group.nickname && <p className="pub-sub">{group.nickname}</p>}
      </header>

      {status === "loading" && <p className="pub-muted">Loading students...</p>}

      {status === "error" && (
        <p className="pub-empty">We couldn't load this year group. Please try again later.</p>
      )}

      {status === "missing" && (
        <p className="pub-empty">We couldn't find that year group.</p>
      )}

      {status === "ready" && students.length === 0 && (
        <p className="pub-empty">No students have been added to this year group yet.</p>
      )}

      {status === "ready" && students.length > 0 && (
        <div className="pub-grid pub-grid--students">
          {students.map((s) => (
            <div key={s.id} className="pub-card">
              <div className="pub-student__photo">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.name} loading="lazy" />
                ) : (
                  <span className="pub-student__initial">{s.name.charAt(0)}</span>
                )}
              </div>
              <p className="pub-student__name">{s.name}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// One file for both views: with no year in the address it shows the list,
// with a year it shows that year group's students.
export default function PublicYearGroups() {
  const { year } = useParams();

  return (
    <div className="pub-page">
      <div className="pub-shell">
        {year ? <YearGroupDetail year={year} /> : <YearGroupList />}
      </div>
    </div>
  );
}
