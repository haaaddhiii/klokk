// KLOKK — main app
const { useState: useS, useEffect: useE, useRef: useR, useCallback: useC } = React;

const STORAGE_KEY = "klokk_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seedHistory() {
  return {};
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "fontStyle": "pixel",
  "format24": false,
  "showSeconds": true,
  "workMin": 25,
  "shortMin": 5,
  "longMin": 15,
  "longEvery": 4,
  "dailyGoal": 8,
  "pattern": "dotted",
  "soundChime": true,
  "soundTick": false,
  "ambient": true
}/*EDITMODE-END*/;

function App() {
  const persisted = loadState() || {};
  const [theme, setTheme] = useS(persisted.theme || "parchment");
  const [tab, setTab] = useS(persisted.tab || "clock");

  const tweakState = (window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}]);
  const [tweaks, setTweak] = tweakState;

  // Pomodoro state — recover running timer across refresh via endsAt
  const [pomoState, setPomoState] = useS(() => {
    const m = persisted.mode || "work";
    const totalForMode = (md) =>
      md === "work" ? TWEAK_DEFAULTS.workMin * 60 :
      md === "short" ? TWEAK_DEFAULTS.shortMin * 60 :
      TWEAK_DEFAULTS.longMin * 60;
    let running = false, endsAt = null, secondsLeft = totalForMode(m);
    if (persisted.running && persisted.endsAt) {
      const remaining = Math.ceil((persisted.endsAt - Date.now()) / 1000);
      if (remaining > 0) {
        running = true;
        endsAt = persisted.endsAt;
        secondsLeft = remaining;
      } else {
        // Session finished while the tab was closed — fire completion on mount
        window.__klokk_completeOnMount = true;
        secondsLeft = 0;
      }
    } else if (typeof persisted.secondsLeft === "number") {
      secondsLeft = persisted.secondsLeft;
    }
    return {
      mode: m,
      running,
      endsAt,
      secondsLeft,
      completedToday: persisted.completedToday || 0,
      completedDate: persisted.completedDate || todayKey(),
      currentSessionInRound: persisted.currentSessionInRound || 0,
      tasks: persisted.tasks || [],
      activeTaskId: persisted.activeTaskId || null,
    };
  });

  // Stats: history map of date -> pomos
  const [stats, setStats] = useS(() => ({
    streak: persisted.streak || 0,
    history: persisted.history || seedHistory(),
  }));

  const [stickyNote, setStickyNote] = useS(persisted.stickyNote || "tea • stretch break\n• don't forget to drink water ✿");
  const [tempUnit, setTempUnit] = useS(persisted.tempUnit === "F" ? "F" : "C");

  const [settingsOpen, setSettingsOpen] = useS(false);

  const weather = window.useWeather ? window.useWeather() : { icon: "☀", label: "SUNNY", t: 72 };

  // Apply theme
  useE(() => {
    const t = window.KLOKK_THEMES[theme];
    if (!t) return;
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--bg-deep", t.bgDeep);
    r.setProperty("--ink", t.ink);
    r.setProperty("--paper", t.paper);
    r.setProperty("--accent1", t.accent1);
    r.setProperty("--accent2", t.accent2);
    r.setProperty("--accent3", t.accent3);
    r.setProperty("--muted", t.muted);
  }, [theme]);

  // Apply font style
  useE(() => {
    const r = document.documentElement.style;
    if (tweaks.fontStyle === "mono") {
      r.setProperty("--font-pixel", '"JetBrains Mono", "IBM Plex Mono", monospace');
      r.setProperty("--font-display", '"JetBrains Mono", monospace');
    } else if (tweaks.fontStyle === "softpixel") {
      r.setProperty("--font-pixel", '"VT323", monospace');
      r.setProperty("--font-display", '"VT323", monospace');
    } else {
      r.setProperty("--font-pixel", '"Press Start 2P", "VT323", monospace');
      r.setProperty("--font-display", '"VT323", "Press Start 2P", monospace');
    }
  }, [tweaks.fontStyle]);

  // Apply pattern
  useE(() => {
    document.body.classList.remove("pattern-dotted","pattern-lined","pattern-grid","pattern-plain");
    document.body.classList.add("pattern-" + (tweaks.pattern || "dotted"));
  }, [tweaks.pattern]);

  // Expose tweaks for ClockTab
  window.__klokk_tweaks = tweaks;

  // tempUnit is in dep array via inclusion below
  // Persist state
  useE(() => {
    saveState({
      theme, tab,
      mode: pomoState.mode,
      running: pomoState.running,
      endsAt: pomoState.endsAt,
      secondsLeft: pomoState.secondsLeft,
      completedToday: pomoState.completedToday,
      completedDate: pomoState.completedDate,
      currentSessionInRound: pomoState.currentSessionInRound,
      tasks: pomoState.tasks,
      activeTaskId: pomoState.activeTaskId,
      streak: stats.streak,
      history: stats.history,
      stickyNote,
      tempUnit,
    });
  }, [theme, tab, pomoState, stats, stickyNote, tempUnit]);

  // Reset daily counter at midnight
  useE(() => {
    if (pomoState.completedDate !== todayKey()) {
      setPomoState((s) => ({ ...s, completedToday: 0, completedDate: todayKey(), currentSessionInRound: 0 }));
    }
  }, []);

  // When durations change while not running, sync secondsLeft
  useE(() => {
    setPomoState((s) => {
      if (s.running) return s;
      const total =
        s.mode === "work" ? tweaks.workMin * 60 :
        s.mode === "short" ? tweaks.shortMin * 60 :
        tweaks.longMin * 60;
      return { ...s, secondsLeft: total };
    });
  }, [tweaks.workMin, tweaks.shortMin, tweaks.longMin]);

  // Anchor endsAt on the running edge so reloads can recover remaining time
  useE(() => {
    setPomoState((s) => {
      if (s.running && !s.endsAt) {
        return { ...s, endsAt: Date.now() + s.secondsLeft * 1000 };
      }
      if (!s.running && s.endsAt) {
        return { ...s, endsAt: null };
      }
      return s;
    });
  }, [pomoState.running]);

  // Timer tick — derives secondsLeft from endsAt so a mid-second refresh keeps accurate
  const tickRef = useR(null);
  useE(() => {
    if (!pomoState.running) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setPomoState((s) => {
        if (!s.endsAt) return s;
        const remaining = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
        if (remaining <= 0) {
          window.__klokk_completeNext = true;
          return { ...s, secondsLeft: 0, running: false, endsAt: null };
        }
        if (tweaks.soundTick && remaining !== s.secondsLeft && remaining % 2 === 0) {
          window.playBeep && window.playBeep("tick");
        }
        return remaining === s.secondsLeft ? s : { ...s, secondsLeft: remaining };
      });
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [pomoState.running, tweaks.soundTick]);

  // If the timer finished while the tab was closed, fire completion on mount
  useE(() => {
    if (window.__klokk_completeOnMount) {
      window.__klokk_completeOnMount = false;
      handleSessionComplete(false);
    }
  }, []);

  // Request notification permission once on the first start
  useE(() => {
    if (
      pomoState.running &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, [pomoState.running]);

  // Handle session completion side-effects
  useE(() => {
    if (window.__klokk_completeNext) {
      window.__klokk_completeNext = false;
      handleSessionComplete(false);
    }
  }, [pomoState.secondsLeft]);

  function handleSessionComplete(skipped) {
    if (!skipped && tweaks.soundChime) window.playBeep && window.playBeep("chime");
    if (
      !skipped &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      const justFinished = pomoState.mode === "work" ? "Focus session" : pomoState.mode === "short" ? "Short break" : "Long break";
      try {
        new Notification("klokk", {
          body: `${justFinished} complete — ready for the next round.`,
          icon: "favicon.svg",
          tag: "klokk-session",
        });
      } catch (e) {}
    }

    setPomoState((s) => {
      let nextMode = s.mode;
      let nextRound = s.currentSessionInRound;
      let completedToday = s.completedToday;
      let activeTaskId = s.activeTaskId;
      let tasks = s.tasks;

      if (s.mode === "work") {
        if (!skipped) {
          completedToday += 1;
          // award task
          if (activeTaskId) {
            tasks = tasks.map((t) => t.id === activeTaskId ? { ...t, pomos: t.pomos + 1 } : t);
          }
        }
        nextRound = (s.currentSessionInRound + 1);
        if (nextRound >= tweaks.longEvery) {
          nextMode = "long";
          nextRound = 0;
        } else {
          nextMode = "short";
        }
      } else {
        nextMode = "work";
      }
      const total =
        nextMode === "work" ? tweaks.workMin * 60 :
        nextMode === "short" ? tweaks.shortMin * 60 :
        tweaks.longMin * 60;
      return {
        ...s,
        mode: nextMode,
        running: false,
        secondsLeft: total,
        currentSessionInRound: nextRound,
        completedToday,
        tasks,
      };
    });

    // record stat
    if (!skipped) {
      setStats((st) => {
        const k = todayKey();
        return { ...st, history: { ...st.history, [k]: (st.history[k] || 0) + 1 } };
      });
    }
  }

  // Live tab title
  useE(() => {
    if (pomoState.running) {
      const m = Math.floor(pomoState.secondsLeft / 60);
      const sec = pomoState.secondsLeft % 60;
      const mode = pomoState.mode === "work" ? "● focus" : pomoState.mode === "short" ? "☕ short" : "✿ long";
      document.title = `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")} ${mode} — klokk`;
    } else {
      document.title = "klokk · cozy clock + pomodoro";
    }
  }, [pomoState.secondsLeft, pomoState.running, pomoState.mode]);

  // Pretty status
  const modeLabel = pomoState.mode === "work" ? "FOCUS" : pomoState.mode === "short" ? "BREAK" : "LONG BREAK";
  const score = stats.streak;

  return (
    <>
      {tweaks.ambient && <Ambient />}

      <div className="app">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <img src="logo.svg" alt="klokk" />
            </div>
            <div>
              <h1 className="brand-name">KLOKK</h1>
              <div className="brand-sub">cozy clock × pomodoro</div>
            </div>
          </div>
          <div className="status-pills">
            <div className="pill">
              <span className="dot"></span>
              <span className="label">MODE:</span>
              <span className="val">{pomoState.running ? modeLabel : "IDLE"}</span>
            </div>
            <div className="pill">
              <span className="dot red"></span>
              <span className="label">STREAK:</span>
              <span className="val">{score}D</span>
            </div>
            <button
              type="button"
              className="pill clickable"
              onClick={() => setTempUnit((u) => (u === "C" ? "F" : "C"))}
              title={`switch to °${tempUnit === "C" ? "F" : "C"}`}
            >
              <span style={{ fontSize: 14 }}>{weather.icon}</span>
              <span className="label">{weather.label}</span>
              {weather.t != null && (
                <span className="val">
                  {tempUnit === "C" ? weather.t : Math.round(weather.t * 9 / 5 + 32)}°{tempUnit}
                </span>
              )}
            </button>
            <SettingsButton onOpen={() => setSettingsOpen(true)} />
          </div>
        </div>

        <div className="tabs">
          <div className={"tab" + (tab === "clock" ? " active" : "")} onClick={() => setTab("clock")}>
            <span className="tab-icon"></span>CLOCK
          </div>
          <div className={"tab" + (tab === "pomo" ? " active" : "")} onClick={() => setTab("pomo")}>
            <span className="tab-icon"></span>POMODORO
          </div>
          <div className={"tab" + (tab === "stats" ? " active" : "")} onClick={() => setTab("stats")}>
            <span className="tab-icon"></span>STATS
          </div>
        </div>

        <div className="card">
          {tab === "clock" && <ClockTab />}
          {tab === "pomo" && (
            <PomoTab
              tweaks={tweaks}
              state={pomoState}
              setState={setPomoState}
              onSessionComplete={() => handleSessionComplete(true)}
            />
          )}
          {tab === "stats" && <StatsTab stats={stats} />}
        </div>

        <div className="footer">
          <span>klokk v2.0 · made with ♥</span>
        </div>
      </div>

      <StickyNote value={stickyNote} onChange={setStickyNote} />
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tweaks={tweaks}
        setTweak={setTweak}
        theme={theme}
        setTheme={setTheme}
        onReset={() => {
          if (confirm("Reset all klokk data? This clears tasks, stats, streak, and notes.")) {
            try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
            location.reload();
          }
        }}
      />

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Display">
            <window.TweakRadio
              label="Font style"
              value={tweaks.fontStyle}
              onChange={(v) => setTweak("fontStyle", v)}
              options={[
                { value: "pixel", label: "Pixel" },
                { value: "softpixel", label: "VT323" },
                { value: "mono", label: "Mono" },
              ]}
            />
            <window.TweakToggle
              label="24-hour clock"
              value={tweaks.format24}
              onChange={(v) => setTweak("format24", v)}
            />
            <window.TweakToggle
              label="Show seconds"
              value={tweaks.showSeconds}
              onChange={(v) => setTweak("showSeconds", v)}
            />
            <window.TweakSelect
              label="Background"
              value={tweaks.pattern}
              onChange={(v) => setTweak("pattern", v)}
              options={[
                { value: "dotted", label: "Dotted" },
                { value: "lined", label: "Lined" },
                { value: "grid", label: "Grid" },
                { value: "plain", label: "Plain" },
              ]}
            />
            <window.TweakToggle
              label="Ambient pixels"
              value={tweaks.ambient}
              onChange={(v) => setTweak("ambient", v)}
            />
          </window.TweakSection>

          <window.TweakSection title="Pomodoro">
            <window.TweakSlider
              label="Work duration (min)"
              value={tweaks.workMin}
              min={5} max={60} step={1}
              onChange={(v) => setTweak("workMin", v)}
            />
            <window.TweakSlider
              label="Short break (min)"
              value={tweaks.shortMin}
              min={1} max={20} step={1}
              onChange={(v) => setTweak("shortMin", v)}
            />
            <window.TweakSlider
              label="Long break (min)"
              value={tweaks.longMin}
              min={5} max={45} step={1}
              onChange={(v) => setTweak("longMin", v)}
            />
            <window.TweakSlider
              label="Long break every N sessions"
              value={tweaks.longEvery}
              min={2} max={8} step={1}
              onChange={(v) => setTweak("longEvery", v)}
            />
            <window.TweakSlider
              label="Daily goal (pomos)"
              value={tweaks.dailyGoal}
              min={1} max={20} step={1}
              onChange={(v) => setTweak("dailyGoal", v)}
            />
          </window.TweakSection>

          <window.TweakSection title="Sound">
            <window.TweakToggle
              label="Chime on session end"
              value={tweaks.soundChime}
              onChange={(v) => setTweak("soundChime", v)}
            />
            <window.TweakToggle
              label="Tick (every 2s)"
              value={tweaks.soundTick}
              onChange={(v) => setTweak("soundTick", v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
