/**
 * MAESTRO.js
 * Motor de datos, cálculos financieros y lógica de negocio para el Portafolio HAPI (Bolsa y Crypto).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HapiEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- DATOS MAESTROS ---

  // Valores mensuales de estados de cuenta Apex/HAPI:
  // [mes, valor_cierre, depositos, retiros_bakkt, dividendos_y_cargos]
  const D = [
    ['2025-06', 294.4,  288.98,  0,     0.29],
    ['2025-07', 491.26, 188,     0,     0.29],
    ['2025-08', 519.03, 0,       0,     0],
    ['2025-09', 1055.6, 485,     0,     0.41],
    ['2025-10', 1226.68,160,     60.6,  0.56],
    ['2025-11', 2905.77,1780.01, 124.55,0],
    ['2025-12', 4311.83,1680,    202,   2.84],
    ['2026-01', 4507.97,382.34,  162.58,0],
    ['2026-02', 5207.02,788.04,  77.57, 0],
    ['2026-03', 5695.71,890,     0,     4.02],
    ['2026-04', 6481.25,360,     43.43, 0.01],
    ['2026-05', 6875.2, 0,       0,     0.01],
    ['2026-06', 6522.29,0.92,    0,     4.96],
    ['2026-07', 7127.3, 420,     0,     0.71],
    ['2026-08', 7492.16,394,     404,   -2],
    ['2026-09', 8367.8, 325,     0,     4.43]
  ];

  // Operaciones ejecutadas (formato: YYMMDD,Tipo,Ticker,Cantidad,Monto)
  // Tipos: B = Compra, S = Venta, X = Split
  const T_RAW = '250623,B,QQQ,.09505,50.15;250623,B,NDAQ,.23142,20.15;250623,B,SPY,.08421,50.15;250623,B,VOO,.0274,15.15;250624,S,NDAQ,.23142,19.88;250624,S,SPY,.08421,50.25;250625,B,QQQ,.01117,6.15;250625,B,SCHD,1.60262,42.9;250625,B,VT,.59739,75.55;250625,B,VOO,.17727,98.91;250718,S,SCHD,1.60262,43.05;250721,B,GOOGL,.23566,43.59;250722,B,GOOGL,.79765,151.17;250722,B,QQQ,.01591,9.14;250722,B,VT,.06389,8.49;250722,B,VOO,.03284,19.19;250903,B,QQQ,.01704,9.75;250903,B,NVDA,.11714,20.15;250903,B,VT,.11342,15.15;250923,B,QQQ,.1599,96.14;250923,B,NVDA,.38116,67.15;250923,B,VT,.70514,97.15;250923,B,VOO,.16318,100.15;250924,B,NVDA,.43905,79.15;251003,B,META,.06884,50.14;251007,B,META,.07135,50.4;251014,S,VT,1.47984,202.46;251015,B,VGT,.27224,202.45;251103,S,GOOGL,.5166,144.73;251103,S,VGT,.27224,216.82;251104,B,NFLX,.32139,361.61;251105,B,META,.2126,135;251110,B,QQQ,.18182,110.15;251110,B,VOO,.17817,109.15;251110,S,GOOGL,.51671,143.07;251114,B,META,.23342,143.77;251118,B,META,.66657,400.15;251118,B,QQQ,.65913,400.15;251118,X,NFLX,2.89251,0;251118,B,VOO,.8157,500.15;251204,B,NFLX,2.92261,300.01;251212,B,SPOT,.99717,600.15;260105,B,NFLX,1.08043,100.15;260105,B,TQQQ,9.6043,500.15;260108,B,SPOT,.34829,200.15;260112,S,TQQQ,9.6043,528.13;260115,B,TQQQ,10.0243,528.13;260116,S,TQQQ,10.0243,554.79;260130,B,TQQQ,9.34404,500.15;260203,B,GLD,.91455,400.15;260206,B,MSFT,.50005,200.15;260209,B,TQQQ,1.00623,50.15;260213,B,AMZN,.31746,64.15;260213,B,TQQQ,1.03299,50.55;260304,B,QQQ,.08347,49.7;260304,B,MSFT,.50632,200.15;260304,B,TQQQ,4.29507,200.15;260402,B,TQQQ,4.63338,200.15;260406,B,META,.3493,200.15;260410,S,AMZN,.31746,73.61;260414,S,NVDA,.93735,176.91;260414,S,TQQQ,17,846.02;260415,S,NFLX,5,527.62;260417,B,SPOT,.27917,150.15;260421,B,MSFT,.59792,250.15;260422,S,TQQQ,1.8,104.47;260424,B,MSFT,.60602,250.15;260429,B,SPOT,.3506,150.15;260501,B,META,.24847,150.15;260501,B,MSFT,.37395,150.15;260507,S,TQQQ,1.51171,105.1;260513,B,TQQQ,1.26294,93.15;260519,B,TQQQ,1.44912,107.15;260527,S,TQQQ,2.71206,219.91;260604,B,GLD,.27669,113.15;260608,B,TQQQ,4.57456,350.15;260608,B,TQQQ,5.64702,450.15;260616,S,TQQQ,10.22158,866.58;260623,B,GOOGL,.19564,68.74;260624,B,TQQQ,5.98838,450.15;260625,B,TQQQ,4.88179,350.15;260701,S,TQQQ,10.87017,867.2;260708,B,TQQQ,6.15782,450.15;260708,B,SMH,.1201,70.15;260709,B,TQQQ,4.98323,350.15;260710,S,TQQQ,11.14105,846.28;260714,B,TQQQ,7.51492,550.15;260717,B,GOOGL,.12795,46.15;260717,B,TQQQ,6.42144,450.15;260720,B,GOOGL,2.8937,1000.15;260724,B,MSFT,1.31282,500.15;260724,B,TQQQ,1.14265,75.22;260724,S,NFLX,2.21694,152.32;260724,S,SPOT,1.97523,922.89;260728,B,META,.83911,500.15;260731,S,MSFT,1.4,622.94;260804,B,TQQQ,.6431,42.15;260805,S,TQQQ,14.5,1080.14;260812,B,TQQQ,1.09923,80.15;260819,B,META,.72948,400.15;260821,B,TQQQ,5.66189,400.15;260825,B,SMH,.1587,87.14;260902,B,TQQQ,1.45734,100.15;260902,B,TQQQ,4.75162,325.15;260910,B,GOOGL,3.72872,1226.15;260910,S,META,1.9,1226;260922,S,TQQQ,14.19219,1084.6';

  // Dividendos cobrados (formato: YYMMDD,Ticker,Bruto,Retención). Neto = bruto − retención (ver HAPI_estados_de_cuenta.md §4)
  const DIV_RAW = '250630,SCHD,.42,.13;250702,VOO,.36,.11;250731,QQQ,.06,.02;250915,GOOGL,.22,.07;250923,VT,.37,.11;251001,VOO,.7,.21;251031,QQQ,.1,.03;251223,META,.66,.2;251224,VOO,2.47,.74;251226,NVDA,.01,0;251231,QQQ,.91,.27;260312,MSFT,.46,.14;260326,META,.66,.2;260327,QQQ,.9,.27;260331,TQQQ,1.12,.34;260331,VOO,2.61,.78;260401,NVDA,.01,0;260611,MSFT,2.35,.71;260625,META,.97,.29;260630,TQQQ,1.03,.31;260630,VOO,2.74,.82;260710,QQQ,1,.3;260910,MSFT,2.27,.68;260914,GOOGL,.71,.21;260928,META,.8,.24;260930,VOO,2.54,.76';

  // Series fijas del gráfico de dividendos (el color sigue a la acción, nunca al ranking); el resto va a "Otros"
  const DIV_KEYS = ['VOO', 'MSFT', 'META', 'QQQ', 'TQQQ'];

  // Nombres completos de los activos
  const N = {
    GOOGL: 'Alphabet',
    META: 'Meta',
    QQQ: 'Invesco QQQ',
    MSFT: 'Microsoft',
    TQQQ: 'ProShares UltraPro QQQ',
    GLD: 'SPDR Gold',
    VOO: 'Vanguard S&P 500',
    SMH: 'VanEck Semiconductor',
    NFLX: 'Netflix',
    SPOT: 'Spotify',
    NVDA: 'Nvidia',
    AMZN: 'Amazon',
    VT: 'Vanguard Total World',
    VGT: 'Vanguard Info Tech',
    SCHD: 'Schwab Dividend',
    SPY: 'SPDR S&P 500',
    NDAQ: 'Nasdaq'
  };

  // Precios de mercado de activos en cartera al 30 de septiembre de 2026
  const PR = {
    GOOGL: 344.08,
    META: 725.18,
    QQQ: 739.77,
    MSFT: 512.9,
    GLD: 380.84,
    VOO: 700.86,
    SMH: 609
  };

  // Traspasos a Bakkt Crypto [fecha, monto_usd]
  const X = [
    ['2025-10-06', 60.6],
    ['2025-11-18', 20.2],
    ['2025-11-19', 104.35],
    ['2025-12-17', 202],
    ['2026-01-08', 162.58],
    ['2026-02-02', 54.67],
    ['2026-02-03', 22.9],
    ['2026-04-16', 43.43],
    ['2026-06-03', -0.92],
    ['2026-08-11', 404]
  ];

  // Portafolio crypto (Bakkt) según la foto "Share Lots" de la app de cálculo (ver HAPI_crypto.md).
  // summary = fila resumen de la foto.
  // lots = [fecha_lote, cantidad, costo_unitario, costo_total, valor_corte, ganancia_corte, ganancia_pct_corte, fecha_traspaso_bolsa]
  const CRYPTO = {
    asset: 'BTC-USD',
    cutDate: '2026-10-17',
    price: 81276.05,
    dayPct: -0.28,
    dayUsd: -2.97,
    summary: { qty: 0.013244, cost: 1006.74, mv: 1076.39, gain: 69.65, gainPct: 6.92 },
    lots: [
      ['2025-11-17', 0.000217, 91751.53, 19.91, 17.64, -2.27, -11.42, '2025-11-18'],
      ['2025-11-19', 0.00111, 91423.11, 101.48, 90.22, -11.26, -11.1, '2025-11-19'],
      ['2025-12-17', 0.002313, 86461.43, 201.16, 187.99, -13.16, -6.54, '2025-12-17'],
      ['2026-01-08', 0.001778, 90529.72, 162.57, 144.51, -18.06, -11.11, '2026-01-08'],
      ['2026-01-31', 0.000667, 81207.99, 54.71, 54.21, -0.49, -0.9, '2026-02-02'],
      ['2026-02-02', 0.000289, 78404.92, 23.89, 23.49, -0.4, -1.68, '2026-02-03'],
      ['2026-04-16', 0.000576, 74704.65, 43.0, 46.78, 3.78, 8.8, '2026-04-16'],
      ['2026-08-11', 0.006294, 63557.0, 400.03, 511.55, 111.52, 27.88, '2026-08-11']
    ]
  };

  // --- FORMATEADORES ---

  const MN = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  // 'YYYY-MM-DD' -> '11 ago 2026'
  const fd = d => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${parseInt(day, 10)} ${MN[parseInt(m, 10) - 1]} ${y}`;
  };

  const lab = m => {
    if (!m) return '';
    const parts = m.split('-');
    const idx = parseInt(parts[1], 10) - 1;
    return `${MN[idx]} ${parts[0].slice(2)}`;
  };

  const f = n => {
    if (n == null || isNaN(n)) return '—';
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const sg = n => {
    if (n == null || isNaN(n)) return '—';
    return n < 0 ? f(n) : '+' + f(n);
  };

  const pc = n => {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  };

  const cls = n => {
    if (n == null || isNaN(n) || n === 0) return 'neutral';
    return n > 0 ? 'p' : 'n';
  };

  const dt = d => {
    if (!d || d.length < 6) return d;
    return `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`;
  };

  // --- MOTOR DE CÁLCULO DE BOLSA ---

  function computePortfolioData() {
    // 1. Parsear lista de operaciones
    const rawOps = T_RAW.split(';').map(s => {
      const [d, t, y, q, a] = s.split(',');
      return {
        d,
        m: '20' + d.slice(0, 2) + '-' + d.slice(2, 4),
        t,
        y,
        q: +q,
        a: +a,
        g: null
      };
    });

    // 2. Procesar posiciones y ganancias realizadas
    const pos = {};
    const mr = {}; // Ganancia realizada por mes

    rawOps.forEach(o => {
      const p = pos[o.y] || (pos[o.y] = { q: 0, c: 0, r: 0 });
      if (o.t === 'S') {
        const costBasisOfSold = p.q > 0 ? (p.c / p.q) * o.q : 0;
        o.g = o.a - costBasisOfSold;
        p.q -= o.q;
        p.c -= costBasisOfSold;
        p.r += o.g;
        mr[o.m] = (mr[o.m] || 0) + o.g;
      } else if (o.t === 'B') {
        p.q += o.q;
        p.c += o.a;
      } else if (o.t === 'X') {
        // Split: suma cantidad de acciones sin alterar costo base total
        p.q += o.q;
      }
    });

    // 3. Calcular rendimientos mensuales (R)
    let prevVal = 0;
    const R = D.map(([m, v, d, w, dv]) => {
      const rl = mr[m] || 0;
      const fl = d - w; // Flujo neto de efectivo
      const pl = v - prevVal - fl; // Ganancia/pérdida total del mes
      const r = {
        m,
        v,
        d,
        w,
        rl,
        dv,
        pl,
        ur: pl - rl - dv, // No realizada
        base: prevVal + fl / 2 // Capital promedio mensual
      };
      prevVal = v;
      return r;
    });

    // 4. Predefinir períodos
    const P = {
      '1M': R.slice(-1),
      '3M': R.slice(-3),
      '6M': R.slice(-6),
      'YTD': R.filter(r => r.m >= '2026-01'),
      '1A': R.slice(-12),
      '2025': R.filter(r => r.m < '2026-01'),
      '2026': R.filter(r => r.m >= '2026-01'),
      'ALL': R
    };

    // 5. Calcular posiciones actuales y efectivo FDIC
    const lastMonth = R[R.length - 1];
    const totalClosingVal = lastMonth ? lastMonth.v : 0;

    const positionsRows = Object.entries(pos).map(([y, p]) => {
      const hasShares = p.q > 1e-6;
      const q = hasShares ? p.q : 0;
      const price = PR[y] || 0;
      const v = q * price;
      const c = hasShares ? p.c : 0;
      return {
        y,
        name: N[y] || y,
        q,
        price,
        c,
        avgCost: q > 0 ? c / q : 0,
        v,
        portfolioPct: totalClosingVal > 0 && q > 0 ? (v / totalClosingVal) * 100 : 0,
        u: v - c,
        unrealizedPct: c > 0 ? ((v - c) / c) * 100 : 0,
        r: p.r
      };
    }).sort((a, b) => b.v - a.v || b.r - a.r);

    const investedTotal = positionsRows.reduce((t, r) => t + r.v, 0);
    const cashFdic = Math.max(0, totalClosingVal - investedTotal);
    const cashPct = totalClosingVal > 0 ? (cashFdic / totalClosingVal) * 100 : 0;

    return {
      D,
      T: rawOps,
      N,
      PR,
      X,
      R,
      P,
      pos,
      mr,
      positionsRows,
      cashFdic,
      cashPct,
      totalClosingVal
    };
  }

  // Calcula agregados para un subconjunto de meses S
  function getPeriodSummary(S) {
    if (!S || S.length === 0) {
      return {
        rl: 0,
        ur: 0,
        capitalGain: 0,
        dv: 0,
        total: 0,
        base: 1,
        deposited: 0,
        withdrawn: 0,
        closingValue: 0,
        firstMonth: '',
        lastMonth: '',
        monthsCount: 0
      };
    }

    const sum = fn => S.reduce((t, r) => t + fn(r), 0);
    const base = sum(r => r.base) / S.length || 1;
    const rl = sum(r => r.rl);
    const ur = sum(r => r.ur);
    const dv = sum(r => r.dv);
    const capitalGain = rl + ur;
    const total = capitalGain + dv;
    const lastRow = S[S.length - 1];

    return {
      rl,
      ur,
      capitalGain,
      dv,
      total,
      base,
      deposited: sum(r => r.d),
      withdrawn: sum(r => r.w),
      closingValue: lastRow.v,
      firstMonth: S[0].m,
      lastMonth: lastRow.m,
      monthsCount: S.length
    };
  }

  // --- MOTOR DEL DASHBOARD ANUAL ---

  const r2 = n => Math.round(n * 100) / 100;

  // Años con estados de cuenta
  function getYears(data) {
    return [...new Set(data.R.map(r => r.m.slice(0, 4)))];
  }

  // Estadísticas de un año: crecimiento, dividendos, ventas y depósitos por mes
  function computeYearDashboard(data, year) {
    const idx = data.R.findIndex(r => r.m.startsWith(year));
    const months = data.R.filter(r => r.m.startsWith(year));
    const startValue = idx > 0 ? data.R[idx - 1].v : 0;
    const endValue = months[months.length - 1].v;

    // Entradas desde Bakkt (X negativos) vienen dentro de "depósitos" en D: se separan de los aportes HAPI
    const inflow = {};
    X.filter(x => x[1] < 0).forEach(([d, a]) => {
      const m = d.slice(0, 7);
      inflow[m] = (inflow[m] || 0) - a;
    });

    // Dividendos
    const dividends = DIV_RAW.split(';').map(s => {
      const [d, y, g, w] = s.split(',');
      return { date: dt(d), m: dt(d).slice(0, 7), y, gross: +g, wh: +w, net: r2(+g - +w), key: DIV_KEYS.includes(y) ? y : 'Otros' };
    }).filter(x => x.date.startsWith(year));

    // Ventas con su ganancia realizada (costo promedio)
    const sales = data.T.filter(o => o.t === 'S' && o.m.startsWith(year)).map(o => {
      const cost = o.a - o.g;
      return { date: dt(o.d), m: o.m, y: o.y, name: N[o.y] || o.y, q: o.q, amount: o.a, cost, gain: o.g, pct: cost > 0 ? (o.g / cost) * 100 : 0 };
    });

    const byMonth = months.map(r => {
      const inf = inflow[r.m] || 0;
      const divs = dividends.filter(x => x.m === r.m);
      const divByKey = {};
      divs.forEach(x => { divByKey[x.key] = r2((divByKey[x.key] || 0) + x.net); });
      const ms = sales.filter(x => x.m === r.m);
      return {
        m: r.m,
        deposits: r2(r.d - inf),
        toCrypto: r2(inf - r.w),
        divNet: r2(divs.reduce((t, x) => t + x.net, 0)),
        divByKey,
        divs,
        sales: ms,
        realized: r.rl,
        realizedPct: r.base > 0 ? (r.rl / r.base) * 100 : 0,
        dv: r.dv,
        unrealized: r.ur,
        value: r.v
      };
    });

    const sum = fn => byMonth.reduce((t, r) => t + fn(r), 0);
    const deposits = sum(r => r.deposits);
    const toCrypto = sum(r => r.toCrypto);
    const realized = sum(r => r.realized);
    const dv = sum(r => r.dv);
    const unrealized = sum(r => r.unrealized);
    const divNet = dividends.reduce((t, x) => t + x.net, 0);
    const growth = endValue - startValue;
    const salesCost = sales.reduce((t, x) => t + x.cost, 0);
    const depMonths = byMonth.filter(r => r.deposits > 0);

    return {
      year,
      months: byMonth,
      firstMonth: months[0].m,
      lastMonth: months[months.length - 1].m,
      startValue,
      endValue,
      growth,
      growthPct: startValue > 0 ? (growth / startValue) * 100 : null,
      // Crecimiento = depósitos + traspasos a crypto + ventas + (dividendos, intereses y cargos) + no realizada
      parts: { deposits, toCrypto, realized, dv, divNet, charges: dv - divNet, unrealized },
      dividends: {
        rows: dividends,
        net: divNet,
        gross: dividends.reduce((t, x) => t + x.gross, 0),
        wh: dividends.reduce((t, x) => t + x.wh, 0),
        keys: DIV_KEYS.concat('Otros').filter(k => dividends.some(x => x.key === k)),
        best: byMonth.reduce((b, r) => (r.divNet > (b ? b.divNet : 0) ? r : b), null)
      },
      sales: {
        rows: sales,
        realized,
        count: sales.length,
        avgMonthly: realized / byMonth.length,
        avgMonthlyPct: byMonth.reduce((t, r) => t + r.realizedPct, 0) / byMonth.length,
        onCostPct: salesCost > 0 ? (realized / salesCost) * 100 : 0,
        winners: sales.filter(x => x.gain > 0).length
      },
      deposits: {
        total: deposits,
        avgMonthly: deposits / byMonth.length,
        monthsWith: depMonths.length,
        max: depMonths.reduce((b, r) => (!b || r.deposits > b.deposits ? r : b), null)
      }
    };
  }

  // --- MOTOR DE CÁLCULO DE CRYPTO ---

  // Valora los lotes de la foto. Sin spot usa los valores del corte; con spot revalúa cantidad × precio.
  function computeCrypto(spotPrice) {
    const live = spotPrice != null && spotPrice > 0;
    const price = live ? spotPrice : CRYPTO.price;

    // En el corte se usan las cifras tal cual de la foto (evita diferencias de redondeo)
    const lots = CRYPTO.lots.map(([date, qty, unit, cost, mvCut, gainCut, pctCut, transferDate]) => {
      const mv = live ? qty * price : mvCut;
      const gain = live ? mv - cost : gainCut;
      // effUnit = costo ÷ cantidad (incluye comisiones; unit es el costo/acción que muestra la foto)
      return { date, qty, unit, effUnit: cost / qty, cost, mv, gain, gainPct: live ? (gain / cost) * 100 : pctCut, transferDate };
    });

    const S = CRYPTO.summary;
    const mv = live ? S.qty * price : S.mv;
    const gain = live ? mv - S.cost : S.gain;

    // Conciliación: traspasos de la bolsa (X) contra el costo del lote que financiaron
    const transfers = X.map(([date, amount]) => {
      const lot = lots.find(l => l.transferDate === date) || null;
      return { date, amount, lot, diff: lot ? amount - lot.cost : null };
    });
    const withdrawn = X.filter(x => x[1] > 0).reduce((t, x) => t + x[1], 0);
    const returned = -X.filter(x => x[1] < 0).reduce((t, x) => t + x[1], 0);
    const matched = transfers.filter(t => t.lot);

    return {
      live,
      price,
      cutDate: CRYPTO.cutDate,
      cutPrice: CRYPTO.price,
      dayPct: CRYPTO.dayPct,
      dayUsd: CRYPTO.dayUsd,
      qty: S.qty,
      cost: S.cost,
      mv,
      gain,
      gainPct: live ? (gain / S.cost) * 100 : S.gainPct,
      avgCost: S.cost / S.qty,
      lots,
      winners: lots.filter(l => l.gain > 0).length,
      best: lots.reduce((b, l) => (l.gainPct > b.gainPct ? l : b), lots[0]),
      transfers,
      withdrawn,
      returned,
      matchedWithdrawn: matched.reduce((t, x) => t + x.amount, 0),
      matchedCost: matched.reduce((t, x) => t + x.lot.cost, 0),
      unmatched: transfers.filter(t => !t.lot && t.amount > 0).reduce((t, x) => t + x.amount, 0)
    };
  }

  // --- CONSULTA DEL PRECIO BTC VIA YAHOO FINANCE & PROXIES CORS ---

  async function fetchBtcSpot() {
    const queryUrl = encodeURIComponent('https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?range=5d&interval=1d');
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?'
    ];

    let lastError = null;

    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy + queryUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const spot = data.chart.result[0].meta.regularMarketPrice;
        if (!(spot > 0)) throw new Error('Respuesta sin precio');
        const timestampStr = new Date().toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        return { spot, timestamp: timestampStr };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo conectar a los proxies de Yahoo Finance');
  }

  // --- PERSISTENCIA EN LOCALSTORAGE ---

  // Precio BTC elegido por el usuario (en vivo o manual). null = usar el precio del corte.
  function loadBtcStorage() {
    try {
      const parsed = JSON.parse(localStorage.getItem('btc') || 'null');
      if (parsed && parsed.s > 0) {
        return { spot: parsed.s, timestamp: parsed.t || '', source: parsed.src || 'live' };
      }
    } catch (e) {
      console.warn('Error leyendo localStorage btc:', e);
    }
    return { spot: null, timestamp: '', source: 'cut' };
  }

  function saveBtcStorage(state) {
    try {
      if (!state || !(state.spot > 0)) {
        localStorage.removeItem('btc');
        return;
      }
      localStorage.setItem('btc', JSON.stringify({ s: state.spot, t: state.timestamp || '', src: state.source }));
    } catch (e) {
      console.warn('Error guardando en localStorage btc:', e);
    }
  }

  return {
    D,
    T_RAW,
    N,
    PR,
    X,
    CRYPTO,
    lab,
    fd,
    f,
    sg,
    pc,
    cls,
    dt,
    computePortfolioData,
    getPeriodSummary,
    getYears,
    computeYearDashboard,
    computeCrypto,
    fetchBtcSpot,
    loadBtcStorage,
    saveBtcStorage
  };
});
