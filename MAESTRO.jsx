/**
 * MAESTRO.jsx
 * Componente maestro de React 18 para la visualización del Portafolio HAPI (Bolsa y Crypto).
 * Requiere: React 18, ReactDOM 18 y MAESTRO.js (HapiEngine).
 */

const { useState, useMemo, useEffect, useRef } = React;

// --- ICONOS VECTORIALES INTEGRADOS (SVG) ---
const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.25, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Icons = {
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="logo-bg" />
      <polyline points="7,21 13,15 17,18 25,10" fill="none" className="logo-line" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" {...svgProps}>
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Refresh: ({ spinning }) => (
    <svg className={spinning ? 'spin' : ''} width="14" height="14" {...svgProps}>
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  )
};

// --- LOGOS DE TICKERS (SVG propio, sin imágenes externas) ---
// Monograma sobre un cuadro redondeado teñido con el color de la marca; colores aclarados en modo oscuro vía CSS.
// mark: dibujo simple propio cuando aporta reconocimiento (cuadros de Microsoft, ₿); si no, texto corto.
const TICKER_BRAND = {
  GOOGL: { c: '#4285f4', t: 'G' },
  META: { c: '#0866ff', t: 'M' },
  QQQ: { c: '#1f4e9c', t: 'Q' },
  MSFT: { c: '#737373', mark: 'msft' },
  TQQQ: { c: '#3b3b3b', t: '3×' },
  GLD: { c: '#b8860b', t: 'Au' },
  VOO: { c: '#96151d', t: 'V' },
  VT: { c: '#96151d', t: 'VT' },
  VGT: { c: '#96151d', t: 'VG' },
  SMH: { c: '#0e3b7d', t: 'SM' },
  NFLX: { c: '#e50914', t: 'N' },
  SPOT: { c: '#1db954', t: 'S' },
  NVDA: { c: '#76b900', t: 'NV' },
  AMZN: { c: '#ff9900', t: 'a' },
  SCHD: { c: '#00a0df', t: 'SC' },
  SPY: { c: '#c8102e', t: 'SP' },
  NDAQ: { c: '#0090ba', t: 'ND' },
  BTC: { c: '#f7931a', t: '₿' },
  Efectivo: { c: '#7a7a74', t: '$' }
};

function TickerLogo({ y, size = 28 }) {
  const b = TICKER_BRAND[y] || { c: '#7a7a74', t: (y || '?').slice(0, 2) };
  const fs = b.t && b.t.length > 1 ? size * 0.36 : size * 0.46;
  return (
    <svg className="tlogo" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ '--c': b.c }} aria-hidden="true">
      <rect className="tlogo-bg" x="0.5" y="0.5" width={size - 1} height={size - 1} rx={size * 0.28} />
      {b.mark === 'msft' ? (
        <g transform={`translate(${size * 0.27} ${size * 0.27})`}>
          {[['#f25022', 0, 0], ['#7fba00', 1, 0], ['#00a4ef', 0, 1], ['#ffb900', 1, 1]].map(([fill, cx, cy]) => (
            <rect key={fill} x={cx * size * 0.24} y={cy * size * 0.24} width={size * 0.215} height={size * 0.215} fill={fill} />
          ))}
        </g>
      ) : (
        <text className="tlogo-text" x="50%" y="50%" dy="0.35em" textAnchor="middle" fontSize={fs}>{b.t}</text>
      )}
    </svg>
  );
}

// Celda de activo: logo + ticker (+ nombre opcional)
function TickerCell({ y, name, size }) {
  return (
    <div className="ticker-cell">
      <TickerLogo y={y} size={size} />
      <div className="ticker-text">
        <span className="ticker-symbol">{y}</span>
        {name && <span className="ticker-name">{name}</span>}
      </div>
    </div>
  );
}

// --- UTILIDADES DEL GRÁFICO ---
function niceTicks(min, max, count = 4, includeZero = true) {
  const lo = includeZero ? Math.min(min, 0) : min;
  const hi = includeZero ? Math.max(max, 0) : max;
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { ticks, min: start, max: end };
}

const axisLabel = v => {
  const a = Math.abs(v);
  const s = a >= 1000 ? `${(a / 1000).toFixed(a % 1000 === 0 ? 0 : 1)}k` : `${a}`;
  return `${v < 0 ? '-' : ''}$${s}`;
};

// Ancho real del contenedor para dibujar el SVG sin escalado (texto nítido)
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// --- COMPONENTE: GRÁFICO DE BOLSA (2 paneles: resultado mensual + acumulado) ---
function InteractiveChart({ monthsData, f, lab }) {
  const [tip, setTip] = useState(null);
  const [wrapRef, width] = useWidth();

  useEffect(() => { setTip(null); }, [monthsData]);

  const n = monthsData.length;
  if (!n) return null;

  const W = Math.max(300, width || 900);
  const compact = W < 560;
  const L = compact ? 46 : 58;
  const RP = 14;
  const step = (W - L - RP) / n;
  const bw = Math.min(28, Math.max(6, step * 0.5));
  const TOP = 22;
  const hP = compact ? 240 : 300;
  const DEP = 24; // franja de depósitos bajo el área del gráfico
  const BOT = 26;
  const depY = TOP + hP + DEP / 2;
  const H = TOP + hP + DEP + BOT;

  let cum = 0;
  const cumulative = monthsData.map(r => (cum += r.pl));
  const stacks = monthsData.map(r => {
    let pos = 0;
    let neg = 0;
    return [[r.rl, 'realized'], [r.ur, 'unrealized']].map(([val, kind]) => {
      const y0 = val >= 0 ? pos : neg;
      const y1 = y0 + val;
      if (val >= 0) pos = y1; else neg = y1;
      return { y0, y1, kind };
    });
  });
  const flat = stacks.flat();
  // Barras y acumulado comparten el mismo eje (mismas unidades en USD)
  const values = flat.flatMap(s => [s.y0, s.y1]).concat(cumulative);
  const tk = niceTicks(Math.min(0, ...values), Math.max(0, ...values), compact ? 4 : 5);
  const y = v => TOP + hP * (1 - (v - tk.min) / (tk.max - tk.min));
  const xC = i => L + step * (i + 0.5);
  const maxDep = Math.max(1, ...monthsData.map(r => r.d));
  const labelEvery = Math.max(1, Math.ceil(46 / step));
  const linePts = cumulative.map((v, i) => `${xC(i)},${y(v)}`).join(' ');
  const areaPath = `M${xC(0)},${y(0)} ${cumulative.map((v, i) => `L${xC(i)},${y(v)}`).join(' ')} L${xC(n - 1)},${y(0)} Z`;
  const last = cumulative[n - 1];
  const d = tip != null ? monthsData[tip] : null;

  return (
    <div className="card chart-card reveal">
      <div className="card-head">
        <h3 className="card-title">Rendimiento mensual y acumulado</h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-chip realized"></span>Realizada</span>
          <span className="legend-item"><span className="legend-chip unrealized"></span>No realizada</span>
          <span className="legend-item"><span className="legend-chip cumulative"></span>Acumulado</span>
          <span className="legend-item"><span className="legend-chip deposit"></span>Depósito</span>
        </div>
      </div>

      <div className="svg-chart-wrapper" ref={wrapRef} onMouseLeave={() => setTip(null)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rendimiento mensual y acumulado">
          {tk.ticks.map(v => (
            <g key={v}>
              <line className={v === 0 ? 'chart-zero' : 'chart-grid'} x1={L} x2={W - RP} y1={y(v)} y2={y(v)} />
              <text className="chart-axis" x={L - 8} y={y(v) + 4} textAnchor="end">{axisLabel(v)}</text>
            </g>
          ))}

          {tip != null && <line className="chart-guide" x1={xC(tip)} x2={xC(tip)} y1={TOP} y2={TOP + hP} />}

          {stacks.map((segs, i) => segs.map(s => (
            Math.abs(s.y1 - s.y0) < 1e-9 ? null : (
              <rect
                key={`${i}-${s.kind}`}
                className={`bar-${s.kind}`}
                x={xC(i) - bw / 2}
                y={Math.min(y(s.y0), y(s.y1))}
                width={bw}
                height={Math.max(1, Math.abs(y(s.y0) - y(s.y1)))}
                rx="2"
                opacity={tip == null || tip === i ? 1 : 0.4}
              />
            )
          )))}

          {monthsData.map((r, i) => r.d > 0 && (
            <circle key={`dep${i}`} className="deposit-dot" cx={xC(i)} cy={depY} r={2.5 + 3.5 * Math.sqrt(r.d / maxDep)}>
              <title>{`Depósito de ${f(r.d)}`}</title>
            </circle>
          ))}

          <path className="area-cum" d={areaPath} />
          <polyline className="line-cum" points={linePts} />
          {cumulative.map((v, i) => (
            <circle key={`pt${i}`} className="dot-cum" cx={xC(i)} cy={y(v)} r={tip === i ? 5 : 3.5} />
          ))}
          <text className="chart-value-label" x={xC(n - 1)} y={y(last) + (last >= 0 ? -12 : 20)} textAnchor="end">{f(last)}</text>

          {monthsData.map((r, i) => (n - 1 - i) % labelEvery === 0 && (
            <text key={`lb${i}`} className="chart-xlabel" x={xC(i)} y={H - 8} textAnchor="middle">{lab(r.m)}</text>
          ))}

          {monthsData.map((r, i) => (
            <rect
              key={`hit${i}`}
              x={L + step * i}
              y={TOP}
              width={step}
              height={hP + DEP}
              fill="transparent"
              onMouseMove={() => setTip(i)}
              onClick={() => setTip(i)}
            />
          ))}
        </svg>

        {d && (
          <div className={`chart-tooltip ${tip > n / 2 ? 'left' : ''}`} style={{ left: xC(tip) + (tip > n / 2 ? -14 : 14) }}>
            <div className="tooltip-header">{lab(d.m)}</div>
            <div className="tooltip-row"><span>Realizada</span><span className={d.rl >= 0 ? 'p' : 'n'}>{f(d.rl)}</span></div>
            <div className="tooltip-row"><span>No realizada</span><span className={d.ur >= 0 ? 'p' : 'n'}>{f(d.ur)}</span></div>
            <div className="tooltip-row"><span>Dividendos y cargos</span><span>{f(d.dv)}</span></div>
            <div className="tooltip-row"><span>Total del mes</span><span className={d.pl >= 0 ? 'p' : 'n'}>{f(d.pl)}</span></div>
            <div className="tooltip-row"><span>Acumulado</span><span className={cumulative[tip] >= 0 ? 'p' : 'n'}>{f(cumulative[tip])}</span></div>
            {d.d > 0 && <div className="tooltip-row"><span>Depósito</span><span>{f(d.d)}</span></div>}
            <div className="tooltip-row"><span>Valor al cierre</span><span>{f(d.v)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE: GRÁFICO CRYPTO (precio de entrada de cada lote vs precio actual y costo promedio) ---
function CryptoLotsChart({ crypto, f, fd, pc }) {
  const [tip, setTip] = useState(null);
  const [wrapRef, width] = useWidth();

  const W = Math.max(300, width || 900);
  const compact = W < 560;
  const L = compact ? 50 : 62;
  const RP = compact ? 16 : 24;
  const TOP = 14;
  const hP = compact ? 200 : 240;
  const BOT = 28;
  const H = TOP + hP + BOT;

  const ms = d => new Date(`${d}T00:00:00Z`).getTime();
  const DAY = 86400000;
  const x0 = ms(crypto.lots[0].date) - 20 * DAY;
  const x1 = ms(crypto.cutDate) + 10 * DAY;
  const xT = d => L + (W - L - RP) * ((ms(d) - x0) / (x1 - x0));

  const prices = crypto.lots.map(l => l.effUnit).concat([crypto.price, crypto.avgCost]);
  const t = niceTicks(Math.min(...prices) * 0.97, Math.max(...prices) * 1.03, compact ? 3 : 4, false);
  const yP = v => TOP + hP * (1 - (v - t.min) / (t.max - t.min));
  const maxCost = Math.max(...crypto.lots.map(l => l.cost));

  // Marcas de mes en el eje X (cada 2 o 3 meses según el ancho)
  const months = [];
  const start = new Date(x0);
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const every = compact ? 3 : 2;
  for (let i = 0; cur.getTime() <= x1; i++) {
    if (i % every === 0) months.push(cur.toISOString().slice(0, 10));
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  const monthLabel = d => fd(d).split(' ').slice(1).join(' ').replace(/ 20(\d\d)$/, ' $1');

  const priceY = yP(crypto.price);
  const avgY = yP(crypto.avgCost);
  const lot = tip != null ? crypto.lots[tip] : null;
  const tipLeft = lot && xT(lot.date) > W * 0.6;

  return (
    <div className="card chart-card reveal">
      <div className="card-head">
        <h3 className="card-title">Costo por BTC de cada lote <span className="section-sub">tamaño = monto invertido</span></h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-chip lot-gain"></span>Lote en ganancia</span>
          <span className="legend-item"><span className="legend-chip lot-loss"></span>Lote en pérdida</span>
          <span className="legend-item"><span className="legend-chip price-line"></span>Precio BTC</span>
          <span className="legend-item"><span className="legend-chip avg-line"></span>Costo promedio</span>
        </div>
      </div>

      <div className="svg-chart-wrapper" ref={wrapRef} onMouseLeave={() => setTip(null)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Precio de entrada de cada lote de BTC">
          {t.ticks.map(v => (
            <g key={v}>
              <line className="chart-grid" x1={L} x2={W - RP} y1={yP(v)} y2={yP(v)} />
              <text className="chart-axis" x={L - 8} y={yP(v) + 4} textAnchor="end">{axisLabel(v)}</text>
            </g>
          ))}

          {/* Zona entre costo promedio y precio actual */}
          <rect className={crypto.price >= crypto.avgCost ? 'zone-gain' : 'zone-loss'} x={L} width={W - L - RP} y={Math.min(priceY, avgY)} height={Math.abs(priceY - avgY)} />
          <line className="avg-line" x1={L} x2={W - RP} y1={avgY} y2={avgY} />
          <line className="price-line" x1={L} x2={W - RP} y1={priceY} y2={priceY} />
          <text className="chart-line-label" x={L + 6} y={priceY - 6}>{`BTC ${f(crypto.price)}`}</text>
          <text className="chart-line-label muted" x={L + 6} y={avgY + (avgY > priceY ? 14 : -6)}>{`Costo prom. ${f(crypto.avgCost)}`}</text>

          {months.map(m => (
            <text key={m} className="chart-xlabel" x={xT(m)} y={H - 8} textAnchor="middle">{monthLabel(m)}</text>
          ))}

          {crypto.lots.map((l, i) => (
            <circle
              key={l.date}
              className={`lot-dot ${l.gain >= 0 ? 'gain' : 'loss'} ${tip === i ? 'active' : ''}`}
              cx={xT(l.date)}
              cy={yP(l.effUnit)}
              r={4 + 9 * Math.sqrt(l.cost / maxCost)}
              onMouseEnter={() => setTip(i)}
              onClick={() => setTip(i)}
            />
          ))}
        </svg>

        {lot && (
          <div className={`chart-tooltip ${tipLeft ? 'left' : ''}`} style={{ left: xT(lot.date) + (tipLeft ? -16 : 16) }}>
            <div className="tooltip-header">Lote · {fd(lot.date)}</div>
            <div className="tooltip-row"><span>Precio de entrada</span><span>{f(lot.unit)}</span></div>
            <div className="tooltip-row"><span>Costo por BTC (con comisiones)</span><span>{f(lot.effUnit)}</span></div>
            <div className="tooltip-row"><span>Cantidad</span><span>{lot.qty.toFixed(6)} BTC</span></div>
            <div className="tooltip-row"><span>Costo</span><span>{f(lot.cost)}</span></div>
            <div className="tooltip-row"><span>Valor</span><span>{f(lot.mv)}</span></div>
            <div className="tooltip-row"><span>Ganancia</span><span className={lot.gain >= 0 ? 'p' : 'n'}>{`${f(lot.gain)} (${pc(lot.gainPct)})`}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE: BARRAS MENSUALES (apiladas o simples, admite negativos) ---
// data = [{ m, segs: [{ key, v, cls }], tip: [[etiqueta, valor, clase]] }]
function MonthlyBars({ data, lab, ariaLabel, valueLabel }) {
  const [tip, setTip] = useState(null);
  const [wrapRef, width] = useWidth();
  useEffect(() => { setTip(null); }, [data]);

  const n = data.length;
  const W = Math.max(300, width || 900);
  const compact = W < 560;
  const L = compact ? 46 : 56;
  const RP = 12;
  const TOP = 22;
  const hP = compact ? 170 : 210;
  const BOT = 26;
  const H = TOP + hP + BOT;
  const step = (W - L - RP) / n;
  const bw = Math.min(30, Math.max(8, step * 0.52));

  const stacks = data.map(d => {
    let pos = 0;
    let neg = 0;
    return d.segs.filter(s => Math.abs(s.v) > 1e-9).map(s => {
      const y0 = s.v >= 0 ? pos : neg;
      const y1 = y0 + s.v;
      if (s.v >= 0) pos = y1; else neg = y1;
      return { ...s, y0, y1 };
    });
  });
  const totals = data.map(d => d.segs.reduce((t, s) => t + s.v, 0));
  const ext = stacks.flat().flatMap(s => [s.y0, s.y1]);
  const tk = niceTicks(Math.min(0, ...ext), Math.max(0, ...ext, 1), compact ? 3 : 4);
  const y = v => TOP + hP * (1 - (v - tk.min) / (tk.max - tk.min));
  const xC = i => L + step * (i + 0.5);
  const labelEvery = Math.max(1, Math.ceil(44 / step));
  // Etiqueta directa solo en el extremo (el mayor valor absoluto)
  const peak = totals.reduce((b, v, i) => (Math.abs(v) > Math.abs(totals[b]) ? i : b), 0);
  const d = tip != null ? data[tip] : null;

  return (
    <div className="svg-chart-wrapper" ref={wrapRef} onMouseLeave={() => setTip(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {tk.ticks.map(v => (
          <g key={v}>
            <line className={v === 0 ? 'chart-zero' : 'chart-grid'} x1={L} x2={W - RP} y1={y(v)} y2={y(v)} />
            <text className="chart-axis" x={L - 8} y={y(v) + 4} textAnchor="end">{axisLabel(v)}</text>
          </g>
        ))}
        {stacks.map((segs, i) => segs.map(s => (
          <rect
            key={`${i}-${s.key}`}
            className={`mbar ${s.cls}`}
            x={xC(i) - bw / 2}
            y={Math.min(y(s.y0), y(s.y1))}
            width={bw}
            height={Math.max(1, Math.abs(y(s.y0) - y(s.y1)))}
            rx="2"
            opacity={tip == null || tip === i ? 1 : 0.4}
          />
        )))}
        {Math.abs(totals[peak]) > 0 && (
          <text className="chart-peak-label" x={xC(peak)} y={totals[peak] >= 0 ? y(totals[peak]) - 7 : y(totals[peak]) + 15} textAnchor="middle">{valueLabel(totals[peak])}</text>
        )}
        {data.map((r, i) => (n - 1 - i) % labelEvery === 0 && (
          <text key={`lb${i}`} className="chart-xlabel" x={xC(i)} y={H - 8} textAnchor="middle">{lab(r.m)}</text>
        ))}
        {data.map((r, i) => (
          <rect key={`hit${i}`} x={L + step * i} y={TOP} width={step} height={hP} fill="transparent" onMouseMove={() => setTip(i)} onClick={() => setTip(i)} />
        ))}
      </svg>
      {d && (
        <div className={`chart-tooltip ${tip > n / 2 ? 'left' : ''}`} style={{ left: xC(tip) + (tip > n / 2 ? -14 : 14) }}>
          <div className="tooltip-header">{lab(d.m)}</div>
          {d.tip.map(([label, val, c], k) => (
            <div className="tooltip-row" key={k}><span>{label}</span><span className={c || ''}>{val}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE: CASCADA (de dónde salió el crecimiento del año) ---
// steps = [{ label, v, kind: 'total' | 'delta', share }]
function Waterfall({ steps, f, sg }) {
  const [tip, setTip] = useState(null);
  const [wrapRef, width] = useWidth();
  useEffect(() => { setTip(null); }, [steps]);

  const n = steps.length;
  const W = Math.max(300, width || 900);
  const compact = W < 560;
  const L = compact ? 46 : 56;
  const RP = 12;
  const TOP = 24;
  const hP = compact ? 190 : 230;
  const BOT = 40;
  const H = TOP + hP + BOT;
  const step = (W - L - RP) / n;
  const bw = Math.min(56, step * 0.6);

  let run = 0;
  const bars = steps.map(s => {
    if (s.kind === 'total') {
      run = s.v;
      return { ...s, y0: 0, y1: s.v };
    }
    const y0 = run;
    run += s.v;
    return { ...s, y0, y1: run };
  });
  const ext = bars.flatMap(b => [b.y0, b.y1]);
  const tk = niceTicks(Math.min(0, ...ext), Math.max(0, ...ext, 1), compact ? 3 : 4);
  const y = v => TOP + hP * (1 - (v - tk.min) / (tk.max - tk.min));
  const xC = i => L + step * (i + 0.5);
  const b = tip != null ? bars[tip] : null;

  return (
    <div className="svg-chart-wrapper" ref={wrapRef} onMouseLeave={() => setTip(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cascada del crecimiento del portafolio">
        {tk.ticks.map(v => (
          <g key={v}>
            <line className={v === 0 ? 'chart-zero' : 'chart-grid'} x1={L} x2={W - RP} y1={y(v)} y2={y(v)} />
            <text className="chart-axis" x={L - 8} y={y(v) + 4} textAnchor="end">{axisLabel(v)}</text>
          </g>
        ))}
        {bars.map((s, i) => i < n - 1 && (
          <line key={`c${i}`} className="wf-connector" x1={xC(i) + bw / 2} x2={xC(i + 1) - bw / 2} y1={y(s.y1)} y2={y(s.y1)} />
        ))}
        {bars.map((s, i) => {
          const cls = s.kind === 'total' ? 'wf-total' : s.v >= 0 ? 'wf-up' : 'wf-down';
          const top = Math.min(y(s.y0), y(s.y1));
          return (
            <g key={s.label} opacity={tip == null || tip === i ? 1 : 0.45}>
              <rect className={cls} x={xC(i) - bw / 2} y={top} width={bw} height={Math.max(1, Math.abs(y(s.y0) - y(s.y1)))} rx="2" />
              <text className="chart-peak-label" x={xC(i)} y={top - 7} textAnchor="middle">
                {compact ? axisLabel(Math.round(s.v)) : s.kind === 'total' ? f(s.v) : sg(s.v)}
              </text>
            </g>
          );
        })}
        {bars.map((s, i) => (
          <text key={`l${i}`} className="chart-xlabel" x={xC(i)} y={TOP + hP + 16 + (compact && i % 2 ? 14 : 0)} textAnchor="middle">
            {/* Máximo 2 líneas: primera palabra / resto; en pantallas angostas, la etiqueta corta */}
            {(compact ? [s.short || s.label] : s.label.includes(' ') ? [s.label.split(' ')[0], s.label.split(' ').slice(1).join(' ')] : [s.label]).map((w, k) => (
              <tspan key={k} x={xC(i)} dy={k ? 12 : 0}>{w}</tspan>
            ))}
          </text>
        ))}
        {bars.map((s, i) => (
          <rect key={`h${i}`} x={L + step * i} y={TOP} width={step} height={hP} fill="transparent" onMouseMove={() => setTip(i)} onClick={() => setTip(i)} />
        ))}
      </svg>
      {b && (
        <div className={`chart-tooltip ${tip > n / 2 ? 'left' : ''}`} style={{ left: xC(tip) + (tip > n / 2 ? -14 : 14) }}>
          <div className="tooltip-header">{b.label}</div>
          <div className="tooltip-row"><span>Monto</span><span className={b.kind === 'total' ? '' : b.v >= 0 ? 'p' : 'n'}>{b.kind === 'total' ? f(b.v) : sg(b.v)}</span></div>
          {b.share != null && <div className="tooltip-row"><span>% del crecimiento</span><span>{`${b.share.toFixed(1)}%`}</span></div>}
          {b.kind === 'delta' && <div className="tooltip-row"><span>Acumulado</span><span>{f(b.y1)}</span></div>}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: APP ---
// --- HORIZONTE: LARGO PLAZO (ETF, incluido GLD) VS CORTO PLAZO (todo lo demás) ---
const LONG_TERM = new Set(['QQQ', 'TQQQ', 'GLD', 'VOO', 'VT', 'VGT', 'SMH', 'SCHD', 'SPY']);

function HorizonChart({ holdings, total, f }) {
  // Ajustes propios sobre el reparto por defecto: { ticker: 'largo' | 'corto' }, guardados en este navegador
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hapi_horizon') || '{}') || {}; } catch (e) { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('hapi_horizon', JSON.stringify(overrides)); } catch (e) {}
  }, [overrides]);
  const defaultOf = k => (LONG_TERM.has(k) ? 'largo' : 'corto');
  const groupOf = k => overrides[k] || defaultOf(k);
  const move = k => {
    const next = groupOf(k) === 'largo' ? 'corto' : 'largo';
    setOverrides(o => {
      const n = { ...o };
      if (next === defaultOf(k)) delete n[k]; else n[k] = next;
      return n;
    });
  };
  const custom = holdings.some(h => overrides[h.key]);
  const groups = [
    { key: 'largo', label: 'Largo plazo', sub: custom ? 'a tu elección' : 'ETF', items: holdings.filter(h => groupOf(h.key) === 'largo') },
    { key: 'corto', label: 'Corto plazo', sub: custom ? 'a tu elección' : 'acciones, crypto y efectivo', items: holdings.filter(h => groupOf(h.key) === 'corto') }
  ].map(g => {
    const v = g.items.reduce((t, h) => t + h.v, 0);
    return { ...g, v, pct: total > 0 ? (v / total) * 100 : 0 };
  });
  // Dona con stroke-dasharray: un círculo por grupo, separado por un hueco de 1.5°
  const size = 180, sw = 22, r = (size - sw) / 2, C = 2 * Math.PI * r, gap = groups.every(g => g.v > 0) ? C * (1.5 / 360) : 0;
  let offset = 0;
  return (
    <div className="card chart-card horizon">
      <div className="horizon-donut">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
          aria-label={groups.map(g => `${g.label} ${g.pct.toFixed(1)}%`).join(', ')}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray-bg)" strokeWidth={sw} />
          {groups.map(g => {
            const len = (g.pct / 100) * C;
            const seg = (
              <circle key={g.key} className={`horizon-seg ${g.key}`} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw}
                strokeDasharray={`${Math.max(0, len - gap)} ${C}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <title>{`${g.label}: ${f(g.v)} · ${g.pct.toFixed(1)}%`}</title>
              </circle>
            );
            offset += len;
            return seg;
          })}
          <text className="horizon-center-val" x="50%" y="47%" textAnchor="middle">{`${groups[0].pct.toFixed(1)}%`}</text>
          <text className="horizon-center-lab" x="50%" y="60%" textAnchor="middle">largo plazo</text>
        </svg>
      </div>
      <div className="horizon-groups">
        {groups.map(g => (
          <div key={g.key} className="horizon-group">
            <div className="horizon-group-head">
              <span className="legend-item"><span className={`legend-chip horizon-chip ${g.key}`}></span><b>{g.label}</b><span className="ticker-name">{g.sub}</span></span>
              <span className="horizon-group-val"><b>{f(g.v)}</b><span>{g.pct.toFixed(1)}%</span></span>
            </div>
            <div className="split-bar"><span className={`split-seg horizon-chip ${g.key}`} style={{ width: `${g.pct}%` }}></span></div>
            <ul className="horizon-list">
              {g.items.map(h => (
                <li key={h.key}>
                  <TickerCell y={h.key} size={22} />
                  <span>{f(h.v)}</span>
                  <span className="horizon-pct">{h.pct.toFixed(1)}%</span>
                  <button className="horizon-move" onClick={() => move(h.key)}
                    title={`Pasar ${h.key} a ${g.key === 'largo' ? 'corto' : 'largo'} plazo`}
                    aria-label={`Pasar ${h.key} a ${g.key === 'largo' ? 'corto' : 'largo'} plazo`}>
                    {g.key === 'largo' ? '→' : '←'}
                  </button>
                </li>
              ))}
              {!g.items.length && <li className="horizon-empty">Sin activos · usa las flechas para moverlos aquí</li>}
            </ul>
          </div>
        ))}
        {custom && (
          <button className="btn ghost horizon-reset" onClick={() => setOverrides({})}>Restablecer (ETF = largo plazo)</button>
        )}
      </div>
    </div>
  );
}

function App() {
  const engine = window.HapiEngine;
  if (!engine) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Error: No se encontró MAESTRO.js cargado.</div>;
  }

  const {
    f,
    sg,
    pc,
    cls,
    lab,
    fd,
    dt,
    computePortfolioData,
    getPeriodSummary,
    getYears,
    computeYearDashboard,
    computeTaxes,
    computeCrypto,
    fetchBtcSpot,
    loadBtcStorage,
    saveBtcStorage
  } = engine;

  // Estado del portafolio base
  const portfolioData = useMemo(() => computePortfolioData(), []);

  // Estados de interfaz
  const [activeTab, setActiveTab] = useState('bolsa');
  const [period, setPeriod] = useState('YTD');
  // Preferencia de tema: 'system' (por defecto), 'light' o 'dark'
  const [themePref, setThemePref] = useState(() => {
    try { return localStorage.getItem('hapi_theme') || 'system'; } catch (e) { return 'system'; }
  });
  const [posSearch, setPosSearch] = useState('');
  const [opsSearch, setOpsSearch] = useState('');
  const [opsType, setOpsType] = useState('ALL');

  // Estado del precio BTC (null = precio del corte de la foto)
  const [btcPrice, setBtcPrice] = useState(() => loadBtcStorage());
  const [isUpdatingBtc, setIsUpdatingBtc] = useState(false);
  const [btcError, setBtcError] = useState('');
  const [manualInput, setManualInput] = useState('');

  // Manejador del Tema (Dark / Light)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const effective = themePref === 'system' ? (mq.matches ? 'dark' : 'light') : themePref;
      document.documentElement.setAttribute('data-theme', effective);
    };
    apply();
    try { localStorage.setItem('hapi_theme', themePref); } catch (e) {}
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themePref]);

  // Entrada escalonada: cada bloque .reveal aparece al entrar en pantalla
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return undefined;
    }
    const show = el => { el.classList.add('in'); io.unobserve(el); };
    // Revela lo que ya está en pantalla o quedó arriba (scroll rápido, ancla, carga a mitad de página)
    const sweep = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) show(el);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) show(e.target); });
      sweep();
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    sweep();
    return () => io.disconnect();
  }, [activeTab]);

  // Título de la pestaña del navegador según la vista
  useEffect(() => {
    document.title = `${{ bolsa: 'Bolsa', crypto: 'Crypto', total: 'Total', dashboard: 'Dashboard', impuestos: 'Impuestos', anual: 'Anual' }[activeTab]} · HAPI`;
  }, [activeTab]);

  // Cálculo del Período seleccionado
  const selectedMonths = useMemo(() => {
    return portfolioData.P[period] || portfolioData.R;
  }, [portfolioData, period]);

  const periodSummary = useMemo(() => {
    return getPeriodSummary(selectedMonths);
  }, [selectedMonths]);

  // Posiciones filtradas
  const filteredPositions = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    if (!q) return portfolioData.positionsRows;
    return portfolioData.positionsRows.filter(
      r => r.y.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [portfolioData.positionsRows, posSearch]);

  // Operaciones filtradas
  const filteredOperations = useMemo(() => {
    const monthsSet = new Set(selectedMonths.map(r => r.m));
    const term = opsSearch.trim().toLowerCase();

    return portfolioData.T
      .filter(o => monthsSet.has(o.m))
      .filter(o => {
        if (opsType !== 'ALL' && o.t !== opsType) return false;
        if (!term) return true;
        const assetName = (portfolioData.N[o.y] || '').toLowerCase();
        return o.y.toLowerCase().includes(term) || assetName.includes(term);
      })
      .slice()
      .reverse();
  }, [portfolioData.T, portfolioData.N, selectedMonths, opsType, opsSearch]);

  // Cálculo de Crypto
  const crypto = useMemo(() => computeCrypto(btcPrice.spot), [btcPrice]);
  const totalWealth = portfolioData.totalClosingVal + crypto.mv;

  // Dashboard anual (bolsa)
  const years = useMemo(() => getYears(portfolioData), [portfolioData]);
  const [dashYear, setDashYear] = useState(() => years[years.length - 1]);
  const dash = useMemo(() => computeYearDashboard(portfolioData, dashYear), [portfolioData, dashYear]);
  const divCls = k => (k === 'Otros' ? 's-other' : `s${['VOO', 'MSFT', 'META', 'QQQ', 'TQQQ'].indexOf(k) + 1}`);
  const endLabel = dash.lastMonth.endsWith('-12') ? 'Cierre' : `Corte ${lab(dash.lastMonth)}`;

  // Impuestos: la tasa la pone el usuario (depende del país); se recuerda en este navegador
  const [taxYear, setTaxYear] = useState(() => years[years.length - 1]);
  const [taxOpts, setTaxOpts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hapi_tax') || 'null');
      if (saved) return { rate: saved.rate || '', includeDiv: saved.includeDiv !== false, credit: saved.credit !== false };
    } catch (e) {}
    return { rate: '', includeDiv: true, credit: true };
  });
  useEffect(() => {
    try { localStorage.setItem('hapi_tax', JSON.stringify(taxOpts)); } catch (e) {}
  }, [taxOpts]);
  const taxRate = parseFloat(String(taxOpts.rate).replace(',', '.'));
  const hasRate = taxRate > 0 && taxRate <= 100;
  const taxCalc = opts => computeTaxes(opts.year, { rate: hasRate ? taxRate : 0, includeDiv: taxOpts.includeDiv, credit: taxOpts.credit });
  const taxByYear = useMemo(
    () => years.map(y => ({ y, ...taxCalc({ year: computeYearDashboard(portfolioData, y) }) })),
    [years, portfolioData, taxOpts]
  );
  const tax = taxByYear.find(t => t.y === taxYear);
  const taxYearData = useMemo(() => computeYearDashboard(portfolioData, taxYear), [portfolioData, taxYear]);

  // Vista Total por periodo (misma barra que Bolsa): bolsa según los estados de Apex; crypto tal como la pestaña Crypto.
  // Crypto no tiene precio histórico: al inicio del periodo (y al final, si el periodo no llega al último mes) se valora a costo.
  // Así siempre se cumple: valor final = valor inicial + capital aportado + ganancia.
  const computeTotal = (months, summary) => {
    const R = portfolioData.R;
    const first = months[0].m;
    const last = months[months.length - 1].m;
    const isLatest = last === R[R.length - 1].m;
    const startIdx = R.findIndex(r => r.m === first);
    const bolsaStart = startIdx > 0 ? R[startIdx - 1].v : 0;
    const bolsaVal = summary.closingValue;
    const netBolsa = summary.deposited - summary.withdrawn;
    const bolsaGain = summary.total;

    // Crypto sin precio histórico: la ganancia del periodo es la de los lotes comprados en él.
    // Lotes anteriores al periodo: a valor actual (si el periodo llega a hoy) o a costo (si termina antes).
    const ym = d => d.slice(0, 7);
    const sumBy = (arr, k) => arr.reduce((t, l) => t + l[k], 0);
    const preLots = crypto.lots.filter(l => ym(l.date) < first);
    const lotsIn = crypto.lots.filter(l => ym(l.date) >= first && ym(l.date) <= last);
    const netCrypto = sumBy(lotsIn, 'cost');
    const cryptoStart = isLatest ? sumBy(preLots, 'mv') : sumBy(preLots, 'cost');
    const cryptoVal = isLatest ? crypto.mv : sumBy(crypto.lots.filter(l => ym(l.date) <= last), 'cost');
    const cryptoGain = !isLatest ? 0 : lotsIn.length === crypto.lots.length ? crypto.gain : sumBy(lotsIn, 'gain');

    const capital = netBolsa + netCrypto;
    const startValue = bolsaStart + cryptoStart;
    const value = bolsaVal + cryptoVal;
    const gain = bolsaGain + cryptoGain;
    const holdings = portfolioData.positionsRows
      .filter(r => r.q > 0)
      .map(r => ({ key: r.y, name: r.name, account: 'Bolsa', v: r.v }))
      .concat([
        { key: 'BTC', name: 'Bitcoin', account: 'Crypto', v: crypto.mv },
        { key: 'Efectivo', name: 'FDIC / margen', account: 'Bolsa', v: portfolioData.cashFdic }
      ])
      .sort((a, b) => b.v - a.v)
      .map(h => ({ ...h, pct: (h.v / totalWealth) * 100 })); // distribución actual (hoy), no depende del periodo
    return {
      first,
      last,
      isLatest,
      startValue,
      capital,
      netBolsa,
      netCrypto,
      lotsInCount: lotsIn.length,
      bolsaVal,
      cryptoVal,
      value,
      gain,
      gainPct: startValue + capital > 0 ? (gain / (startValue + capital)) * 100 : 0,
      bolsaGain,
      bolsaGainPct: (bolsaGain / summary.base) * 100,
      cryptoGain,
      cryptoGainPct: netCrypto > 0 ? (cryptoGain / netCrypto) * 100 : 0,
      bolsaPct: (bolsaVal / value) * 100,
      cryptoPct: (cryptoVal / value) * 100,
      holdings
    };
  };
  const total = useMemo(() => computeTotal(selectedMonths, periodSummary), [portfolioData, crypto, selectedMonths, periodSummary, totalWealth]);

  // Vista Anual: el mismo cálculo de Total, un año completo por fila (el primero marca el inicio del portafolio)
  const annual = useMemo(() => years.map((y, i) => {
    const months = portfolioData.R.filter(r => r.m.startsWith(y));
    const t = computeTotal(months, getPeriodSummary(months));
    return { year: y, ...t, months: months.length, isStart: i === 0 };
  }).reverse(), [years, portfolioData, crypto, totalWealth]);

  // Crecimiento del dashboard: bolsa + crypto (mismo cálculo que Anual). Los traspasos a crypto quedan dentro del portafolio.
  const dashTotal = annual.find(a => a.year === dashYear);
  const grow = {
    start: dashTotal.startValue,
    end: dashTotal.value,
    total: dashTotal.value - dashTotal.startValue,
    pct: dashTotal.startValue > 0 ? ((dashTotal.value - dashTotal.startValue) / dashTotal.startValue) * 100 : null,
    gain: dashTotal.gain,
    deposits: dashTotal.capital,
    netBolsa: dashTotal.netBolsa,
    netCrypto: dashTotal.netCrypto,
    crypto: dashTotal.cryptoGain,
    unrealized: dash.parts.unrealized + dashTotal.cryptoGain
  };
  const share = v => (grow.total !== 0 ? (v / grow.total) * 100 : 0);
  const sharePct = v => { const s = share(v); return `${Math.abs(s) < 0.05 ? '0.0' : s.toFixed(1)}%`; };

  const applyBtcPrice = next => {
    setBtcPrice(next);
    saveBtcStorage(next);
  };

  // Precio en vivo vía Yahoo Finance
  const handleUpdateBtc = async () => {
    setIsUpdatingBtc(true);
    setBtcError('');
    try {
      const res = await fetchBtcSpot();
      applyBtcPrice({ spot: res.spot, timestamp: res.timestamp, source: 'live' });
    } catch (err) {
      console.error(err);
      setBtcError('No se pudo consultar el precio en vivo. Ingrésalo manualmente.');
    } finally {
      setIsUpdatingBtc(false);
    }
  };

  const handleManualPrice = e => {
    e.preventDefault();
    const num = parseFloat(manualInput);
    if (!isNaN(num) && num > 0) {
      applyBtcPrice({ spot: num, timestamp: '', source: 'manual' });
      setManualInput('');
      setBtcError('');
    }
  };

  const priceSourceLabel = !crypto.live
    ? `Precio del corte · ${fd(crypto.cutDate)}`
    : btcPrice.source === 'manual'
      ? 'Precio manual'
      : `En vivo · ${btcPrice.timestamp}`;

  const periodKeys = ['1M', '3M', '6M', 'YTD', '1A', '2025', '2026', 'ALL'];

  return (
    <div className="app-container">
      <a className="skip-link" href="#main">Saltar al contenido</a>
      {/* HEADER */}
      <header className="app-header">
        <div className="brand-section">
          <Icons.Logo />
          <div className="brand-text">
            <h1>Portafolio HAPI</h1>
            <div className="brand-sub">
              {activeTab === 'bolsa'
                ? 'Bolsa · Apex Clearing · jun 2025 – sep 2026 · USD'
                : activeTab === 'crypto'
                  ? `Crypto · Bakkt · corte ${fd(crypto.cutDate)} · USD`
                  : activeTab === 'total'
                    ? `Total · bolsa + crypto · USD`
                    : activeTab === 'dashboard'
                      ? `Dashboard · bolsa + crypto · ${dashYear} · USD`
                      : activeTab === 'anual'
                        ? 'Anual · bolsa + crypto · USD'
                        : `Impuestos · estimación · ${taxYear} · USD`}
            </div>
          </div>
        </div>

        <div className="segmented theme-switch" role="group" aria-label="Tema">
          {[['system', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, l]) => (
            <button key={k} className={themePref === k ? 'active' : ''} aria-pressed={themePref === k} onClick={() => setThemePref(k)}>{l}</button>
          ))}
        </div>
      </header>

      {/* PESTAÑAS PRINCIPALES */}
      <nav className="tabs-nav" aria-label="Portafolios">
        <button className={`tab-btn ${activeTab === 'bolsa' ? 'active' : ''}`} onClick={() => setActiveTab('bolsa')}>
          Bolsa <span className="tab-count">16 meses</span>
        </button>
        <button className={`tab-btn ${activeTab === 'crypto' ? 'active' : ''}`} onClick={() => setActiveTab('crypto')}>
          Crypto <span className="tab-count">{crypto.lots.length} lotes</span>
        </button>
        <button className={`tab-btn ${activeTab === 'total' ? 'active' : ''}`} onClick={() => setActiveTab('total')}>
          Total <span className="tab-count">bolsa + crypto</span>
        </button>
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard <span className="tab-count">por año</span>
        </button>
        <button className={`tab-btn ${activeTab === 'impuestos' ? 'active' : ''}`} onClick={() => setActiveTab('impuestos')}>
          Impuestos <span className="tab-count">por año</span>
        </button>
        <button className={`tab-btn ${activeTab === 'anual' ? 'active' : ''}`} onClick={() => setActiveTab('anual')}>
          Anual <span className="tab-count">{years.length} años</span>
        </button>
      </nav>

      <main id="main">
      {/* VISTA 1: BOLSA */}
      {activeTab === 'bolsa' && (
        <section aria-label="Bolsa">
          {/* BARRA DE PERÍODOS */}
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Periodo">
              {periodKeys.map(k => (
                <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{k}</button>
              ))}
            </div>
            <div className="toolbar-note">
              {lab(periodSummary.firstMonth)} – {lab(periodSummary.lastMonth)} · {periodSummary.monthsCount} {periodSummary.monthsCount > 1 ? 'meses' : 'mes'}
            </div>
          </div>

          {/* KPIs: tarjeta principal + 4 mosaicos */}
          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">Rendimiento total</span>
              <div className="hero-line">
                <b className="kpi-val hero-val">{sg(periodSummary.total)}</b>
                <span className={`tag ${cls(periodSummary.total)}`}>{pc((periodSummary.total / periodSummary.base) * 100)}</span>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><span>Depositado</span><b>{f(periodSummary.deposited)}</b></div>
                <div className="hero-stat"><span>Retirado</span><b>{f(periodSummary.withdrawn)}</b></div>
                <div className="hero-stat"><span>Valor al cierre</span><b>{f(periodSummary.closingValue)}</b></div>
              </div>
              <p className="footnote">Los depósitos no cuentan como ganancia; los % son sobre el capital promedio del periodo.</p>
            </div>
            {[
              ['Realizada', periodSummary.rl],
              ['No realizada', periodSummary.ur],
              ['Realizada + no realizada', periodSummary.capitalGain],
              ['Dividendos netos y cargos', periodSummary.dv]
            ].map(([label, val], i) => (
              <div className="card kpi reveal" style={{ '--i': i + 1 }} key={label}>
                <span className="kpi-label">{label}</span>
                <b className={`kpi-val ${cls(val)}`}>{sg(val)}</b>
                <span className={`tag ${cls(val)}`}>{pc((val / periodSummary.base) * 100)}</span>
              </div>
            ))}
          </div>

          {/* GRÁFICO INTERACTIVO */}
          <InteractiveChart monthsData={selectedMonths} f={f} lab={lab} />

          {/* TABLA DE POSICIONES Y ACTIVOS */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Posiciones <span className="section-sub">precios al 30 sep 2026</span></h2>
              <div className="search-input-wrapper">
                <span className="search-icon"><Icons.Search /></span>
                <input type="search" placeholder="Buscar activo" aria-label="Buscar activo" value={posSearch} onChange={e => setPosSearch(e.target.value)} />
              </div>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Activo</th>
                      <th>Cantidad</th>
                      <th>Costo prom.</th>
                      <th>Precio</th>
                      <th>Valor</th>
                      <th>% cartera</th>
                      <th>No realizada</th>
                      <th>Realizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPositions.map(r => (
                      <tr key={r.y}>
                        <td>
                          <TickerCell y={r.y} name={r.name} />
                        </td>
                        <td>{r.q > 0 ? r.q.toFixed(5) : '—'}</td>
                        <td>{r.q > 0 ? f(r.avgCost) : '—'}</td>
                        <td>{r.q > 0 ? f(r.price) : '—'}</td>
                        <td>{r.q > 0 ? f(r.v) : '—'}</td>
                        <td>
                          {r.q > 0 ? (
                            <span className="weight-cell">
                              {r.portfolioPct.toFixed(1)}%
                              <span className="weight-bar"><span className="weight-fill" style={{ width: `${Math.min(100, r.portfolioPct)}%` }}></span></span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className={r.q > 0 ? cls(r.u) : 'neutral'}>{r.q > 0 ? `${sg(r.u)} (${pc(r.unrealizedPct)})` : '—'}</td>
                        <td className={r.r !== 0 ? cls(r.r) : 'neutral'}>{r.r !== 0 ? sg(r.r) : '—'}</td>
                      </tr>
                    ))}
                    {filteredPositions.length === 0 && (
                      <tr><td colSpan={8} className="empty-row">No hay activos que coincidan con la búsqueda.</td></tr>
                    )}
                    <tr className="row-total">
                      <td>Efectivo / FDIC</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{f(portfolioData.cashFdic)}</td>
                      <td>{portfolioData.cashPct.toFixed(1)}%</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* TABLA DE RENDIMIENTO MENSUAL */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Rendimiento mensual</h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Valor cierre</th>
                      <th>Depósitos</th>
                      <th>Retiros</th>
                      <th>Realizada</th>
                      <th>No realizada</th>
                      <th>Dividendos</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonths.slice().reverse().map(r => (
                      <tr key={r.m}>
                        <td className="strong">{lab(r.m)}</td>
                        <td>{f(r.v)}</td>
                        <td>{f(r.d)}</td>
                        <td>{f(r.w)}</td>
                        <td className={cls(r.rl)}>{sg(r.rl)}</td>
                        <td className={cls(r.ur)}>{sg(r.ur)}</td>
                        <td className={cls(r.dv)}>{sg(r.dv)}</td>
                        <td className={`${cls(r.pl)} strong`}>{sg(r.pl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* TABLA DE OPERACIONES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Operaciones <span className="section-sub">{filteredOperations.length} en el periodo</span></h2>
              <div className="section-tools">
                <div className="segmented" role="group" aria-label="Tipo de operación">
                  {[['ALL', 'Todas'], ['B', 'Compras'], ['S', 'Ventas'], ['X', 'Split']].map(([k, l]) => (
                    <button key={k} className={opsType === k ? 'active' : ''} onClick={() => setOpsType(k)}>{l}</button>
                  ))}
                </div>
                <div className="search-input-wrapper">
                  <span className="search-icon"><Icons.Search /></span>
                  <input type="search" placeholder="Buscar activo" aria-label="Buscar operación por activo" value={opsSearch} onChange={e => setOpsSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Operación</th>
                      <th>Activo</th>
                      <th>Cantidad</th>
                      <th>Monto</th>
                      <th>Ganancia realizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperations.map((o, idx) => (
                      <tr key={idx}>
                        <td>{dt(o.d)}</td>
                        <td><span className={`badge ${o.t === 'B' ? 'buy' : o.t === 'S' ? 'sell' : 'split'}`}>{o.t === 'B' ? 'Compra' : o.t === 'S' ? 'Venta' : 'Split'}</span></td>
                        <td title={portfolioData.N[o.y] || ''}><TickerCell y={o.y} size={22} /></td>
                        <td>{o.q}</td>
                        <td>{o.a ? f(o.a) : '—'}</td>
                        <td className={o.g == null ? 'neutral' : cls(o.g)}>{o.g == null ? '—' : sg(o.g)}</td>
                      </tr>
                    ))}
                    {filteredOperations.length === 0 && (
                      <tr><td colSpan={6} className="empty-row">No hay operaciones con este filtro en el periodo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VISTA 2: CRYPTO (BAKKT) */}
      {activeTab === 'crypto' && (
        <section aria-label="Crypto">
          {/* PRECIO BTC */}
          <div className="toolbar">
            <div className="price-source">
              <TickerLogo y="BTC" size={26} />
              <span className="price-source-label">BTC-USD</span>
              <b>{f(crypto.price)}</b>
              <span className="toolbar-note">{priceSourceLabel}</span>
            </div>
            <div className="section-tools">
              <button className="btn" onClick={handleUpdateBtc} disabled={isUpdatingBtc}>
                <Icons.Refresh spinning={isUpdatingBtc} />
                {isUpdatingBtc ? 'Consultando…' : 'Precio en vivo'}
              </button>
              <form className="manual-price" onSubmit={handleManualPrice}>
                <input type="number" step="any" min="0" placeholder="Precio manual" aria-label="Precio manual de BTC" value={manualInput} onChange={e => setManualInput(e.target.value)} />
              </form>
              {crypto.live && <button className="btn ghost" onClick={() => applyBtcPrice({ spot: null })}>Usar corte</button>}
            </div>
          </div>
          {btcError && <p className="inline-error">{btcError}</p>}

          {/* KPIs CRYPTO */}
          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">Valor de mercado</span>
              <div className="hero-line">
                <b className="kpi-val hero-val">{f(crypto.mv)}</b>
                <span className={`tag ${cls(crypto.gain)}`}>{`${sg(crypto.gain)} · ${pc(crypto.gainPct)}`}</span>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><span>Invertido</span><b>{f(crypto.cost)}</b></div>
                <div className="hero-stat"><span>Cantidad</span><b>{crypto.qty.toFixed(6)} BTC</b></div>
                <div className="hero-stat"><span>Ganancia no realizada</span><b className={cls(crypto.gain)}>{sg(crypto.gain)}</b></div>
              </div>
              <p className="footnote">Sin ventas registradas: toda la ganancia es no realizada.</p>
            </div>
            <div className="card kpi reveal" style={{ '--i': 1 }}>
              <span className="kpi-label">Costo promedio</span>
              <b className="kpi-val">{f(crypto.avgCost)}</b>
              <span className={`tag ${cls(crypto.price - crypto.avgCost)}`}>{`BTC ${pc((crypto.price / crypto.avgCost - 1) * 100)} sobre el costo`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 2 }}>
              <span className="kpi-label">{crypto.live ? 'Lotes en ganancia' : 'Variación del día (corte)'}</span>
              {crypto.live ? (
                <>
                  <b className="kpi-val">{crypto.winners} <span className="kpi-of">de {crypto.lots.length}</span></b>
                  <span className="kpi-meta">al precio actual</span>
                </>
              ) : (
                <>
                  <b className={`kpi-val ${cls(crypto.dayUsd)}`}>{sg(crypto.dayUsd)}</b>
                  <span className={`tag ${cls(crypto.dayUsd)}`}>{pc(crypto.dayPct)}</span>
                </>
              )}
            </div>
            <div className="card kpi reveal" style={{ '--i': 3 }}>
              <span className="kpi-label">Mejor lote</span>
              <b className={`kpi-val ${cls(crypto.best.gain)}`}>{pc(crypto.best.gainPct)}</b>
              <span className="kpi-meta">{`${fd(crypto.best.date)} · ${sg(crypto.best.gain)}`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 4 }}>
              <span className="kpi-label">Patrimonio total</span>
              <b className="kpi-val">{f(totalWealth)}</b>
              <span className="kpi-meta">{`Crypto ${((crypto.mv / totalWealth) * 100).toFixed(1)}% · bolsa a 30 sep`}</span>
            </div>
          </div>

          <CryptoLotsChart crypto={crypto} f={f} fd={fd} pc={pc} />

          {/* TABLA DE LOTES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Lotes BTC <span className="section-sub">{crypto.winners} de {crypto.lots.length} en ganancia</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cantidad BTC</th>
                      <th>Precio entrada</th>
                      <th>Costo</th>
                      <th>Valor</th>
                      <th>Ganancia</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crypto.lots.slice().reverse().map(l => (
                      <tr key={l.date}>
                        <td className="strong">{fd(l.date)}</td>
                        <td>{l.qty.toFixed(6)}</td>
                        <td>{f(l.unit)}</td>
                        <td>{f(l.cost)}</td>
                        <td>{f(l.mv)}</td>
                        <td className={cls(l.gain)}>{sg(l.gain)}</td>
                        <td className={cls(l.gain)}>{pc(l.gainPct)}</td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total</td>
                      <td>{crypto.qty.toFixed(6)}</td>
                      <td>{f(crypto.avgCost)}</td>
                      <td>{f(crypto.cost)}</td>
                      <td>{f(crypto.mv)}</td>
                      <td className={cls(crypto.gain)}>{sg(crypto.gain)}</td>
                      <td className={cls(crypto.gain)}>{pc(crypto.gainPct)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CONCILIACIÓN CON LOS TRASPASOS DE LA BOLSA */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Traspasos desde la bolsa <span className="section-sub">Journal to BAKKT en los estados de Apex</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha traspaso</th>
                      <th>Monto</th>
                      <th>Lote</th>
                      <th>Costo lote</th>
                      <th>Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crypto.transfers.slice().reverse().map(t => (
                      <tr key={t.date}>
                        <td className="strong">{fd(t.date)}</td>
                        <td className={t.amount < 0 ? 'p' : ''}>{t.amount < 0 ? `+${f(-t.amount)} entrada` : f(t.amount)}</td>
                        <td className={t.lot ? '' : 'neutral'}>{t.lot ? fd(t.lot.date) : 'Sin lote'}</td>
                        <td>{t.lot ? f(t.lot.cost) : '—'}</td>
                        <td className="neutral">{t.diff != null ? f(t.diff) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total retirado</td>
                      <td>{f(crypto.withdrawn)}</td>
                      <td></td>
                      <td>{f(crypto.matchedCost)}</td>
                      <td>{f(crypto.withdrawn - crypto.matchedCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              De {f(crypto.withdrawn)} retirados de la bolsa, {f(crypto.matchedWithdrawn)} financiaron los {crypto.lots.length} lotes
              (diferencia de {f(crypto.matchedWithdrawn - crypto.matchedCost)} por spread y comisiones). {f(crypto.unmatched)} en traspasos
              ({crypto.transfers.filter(t => !t.lot && t.amount > 0).map(t => fd(t.date)).join(', ')}) no tienen lote asociado y en jun 2026 volvieron {f(crypto.returned)} a la bolsa; queda pendiente confirmar a dónde fue ese saldo.
              Los lotes provienen de la foto "Share Lots" del {fd(crypto.cutDate)}; con precio en vivo o manual se revalúan como cantidad × precio.
            </p>
          </div>
        </section>
      )}
      {/* VISTA 3: TOTAL (BOLSA + CRYPTO) */}
      {activeTab === 'total' && (
        <section aria-label="Total">
          {/* BARRA DE PERÍODOS (compartida con Bolsa) */}
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Periodo">
              {periodKeys.map(k => (
                <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{k}</button>
              ))}
            </div>
            <div className="toolbar-note">
              {`${lab(total.first)} – ${lab(total.last)} · ${selectedMonths.length} ${selectedMonths.length > 1 ? 'meses' : 'mes'} · crypto ${!total.isLatest ? 'a costo' : crypto.live ? (btcPrice.source === 'manual' ? 'a precio manual' : 'en vivo') : `al ${fd(crypto.cutDate)}`}`}
            </div>
          </div>

          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">{total.isLatest ? 'Patrimonio total' : `Patrimonio al cierre de ${lab(total.last)}`}</span>
              <div className="hero-line">
                <b className="kpi-val hero-val">{f(total.value)}</b>
                <span className={`tag ${cls(total.gain)}`}>{`${sg(total.gain)} · ${pc(total.gainPct)}`}</span>
              </div>
              <div className="split" aria-label={`Bolsa ${total.bolsaPct.toFixed(1)}%, crypto ${total.cryptoPct.toFixed(1)}%`}>
                <div className="split-bar">
                  <span className="split-seg bolsa" style={{ width: `${total.bolsaPct}%` }}></span>
                  <span className="split-seg crypto" style={{ width: `${total.cryptoPct}%` }}></span>
                </div>
                <div className="split-legend">
                  <span><i className="split-dot bolsa"></i>Bolsa {total.bolsaPct.toFixed(1)}%</span>
                  <span><i className="split-dot crypto"></i>Crypto {total.cryptoPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><span>Inicio del periodo</span><b>{f(total.startValue)}</b></div>
                <div className="hero-stat"><span>Capital aportado</span><b>{f(total.capital)}</b></div>
                <div className="hero-stat"><span>Ganancia del periodo</span><b className={cls(total.gain)}>{sg(total.gain)}</b></div>
              </div>
              <p className="footnote">
                {`Valor final = inicio + capital aportado + ganancia. Capital = aportado neto a la bolsa + lotes de BTC comprados en el periodo. ${total.isLatest
                  ? 'Sin precio histórico de BTC, la ganancia crypto del periodo es la de los lotes comprados en él.'
                  : 'Sin precio histórico de BTC, la crypto se valora a costo y no suma ganancia en este periodo.'}`}
              </p>
            </div>
            <div className="card kpi reveal" style={{ '--i': 1 }}>
              <span className="kpi-label">Bolsa</span>
              <b className="kpi-val">{f(total.bolsaVal)}</b>
              <span className={`tag ${cls(total.bolsaGain)}`}>{`${sg(total.bolsaGain)} · ${pc(total.bolsaGainPct)}`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 2 }}>
              <span className="kpi-label">Crypto</span>
              <b className="kpi-val">{f(total.cryptoVal)}</b>
              {!total.isLatest
                ? <span className="kpi-meta">a costo (sin precio histórico)</span>
                : total.lotsInCount
                  ? <span className={`tag ${cls(total.cryptoGain)}`}>{`${sg(total.cryptoGain)} · ${pc(total.cryptoGainPct)}`}</span>
                  : <span className="kpi-meta">sin compras en el periodo</span>}
            </div>
            <div className="card kpi reveal" style={{ '--i': 3 }}>
              <span className="kpi-label">Aportado a bolsa (neto)</span>
              <b className="kpi-val">{f(total.netBolsa)}</b>
              <span className="kpi-meta">aportes − traspasos a Bakkt</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 4 }}>
              <span className="kpi-label">Invertido en crypto</span>
              <b className="kpi-val">{f(total.netCrypto)}</b>
              <span className="kpi-meta">{total.lotsInCount ? `${total.lotsInCount} ${total.lotsInCount > 1 ? 'lotes' : 'lote'} de BTC en el periodo` : 'sin compras en el periodo'}</span>
            </div>
          </div>

          {/* DISTRIBUCIÓN DEL PATRIMONIO */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Distribución actual <span className="section-sub">{total.holdings.length} partidas · % del patrimonio de hoy</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Activo</th>
                      <th>Cuenta</th>
                      <th>Valor</th>
                      <th>% patrimonio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {total.holdings.map(h => (
                      <tr key={h.key}>
                        <td>
                          <TickerCell y={h.key} name={h.name} />
                        </td>
                        <td><span className={`badge ${h.account === 'Crypto' ? 'sell' : 'split'}`}>{h.account}</span></td>
                        <td>{f(h.v)}</td>
                        <td>
                          <span className="weight-cell">
                            {h.pct.toFixed(1)}%
                            <span className="weight-bar"><span className={`weight-fill ${h.account === 'Crypto' ? 'crypto' : ''}`} style={{ width: `${Math.min(100, h.pct)}%` }}></span></span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total</td>
                      <td></td>
                      <td>{f(totalWealth)}</td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              Bolsa según los estados de cuenta de Apex; crypto tal como aparece en la pestaña Crypto (lotes de BTC a su costo y al precio vigente).
              La barra de periodos es la misma de la pestaña Bolsa (cambiarla aquí también la cambia allá). Esta tabla siempre muestra la distribución de hoy.
              Las fechas no coinciden: la bolsa es el cierre del 30 sep 2026 y crypto {crypto.live ? 'usa el precio actual' : `el corte del ${fd(crypto.cutDate)}`}.
            </p>
          </div>

          {/* HORIZONTE: LARGO VS CORTO PLAZO */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Largo vs corto plazo <span className="section-sub">ETF por defecto, ajustable · % del patrimonio de hoy</span></h2>
            </div>
            <HorizonChart holdings={total.holdings} total={totalWealth} f={f} />
            <p className="note">Por defecto, largo plazo agrupa todos los ETF (incluido GLD, el oro); corto plazo, las acciones individuales, el BTC y el efectivo de la cuenta. Con las flechas pasas cualquier activo al otro grupo; tu elección se guarda en este navegador.</p>
          </div>
        </section>
      )}
      {/* VISTA 4: DASHBOARD ANUAL (BOLSA) */}
      {activeTab === 'dashboard' && (
        <section aria-label="Dashboard">
          {/* FILTRO POR AÑO: una sola fila que controla todo el dashboard */}
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Año">
              {years.map(y => (
                <button key={y} className={dashYear === y ? 'active' : ''} aria-pressed={dashYear === y} onClick={() => setDashYear(y)}>{y}</button>
              ))}
            </div>
            <div className="toolbar-note">
              {`${lab(dash.firstMonth)} – ${lab(dash.lastMonth)} · ${dash.months.length} ${dash.months.length > 1 ? 'meses' : 'mes'} · bolsa + crypto`}
            </div>
          </div>

          {/* 1. CRECIMIENTO DEL PORTAFOLIO */}
          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">{`Crecimiento en ${dashYear}`}</span>
              <div className="hero-line">
                <b className="kpi-val hero-val">{sg(grow.total)}</b>
                {grow.pct != null && <span className={`tag ${cls(grow.total)}`}>{pc(grow.pct)}</span>}
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><span>{grow.start > 0 ? `Inicio (${lab(`${+dashYear - 1}-12`)})` : 'Inicio'}</span><b>{f(grow.start)}</b></div>
                <div className="hero-stat"><span>{endLabel}</span><b>{f(grow.end)}</b></div>
                <div className="hero-stat"><span>Ganancia del año</span><b className={cls(grow.gain)}>{sg(grow.gain)}</b></div>
              </div>
              <p className="footnote">
                {grow.start > 0
                  ? 'Crecimiento = valor al corte − valor al inicio del año, bolsa + crypto. Incluye depósitos; la ganancia del año los excluye.'
                  : 'La cuenta se abrió en jun 2025: el año parte de $0, así que no hay % de crecimiento.'}
              </p>
            </div>
            {[
              ['Depósitos netos', grow.deposits, 'aportes a bolsa y compras de crypto'],
              ['Ventas de acciones', dash.parts.realized, 'ganancia realizada'],
              ['Dividendos y cargos', dash.parts.dv, 'dividendos netos − intereses de margen'],
              ['No realizada', grow.unrealized, `precio en cartera · BTC ${sg(grow.crypto)}`]
            ].map(([label, v, meta], i) => (
              <div className="card kpi reveal" style={{ '--i': i + 1 }} key={label}>
                <span className="kpi-label">{label}</span>
                <b className={`kpi-val ${i ? cls(v) : ''}`}>{i ? sg(v) : f(v)}</b>
                <span className="tag">{`${sharePct(v)} del crecimiento`}</span>
                <span className="kpi-meta">{meta}</span>
              </div>
            ))}
          </div>

          <div className="card chart-card reveal">
            <div className="card-head">
              <h3 className="card-title">{`De dónde salió el crecimiento · ${dashYear}`}</h3>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-chip wf-total"></span>Valor del portafolio</span>
                <span className="legend-item"><span className="legend-chip wf-up"></span>Suma</span>
                <span className="legend-item"><span className="legend-chip wf-down"></span>Resta</span>
              </div>
            </div>
            <Waterfall
              f={f}
              sg={sg}
              steps={[
                { label: 'Inicio', short: 'Inicio', v: grow.start, kind: 'total' },
                { label: 'Depósitos', short: 'Dep.', v: grow.deposits, kind: 'delta', share: share(grow.deposits) },
                { label: 'Ventas', short: 'Ventas', v: dash.parts.realized, kind: 'delta', share: share(dash.parts.realized) },
                { label: 'Dividendos y cargos', short: 'Div.', v: dash.parts.dv, kind: 'delta', share: share(dash.parts.dv) },
                { label: 'No realizada', short: 'No real.', v: dash.parts.unrealized, kind: 'delta', share: share(dash.parts.unrealized) },
                { label: 'Crypto (BTC)', short: 'BTC', v: grow.crypto, kind: 'delta', share: share(grow.crypto) },
                { label: endLabel, short: dash.lastMonth.endsWith('-12') ? 'Cierre' : 'Corte', v: grow.end, kind: 'total' }
              ]}
            />
          </div>

          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Origen del crecimiento <span className="section-sub">{`${f(grow.start)} → ${f(grow.end)}`}</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Componente</th><th>Monto</th><th>% del crecimiento</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['Depósitos netos', grow.deposits, ''],
                      ['Bolsa (HAPI − traspasos a crypto)', grow.netBolsa, 'sub'],
                      ['Compras de crypto (Bakkt)', grow.netCrypto, 'sub'],
                      ['Ganancia realizada', dash.parts.realized + dash.parts.dv, ''],
                      ['Ventas de acciones', dash.parts.realized, 'sub'],
                      ['Dividendos netos', dash.parts.divNet, 'sub'],
                      ...(Math.abs(dash.parts.charges) > 0.004 ? [['Intereses y cargos de margen', dash.parts.charges, 'sub']] : []),
                      ['No realizada', grow.unrealized, ''],
                      ['Bolsa', dash.parts.unrealized, 'sub'],
                      ['Crypto (BTC)', grow.crypto, 'sub']
                    ].map(([label, v, kind]) => (
                      <tr key={label} className={kind === 'sub' ? 'row-sub' : ''}>
                        <td className={kind === 'sub' ? '' : 'strong'}>{label}</td>
                        <td className={cls(v)}>{sg(v)}</td>
                        <td>{sharePct(v)}</td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Crecimiento total</td>
                      <td>{sg(grow.total)}</td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. DIVIDENDOS POR MES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Dividendos por mes <span className="section-sub">{`${dash.dividends.rows.length} pagos · neto de retención`}</span></h2>
            </div>
            <div className="kpi-row">
              <div className="card kpi"><span className="kpi-label">Neto recibido</span><b className="kpi-val">{f(dash.dividends.net)}</b><span className="kpi-meta">{`promedio ${f(dash.dividends.net / dash.months.length)} / mes`}</span></div>
              <div className="card kpi"><span className="kpi-label">Bruto</span><b className="kpi-val">{f(dash.dividends.gross)}</b><span className="kpi-meta">antes de retención</span></div>
              <div className="card kpi"><span className="kpi-label">Retención (~30%)</span><b className="kpi-val">{f(dash.dividends.wh)}</b><span className="kpi-meta">impuesto a no residentes</span></div>
              <div className="card kpi"><span className="kpi-label">Mejor mes</span><b className="kpi-val">{dash.dividends.best ? f(dash.dividends.best.divNet) : '—'}</b><span className="kpi-meta">{dash.dividends.best ? lab(dash.dividends.best.m) : 'sin dividendos'}</span></div>
            </div>
            <div className="card chart-card">
              <div className="card-head">
                <h3 className="card-title">Neto por mes y acción</h3>
                <div className="chart-legend">
                  {dash.dividends.keys.map(k => (
                    <span className="legend-item" key={k}><span className={`legend-chip ${divCls(k)}`}></span>{k === 'Otros' ? 'Otros (GOOGL, NVDA, SCHD, VT)' : k}</span>
                  ))}
                </div>
              </div>
              <MonthlyBars
                lab={lab}
                ariaLabel="Dividendos netos por mes y acción"
                valueLabel={f}
                data={dash.months.map(r => ({
                  m: r.m,
                  segs: dash.dividends.keys.map(k => ({ key: k, v: r.divByKey[k] || 0, cls: divCls(k) })),
                  tip: r.divs.length
                    ? r.divs.map(x => [x.y, f(x.net)]).concat([['Total del mes', f(r.divNet)]])
                    : [['Sin dividendos', '—']]
                }))}
              />
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Acción</th><th>Bruto</th><th>Retención</th><th>Neto</th></tr>
                  </thead>
                  <tbody>
                    {dash.dividends.rows.slice().reverse().map((x, k) => (
                      <tr key={k}>
                        <td className="strong">{fd(x.date)}</td>
                        <td><span className="ticker-legend"><TickerCell y={x.y} size={22} /><span className={`legend-chip ${divCls(x.key)}`} title="Color en el gráfico"></span></span></td>
                        <td>{f(x.gross)}</td>
                        <td className="neutral">{x.wh > 0 ? `-${f(x.wh)}` : '—'}</td>
                        <td className="p">{f(x.net)}</td>
                      </tr>
                    ))}
                    {dash.dividends.rows.length === 0 && <tr><td colSpan={5} className="empty-row">No hubo dividendos este año.</td></tr>}
                    <tr className="row-total">
                      <td>Total</td><td></td><td>{f(dash.dividends.gross)}</td><td>{`-${f(dash.dividends.wh)}`}</td><td>{f(dash.dividends.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. VENTAS REALIZADAS POR MES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Ventas por mes <span className="section-sub">{`${dash.sales.count} ventas · ${dash.sales.winners} con ganancia`}</span></h2>
            </div>
            <div className="kpi-row">
              <div className="card kpi"><span className="kpi-label">Ganancia realizada</span><b className={`kpi-val ${cls(dash.sales.realized)}`}>{sg(dash.sales.realized)}</b><span className="kpi-meta">{`${dash.sales.count} ventas en ${dash.months.length} meses`}</span></div>
              <div className="card kpi"><span className="kpi-label">Promedio mensual</span><b className={`kpi-val ${cls(dash.sales.avgMonthly)}`}>{sg(dash.sales.avgMonthly)}</b><span className={`tag ${cls(dash.sales.avgMonthlyPct)}`}>{`${pc(dash.sales.avgMonthlyPct)} / mes`}</span></div>
              <div className="card kpi"><span className="kpi-label">Rendimiento sobre lo vendido</span><b className={`kpi-val ${cls(dash.sales.onCostPct)}`}>{pc(dash.sales.onCostPct)}</b><span className="kpi-meta">ganancia ÷ costo de lo vendido</span><span className="kpi-meta">{`Capital vendido: ${f(dash.sales.avgMonthlyCost)} / mes`}</span></div>
              <div className="card kpi"><span className="kpi-label">Ventas con ganancia</span><b className="kpi-val">{dash.sales.winners} <span className="kpi-of">de {dash.sales.count}</span></b><span className="kpi-meta">{dash.sales.count ? `${((dash.sales.winners / dash.sales.count) * 100).toFixed(0)}% de acierto` : '—'}</span></div>
            </div>
            <div className="card chart-card">
              <div className="card-head">
                <h3 className="card-title">Ganancia realizada por mes</h3>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-chip pos"></span>Ganancia</span>
                  <span className="legend-item"><span className="legend-chip neg"></span>Pérdida</span>
                </div>
              </div>
              <MonthlyBars
                lab={lab}
                ariaLabel="Ganancia realizada por mes"
                valueLabel={sg}
                data={dash.months.map(r => ({
                  m: r.m,
                  segs: [{ key: 'rl', v: r.realized, cls: r.realized >= 0 ? 'pos' : 'neg' }],
                  tip: r.sales.length
                    ? r.sales.map(x => [`${x.y} · ${+x.q.toFixed(4)} acc.`, `${sg(x.gain)} (${pc(x.pct)})`, cls(x.gain)])
                        .concat([['Total del mes', `${sg(r.realized)} · ${pc(r.realizedPct)}`, cls(r.realized)]])
                    : [['Sin ventas', '—']]
                }))}
              />
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Acción</th><th>Cantidad</th><th>Monto venta</th><th>Costo</th><th>Ganancia</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {dash.sales.rows.slice().reverse().map((x, k) => (
                      <tr key={k}>
                        <td className="strong">{fd(x.date)}</td>
                        <td title={x.name}><TickerCell y={x.y} size={22} /></td>
                        <td>{x.q}</td>
                        <td>{f(x.amount)}</td>
                        <td className="neutral">{f(x.cost)}</td>
                        <td className={cls(x.gain)}>{sg(x.gain)}</td>
                        <td className={cls(x.gain)}>{pc(x.pct)}</td>
                      </tr>
                    ))}
                    {dash.sales.rows.length === 0 && <tr><td colSpan={7} className="empty-row">No hubo ventas este año.</td></tr>}
                    <tr className="row-total">
                      <td>Total</td><td></td><td></td>
                      <td>{f(dash.sales.rows.reduce((t, x) => t + x.amount, 0))}</td>
                      <td>{f(dash.sales.rows.reduce((t, x) => t + x.cost, 0))}</td>
                      <td className={cls(dash.sales.realized)}>{sg(dash.sales.realized)}</td>
                      <td className={cls(dash.sales.realized)}>{pc(dash.sales.onCostPct)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              Promedio mensual = ganancia realizada del año ÷ {dash.months.length} meses con estado de cuenta. El % mensual es el promedio de cada mes sobre su capital promedio;
              el rendimiento sobre lo vendido compara la ganancia con el costo promedio de las acciones vendidas.
            </p>
          </div>

          {/* 4. DEPÓSITOS POR MES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Depósitos por mes <span className="section-sub">aportes desde HAPI</span></h2>
            </div>
            <div className="kpi-row">
              <div className="card kpi"><span className="kpi-label">Total depositado</span><b className="kpi-val">{f(dash.deposits.total)}</b><span className="kpi-meta">{`${dash.deposits.monthsWith} de ${dash.months.length} meses con depósito`}</span></div>
              <div className="card kpi"><span className="kpi-label">Promedio mensual</span><b className="kpi-val">{f(dash.deposits.avgMonthly)}</b><span className="kpi-meta">{`sobre ${dash.months.length} meses`}</span></div>
              <div className="card kpi"><span className="kpi-label">Mayor depósito</span><b className="kpi-val">{dash.deposits.max ? f(dash.deposits.max.deposits) : '—'}</b><span className="kpi-meta">{dash.deposits.max ? lab(dash.deposits.max.m) : '—'}</span></div>
              <div className="card kpi"><span className="kpi-label">Traspasado a crypto</span><b className="kpi-val">{f(-dash.parts.toCrypto)}</b><span className="kpi-meta">sale de la bolsa hacia Bakkt</span></div>
            </div>
            <div className="card chart-card">
              <div className="card-head">
                <h3 className="card-title">Depositado por mes</h3>
              </div>
              <MonthlyBars
                lab={lab}
                ariaLabel="Depósitos por mes"
                valueLabel={f}
                data={dash.months.map(r => ({
                  m: r.m,
                  segs: [{ key: 'dep', v: r.deposits, cls: 'acc' }],
                  tip: [['Depositado', f(r.deposits)]].concat(r.toCrypto ? [['Traspaso a crypto', sg(r.toCrypto), cls(r.toCrypto)]] : [])
                }))}
              />
              <details className="table-toggle">
                <summary>Ver como tabla</summary>
                <table className="data-table">
                  <thead><tr><th>Mes</th><th>Depositado</th><th>Traspaso a crypto</th></tr></thead>
                  <tbody>
                    {dash.months.map(r => (
                      <tr key={r.m}><td className="strong">{lab(r.m)}</td><td>{f(r.deposits)}</td><td className={r.toCrypto ? cls(r.toCrypto) : 'neutral'}>{r.toCrypto ? sg(r.toCrypto) : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          </div>
        </section>
      )}
      {/* VISTA 6: ANUAL (RENDIMIENTO DEL PORTAFOLIO POR AÑO) */}
      {activeTab === 'anual' && (
        <section aria-label="Anual">
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Rendimiento anual <span className="section-sub">bolsa + crypto</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Año</th><th>Valor inicial</th><th>Aportado neto</th><th>Ganancia</th><th>Rendimiento</th><th>Valor final</th></tr>
                  </thead>
                  <tbody>
                    {annual.map(a => (
                      <tr key={a.year}>
                        <td className="strong">
                          {a.year}
                          {a.isStart && <div className="note">{`Inicio del portafolio · ${lab(a.first)}`}</div>}
                          {a.months < 12 && !a.isStart && <div className="note">{`${lab(a.first)} – ${lab(a.last)} · ${a.months} meses`}</div>}
                        </td>
                        <td>{f(a.startValue)}</td>
                        <td>{f(a.capital)}</td>
                        <td className={cls(a.gain)}>{sg(a.gain)}</td>
                        <td className={cls(a.gainPct)}>{pc(a.gainPct)}</td>
                        <td className="strong">{f(a.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* VISTA 5: IMPUESTOS (ESTIMACIÓN POR AÑO) */}
      {activeTab === 'impuestos' && (
        <section aria-label="Impuestos">
          {/* Filtros: año + tasa manual + qué entra en la base */}
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Año">
              {years.map(y => (
                <button key={y} className={taxYear === y ? 'active' : ''} aria-pressed={taxYear === y} onClick={() => setTaxYear(y)}>{y}</button>
              ))}
            </div>
            <div className="section-tools tax-controls">
              <label className="rate-input">
                <span>Tasa de impuesto</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={taxOpts.rate}
                  aria-invalid={taxOpts.rate !== '' && !hasRate}
                  onChange={e => setTaxOpts(o => ({ ...o, rate: e.target.value }))}
                />
                <em>%</em>
              </label>
              <label className="check">
                <input type="checkbox" checked={taxOpts.includeDiv} onChange={e => setTaxOpts(o => ({ ...o, includeDiv: e.target.checked }))} />
                Incluir dividendos
              </label>
              <label className={`check ${taxOpts.includeDiv ? '' : 'disabled'}`}>
                <input type="checkbox" checked={taxOpts.credit} disabled={!taxOpts.includeDiv} onChange={e => setTaxOpts(o => ({ ...o, credit: e.target.checked }))} />
                Descontar retención pagada
              </label>
            </div>
          </div>
          {taxOpts.rate !== '' && !hasRate && <p className="inline-error">La tasa debe estar entre 0 y 100%.</p>}

          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">{`Impuesto estimado ${taxYear}`}</span>
              {hasRate ? (
                <div className="hero-line">
                  <b className="kpi-val hero-val">{f(tax.tax)}</b>
                  <span className="tag">{`${taxRate}% sobre ${f(tax.taxable)}`}</span>
                </div>
              ) : (
                <div className="empty-state">
                  <b>Ingresa tu tasa de impuesto</b>
                  <span>Depende del país donde declaras. Escríbela arriba (por ejemplo 15) y el cálculo se hace al instante.</span>
                </div>
              )}
              <div className="hero-stats">
                <div className="hero-stat"><span>Base gravable</span><b className={cls(tax.base)}>{sg(tax.base)}</b></div>
                <div className="hero-stat"><span>Impuesto bruto</span><b>{hasRate ? f(tax.grossTax) : '—'}</b></div>
                <div className="hero-stat"><span>Crédito retención</span><b>{hasRate && tax.credit ? `-${f(tax.credit)}` : '—'}</b></div>
              </div>
              <p className="footnote">
                {tax.base <= 0
                  ? 'Este año el resultado realizado es negativo o cero: no hay impuesto que pagar.'
                  : 'La base son las ganancias realizadas del año: ventas con ganancia menos ventas con pérdida, más dividendos si los incluyes.'}
              </p>
            </div>
            <div className="card kpi reveal" style={{ '--i': 1 }}>
              <span className="kpi-label">Ganancias en ventas</span>
              <b className="kpi-val p">{sg(tax.gains)}</b>
              <span className="kpi-meta">{`${taxYearData.sales.winners} ventas con ganancia`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 2 }}>
              <span className="kpi-label">Pérdidas compensadas</span>
              <b className={`kpi-val ${cls(tax.losses)}`}>{tax.losses ? sg(tax.losses) : '$0.00'}</b>
              <span className="kpi-meta">{`${taxYearData.sales.count - taxYearData.sales.winners} ventas con pérdida`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 3 }}>
              <span className="kpi-label">Dividendos brutos</span>
              <b className="kpi-val">{f(taxYearData.dividends.gross)}</b>
              <span className="kpi-meta">{taxOpts.includeDiv ? 'incluidos en la base' : 'no incluidos en la base'}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 4 }}>
              <span className="kpi-label">Retención ya pagada</span>
              <b className="kpi-val">{f(tax.wh)}</b>
              <span className="kpi-meta">~30% en origen (EE. UU.)</span>
            </div>
          </div>

          {/* CÁLCULO PASO A PASO */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Cálculo <span className="section-sub">{`año ${taxYear}`}</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Concepto</th><th>Monto</th></tr></thead>
                  <tbody>
                    <tr><td>Ganancias en ventas</td><td className="p">{sg(tax.gains)}</td></tr>
                    <tr><td>Pérdidas en ventas</td><td className={tax.losses ? 'n' : 'neutral'}>{tax.losses ? sg(tax.losses) : '—'}</td></tr>
                    <tr className="row-sub"><td>Resultado neto de ventas</td><td className={cls(tax.salesNet)}>{sg(tax.salesNet)}</td></tr>
                    <tr><td>Dividendos brutos</td><td className={taxOpts.includeDiv ? '' : 'neutral'}>{taxOpts.includeDiv ? `+${f(tax.divGross)}` : 'no incluidos'}</td></tr>
                    <tr className="row-total"><td>Base gravable</td><td>{sg(tax.base)}</td></tr>
                    <tr><td>{`Tasa de impuesto`}</td><td>{hasRate ? `× ${taxRate}%` : '—'}</td></tr>
                    <tr><td>Impuesto bruto</td><td>{hasRate ? f(tax.grossTax) : '—'}</td></tr>
                    <tr><td>Crédito por retención en origen</td><td className="neutral">{hasRate && tax.credit ? `-${f(tax.credit)}` : '—'}</td></tr>
                    <tr className="row-total"><td>Impuesto a pagar</td><td>{hasRate ? f(tax.tax) : '—'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BASE POR MES */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Base por mes <span className="section-sub">se compensa en el total del año</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Mes</th><th>Ventas</th><th>Resultado ventas</th><th>Dividendos brutos</th><th>Base del mes</th></tr></thead>
                  <tbody>
                    {tax.months.slice().reverse().map(r => (
                      <tr key={r.m}>
                        <td className="strong">{lab(r.m)}</td>
                        <td className={r.count ? '' : 'neutral'}>{r.count || '—'}</td>
                        <td className={r.count ? cls(r.sales) : 'neutral'}>{r.count ? sg(r.sales) : '—'}</td>
                        <td className={r.div ? '' : 'neutral'}>{r.div ? f(r.div) : '—'}</td>
                        <td className={r.base ? cls(r.base) : 'neutral'}>{r.base ? sg(r.base) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total</td>
                      <td>{taxYearData.sales.count}</td>
                      <td>{sg(tax.salesNet)}</td>
                      <td>{f(tax.divGross)}</td>
                      <td>{sg(tax.base)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RESUMEN DE TODOS LOS AÑOS */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Todos los años <span className="section-sub">{hasRate ? `con tasa ${taxRate}%` : 'sin tasa'}</span></h2>
            </div>
            <div className="card table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Año</th><th>Resultado ventas</th><th>Dividendos</th><th>Base gravable</th><th>Impuesto a pagar</th></tr></thead>
                  <tbody>
                    {taxByYear.slice().reverse().map(t => (
                      <tr key={t.y} className={t.y === taxYear ? 'row-selected' : ''}>
                        <td className="strong">{t.y}</td>
                        <td className={cls(t.salesNet)}>{sg(t.salesNet)}</td>
                        <td className={taxOpts.includeDiv ? '' : 'neutral'}>{taxOpts.includeDiv ? f(t.divGross) : '—'}</td>
                        <td>{sg(t.base)}</td>
                        <td className="strong">{hasRate ? f(t.tax) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="row-total">
                      <td>Total</td>
                      <td>{sg(taxByYear.reduce((s, t) => s + t.salesNet, 0))}</td>
                      <td>{taxOpts.includeDiv ? f(taxByYear.reduce((s, t) => s + t.divGross, 0)) : '—'}</td>
                      <td>{sg(taxByYear.reduce((s, t) => s + t.base, 0))}</td>
                      <td>{hasRate ? f(taxByYear.reduce((s, t) => s + t.tax, 0)) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              Estimación orientativa, no asesoría tributaria. Usa costo promedio para la ganancia de cada venta y montos en USD;
              tu país puede exigir otro método (por ejemplo FIFO), convertir a moneda local con la tasa de cada fecha, permitir arrastrar pérdidas entre años
              o tratar distinto los dividendos. La crypto no tiene ventas registradas, así que no genera impuesto por ahora. La tasa se guarda solo en este navegador.
            </p>
          </div>
        </section>
      )}
      </main>
    </div>
  );
}

// Montar la aplicación React en el DOM
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
