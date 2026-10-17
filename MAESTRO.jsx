/**
 * MAESTRO.jsx
 * Componente maestro de React 18 para la visualización del Portafolio HAPI (Bolsa y Crypto).
 * Requiere: React 18, ReactDOM 18 y MAESTRO.js (HapiEngine).
 */

const { useState, useMemo, useEffect, useCallback, useRef } = React;

// --- ICONOS VECTORIALES INTEGRADOS (SVG) ---
const Icons = {
  Sun: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Refresh: ({ spinning }) => (
    <svg className={spinning ? 'spin' : ''} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
};

// --- COMPONENTE: GRÁFICO INTERACTIVO SVG ---
function InteractiveChart({ monthsData, f, lab }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 960;
  const H = 270;
  const L = 64;
  const R_PAD = 24;
  const B_PAD = 36;
  const T_PAD = 30;

  const n = monthsData.length;
  if (!n) return null;

  const barWidth = Math.min(36, Math.max(14, ((W - L - R_PAD) / n) * 0.45));

  // Acumulador de ganancia y segmentos apilados
  let cum = 0;
  const cumulative = monthsData.map(r => (cum += r.pl));

  const stacked = monthsData.map(r => {
    let posA = 0;
    let negB = 0;
    const segments = [];
    [
      [r.rl, '#38bdf8', 'Realizada'],
      [r.ur, '#f97316', 'No realizada']
    ].forEach(([val, color, type]) => {
      if (val >= 0) {
        segments.push({ y0: posA, y1: posA + val, color, val, type });
        posA += val;
      } else {
        segments.push({ y0: negB, y1: negB + val, color, val, type });
        negB += val;
      }
    });
    return segments;
  });

  const allValues = [
    ...cumulative.map(Math.abs),
    ...stacked.flat().map(s => Math.max(Math.abs(s.y0), Math.abs(s.y1)))
  ];
  const maxVal = Math.max(10, ...allValues) * 1.15;

  const yCoord = v => T_PAD + (H - T_PAD - B_PAD) * (1 - (v + maxVal) / (2 * maxVal));
  const xCoord = i => L + (W - L - R_PAD) * ((i + 0.5) / n);

  const handleMouseMove = (e, r, i) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPos = ((xCoord(i) / W) * rect.width);
    const yPos = Math.min(rect.height - 40, Math.max(40, (yCoord(cumulative[i]) / H) * rect.height));

    setTooltip({
      x: xPos,
      y: yPos,
      data: r,
      cumTotal: cumulative[i]
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const polylinePoints = cumulative.map((v, i) => `${xCoord(i)},${yCoord(v)}`).join(' ');

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Rendimiento Mensual y Evolución Acumulada</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-chip realized"></span> Realizada
          </span>
          <span className="legend-item">
            <span className="legend-chip unrealized"></span> No realizada
          </span>
          <span className="legend-item">
            <span className="legend-chip cumulative"></span> Total acumulado
          </span>
          <span className="legend-item">
            <span className="legend-chip deposit"></span> Depósito
          </span>
        </div>
      </div>

      <div className="svg-chart-wrapper" onMouseLeave={handleMouseLeave}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: '560px', display: 'block' }}
        >
          {/* Ejes y líneas de referencia */}
          {[-maxVal, 0, maxVal].map((val, idx) => {
            const y = yCoord(val);
            return (
              <g key={idx}>
                <line
                  x1={L}
                  x2={W - R_PAD}
                  y1={y}
                  y2={y}
                  stroke={val === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={val === 0 ? '1.5' : '1'}
                  strokeDasharray={val === 0 ? 'none' : '4 4'}
                />
                <text
                  x={L - 10}
                  y={y + 4}
                  fontSize="11"
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {f(Math.round(val)).replace('.00', '')}
                </text>
              </g>
            );
          })}

          {/* Barras apiladas de Realizada y No Realizada */}
          {stacked.map((segments, i) => {
            const x = xCoord(i) - barWidth / 2;
            const rowData = monthsData[i];
            return (
              <g
                key={`col-${i}`}
                onMouseMove={e => handleMouseMove(e, rowData, i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zona invisible para facilitar hover */}
                <rect
                  x={xCoord(i) - (W - L) / n / 2}
                  y={T_PAD}
                  width={(W - L) / n}
                  height={H - T_PAD - B_PAD}
                  fill="transparent"
                />
                {segments.map((seg, sIdx) => {
                  const yTop = Math.min(yCoord(seg.y0), yCoord(seg.y1));
                  const height = Math.max(1, Math.abs(yCoord(seg.y0) - yCoord(seg.y1)));
                  return (
                    <rect
                      key={sIdx}
                      x={x}
                      y={yTop}
                      width={barWidth}
                      height={height}
                      fill={seg.color}
                      rx="3"
                      opacity="0.9"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Línea de rendimiento total acumulado */}
          <polyline
            fill="none"
            stroke="var(--gain)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />

          {/* Puntos de datos y marcas de depósitos */}
          {monthsData.map((r, i) => {
            const cx = xCoord(i);
            const cy = yCoord(cumulative[i]);
            return (
              <g key={`marker-${i}`} onMouseMove={e => handleMouseMove(e, r, i)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="var(--gain)"
                  stroke="var(--bg-app)"
                  strokeWidth="2"
                />
                {r.d > 0 && (
                  <circle
                    cx={cx}
                    cy={14}
                    r="4.5"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                  >
                    <title>{`Depósito de ${f(r.d)}`}</title>
                  </circle>
                )}
                <text
                  x={cx}
                  y={H - 12}
                  fontSize="11"
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontFamily="'Outfit', sans-serif"
                  fontWeight="500"
                >
                  {lab(r.m)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip flotante interactivo */}
        {tooltip && (
          <div
            className="chart-tooltip-floating"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`
            }}
          >
            <div className="tooltip-header">{lab(tooltip.data.m)}</div>
            <div className="tooltip-row">
              <span>Realizada:</span>
              <span className={tooltip.data.rl >= 0 ? 'p' : 'n'}>{f(tooltip.data.rl)}</span>
            </div>
            <div className="tooltip-row">
              <span>No realizada:</span>
              <span className={tooltip.data.ur >= 0 ? 'p' : 'n'}>{f(tooltip.data.ur)}</span>
            </div>
            <div className="tooltip-row">
              <span>Divid./Cargos:</span>
              <span>{f(tooltip.data.dv)}</span>
            </div>
            <div className="tooltip-row">
              <span>Total Mes:</span>
              <span className={tooltip.data.pl >= 0 ? 'p' : 'n'}>{f(tooltip.data.pl)}</span>
            </div>
            <div className="tooltip-row" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span>Acumulado:</span>
              <span style={{ color: 'var(--gain)' }}>{f(tooltip.cumTotal)}</span>
            </div>
            {tooltip.data.d > 0 && (
              <div className="tooltip-row">
                <span>Depósito:</span>
                <span style={{ color: 'var(--amber)' }}>{f(tooltip.data.d)}</span>
              </div>
            )}
            <div className="tooltip-row">
              <span>Cierre Portafolio:</span>
              <span>{f(tooltip.data.v)}</span>
            </div>
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
    dt,
    computePortfolioData,
    getPeriodSummary,
    computeCryptoRows,
    fetchBtcData,
    loadBtcStorage,
    saveBtcStorage
  } = engine;

  // Estado del portafolio base
  const portfolioData = useMemo(() => computePortfolioData(), []);

  // Estados de interfaz
  const [activeTab, setActiveTab] = useState('bolsa');
  const [period, setPeriod] = useState('YTD');
  const [theme, setTheme] = useState(() => localStorage.getItem('hapi_theme') || 'dark');
  const [posSearch, setPosSearch] = useState('');
  const [opsSearch, setOpsSearch] = useState('');
  const [opsType, setOpsType] = useState('ALL');

  // Estado de Crypto y BTC
  const [btcStorage, setBtcStorage] = useState(() => loadBtcStorage());
  const [isUpdatingBtc, setIsUpdatingBtc] = useState(false);
  const [btcStatusMsg, setBtcStatusMsg] = useState(
    btcStorage.timestamp ? `Última cotización guardada: ${btcStorage.timestamp}` : ''
  );
  const [manualSpotInput, setManualSpotInput] = useState(
    btcStorage.spot ? btcStorage.spot.toString() : ''
  );

  // Manejador del Tema (Dark / Light)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hapi_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
  const cryptoData = useMemo(() => {
    const spot = parseFloat(manualSpotInput) || btcStorage.spot || null;
    return computeCryptoRows(btcStorage.history, spot, btcStorage.overrides);
  }, [btcStorage, manualSpotInput]);

  // Actualización de BTC vía Yahoo Finance
  const handleUpdateBtc = async () => {
    setIsUpdatingBtc(true);
    setBtcStatusMsg('Consultando Yahoo Finance vía proxies CORS...');
    try {
      const res = await fetchBtcData();
      const updatedStorage = {
        ...btcStorage,
        history: res.history,
        spot: res.spot,
        timestamp: res.timestamp
      };
      setBtcStorage(updatedStorage);
      saveBtcStorage(updatedStorage);
      setManualSpotInput(res.spot.toString());
      setBtcStatusMsg(`Actualizado exitosamente: ${res.timestamp}`);
    } catch (err) {
      console.error(err);
      setBtcStatusMsg('No se pudo consultar Yahoo Finance automáticamente. Ingresa el precio de BTC manualmente.');
    } finally {
      setIsUpdatingBtc(false);
    }
  };

  // Cambio de precio manual de BTC en tabla
  const handleTransferPriceChange = (index, value) => {
    const num = parseFloat(value);
    const newOverrides = { ...btcStorage.overrides };
    if (!isNaN(num) && num > 0) {
      newOverrides[index] = num;
    } else {
      delete newOverrides[index];
    }
    const updatedStorage = { ...btcStorage, overrides: newOverrides };
    setBtcStorage(updatedStorage);
    saveBtcStorage(updatedStorage);
  };

  // Cambio de precio spot manual
  const handleSpotPriceChange = e => {
    const val = e.target.value;
    setManualSpotInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const updatedStorage = { ...btcStorage, spot: num };
      setBtcStorage(updatedStorage);
      saveBtcStorage(updatedStorage);
    }
  };

  const periodKeys = ['1M', '3M', '6M', 'YTD', '1A', '2025', '2026', 'ALL'];

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">H</div>
          <div className="brand-text">
            <h1>
              HAPI · Portafolio
              <span className="brand-badge">Apex Clearing</span>
            </h1>
            <div className="brand-sub">
              <span className="dot"></span>
              Historial mensual consolidado · jun 2025 – sep 2026 · USD
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>
      </header>

      {/* PESTAÑAS PRINCIPALES */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'bolsa' ? 'active' : ''}`}
          onClick={() => setActiveTab('bolsa')}
        >
          <span>Bolsa de Valores</span>
          <span className="tab-pill-count">16 meses</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          <span>Crypto (Bakkt)</span>
          <span className="tab-pill-count">10 traspasos</span>
        </button>
      </nav>

      {/* VISTA 1: BOLSA */}
      {activeTab === 'bolsa' && (
        <section>
          {/* BARRA DE PERÍODOS */}
          <div className="period-bar-container">
            <div className="period-pills">
              {periodKeys.map(k => (
                <button
                  key={k}
                  className={`period-btn ${period === k ? 'active' : ''}`}
                  onClick={() => setPeriod(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="period-range-label font-heading">
              <b>{lab(periodSummary.firstMonth)}</b> – <b>{lab(periodSummary.lastMonth)}</b>
              <span>({periodSummary.monthsCount} {periodSummary.monthsCount > 1 ? 'meses' : 'mes'})</span>
            </div>
          </div>

          {/* TARJETAS KPI (FORMATO MAESTRO) */}
          <div className="cards-grid">
            <div className="card-kpi">
              <span className="card-kpi-label">Realizada</span>
              <b className={`card-kpi-val ${cls(periodSummary.rl)}`}>
                {sg(periodSummary.rl)}
              </b>
              <span className={`card-kpi-pct ${cls(periodSummary.rl)}`}>
                {pc((periodSummary.rl / periodSummary.base) * 100)}
              </span>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">No realizada</span>
              <b className={`card-kpi-val ${cls(periodSummary.ur)}`}>
                {sg(periodSummary.ur)}
              </b>
              <span className={`card-kpi-pct ${cls(periodSummary.ur)}`}>
                {pc((periodSummary.ur / periodSummary.base) * 100)}
              </span>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Realizada + no realizada</span>
              <b className={`card-kpi-val ${cls(periodSummary.capitalGain)}`}>
                {sg(periodSummary.capitalGain)}
              </b>
              <span className={`card-kpi-pct ${cls(periodSummary.capitalGain)}`}>
                {pc((periodSummary.capitalGain / periodSummary.base) * 100)}
              </span>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Dividendos netos y cargos</span>
              <b className={`card-kpi-val ${cls(periodSummary.dv)}`}>
                {sg(periodSummary.dv)}
              </b>
              <span className={`card-kpi-pct ${cls(periodSummary.dv)}`}>
                {pc((periodSummary.dv / periodSummary.base) * 100)}
              </span>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Rendimiento total</span>
              <b className={`card-kpi-val ${cls(periodSummary.total)}`}>
                {sg(periodSummary.total)}
              </b>
              <span className={`card-kpi-pct ${cls(periodSummary.total)}`}>
                {pc((periodSummary.total / periodSummary.base) * 100)}
              </span>
            </div>
          </div>

          {/* TEXTO DE RESUMEN DEL PERÍODO */}
          <div className="info-subtext">
            Depositado {f(periodSummary.deposited)} · Retirado {f(periodSummary.withdrawn)} · Valor al cierre {f(periodSummary.closingValue)} · Los depósitos no cuentan como ganancia; los % son sobre el capital promedio del periodo.
          </div>

          {/* LEYENDA DEL GRÁFICO */}
          <div className="chart-legend-row">
            <span style={{ color: 'var(--sky)' }}>■</span> Realizada &nbsp;
            <span style={{ color: 'var(--orange)' }}>■</span> No realizada &nbsp;
            <span style={{ color: 'var(--gain)' }}>—</span> Total acumulado &nbsp;
            <span style={{ color: 'var(--amber)' }}>○</span> Depósitos
          </div>

          {/* GRÁFICO INTERACTIVO */}
          <InteractiveChart monthsData={selectedMonths} f={f} lab={lab} />

          {/* TABLA DE POSICIONES Y ACTIVOS */}
          <div className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">
                Posiciones y activos · precios al 30 sep 2026
              </h2>
            </div>

            <div className="table-card">
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
                        <td title={r.name}>{r.y}</td>
                        <td>{r.q > 0 ? r.q.toFixed(5) : '—'}</td>
                        <td>{r.q > 0 ? f(r.avgCost) : '—'}</td>
                        <td>{r.q > 0 ? f(r.price) : '—'}</td>
                        <td>{r.q > 0 ? f(r.v) : '—'}</td>
                        <td>{r.q > 0 ? (r.portfolioPct).toFixed(1) + '%' : '—'}</td>
                        <td className={r.q > 0 ? cls(r.u) : 'neutral'}>
                          {r.q > 0 ? `${sg(r.u)} (${pc(r.unrealizedPct)})` : '—'}
                        </td>
                        <td className={r.r !== 0 ? cls(r.r) : 'neutral'}>
                          {r.r !== 0 ? sg(r.r) : '—'}
                        </td>
                      </tr>
                    ))}
                    {/* FILA DE EFECTIVO / FDIC */}
                    <tr className="row-cash">
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
          <div className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">Rendimiento mensual</h2>
            </div>
            <div className="table-card">
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
                        <td style={{ fontWeight: '500' }}>{lab(r.m)}</td>
                        <td>{f(r.v)}</td>
                        <td>{f(r.d)}</td>
                        <td>{f(r.w)}</td>
                        <td className={cls(r.rl)}>{sg(r.rl)}</td>
                        <td className={cls(r.ur)}>{sg(r.ur)}</td>
                        <td className={cls(r.dv)}>{sg(r.dv)}</td>
                        <td className={cls(r.pl)} style={{ fontWeight: '600' }}>
                          {sg(r.pl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* TABLA DE OPERACIONES */}
          <div className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">
                Operaciones del periodo
              </h2>
            </div>

            <div className="table-card">
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
                        <td>{o.t === 'B' ? 'Compra' : o.t === 'S' ? 'Venta' : 'Split'}</td>
                        <td title={portfolioData.N[o.y] || ''}>{o.y}</td>
                        <td>{o.q}</td>
                        <td>{o.a ? f(o.a) : '—'}</td>
                        <td className={o.g == null ? '' : cls(o.g)}>
                          {o.g == null ? '—' : sg(o.g)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VISTA 2: CRYPTO (BAKKT) */}
      {activeTab === 'crypto' && (
        <section>
          {/* PANEL DE CONTROL DE PRECIO BTC */}
          <div className="crypto-controls-card">
            <div className="crypto-action-group">
              <button
                className="btn-primary"
                onClick={handleUpdateBtc}
                disabled={isUpdatingBtc}
              >
                <Icons.Refresh spinning={isUpdatingBtc} />
                <span>{isUpdatingBtc ? 'Actualizando…' : 'Actualizar precio'}</span>
              </button>
              <div className="crypto-status-text">{btcStatusMsg}</div>
            </div>

            <div className="manual-spot-input-group">
              <span>Precio manual de BTC (si falla la consulta):</span>
              <input
                type="number"
                step="any"
                className="input-styled"
                placeholder="Ej. 65000"
                value={manualSpotInput}
                onChange={handleSpotPriceChange}
              />
            </div>
          </div>

          {/* TARJETAS KPI DE CRYPTO */}
          <div className="cards-grid">
            <div className="card-kpi">
              <span className="card-kpi-label">Invertido neto</span>
              <b className="card-kpi-val">{f(cryptoData.totalInvested)}</b>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">BTC estimado</span>
              <b className="card-kpi-val" style={{ color: 'var(--amber)' }}>
                {cryptoData.totalBtc.toFixed(6)}
              </b>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Precio promedio</span>
              <b className="card-kpi-val">
                {cryptoData.avgPrice > 0 ? f(cryptoData.avgPrice) : '—'}
              </b>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Precio actual</span>
              <b className="card-kpi-val" style={{ color: 'var(--sky)' }}>
                {btcStorage.spot || manualSpotInput ? f(parseFloat(manualSpotInput) || btcStorage.spot) : '—'}
              </b>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Valor actual</span>
              <b className="card-kpi-val">
                {cryptoData.currentVal != null ? f(cryptoData.currentVal) : '—'}
              </b>
            </div>

            <div className="card-kpi">
              <span className="card-kpi-label">Ganancia / pérdida</span>
              <b className={`card-kpi-val ${cls(cryptoData.profitLoss)}`}>
                {cryptoData.profitLoss != null ? sg(cryptoData.profitLoss) : '—'}
              </b>
              {cryptoData.roiPct != null && (
                <span className={`card-kpi-pct ${cls(cryptoData.profitLoss)}`}>
                  {pc(cryptoData.roiPct)}
                </span>
              )}
            </div>
          </div>

          {/* TABLA DE TRASPASOS A BAKKT */}
          <div className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">Registro de Traspasos a Bakkt</h2>
            </div>
            <div className="table-card">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha Traspaso</th>
                      <th>Monto Traspasado</th>
                      <th>Precio BTC (USD)</th>
                      <th>BTC Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoData.rows.map(r => {
                      const isManual = r.manualPrice != null;
                      return (
                        <tr key={r.index}>
                          <td className="font-mono">{r.date}</td>
                          <td className="font-mono" style={{ fontWeight: '600' }}>
                            {f(r.amount)}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              className={`table-input-price ${isManual ? 'manual-override' : ''}`}
                              defaultValue={r.manualPrice != null ? r.manualPrice : ''}
                              placeholder={r.historicalPrice ? r.historicalPrice.toFixed(0) : '—'}
                              onBlur={e => handleTransferPriceChange(r.index, e.target.value)}
                              title={isManual ? 'Precio editado manualmente' : 'Precio de cierre histórico de Yahoo'}
                            />
                          </td>
                          <td className="font-mono" style={{ color: 'var(--amber)', fontWeight: '600' }}>
                            {r.estimatedBtc > 0 ? r.estimatedBtc.toFixed(6) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="crypto-explainer-card">
              <b>Nota metodológica:</b> El BTC estimado se calcula dividiendo el monto traspasado entre el precio de cierre diario de BTC-USD (Yahoo Finance) en la fecha correspondiente. Si compraste en un día diferente o con comisiones, puedes editar el precio directamente en la celda de la tabla y los totales se actualizarán de inmediato.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Montar la aplicación React en el DOM
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
