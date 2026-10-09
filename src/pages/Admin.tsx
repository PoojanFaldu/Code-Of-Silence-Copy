import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminAddTime,
  adminDeletePlayer,
  EVENT_DB_EVENT,
  formatTimeUsed,
  loadEventDb,
  MISSION_DURATION_SECONDS,
  refreshEventDbFromServer,
  remainingFromStart,
  verifyAdminPassword,
  type PlayerRecord,
} from "@/lib/eventDb";

const ADD_PRESETS = [60, 120, 300, 600] as const;

function fmtClock(total: number) {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function liveRemaining(p: PlayerRecord): string {
  if (p.status === "finished" && !p.timedOut) return "done";
  if (p.gameStartTime == null) return "—";
  const rem = remainingFromStart(p.gameStartTime, p.timeBonusSeconds ?? 0) ?? 0;
  if (rem <= 0 || p.timedOut) return "0:00";
  return fmtClock(rem);
}

function guessHistory(p: PlayerRecord) {
  const list = p.murderGuesses ?? [];
  if (list.length === 0) {
    if (p.murderGuessName) {
      return `${p.murderGuessName} (${p.murderGuess === "correct" ? "✓" : "✗"})`;
    }
    return "—";
  }
  return list
    .map((g, i) => `${i + 1}. ${g.name} ${g.correct ? "✓" : "✗"}`)
    .join(" → ");
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const db = await refreshEventDbFromServer();
    setPlayers(db.players);
  }, []);

  useEffect(() => {
    if (!authed) return;
    void refresh();
    const onEvt = () => setPlayers(loadEventDb().players);
    window.addEventListener(EVENT_DB_EVENT, onEvt);
    const id = window.setInterval(() => void refresh(), 3000);
    return () => {
      window.removeEventListener(EVENT_DB_EVENT, onEvt);
      window.clearInterval(id);
    };
  }, [authed, refresh]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      setAuthError("Incorrect password.");
      return;
    }
    sessionStorage.setItem("cos_admin_ok", "1");
    sessionStorage.setItem("cos_admin_pw", password);
    setAuthed(true);
  };

  useEffect(() => {
    if (sessionStorage.getItem("cos_admin_ok") === "1") {
      const pw = sessionStorage.getItem("cos_admin_pw") || "";
      if (pw) {
        setPassword(pw);
        setAuthed(true);
      }
    }
  }, []);

  const pw = () => sessionStorage.getItem("cos_admin_pw") || password;

  const onAddTime = async (playerId: string, seconds: number) => {
    setBusyId(playerId);
    setMsg("");
    const res = await adminAddTime(pw(), playerId, seconds);
    setBusyId(null);
    if (!res.ok) {
      setMsg(res.error || "Add time failed");
      return;
    }
    setMsg(`Added ${fmtClock(seconds)} to player.`);
    await refresh();
  };

  const onDelete = async (player: PlayerRecord) => {
    if (!window.confirm(`Delete player “${player.name}” permanently?`)) return;
    setBusyId(player.id);
    setMsg("");
    const res = await adminDeletePlayer(pw(), player.id);
    setBusyId(null);
    if (!res.ok) {
      setMsg(res.error || "Delete failed");
      return;
    }
    setMsg(`Deleted ${player.name}.`);
    await refresh();
  };

  const sorted = [...players].sort((a, b) => {
    const order = (p: PlayerRecord) =>
      p.status === "playing" ? 0 : p.status === "waiting" ? 1 : 2;
    const d = order(a) - order(b);
    if (d !== 0) return d;
    return (b.lastSeenAt || "").localeCompare(a.lastSeenAt || "");
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm space-y-4 border border-white/10 rounded-xl p-6 bg-zinc-950"
        >
          <h1 className="text-xl font-black tracking-[0.2em]">ADMIN</h1>
          <p className="text-xs text-slate-500 font-mono">Code of Silence · live control</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm font-mono"
            autoFocus
          />
          {authError && <p className="text-rose-400 text-xs">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-white text-black font-bold text-sm tracking-widest rounded"
          >
            ENTER
          </button>
          <Link to="/" className="block text-center text-xs text-slate-500 hover:text-white">
            ← Back
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em]">ADMIN</h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Mission {fmtClock(MISSION_DURATION_SECONDS)} · live room / puzzle · add time · delete
            </p>
          </div>
          <div className="flex gap-3 text-xs font-mono items-center">
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Refresh
            </button>
            <Link to="/leaderboard" className="text-slate-400 hover:text-white">
              Leaderboard
            </Link>
            <Link to="/" className="text-slate-400 hover:text-white">
              Play
            </Link>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("cos_admin_ok");
                sessionStorage.removeItem("cos_admin_pw");
                setAuthed(false);
              }}
              className="text-rose-400/80 hover:text-rose-300"
            >
              Lock
            </button>
          </div>
        </div>

        {msg && <p className="text-xs font-mono text-emerald-400">{msg}</p>}

        <div className="rounded-xl border border-white/10 overflow-x-auto bg-zinc-950/80">
          <table className="w-full text-left text-sm min-w-[960px]">
            <thead className="bg-black/70 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">Player</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Room / Puzzle</th>
                <th className="px-3 py-3">Puzzles</th>
                <th className="px-3 py-3">Clock</th>
                <th className="px-3 py-3">Bonus</th>
                <th className="px-3 py-3">Guess history</th>
                <th className="px-3 py-3">Add time</th>
                <th className="px-3 py-3">Delete</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    No players yet.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => (
                  <tr key={p.id} className="border-t border-white/10 align-top">
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">{p.name}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      <span
                        className={
                          p.status === "playing"
                            ? "text-emerald-400"
                            : p.status === "finished"
                              ? "text-slate-400"
                              : "text-amber-400"
                        }
                      >
                        {p.status}
                        {p.timedOut ? " · timeout" : ""}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-cyan-200/90">
                      {p.currentRoom || "—"}
                      <span className="text-slate-600"> / </span>
                      {p.currentPuzzle || "—"}
                    </td>
                    <td className="px-3 py-3 font-mono">{p.puzzlesPassed}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      <div>{liveRemaining(p)}</div>
                      <div className="text-slate-600">
                        used {formatTimeUsed(p.timeUsedSeconds)}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-amber-300/90">
                      +{fmtClock(p.timeBonusSeconds ?? 0)}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-300 max-w-[220px] leading-relaxed">
                      {guessHistory(p)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ADD_PRESETS.map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void onAddTime(p.id, sec)}
                            className="px-2 py-1 text-[10px] font-mono rounded border border-white/15 hover:border-cyan-400/50 hover:text-cyan-300 disabled:opacity-40"
                          >
                            +{fmtClock(sec)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void onDelete(p)}
                        className="px-2.5 py-1.5 text-[10px] font-mono tracking-wide rounded border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
