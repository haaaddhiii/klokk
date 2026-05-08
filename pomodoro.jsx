// Pomodoro tab + tasks
const { useState: useStatePomo, useEffect: useEffectPomo, useRef: useRefPomo } = React;

// Simple beep generator using WebAudio
function playBeep(type = "chime") {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = window.__brutime_audioCtx || new Ctx();
    window.__brutime_audioCtx = ctx;
    if (type === "tick") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 1200;
      o.type = "square";
      g.gain.value = 0.04;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      o.stop(ctx.currentTime + 0.05);
    } else {
      // chime: two-tone
      [880, 1320].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        g.gain.value = 0.0001;
        o.connect(g); g.connect(ctx.destination);
        const t0 = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.start(t0);
        o.stop(t0 + 0.55);
      });
    }
  } catch (e) {}
}

function PomoTab({ tweaks, state, setState, onSessionComplete }) {
  const { mode, running, secondsLeft, completedToday, currentSessionInRound } = state;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const totalForMode = (m) => {
    if (m === "work") return tweaks.workMin * 60;
    if (m === "short") return tweaks.shortMin * 60;
    return tweaks.longMin * 60;
  };

  const setMode = (m) => {
    setState((s) => ({ ...s, mode: m, running: false, secondsLeft: totalForMode(m) }));
  };

  const toggle = () => {
    setState((s) => ({ ...s, running: !s.running }));
  };
  const reset = () => {
    setState((s) => ({ ...s, running: false, secondsLeft: totalForMode(s.mode) }));
  };
  const skip = () => {
    onSessionComplete(true);
  };

  // Tasks
  const [taskInput, setTaskInput] = useStatePomo("");
  const tasks = state.tasks || [];

  const addTask = () => {
    const t = taskInput.trim();
    if (!t) return;
    setState((s) => ({
      ...s,
      tasks: [...s.tasks, { id: Date.now(), text: t, done: false, pomos: 0 }],
    }));
    setTaskInput("");
  };
  const toggleTask = (id) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };
  const delTask = (id) => {
    setState((s) => {
      const newTasks = s.tasks.filter((t) => t.id !== id);
      const activeId = s.activeTaskId === id ? null : s.activeTaskId;
      return { ...s, tasks: newTasks, activeTaskId: activeId };
    });
  };
  const setActive = (id) => {
    setState((s) => ({ ...s, activeTaskId: s.activeTaskId === id ? null : id }));
  };

  const activeTask = tasks.find((t) => t.id === state.activeTaskId);

  // Session dots
  const N = tweaks.longEvery;
  const dots = [];
  for (let i = 0; i < N; i++) {
    let cls = "session-dot";
    if (i < currentSessionInRound) cls += " done";
    else if (i === currentSessionInRound && mode === "work") cls += " current";
    dots.push(<div key={i} className={cls}></div>);
  }

  const dailyGoal = tweaks.dailyGoal;
  const pct = Math.min(100, (completedToday / dailyGoal) * 100);

  const modeOverline = {
    work: "FOCUS SESSION",
    short: "SHORT BREAK",
    long: "LONG BREAK",
  }[mode];

  return (
    <div className="pomo">
      <div className="pomo-main">
        <div className="pomo-mode-row">
          <button className={"pomo-mode work" + (mode === "work" ? " active" : "")} onClick={() => setMode("work")}>WORK · {tweaks.workMin}M</button>
          <button className={"pomo-mode short" + (mode === "short" ? " active" : "")} onClick={() => setMode("short")}>SHORT · {tweaks.shortMin}M</button>
          <button className={"pomo-mode long" + (mode === "long" ? " active" : "")} onClick={() => setMode("long")}>LONG · {tweaks.longMin}M</button>
        </div>

        <div className="pomo-overline">{modeOverline}</div>

        <div className="pomo-display">
          <FlipPair value={String(minutes).padStart(2, "0")} label="MINUTES" size="sm" />
          <FlipColon />
          <FlipPair value={String(seconds).padStart(2, "0")} label="SECONDS" size="sm" />
        </div>

        {mode === "work" && (
          <div className={"pomo-current-task" + (!activeTask ? " empty" : "")}>
            {activeTask ? "▸ " + activeTask.text : "no task selected — pick one ➜"}
          </div>
        )}

        <div className="pomo-controls">
          <button className={"btn " + (running ? "primary" : "go")} onClick={toggle}>
            {running ? "PAUSE" : "START"}
          </button>
          <button className="btn ghost" onClick={reset}>RESET</button>
          <button className="btn ghost" onClick={skip}>SKIP ▸</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <span className="session-label">SESSION {currentSessionInRound + 1} / {N}</span>
          {dots}
        </div>
      </div>

      <div className="pomo-side">
        <div className="panel">
          <h3 className="panel-title red">TASKS</h3>
          <ul className="task-list">
            {tasks.length === 0 && (
              <li style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)", fontStyle: "italic", padding: "10px 4px" }}>
                no tasks yet — what's on the docket?
              </li>
            )}
            {tasks.map((t) => (
              <li
                key={t.id}
                className={"task" + (t.done ? " done" : "")}
                style={state.activeTaskId === t.id ? { boxShadow: "inset 0 0 0 2px var(--accent2)" } : {}}
              >
                <div className="check" onClick={() => toggleTask(t.id)}>{t.done ? "✓" : ""}</div>
                <div className="text" onClick={() => setActive(t.id)} style={{ cursor: "pointer" }}>{t.text}</div>
                {t.pomos > 0 && <span className="pomos">{"●".repeat(Math.min(t.pomos, 6))}</span>}
                <button className="del" onClick={() => delTask(t.id)} title="delete">✕</button>
              </li>
            ))}
          </ul>
          <div className="add-task">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="add a task…"
              maxLength={80}
            />
            <button className="btn sm go" onClick={addTask}>+ ADD</button>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">DAILY GOAL</h3>
          <div className="progress-row">
            <span><span className="num">{completedToday}</span> / {dailyGoal} POMOS</span>
            <span style={{ color: "var(--muted)" }}>{Math.round(pct)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + "%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PomoTab, playBeep });
