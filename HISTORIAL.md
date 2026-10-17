# HISTORIAL · HAPI Portafolio

> **Regla de uso:** leer este archivo ANTES de abrir el código. Al terminar cada cambio, agregar una entrada en "Registro de cambios" y corregir las secciones de arriba si algo cambió (archivos, datos, cálculos).

## 1. Qué es
Webapp estática en español con el resumen de inversiones de Nicolás, calculado desde los estados de cuenta mensuales de Apex/HAPI (jun 2025 – sep 2026). Dos pestañas: **Bolsa** y **Crypto** (BTC vía Bakkt, desde la foto "Share Lots").
- Fuentes de datos: `HAPI_estados_de_cuenta.md` (bolsa, ya transcrita de los PDFs) y `HAPI_crypto.md` (lotes BTC por corte). Leerlas en vez de los PDFs.
- Repo: `niko-londono/HAPI` (rama `main`). Sitio: proyecto Vercel `portafolio-finanzas`.
- Sin build: React 18 + Babel standalone desde CDN (unpkg/cdnjs). Para abrir en local hace falta servidor (`npx serve .`), no `file://`.

## 2. Archivos
| Archivo | Rol | Cuándo tocarlo |
|---|---|---|
| `index.html` | Shell: título, favicon, tema previo al render, fuente Inter, React/Babel (versiones fijas), `MAESTRO.css/js/jsx`, aviso si se abre con `file://`. | Casi nunca. |
| `favicon.svg` | Ícono de la pestaña (cuadro oscuro con línea ascendente; el mismo dibujo es el logo del header). | Si cambia la marca. |
| `HAPI_estados_de_cuenta.md` / `HAPI_crypto.md` | Bases de datos en texto (bolsa y crypto) con su protocolo de actualización. | Cada mes / cada foto nueva. |
| `MAESTRO.js` | Motor `window.HapiEngine`: datos, cálculos, formato, precios BTC, localStorage. Sin UI. | Datos nuevos o lógica de cálculo. |
| `MAESTRO.jsx` | UI en React: `Icons`, `niceTicks`, `axisLabel`, `InteractiveChart`, `App`. | Layout, componentes, gráfico. |
| `MAESTRO.css` | Estilos: tokens (dark/light), header, tabs, KPIs, gráfico, tablas, crypto, responsive. | Aspecto. |
| `HISTORIAL.md` | Este archivo. | En cada cambio. |
| `README.md` | Descripción corta del proyecto (opcional). | Si cambia el alcance. |

### MAESTRO.js (API de `HapiEngine`)
- **Datos:** `D` = `[mes, valor_cierre, depósitos, retiros_bakkt, dividendos_netos_y_cargos]` (16 filas). `T_RAW` = operaciones `YYMMDD,tipo,ticker,cantidad,monto` separadas por `;` (tipo `B` compra, `S` venta, `X` split). `PR` = precios al 30 sep 2026. `N` = nombres de activos. `X` = traspasos a Bakkt `[fecha, monto]`. `CRYPTO` = corte de la foto Share Lots: `cutDate, price, dayPct, dayUsd, summary {qty, cost, mv, gain, gainPct}` y `lots` = `[fecha, cantidad, costo_unitario, costo_total, valor_corte, ganancia_corte, ganancia_pct_corte, fecha_traspaso_bolsa]`.
- **Formato:** `lab, fd (YYYY-MM-DD → "11 ago 2026"), f, sg, pc, cls, dt`.
- **Cálculo:** `computePortfolioData()` → `{T, R, P, pos, positionsRows, cashFdic, cashPct, totalClosingVal, N, PR, X}`; `getPeriodSummary(meses)` → totales del periodo; `computeCrypto(spot)` → lotes valorados, totales, costo promedio, mejor lote, conciliación `transfers` (cada traspaso `X` con su lote).
- **BTC:** `fetchBtcSpot()` (Yahoo `BTC-USD`, proxies `allorigins` y `corsproxy.io`), `loadBtcStorage/saveBtcStorage` (clave `btc` en localStorage: `{s, t, src}`; vacío = precio del corte).

### MAESTRO.jsx (estructura)
- `App`: estado `activeTab, period, theme (hapi_theme), posSearch, opsSearch, opsType`, más `btcPrice {spot, timestamp, source}`. Períodos: 1M, 3M, 6M, YTD, 1A, 2025, 2026, ALL. El título de la pestaña cambia con la vista ("Bolsa · HAPI" / "Crypto · HAPI").
- Bolsa: barra de periodo → KPI (tarjeta principal + 4 mosaicos) → `InteractiveChart` → posiciones (buscador) → rendimiento mensual → operaciones (filtro tipo + buscador).
- Crypto: barra de precio (corte / en vivo / manual / volver al corte) → KPI (valor de mercado + costo promedio, variación del día o lotes en ganancia, mejor lote, patrimonio total) → `CryptoLotsChart` → tabla de lotes → conciliación de traspasos → nota.
- `useWidth()`: hook con ResizeObserver para que los SVG se dibujen al ancho real.
- `InteractiveChart`: 2 paneles (barras mensuales realizada/no realizada + línea y área del acumulado), franja de depósitos, ticks "redondos", tooltip que cambia de lado.
- `CryptoLotsChart`: eje X por fecha, cada lote en su costo por BTC (costo ÷ cantidad, incluye comisiones), tamaño = monto, color ganancia/pérdida; líneas de precio BTC y costo promedio.

### MAESTRO.css (mapa)
Estilo minimalista: casi monocromo, un solo acento (`--accent`) y verde/rojo solo para ganancia/pérdida; fuente única Inter con cifras tabulares. Tokens `:root` y `[data-theme='light']` (`--bg, --surface, --border, --text-*, --accent, --gain, --loss, --amber, --grid, --axis`) → base → header/tabs → `.toolbar` + `.segmented` → `.card` / `.kpi-grid` / `.kpi.hero` → gráficos (`.bar-*`, `.line-cum`, `.lot-dot`, `.price-line`, `.avg-line`, `.chart-tooltip`) → tablas (`.data-table`, primera columna fija, `.row-total`) → controles (`.btn`, búsqueda, precio manual) → responsive (900/640 px).

## 3. Reglas de cálculo
- Valor de cierre = *Total Equity Holdings* de cada estado. Fechas de operaciones = fecha de liquidación que aparece en el estado.
- Total del mes = valor cierre − valor anterior − (depósitos − retiros).
- Realizada = venta − costo promedio por activo (el split `X` suma acciones sin costo). No realizada = total − realizada − dividendos netos y cargos.
- % = monto ÷ capital promedio del periodo (promedio mensual de valor anterior + flujo/2).
- Traspasos "Journal to BAKKT" = retiros de la bolsa; el 03-jun-2026 volvieron $0.92 (depósito). Intereses de margen entran como cargo (ago 2026: −$2.00).
- Crypto: en el corte se muestran las cifras tal cual de la foto Share Lots (valor, ganancia $ y %). Con precio en vivo o manual: valor = cantidad × precio y ganancia = valor − costo. Costo promedio = costo total ÷ cantidad.
- Conciliación crypto: cada lote se liga a su traspaso `X` (`fecha_traspaso_bolsa`). Diferencia por lote = monto traspasado − costo del lote (spread/comisiones).

## 4. Cifras de control (ALL, a sep 2026)
Realizada ≈ +$486.91 · Rendimiento total ≈ +$1,300.24 · Aportes netos $7,067.56 · Valor al cierre $8,367.80 · Traspasos a Bakkt $1,074.73. Si cambian al tocar datos o fórmulas, revisar.
Crypto (corte 17 oct 2026): 0.013244 BTC · costo $1,006.74 · valor $1,076.39 · ganancia +$69.65 (+6.92%) · costo promedio $76,014.80 · 2 de 8 lotes en ganancia · patrimonio total $9,444.19.

## 4b. Cómo agregar un corte crypto nuevo
1) Transcribir la foto en `HAPI_crypto.md` (su protocolo). 2) En `MAESTRO.js` → `CRYPTO`: actualizar `cutDate, price, dayPct, dayUsd, summary` y los valores de corte de cada lote; añadir lotes nuevos con su `fecha_traspaso_bolsa`. 3) Si hubo traspasos nuevos, deben estar también en `X` (y en `D`). 4) Registrar el cambio abajo.

## 5. Cómo agregar un mes nuevo
1) Añadir fila en `D`. 2) Añadir sus operaciones en `T_RAW` (con la fecha del estado). 3) Actualizar `PR` con los precios de cierre. 4) Si hubo traspasos a Bakkt, añadir a `X` y restarlos en la columna de retiros de `D`. 5) Actualizar etiquetas de texto ("jun 2025 – sep 2026", "16 meses", "precios al …") en `MAESTRO.jsx`. 6) Registrar el cambio abajo.

## 6. Pendientes y notas
- Los datos viajan dentro del código: si el sitio es público, los montos son visibles. Revisar protección en Vercel.
- Crypto: $60.60 traspasados el 6 oct 2025 no tienen lote en la foto, y el 3 jun 2026 volvieron $0.92. Confirmar con Nicolás a dónde fue ese saldo (¿efectivo en Bakkt, lote vendido?).
- Confirmar si el corte del 17 oct 2026 representa el cierre de septiembre u octubre.
- Yahoo/proxies CORS pueden fallar: existe precio manual.
- Posible mejora: historial del valor crypto cuando haya varios cortes.

## 7. Registro de cambios
- **2026-10-17 · v5 · Crypto con lotes reales + UI minimalista.** Crypto deja de estimar BTC con Yahoo y usa los 8 lotes de la foto Share Lots (`CRYPTO` en `MAESTRO.js`, `computeCrypto`, `fetchBtcSpot`; se eliminaron `computeCryptoRows` y la tabla editable). Nueva vista: precio de corte/en vivo/manual, KPIs, gráfico de costo por lote, tabla de lotes y conciliación con los traspasos de la bolsa. UI rehecha más sobria (Inter única, casi monocroma, sin pastillas de color). Favicon `favicon.svg`, título corto "HAPI · Portafolio" (y "Bolsa · HAPI" / "Crypto · HAPI" según la vista), React fijado a 18.3.1. Archivos tocados: todos los `MAESTRO.*`, `index.html`, `favicon.svg`, `HISTORIAL.md`, `README.md`.
- **2026-10-17 · v4 · Rediseño de layout y gráfico.** CSS reescrito (tokens más sobrios, tabs subrayadas, periodos segmentados, tabla con primera columna fija, soporte claro/oscuro real). KPI: tarjeta principal "Rendimiento total" con depositado/retirado/valor al cierre + 4 mosaicos; se eliminó la leyenda duplicada. Posiciones con ticker+nombre y barra de peso; operaciones con insignias; se activaron los buscadores y el filtro por tipo que ya existían en el estado. Gráfico: 2 paneles, ejes con ticks redondos, rejilla visible en modo claro, ancho real sin escalado, etiquetas de mes sin solaparse, tooltip sin desbordes, franja de depósitos proporcional. Archivos tocados: `MAESTRO.css`, `MAESTRO.jsx`, `HISTORIAL.md`. Sin cambios en `MAESTRO.js` ni `index.html`.
- **v3 · Versión modular.** Separación en `index.html` + `MAESTRO.js/.jsx/.css` (React + Babel en el navegador).
- **v2 · Bolsa completa en Vercel.** Posiciones, rendimiento mensual y operaciones; realizada calculada en el navegador con costo promedio.
- **v1 · Primera versión.** Un solo HTML con resumen, gráfico mensual y pestaña Crypto básica (botón de precio con Yahoo).
