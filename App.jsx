import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Zap, Calendar, BookOpen, Layers, BarChart3, Plus, Check, X,
  Search, ChevronRight, Trash2, ArrowLeft, Clock, Sparkles
} from "lucide-react";
import { loadKey, saveKey } from "./supabaseClient.js";

// ---------- design tokens ----------
const C = {
  ink: "#FFFFFF",
  paper: "#FFFFFF",
  paper2: "#F4EFE4",
  line: "rgba(43,38,32,0.12)",
  honey: "#C9A063",
  honeyDark: "#A67C3D",
  honeyDim: "rgba(201,160,99,0.16)",
  bloom: "#8C6A3F",
  bloomDim: "rgba(140,106,63,0.12)",
  cream: "#2B2620",
  muted: "#6B6357",
  faint: "#9C9284",
};

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    body { -webkit-font-smoothing: antialiased; }
    ::selection { background: ${C.honey}; color: ${C.ink}; }
    input, textarea, select { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus, button:focus-visible {
      outline: 2px solid ${C.honey}; outline-offset: 2px;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: ${C.paper2}; border-radius: 8px; }
    @media (max-width: 640px) {
      .hpp-nav-label { display: none; }
    }
  `}</style>
);

const display = { fontFamily: "'Fraunces', serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

// ---------- storage helpers (Supabase-backed) ----------
async function load(key, fallback) {
  return await loadKey(key, fallback);
}
async function save(key, value) {
  await saveKey(key, value);
}

const uid = () => Math.random().toString(36).slice(2, 10);

const STAGES = [
  { key: "idea", label: "Idea" },
  { key: "research", label: "Research" },
  { key: "script", label: "Script" },
  { key: "record", label: "Record" },
  { key: "edit", label: "Edit" },
  { key: "posted", label: "Posted" },
];

const CHECKLIST_TEMPLATE = [
  "Research", "Script", "Record", "Edit", "Thumbnail", "Caption", "Post", "Repurpose",
];

const CAPTURE_TAGS = ["Hook", "Script", "Editing", "Filming", "Carousel", "Trend", "CTA", "Story"];
const SWIPE_CATS = ["Hooks", "CTAs", "Storytelling", "Open Loops", "Titles"];

// ---------- tiny primitives ----------
function Pill({ children, active, onClick, color = C.honey }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? color : C.line}`,
        background: active ? (color === C.honey ? C.honeyDim : C.bloomDim) : "transparent",
        color: active ? color : C.muted,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 3px rgba(43,38,32,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        color: C.faint,
        cursor: "pointer",
        padding: 6,
        borderRadius: 8,
        display: "flex",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = C.bloom)}
      onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
    >
      <Icon size={16} />
    </button>
  );
}

// honey jar progress — the signature element
function HoneyJar({ progress }) {
  const p = Math.max(0, Math.min(100, progress));
  const fillHeight = (p / 100) * 78;
  return (
    <svg width="72" height="96" viewBox="0 0 72 96" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="honeyFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={C.honeyDark} />
          <stop offset="100%" stopColor={C.honey} />
        </linearGradient>
        <clipPath id="jarClip">
          <rect x="10" y="14" width="52" height="78" rx="10" />
        </clipPath>
      </defs>
      {/* lid */}
      <rect x="20" y="4" width="32" height="10" rx="3" fill={C.paper2} stroke={C.line} />
      {/* jar body outline */}
      <rect x="10" y="14" width="52" height="78" rx="10" fill={C.paper2} stroke={C.line} strokeWidth="1.5" />
      {/* fill */}
      <g clipPath="url(#jarClip)">
        <rect x="10" y={92 - fillHeight} width="52" height={fillHeight} fill="url(#honeyFill)" />
        <ellipse cx="36" cy={92 - fillHeight} rx="26" ry="3.2" fill={C.honey} opacity="0.7" />
      </g>
      <text x="36" y="60" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="14" fill={p > 45 ? C.ink : C.cream} fontWeight="600">
        {Math.round(p)}%
      </text>
    </svg>
  );
}

function Empty({ label, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 16px", color: C.faint }}>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 13 }}>{sub}</p>}
    </div>
  );
}

// ================= APP =================
export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("home");
  const [projects, setProjects] = useState([]);
  const [captures, setCaptures] = useState([]);
  const [swipes, setSwipes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [openProjectId, setOpenProjectId] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, c, s, r] = await Promise.all([
        load("hpp:projects", []),
        load("hpp:captures", []),
        load("hpp:swipes", []),
        load("hpp:reviews", []),
      ]);
      setProjects(p);
      setCaptures(c);
      setSwipes(s);
      setReviews(r);
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) save("hpp:projects", projects); }, [projects, ready]);
  useEffect(() => { if (ready) save("hpp:captures", captures); }, [captures, ready]);
  useEffect(() => { if (ready) save("hpp:swipes", swipes); }, [swipes, ready]);
  useEffect(() => { if (ready) save("hpp:reviews", reviews); }, [reviews, ready]);

  const activeProject = useMemo(() => {
    const live = projects.filter((p) => p.stage !== "posted");
    if (live.length === 0) return null;
    return [...live].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }, [projects]);

  function touchProject(id, patch) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p))
    );
  }

  function createProject(title) {
    const np = {
      id: uid(),
      title: title || "Untitled idea",
      stage: "idea",
      checklist: CHECKLIST_TEMPLATE.map((label) => ({ id: uid(), label, done: false })),
      notes: "",
      estMinutes: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => [np, ...prev]);
    return np.id;
  }

  if (!ready) {
    return (
      <div style={{ background: C.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
        {FONTS}
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Warming the honey…</p>
      </div>
    );
  }

  const NAV = [
    { key: "home", label: "Home", icon: Home },
    { key: "capture", label: "Capture", icon: Zap },
    { key: "calendar", label: "Calendar", icon: Calendar },
    { key: "swipe", label: "Swipe", icon: BookOpen },
    { key: "projects", label: "Projects", icon: Layers },
    { key: "review", label: "Review", icon: BarChart3 },
  ];

  return (
    <div style={{ background: C.ink, minHeight: "100vh", color: C.cream, fontFamily: "'Inter', sans-serif" }}>
      {FONTS}

      {/* header */}
      <div style={{ borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.ink, zIndex: 10 }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "18px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <span style={{ ...display, fontSize: 22, fontWeight: 600, color: C.honey }}>Honey Poco a Poco</span>
            <span style={{ fontSize: 12, color: C.faint, ...mono }}>little by little</span>
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
            {NAV.map((n) => {
              const active = view === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => { setView(n.key); setOpenProjectId(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "transparent", border: "none",
                    padding: "10px 14px",
                    borderBottom: `2px solid ${active ? C.honey : "transparent"}`,
                    color: active ? C.honey : C.faint,
                    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <n.icon size={15} />
                  <span className="hpp-nav-label">{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px 64px" }}>
        {view === "home" && (
          <HomeView
            activeProject={activeProject}
            onOpenProject={(id) => { setOpenProjectId(id); setView("projects"); }}
            onNewProject={() => {
              const id = createProject("");
              setOpenProjectId(id);
              setView("projects");
            }}
            capturesCount={captures.length}
            weekProgress={projects.filter((p) => p.stage === "posted" && p.updatedAt > Date.now() - 7 * 86400000).length}
          />
        )}

        {view === "capture" && <CaptureView captures={captures} setCaptures={setCaptures} />}

        {view === "calendar" && (
          <CalendarView
            projects={projects}
            onAdvance={(id, dir) => {
              const p = projects.find((x) => x.id === id);
              const idx = STAGES.findIndex((s) => s.key === p.stage);
              const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))];
              touchProject(id, { stage: next.key });
            }}
            onNew={() => createProject("")}
            onOpen={(id) => { setOpenProjectId(id); setView("projects"); }}
          />
        )}

        {view === "swipe" && <SwipeView swipes={swipes} setSwipes={setSwipes} />}

        {view === "projects" && (
          <ProjectsView
            projects={projects}
            setProjects={setProjects}
            openProjectId={openProjectId}
            setOpenProjectId={setOpenProjectId}
            touchProject={touchProject}
            createProject={createProject}
          />
        )}

        {view === "review" && <ReviewView reviews={reviews} setReviews={setReviews} />}
      </div>
    </div>
  );
}

// ---------- HOME ----------
function HomeView({ activeProject, onOpenProject, onNewProject, capturesCount, weekProgress }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const progress = activeProject
    ? Math.round((activeProject.checklist.filter((c) => c.done).length / activeProject.checklist.length) * 100)
    : 0;
  const nextItem = activeProject ? activeProject.checklist.find((c) => !c.done) : null;

  return (
    <div>
      <p style={{ ...display, fontSize: 28, fontWeight: 500, marginBottom: 24 }}>
        {greeting}, Neye <span style={{ color: C.honey }}>🌻</span>
      </p>

      {activeProject ? (
        <Card style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <HoneyJar progress={progress} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.faint, marginBottom: 6, ...mono }}>
              Current project
            </p>
            <p style={{ ...display, fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
              {activeProject.title || "Untitled idea"}
            </p>
            {nextItem ? (
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>
                Next action: <span style={{ color: C.cream, fontWeight: 600 }}>{nextItem.label}</span>
              </p>
            ) : (
              <p style={{ fontSize: 14, color: C.honey, marginBottom: 4 }}>Everything's checked off. Ship it or repurpose it.</p>
            )}
            <p style={{ fontSize: 13, color: C.faint, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={13} /> Est. {activeProject.estMinutes || 20} mins · Stage: {STAGES.find((s) => s.key === activeProject.stage)?.label}
            </p>
          </div>
          <button
            onClick={() => onOpenProject(activeProject.id)}
            style={{
              background: C.honey, color: C.ink, border: "none", borderRadius: 12,
              padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Continue <ChevronRight size={16} />
          </button>
        </Card>
      ) : (
        <Card style={{ textAlign: "center" }}>
          <Sparkles size={22} color={C.honey} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 16 }}>Nothing in motion right now. Start one idea.</p>
          <button
            onClick={onNewProject}
            style={{ background: C.honey, color: C.ink, border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}
          >
            + New project
          </button>
        </Card>
      )}

      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 160, padding: 16 }}>
          <p style={{ fontSize: 22, ...display, fontWeight: 600, color: C.honey }}>{capturesCount}</p>
          <p style={{ fontSize: 12, color: C.faint }}>things captured</p>
        </Card>
        <Card style={{ flex: 1, minWidth: 160, padding: 16 }}>
          <p style={{ fontSize: 22, ...display, fontWeight: 600, color: C.bloom }}>{weekProgress}</p>
          <p style={{ fontSize: 12, color: C.faint }}>posted this week</p>
        </Card>
      </div>
    </div>
  );
}

// ---------- CAPTURE ----------
function CaptureView({ captures, setCaptures }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState(CAPTURE_TAGS[0]);

  function addCapture() {
    if (!text.trim()) return;
    setCaptures((prev) => [{ id: uid(), text: text.trim(), tag, createdAt: Date.now() }, ...prev]);
    setText("");
  }

  return (
    <div>
      <p style={{ ...display, fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Quick save</p>
      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a link, a tweet, a tiktok, or just type the idea before it disappears…"
          rows={3}
          style={{
            width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 10,
            padding: 12, color: C.cream, fontSize: 14, resize: "vertical", marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {CAPTURE_TAGS.map((t) => (
            <Pill key={t} active={tag === t} onClick={() => setTag(t)}>{t}</Pill>
          ))}
        </div>
        <button
          onClick={addCapture}
          style={{
            background: C.honey, color: C.ink, border: "none", borderRadius: 10,
            padding: "11px 20px", fontWeight: 700, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6,
          }}
        >
          <Plus size={16} /> Capture
        </button>
      </Card>

      <p style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.faint, margin: "24px 0 10px", ...mono }}>
        Recent · {captures.length}
      </p>
      {captures.length === 0 ? (
        <Empty label="Nothing saved yet" sub="The next hook you see mid-scroll — that's what this is for." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {captures.map((c) => (
            <Card key={c.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: C.honey, ...mono, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.tag}</span>
                <p style={{ fontSize: 14, marginTop: 4, wordBreak: "break-word" }}>{c.text}</p>
              </div>
              <IconBtn icon={Trash2} onClick={() => setCaptures((prev) => prev.filter((x) => x.id !== c.id))} title="Delete" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- CALENDAR ----------
function CalendarView({ projects, onAdvance, onNew, onOpen }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...display, fontSize: 22, fontWeight: 600 }}>Content calendar</p>
        <button
          onClick={onNew}
          style={{ background: C.honeyDim, color: C.honey, border: `1px solid ${C.honey}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> New idea
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {STAGES.map((stage, colIdx) => {
          const items = projects.filter((p) => p.stage === stage.key).sort((a, b) => b.updatedAt - a.updatedAt);
          return (
            <div key={stage.key} style={{ minWidth: 200, flex: "0 0 200px" }}>
              <p style={{ fontSize: 12, color: C.faint, ...mono, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {stage.label} · {items.length}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((p) => (
                  <Card key={p.id} style={{ padding: 12 }}>
                    <p onClick={() => onOpen(p.id)} style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, cursor: "pointer" }}>
                      {p.title || "Untitled idea"}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <button
                        disabled={colIdx === 0}
                        onClick={() => onAdvance(p.id, -1)}
                        style={{ background: "transparent", border: "none", color: colIdx === 0 ? C.line : C.faint, cursor: colIdx === 0 ? "default" : "pointer", fontSize: 12 }}
                      >
                        ← back
                      </button>
                      <button
                        disabled={colIdx === STAGES.length - 1}
                        onClick={() => onAdvance(p.id, 1)}
                        style={{ background: "transparent", border: "none", color: colIdx === STAGES.length - 1 ? C.line : C.honey, cursor: colIdx === STAGES.length - 1 ? "default" : "pointer", fontSize: 12, fontWeight: 600 }}
                      >
                        move →
                      </button>
                    </div>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div style={{ border: `1px dashed ${C.line}`, borderRadius: 12, padding: "16px 8px", textAlign: "center", color: C.faint, fontSize: 12 }}>
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- SWIPE LIBRARY ----------
function SwipeView({ swipes, setSwipes }) {
  const [cat, setCat] = useState(SWIPE_CATS[0]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const filtered = swipes
    .filter((s) => s.cat === cat)
    .filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);

  function add() {
    if (!draft.trim()) return;
    setSwipes((prev) => [{ id: uid(), text: draft.trim(), cat, createdAt: Date.now() }, ...prev]);
    setDraft("");
  }

  return (
    <div>
      <p style={{ ...display, fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Swipe library</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {SWIPE_CATS.map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)} color={C.bloom}>{c}</Pill>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} color={C.faint} style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${cat.toLowerCase()}…`}
            style={{ width: "100%", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px 10px 34px", color: C.cream, fontSize: 14 }}
          />
        </div>
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={`Add a new ${cat.slice(0, -1).toLowerCase()}…`}
            style={{ flex: 1, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", color: C.cream, fontSize: 14 }}
          />
          <button onClick={add} style={{ background: C.bloomDim, color: C.bloom, border: `1px solid ${C.bloom}`, borderRadius: 10, padding: "0 16px", fontWeight: 700, cursor: "pointer" }}>
            Save
          </button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Empty label={`No ${cat.toLowerCase()} saved yet`} sub="Add the next one you screenshot mid-scroll." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((s) => (
            <Card key={s.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <p style={{ fontSize: 14 }}>{s.text}</p>
              <IconBtn icon={Trash2} onClick={() => setSwipes((prev) => prev.filter((x) => x.id !== s.id))} title="Delete" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- PROJECTS ----------
function ProjectsView({ projects, setProjects, openProjectId, setOpenProjectId, touchProject, createProject }) {
  const open = projects.find((p) => p.id === openProjectId);

  if (open) {
    return <ProjectDetail project={open} touchProject={touchProject} onBack={() => setOpenProjectId(null)}
      onDelete={() => { setProjects((prev) => prev.filter((p) => p.id !== open.id)); setOpenProjectId(null); }} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...display, fontSize: 22, fontWeight: 600 }}>Projects</p>
        <button
          onClick={() => { const id = createProject(""); setOpenProjectId(id); }}
          style={{ background: C.honeyDim, color: C.honey, border: `1px solid ${C.honey}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> New
        </button>
      </div>
      {projects.length === 0 ? (
        <Empty label="No projects yet" sub="Start one — even a rough working title is enough." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...projects].sort((a, b) => b.updatedAt - a.updatedAt).map((p) => {
            const progress = Math.round((p.checklist.filter((c) => c.done).length / p.checklist.length) * 100);
            return (
              <Card key={p.id} style={{ padding: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }} >
                <div onClick={() => setOpenProjectId(p.id)} style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{p.title || "Untitled idea"}</p>
                  <p style={{ fontSize: 12, color: C.faint, ...mono }}>{STAGES.find((s) => s.key === p.stage)?.label} · {progress}%</p>
                </div>
                <ChevronRight size={16} color={C.faint} onClick={() => setOpenProjectId(p.id)} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, touchProject, onBack, onDelete }) {
  const [title, setTitle] = useState(project.title);
  const progress = Math.round((project.checklist.filter((c) => c.done).length / project.checklist.length) * 100);

  useEffect(() => setTitle(project.title), [project.id]);

  function toggle(itemId) {
    const checklist = project.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
    touchProject(project.id, { checklist });
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, padding: 0 }}>
        <ArrowLeft size={15} /> All projects
      </button>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
        <HoneyJar progress={progress} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => touchProject(project.id, { title })}
            placeholder="Untitled idea"
            style={{ ...display, fontSize: 22, fontWeight: 600, background: "transparent", border: "none", color: C.cream, width: "100%", padding: 0, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STAGES.map((s) => (
              <Pill key={s.key} active={project.stage === s.key} onClick={() => touchProject(project.id, { stage: s.key })}>{s.label}</Pill>
            ))}
          </div>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.faint, marginBottom: 12, ...mono }}>Production pipeline</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {project.checklist.map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", cursor: "pointer" }}>
              <span
                onClick={() => toggle(c.id)}
                style={{
                  width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${c.done ? C.honey : C.faint}`,
                  background: c.done ? C.honey : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                {c.done && <Check size={12} color={C.ink} strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 14, color: c.done ? C.faint : C.cream, textDecoration: c.done ? "line-through" : "none" }}>{c.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.faint, marginBottom: 10, ...mono }}>Research & notes</p>
        <textarea
          defaultValue={project.notes}
          onBlur={(e) => touchProject(project.id, { notes: e.target.value })}
          placeholder="Drop research links, insights, angle, hook ideas…"
          rows={5}
          style={{ width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, color: C.cream, fontSize: 14, resize: "vertical" }}
        />
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} color={C.faint} />
          <input
            type="number"
            defaultValue={project.estMinutes}
            onBlur={(e) => touchProject(project.id, { estMinutes: Number(e.target.value) || 0 })}
            style={{ width: 60, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 8px", color: C.cream, fontSize: 13 }}
          />
          <span style={{ fontSize: 13, color: C.faint }}>min estimate</span>
        </div>
        <button onClick={onDelete} style={{ background: "transparent", border: "none", color: C.bloom, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <Trash2 size={14} /> Delete project
        </button>
      </div>
    </div>
  );
}

// ---------- REVIEW ----------
function ReviewView({ reviews, setReviews }) {
  const blank = { videosPosted: "", bestHook: "", bestEdit: "", worked: "", flopped: "", lesson: "" };
  const [form, setForm] = useState(blank);

  function submit() {
    if (!form.lesson.trim() && !form.worked.trim()) return;
    setReviews((prev) => [{ id: uid(), date: Date.now(), ...form }, ...prev]);
    setForm(blank);
  }

  const field = (key, label, placeholder) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: C.faint, marginBottom: 5, ...mono }}>{label}</p>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", color: C.cream, fontSize: 14 }}
      />
    </div>
  );

  return (
    <div>
      <p style={{ ...display, fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Sunday review</p>
      <p style={{ fontSize: 13, color: C.faint, marginBottom: 18 }}>What worked, what flopped, what you're keeping.</p>

      <Card style={{ marginBottom: 24 }}>
        {field("videosPosted", "Videos posted this week", "e.g. 4")}
        {field("bestHook", "Best hook", "which hook pulled hardest")}
        {field("bestEdit", "Best edit choice", "what made it feel good")}
        {field("worked", "What worked", "")}
        {field("flopped", "What flopped", "")}
        {field("lesson", "Biggest lesson", "")}
        <button onClick={submit} style={{ background: C.honey, color: C.ink, border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
          Save review
        </button>
      </Card>

      <p style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.faint, marginBottom: 10, ...mono }}>Past reviews</p>
      {reviews.length === 0 ? (
        <Empty label="No reviews logged yet" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <Card key={r.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.honey, ...mono }}>{new Date(r.date).toLocaleDateString()}</span>
                <IconBtn icon={Trash2} onClick={() => setReviews((prev) => prev.filter((x) => x.id !== r.id))} title="Delete" />
              </div>
              {r.videosPosted && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Posted:</b> {r.videosPosted}</p>}
              {r.bestHook && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Best hook:</b> {r.bestHook}</p>}
              {r.bestEdit && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Best edit:</b> {r.bestEdit}</p>}
              {r.worked && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Worked:</b> {r.worked}</p>}
              {r.flopped && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Flopped:</b> {r.flopped}</p>}
              {r.lesson && <p style={{ fontSize: 13 }}><b>Lesson:</b> {r.lesson}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
