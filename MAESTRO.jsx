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

// --- COMPONENTE PRINCIPAL: APP ---
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
    document.title = `${{ bolsa: 'Bolsa', crypto: 'Crypto', total: 'Total' }[activeTab]} · HAPI`;
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

  // Vista Total: todo el dinero entra por la bolsa (aportes HAPI); lo que pasa a Bakkt es capital de crypto
  const total = useMemo(() => {
    const netBolsa = portfolioData.D.reduce((t, r) => t + r[2] - r[3], 0);
    const netCrypto = crypto.withdrawn - crypto.returned;
    const capital = netBolsa + netCrypto;
    const bolsaVal = portfolioData.totalClosingVal;
    const value = bolsaVal + crypto.mv;
    const holdings = portfolioData.positionsRows
      .filter(r => r.q > 0)
      .map(r => ({ key: r.y, name: r.name, account: 'Bolsa', v: r.v }))
      .concat([
        { key: 'BTC', name: 'Bitcoin', account: 'Crypto', v: crypto.mv },
        { key: 'Efectivo', name: 'FDIC / margen', account: 'Bolsa', v: portfolioData.cashFdic }
      ])
      .sort((a, b) => b.v - a.v)
      .map(h => ({ ...h, pct: (h.v / value) * 100 }));
    return {
      capital,
      netBolsa,
      netCrypto,
      bolsaVal,
      value,
      gain: value - capital,
      gainPct: ((value - capital) / capital) * 100,
      bolsaGain: bolsaVal - netBolsa,
      cryptoGain: crypto.mv - netCrypto,
      bolsaPct: (bolsaVal / value) * 100,
      cryptoPct: (crypto.mv / value) * 100,
      holdings
    };
  }, [portfolioData, crypto]);

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
                  : `Total · bolsa + crypto · USD`}
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
                          <div className="ticker-cell">
                            <span className="ticker-symbol">{r.y}</span>
                            <span className="ticker-name">{r.name}</span>
                          </div>
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
                        <td title={portfolioData.N[o.y] || ''}>{o.y}</td>
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
          <div className="toolbar">
            <div className="toolbar-note">
              {`Bolsa al 30 sep 2026 · crypto ${crypto.live ? (btcPrice.source === 'manual' ? 'a precio manual' : 'a precio en vivo') : `al ${fd(crypto.cutDate)}`}`}
            </div>
          </div>

          <div className="kpi-grid">
            <div className="card kpi hero reveal" style={{ '--i': 0 }}>
              <span className="kpi-label">Patrimonio total</span>
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
                <div className="hero-stat"><span>Capital aportado</span><b>{f(total.capital)}</b></div>
                <div className="hero-stat"><span>Ganancia total</span><b className={cls(total.gain)}>{sg(total.gain)}</b></div>
                <div className="hero-stat"><span>Activos</span><b>{total.holdings.length - 1} + efectivo</b></div>
              </div>
              <p className="footnote">Capital aportado = todo lo que entró desde HAPI. Lo que pasó a Bakkt cuenta como capital de crypto, no como retiro.</p>
            </div>
            <div className="card kpi reveal" style={{ '--i': 1 }}>
              <span className="kpi-label">Bolsa</span>
              <b className="kpi-val">{f(total.bolsaVal)}</b>
              <span className={`tag ${cls(total.bolsaGain)}`}>{`${sg(total.bolsaGain)} · ${pc((total.bolsaGain / total.netBolsa) * 100)}`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 2 }}>
              <span className="kpi-label">Crypto</span>
              <b className="kpi-val">{f(crypto.mv)}</b>
              <span className={`tag ${cls(total.cryptoGain)}`}>{`${sg(total.cryptoGain)} · ${pc((total.cryptoGain / total.netCrypto) * 100)}`}</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 3 }}>
              <span className="kpi-label">Aportado a bolsa (neto)</span>
              <b className="kpi-val">{f(total.netBolsa)}</b>
              <span className="kpi-meta">aportes − traspasos a Bakkt</span>
            </div>
            <div className="card kpi reveal" style={{ '--i': 4 }}>
              <span className="kpi-label">Traspasado a crypto (neto)</span>
              <b className="kpi-val">{f(total.netCrypto)}</b>
              <span className="kpi-meta">{`invertido en lotes ${f(crypto.cost)}`}</span>
            </div>
          </div>

          {/* DISTRIBUCIÓN DEL PATRIMONIO */}
          <div className="section reveal">
            <div className="section-header">
              <h2 className="section-title">Distribución <span className="section-sub">{total.holdings.length} partidas · % del patrimonio</span></h2>
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
                          <div className="ticker-cell">
                            <span className="ticker-symbol">{h.key}</span>
                            <span className="ticker-name">{h.name}</span>
                          </div>
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
                      <td>{f(total.value)}</td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="note">
              En esta vista la ganancia de crypto se mide contra lo traspasado desde la bolsa ({f(total.netCrypto)}), no contra el costo de los lotes ({f(crypto.cost)}):
              por eso es {sg(total.cryptoGain)} y no {sg(crypto.gain)}. La diferencia son spreads y {f(crypto.unmatched)} traspasados sin lote asociado (pendiente de confirmar).
              Las fechas no coinciden: la bolsa es el cierre del 30 sep 2026 y crypto el corte del {fd(crypto.cutDate)}.
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
