import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { api, forgetGuest } from "./api/client";
import { DemoPage } from "./pages/DemoPage";
import { GamesPage } from "./pages/GamesPage";
import { ImportPage } from "./pages/ImportPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { PlayPage } from "./pages/PlayPage";
import { PracticePage } from "./pages/PracticePage";
import { ProgressPage } from "./pages/ProgressPage";
import { ReviewPage } from "./pages/ReviewPage";

function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online ? null : <p className="banner error" role="status">You are offline. Your game is safe; saving will retry when you reconnect.</p>;
}

function Home() {
  return (
    <section className="home">
      <h1>ChessLab</h1>
      <p>Turn your games into evidence-backed tactical lessons, then practise the idea in new positions.</p>
      <div className="cta">
        <Link className="primary" to="/play">Play now</Link>
        <Link to="/import">Analyse my games</Link>
        <Link to="/demo">Explore a sample</Link>
      </div>
    </section>
  );
}

async function deleteMyData() {
  if (!window.confirm("Delete all your games, findings and practice history? This cannot be undone.")) return;
  await api("/v1/me/data", { method: "DELETE" });
  forgetGuest();
  window.location.assign("/");
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <header className="nav">
        <Link to="/" className="brand">ChessLab</Link>
        <nav aria-label="Main">
          {[["/play", "Play"], ["/import", "Import"], ["/games", "My games"], ["/practice", "Practice"],
            ["/progress", "Progress"], ["/demo", "Demo"], ["/methodology", "Methodology"]].map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <OfflineBanner />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/review/:gameId" element={<ReviewPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/:sessionId" element={<PracticePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="*" element={<p>Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
      <footer>
        <button className="link" onClick={deleteMyData}>Delete my data</button>
        <span> · Your data is tied to this browser. Clearing site data loses access to it.</span>
      </footer>
    </BrowserRouter>
  );
}
