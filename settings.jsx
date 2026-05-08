// In-app Settings modal — always accessible, mobile-friendly
const { useState: useStateSettings, useEffect: useEffectSettings } = React;

function SettingsButton({ onOpen }) {
  return (
    <button className="settings-fab" onClick={onOpen} title="Settings" aria-label="Open settings">
      <span className="settings-fab-icon">⚙</span>
      <span className="settings-fab-label">SETTINGS</span>
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="sf-field">
      <div className="sf-field-head">
        <span className="sf-label">{label}</span>
        {hint && <span className="sf-hint">{hint}</span>}
      </div>
      <div className="sf-control">{children}</div>
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div className="sf-seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={"sf-seg-btn" + (value === o.value ? " active" : "")}
          onClick={() => onChange(o.value)}
          type="button"
        >{o.label}</button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={"sf-toggle" + (value ? " on" : "")}
      onClick={() => onChange(!value)}
      type="button"
      role="switch"
      aria-checked={value}
    >
      <span className="sf-toggle-knob"></span>
      <span className="sf-toggle-label">{value ? "ON" : "OFF"}</span>
    </button>
  );
}

function Stepper({ value, onChange, min, max, step = 1, suffix }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="sf-stepper">
      <button onClick={dec} type="button" disabled={value <= min}>−</button>
      <span className="sf-stepper-val">{value}{suffix ? <span className="sf-stepper-suffix">{suffix}</span> : null}</span>
      <button onClick={inc} type="button" disabled={value >= max}>+</button>
    </div>
  );
}

function SettingsModal({ open, onClose, tweaks, setTweak, theme, setTheme, onReset }) {
  // Lock body scroll when open
  useEffectSettings(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close on Esc
  useEffectSettings(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const themes = window.BRUTIME_THEMES || {};

  return (
    <div className="sf-backdrop" onClick={onClose}>
      <div className="sf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="sf-header">
          <div className="sf-title-wrap">
            <span className="sf-icon">⚙</span>
            <h2 className="sf-title">SETTINGS</h2>
          </div>
          <button className="sf-close" onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        <div className="sf-body">
          {/* Theme */}
          <section className="sf-section">
            <h3 className="sf-section-title">★ THEME</h3>
            <div className="sf-theme-grid">
              {Object.keys(themes).map((k) => {
                const t = themes[k];
                return (
                  <button
                    key={k}
                    className={"sf-theme" + (theme === k ? " active" : "")}
                    onClick={() => setTheme(k)}
                    type="button"
                  >
                    <div className="sf-theme-swatch" style={{ background: t.bg }}>
                      <span style={{ background: t.accent1 }}></span>
                      <span style={{ background: t.accent2 }}></span>
                      <span style={{ background: t.ink }}></span>
                      <span style={{ background: t.accent3 }}></span>
                    </div>
                    <div className="sf-theme-name">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Display */}
          <section className="sf-section">
            <h3 className="sf-section-title">▣ DISPLAY</h3>
            <Field label="Font style" hint="Pixel feels chunky; Mono feels modern.">
              <Seg
                value={tweaks.fontStyle}
                onChange={(v) => setTweak("fontStyle", v)}
                options={[
                  { value: "pixel", label: "PIXEL" },
                  { value: "softpixel", label: "VT323" },
                  { value: "mono", label: "MONO" },
                ]}
              />
            </Field>
            <Field label="Clock format">
              <Seg
                value={tweaks.format24 ? "24" : "12"}
                onChange={(v) => setTweak("format24", v === "24")}
                options={[
                  { value: "12", label: "12-HOUR" },
                  { value: "24", label: "24-HOUR" },
                ]}
              />
            </Field>
            <Field label="Show seconds">
              <Toggle value={tweaks.showSeconds} onChange={(v) => setTweak("showSeconds", v)} />
            </Field>
            <Field label="Background pattern">
              <Seg
                value={tweaks.pattern}
                onChange={(v) => setTweak("pattern", v)}
                options={[
                  { value: "dotted", label: "DOTS" },
                  { value: "lined", label: "LINES" },
                  { value: "grid", label: "GRID" },
                  { value: "plain", label: "PLAIN" },
                ]}
              />
            </Field>
            <Field label="Ambient pixels" hint="Floating bits in the background.">
              <Toggle value={tweaks.ambient} onChange={(v) => setTweak("ambient", v)} />
            </Field>
          </section>

          {/* Pomodoro */}
          <section className="sf-section">
            <h3 className="sf-section-title">◐ POMODORO</h3>
            <Field label="Work duration">
              <Stepper value={tweaks.workMin} min={5} max={60} step={1} suffix="m" onChange={(v) => setTweak("workMin", v)} />
            </Field>
            <Field label="Short break">
              <Stepper value={tweaks.shortMin} min={1} max={20} step={1} suffix="m" onChange={(v) => setTweak("shortMin", v)} />
            </Field>
            <Field label="Long break">
              <Stepper value={tweaks.longMin} min={5} max={45} step={1} suffix="m" onChange={(v) => setTweak("longMin", v)} />
            </Field>
            <Field label="Long break every">
              <Stepper value={tweaks.longEvery} min={2} max={8} step={1} suffix=" sessions" onChange={(v) => setTweak("longEvery", v)} />
            </Field>
            <Field label="Daily goal">
              <Stepper value={tweaks.dailyGoal} min={1} max={20} step={1} suffix=" pomos" onChange={(v) => setTweak("dailyGoal", v)} />
            </Field>
          </section>

          {/* Sound */}
          <section className="sf-section">
            <h3 className="sf-section-title">♪ SOUND</h3>
            <Field label="Chime on session end">
              <Toggle value={tweaks.soundChime} onChange={(v) => setTweak("soundChime", v)} />
            </Field>
            <Field label="Tick every 2s" hint="A retro tick while focusing.">
              <Toggle value={tweaks.soundTick} onChange={(v) => setTweak("soundTick", v)} />
            </Field>
          </section>

          {onReset && (
            <section className="sf-section sf-danger">
              <button className="sf-reset" type="button" onClick={onReset}>
                ↻ RESET ALL DATA
              </button>
              <p className="sf-reset-note">Clears tasks, stats, streak, and notes. Cannot be undone.</p>
            </section>
          )}
        </div>

        <div className="sf-footer">
          <button className="btn go" onClick={onClose} type="button">DONE</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsButton, SettingsModal });
