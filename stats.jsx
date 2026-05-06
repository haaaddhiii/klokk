// Stats tab
const { useMemo: useMemoStats } = React;

function StatsTab({ stats }) {
  // Build heatmap (last 14 weeks = 98 days, but we'll show 14 cols x 7 rows = 98)
  const today = new Date();
  const cells = useMemoStats(() => {
    const arr = [];
    for (let i = 97; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = stats.history[key] || 0;
      arr.push({ key, v, isToday: i === 0 });
    }
    return arr;
  }, [stats.history]);

  const level = (v) => {
    if (v === 0) return 0;
    if (v <= 2) return 1;
    if (v <= 4) return 2;
    if (v <= 6) return 3;
    return 4;
  };

  // Last 7 days bar chart
  const last7 = useMemoStats(() => {
    const out = [];
    const labels = ["S","M","T","W","T","F","S"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        v: stats.history[key] || 0,
        lab: labels[d.getDay()],
        isToday: i === 0,
      });
    }
    return out;
  }, [stats.history]);

  const max7 = Math.max(1, ...last7.map((x) => x.v));

  const totalPomos = Object.values(stats.history).reduce((a, b) => a + b, 0);
  const totalMin = totalPomos * 25;
  const totalHours = (totalMin / 60).toFixed(1);
  const days = Object.keys(stats.history).filter((k) => stats.history[k] > 0).length;
  const best = Math.max(0, ...Object.values(stats.history));

  return (
    <div className="stats">
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-num">{stats.streak}</div>
          <div className="stat-lab">DAY STREAK</div>
        </div>
        <div className="stat-card green">
          <div className="stat-num">{totalPomos}</div>
          <div className="stat-lab">TOTAL POMOS</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-num">{totalHours}</div>
          <div className="stat-lab">FOCUS HOURS</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{best}</div>
          <div className="stat-lab">BEST DAY</div>
        </div>
      </div>

      <div className="heatmap">
        <h3 className="panel-title">LAST 14 WEEKS</h3>
        <div className="heat-grid">
          {cells.map((c, i) => (
            <div
              key={i}
              className={"heat-cell l" + level(c.v) + (c.isToday ? " today" : "")}
              title={`${c.key}: ${c.v} pomos`}
            ></div>
          ))}
        </div>
        <div className="heat-legend">
          <span>LESS</span>
          <span className="heat-cell l0"></span>
          <span className="heat-cell l1"></span>
          <span className="heat-cell l2"></span>
          <span className="heat-cell l3"></span>
          <span className="heat-cell l4"></span>
          <span>MORE</span>
        </div>
      </div>

      <div className="heatmap">
        <h3 className="panel-title blue">THIS WEEK</h3>
        <div className="bar-chart">
          {last7.map((b, i) => (
            <div
              key={i}
              className="bar"
              style={{
                height: (b.v / max7) * 100 + "%",
                background: b.isToday ? "var(--accent2)" : "var(--accent3)",
              }}
            >
              <span className="bar-val">{b.v}</span>
              <span className="bar-cap">{b.lab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatsTab });
