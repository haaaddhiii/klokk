// Sticky note + ambient background + theme switcher + weather pill
const { useState: useStateExtras, useEffect: useEffectExtras } = React;

function StickyNote({ value, onChange }) {
  const [collapsed, setCollapsed] = useStateExtras(true);
  if (collapsed) {
    return (
      <div className="sticky collapsed" onClick={() => setCollapsed(false)} title="open notes">
        ✎
      </div>
    );
  }
  return (
    <div className="sticky">
      <div className="sticky-head">
        <span>★ STICKY NOTE</span>
        <button onClick={() => setCollapsed(true)} title="collapse">—</button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="jot something cozy…"
      />
    </div>
  );
}

function Ambient() {
  const dots = [];
  const colors = ["", "c1", "c2", "c3"];
  for (let i = 0; i < 18; i++) {
    const left = Math.random() * 100;
    const dur = 22 + Math.random() * 28;
    const delay = -Math.random() * dur;
    const size = 6 + Math.floor(Math.random() * 6);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const top = 100 + Math.random() * 20;
    dots.push(
      <div
        key={i}
        className={"pixel-dot " + color}
        style={{
          left: left + "%",
          top: top + "vh",
          width: size,
          height: size,
          animationDuration: dur + "s",
          animationDelay: delay + "s",
        }}
      />
    );
  }
  return <div className="ambient">{dots}</div>;
}

function ThemeSwitcher({ theme, setTheme }) {
  const themes = window.KLOKK_THEMES;
  return (
    <div className="theme-switch" title="switch palette">
      {Object.keys(themes).map((k) => {
        const t = themes[k];
        return (
          <div
            key={k}
            className={"theme-chip" + (theme === k ? " active" : "")}
            onClick={() => setTheme(k)}
            title={t.name}
            style={{
              background: t.bg,
            }}
          >
            <span style={{ background: t.accent1 }}></span>
            <span style={{ background: t.accent2 }}></span>
            <span style={{ background: t.ink }}></span>
            <span style={{ background: t.accent3 }}></span>
          </div>
        );
      })}
    </div>
  );
}

// Open-Meteo current weather, gated on geolocation. No API key required.
function wmoToIconLabel(code) {
  if (code === 0) return { icon: "☀", label: "CLEAR" };
  if (code === 1 || code === 2) return { icon: "⛅", label: "PARTLY" };
  if (code === 3) return { icon: "☁", label: "CLOUDY" };
  if (code >= 45 && code <= 48) return { icon: "≋", label: "FOG" };
  if (code >= 51 && code <= 67) return { icon: "☂", label: "RAIN" };
  if (code >= 71 && code <= 77) return { icon: "❄", label: "SNOW" };
  if (code >= 80 && code <= 82) return { icon: "☂", label: "SHOWERS" };
  if (code >= 85 && code <= 86) return { icon: "❄", label: "SNOW" };
  if (code >= 95) return { icon: "⚡", label: "STORM" };
  return { icon: "—", label: "—" };
}

function useWeather() {
  const [w, setW] = useStateExtras({ icon: "◌", label: "LOADING", t: null });
  useEffectExtras(() => {
    let cancelled = false;
    (async () => {
      try {
        // Approx location from IP — no permission prompt. ipapi.co returns lat/lon.
        const geo = await fetch("https://ipapi.co/json/").then((r) => r.json());
        if (cancelled) return;
        const lat = geo.latitude;
        const lon = geo.longitude;
        if (lat == null || lon == null) throw new Error("no coords");
        const url =
          "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
          "&longitude=" + lon +
          "&current=temperature_2m,weather_code";
        const d = await fetch(url).then((r) => r.json());
        if (cancelled) return;
        const t = Math.round(d.current.temperature_2m);
        const map = wmoToIconLabel(d.current.weather_code);
        setW({ icon: map.icon, label: map.label, t });
      } catch (e) {
        if (!cancelled) setW({ icon: "—", label: "OFFLINE", t: null });
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return w;
}

Object.assign(window, { StickyNote, Ambient, ThemeSwitcher, useWeather });
