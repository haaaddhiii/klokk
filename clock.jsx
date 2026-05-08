// FlipDigit + FlipClock components
const { useState, useEffect, useRef } = React;

function FlipDigit({ value, size = "lg" }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const valueRef = useRef(value);

  useEffect(() => {
    if (value !== valueRef.current) {
      setPrev(valueRef.current);
      setFlipping(true);
      valueRef.current = value;
      const t = setTimeout(() => setFlipping(false), 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={"flip" + (size === "sm" ? " sm" : "")}>
      <div className="flip-card">
        <div className="flip-half top"><span>{value}</span></div>
        <div className="flip-divider"></div>
        <div className="flip-half bottom"><span>{value}</span></div>
        {flipping && (
          <div className="flip-anim" key={prev + "-" + value}>
            <span>{prev}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FlipPair({ value, label, size = "lg" }) {
  const v = String(value).padStart(2, "0");
  return (
    <div className="flip-group">
      <div className="flip-pair">
        <FlipDigit value={v[0]} size={size} />
        <FlipDigit value={v[1]} size={size} />
      </div>
      {label && <div className="flip-label">{label}</div>}
    </div>
  );
}

function FlipColon() {
  return <div className="flip-colon">:</div>;
}

function FlipClock({ format24, showSeconds }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  let ampm = h >= 12 ? "PM" : "AM";
  if (!format24) {
    h = h % 12;
    if (h === 0) h = 12;
  }

  const hStr = String(h).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");
  const sStr = String(s).padStart(2, "0");

  return (
    <div className="flip-row">
      <FlipPair value={hStr} label="HOURS" />
      <FlipColon />
      <FlipPair value={mStr} label="MINUTES" />
      {showSeconds && (
        <>
          <FlipColon />
          <FlipPair value={sStr} label="SECONDS" />
        </>
      )}
      {!format24 && (
        <div style={{ marginLeft: 4, alignSelf: "flex-start", marginTop: 12 }}>
          <div className="ampm-badge" style={{
            fontFamily: "var(--font-pixel)",
            fontSize: 13,
            background: "var(--accent3)",
            color: "var(--paper)",
            border: "var(--border)",
            boxShadow: "var(--shadow-sm)",
            padding: "7px 10px",
            letterSpacing: 1.5,
          }}>
            {ampm}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting(now) {
  const h = now.getHours();
  if (h < 5) return "STILL UP, FRIEND?";
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  if (h < 21) return "GOOD EVENING";
  return "WINDING DOWN";
}

function ClockTab() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tweaks = window.__brutime_tweaks || { format24: false, showSeconds: true };

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  return (
    <div className="clock-wrap">
      <FlipClock format24={tweaks.format24} showSeconds={tweaks.showSeconds} />
      <div className="clock-meta">
        <div className="date-strip">
          <div className="date-block accent">{days[now.getDay()]}</div>
          <div className="date-block">{String(now.getDate()).padStart(2, "0")}</div>
          <div className="date-block">{months[now.getMonth()]}</div>
          <div className="date-block accent2">{now.getFullYear()}</div>
        </div>
        <div className="greeting">{getGreeting(now)}</div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--muted)",
          letterSpacing: 1,
          marginTop: 4,
        }}>
          WEEK {Math.ceil((((now - new Date(now.getFullYear(), 0, 1))/86400000) + new Date(now.getFullYear(),0,1).getDay()+1)/7)} · DAY {Math.floor((now - new Date(now.getFullYear(),0,0))/86400000)} OF {now.getFullYear()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FlipDigit, FlipPair, FlipColon, FlipClock, ClockTab, getGreeting });
