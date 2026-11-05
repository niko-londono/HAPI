# Prompt para recrear la app "Portafolio HAPI" con tus propios datos

> Copia todo lo que está dentro del bloque de abajo y pégalo en Claude Code (o en Claude con archivos adjuntos).
> Adjunta tus estados de cuenta mensuales en PDF de HAPI/Apex y, si tienes crypto, la captura de tu tabla de lotes.
> Rellena los campos entre `[corchetes]` antes de enviarlo.

---

```text
Quiero que me construyas una webapp estática en español para seguir mis inversiones, a partir de mis
estados de cuenta mensuales de HAPI (corredor) / Apex Clearing (custodio). Trabaja con MIS datos, que te
adjunto. No inventes cifras: si algo no está en los documentos, pregúntame.

## Mis datos
- Nombre que aparece en la app: [tu nombre o apodo]
- Estados de cuenta adjuntos: [mes inicial] a [mes final] (PDF mensuales de Apex/HAPI, en USD)
- ¿Tengo crypto vía Bakkt?: [sí/no]. Si sí, te adjunto una captura de mi tabla de lotes ("Share Lots")
  con fecha, cantidad, costo total, valor de mercado y ganancia de cada lote.
- ¿Uso cuenta de margen?: [sí/no, desde qué fecha y con qué tasa anual]
- Mi tasa de impuesto sobre ganancias (opcional): [ej. 15%]
- Dónde lo voy a publicar: [GitHub Pages / Vercel / solo local]
- Acciones que considero de largo plazo (ETFs, etc.): [ej. VOO, QQQ, SCHD]

## Paso 1 · Base de datos en texto (antes de programar)
Lee cada PDF una sola vez (solo las páginas útiles, antes de "IMPORTANT INFORMATION") y crea
`estados_de_cuenta.md` con:
0. Protocolo para agregar un PDF nuevo en el futuro sin releer los viejos.
1. Convenciones de lectura:
   - Valor total de la cuenta = línea "Total Equity Holdings" de la página 1.
   - Depósitos = líneas "Journal from HAPI..." en "Funds Paid and Received".
   - "Journal to BAKKT CRYPTO SOLUTIONS" = retiro de la bolsa hacia crypto.
   - Movimientos del cash sweep / FDIC (SWEEP, REDEEMED, DIV REINV) no son aportes ni operaciones.
   - Liquidación T+1: las operaciones del último día hábil aparecen en "Executed Trades Pending Settlement".
   - Dividendos brutos y retención (WH) por separado; neto = bruto − retención.
   - Splits: suman acciones con costo 0.
   - Intereses de margen ("Debit interest") son un cargo.
   - No guardes datos personales (dirección, número de cuenta).
2. Resumen mensual: apertura, securities, FDIC, efectivo/margen, cierre, aportes, retiros a Bakkt,
   resultado del mes, compras, ventas.
3. Detalle de aportes y retiros. 4. Dividendos e intereses. 5. Posiciones al cierre de cada mes.
6. Operaciones por mes. 7. Métricas acumuladas. 8. Log de meses incorporados.
Valida cada mes: suma de posiciones = Securities; Securities + FDIC + efectivo = Total Equity Holdings;
apertura = cierre del mes anterior; suma de compras/ventas = totales del PDF. Muéstrame las
diferencias si algo no cuadra.

Si tengo crypto, crea `crypto.md` igual: resumen por corte, lotes (fecha, cantidad, costo, valor,
ganancia), cruce de cada lote con su traspaso "Journal to BAKKT" y log de cortes.

## Paso 2 · Arquitectura (sin build)
Solo archivos estáticos, sin npm ni compilación:
- `index.html`: shell; tema antes de pintar (Auto/Claro/Oscuro guardado en localStorage), fuentes de
  Google (Geist, Geist Mono, Instrument Serif), React 18.3.1 + ReactDOM + Babel Standalone 7.24.4 desde
  CDN con versión fija, esqueleto de carga, aviso si se abre con file:// ("usa npx serve .").
  Los archivos se cargan con `?v=__BUILD__` para romper caché en cada despliegue.
- `MAESTRO.js`: motor `window.HapiEngine` sin UI. Datos + cálculos + formato.
- `MAESTRO.jsx`: interfaz en React con hooks.
- `MAESTRO.css`: sistema de diseño.
- `HISTORIAL.md`: qué es la app, mapa de archivos y funciones, reglas de cálculo, cifras de control,
  cómo agregar un mes / un corte crypto, pendientes y registro de cambios. Actualízalo en cada cambio.
- `README.md`, `favicon.svg` (cuadro oscuro con línea ascendente), `.nojekyll` y
  `.github/workflows/deploy.yml` (GitHub Pages; reemplaza `__BUILD__` por el commit corto con sed).

### Datos en MAESTRO.js (compactos)
- `D`: `[mes 'YYYY-MM', valor_cierre, depósitos, retiros_bakkt, dividendos_netos_y_cargos]`.
- `T_RAW`: string `YYMMDD,Tipo,Ticker,Cantidad,Monto;` (B compra, S venta, X split), fecha de liquidación.
- `DIV_RAW`: `YYMMDD,Ticker,Bruto,Retención;`.
- `PR`: precio de cierre del último mes por ticker. `N`: nombre completo por ticker.
- `X`: traspasos a Bakkt `['YYYY-MM-DD', monto]`.
- `CRYPTO`: fecha de corte, precio, variación del día, resumen y lotes (cada uno con su fecha de traspaso).
- `MARGIN` (si aplica): efectivo inicial, fecha de inicio, tasa, flujos fechados, intereses cobrados.

### Reglas de cálculo
- Resultado del mes = cierre − cierre anterior − (depósitos − retiros).
- Ganancia realizada = monto de venta − costo promedio ponderado del activo (por operación y por mes).
- No realizada = resultado total − realizada − dividendos netos y cargos.
- % de rendimiento = monto ÷ capital promedio del periodo (Modified Dietz: saldo inicial + flujos/2).
- Traspasos a Bakkt = retiros de la bolsa que alimentan el módulo crypto.
- Crypto: en el corte, cifras tal cual de la foto; con precio en vivo/manual, valor = cantidad × precio
  y ganancia = valor − costo. Costo promedio = costo total ÷ cantidad.
- Precio BTC en vivo: Coinbase → Kraken → CoinGecko (APIs públicas con CORS, 6 s de límite cada una),
  guardado en localStorage, mostrando hora y fuente.
- Impuestos: base = ganancias − pérdidas realizadas del año (+ dividendos si lo elijo), menos crédito
  por retención; aclara que es estimación, no asesoría.
- Margen: reconstruir el efectivo día a día para saber cuánto se pagó con deuda, intereses pagados y
  estimados, y la ganancia de lo comprado con margen.

## Paso 3 · Interfaz (5 pestañas)
Barra de periodos compartida: 1M, 3M, 6M, YTD, 1A, cada año disponible, ALL.
1. **Bolsa**: KPI principal (rendimiento total con %) + mosaicos (realizada, no realizada, ganancia de
   capital, dividendos/cargos); gráfico SVG interactivo propio (barras apiladas realizada/no realizada
   por mes, línea + área de ganancia acumulada, franja de depósitos debajo, tooltip que cambia de lado,
   ticks redondos); tabla de posiciones con buscador, logo/monograma por ticker, precio, valor, % de
   cartera y fila de efectivo FDIC (o "Margen (deuda)" si es negativo); tabla de rendimiento mensual;
   tabla de operaciones con filtro (Compras/Ventas/Splits) y buscador.
2. **Crypto**: barra de precio (corte / en vivo / manual con botón Guardar / volver al corte); KPIs
   (valor y costo promedio, variación del día o lotes en ganancia, mejor lote, patrimonio total);
   gráfico de lotes (eje X por fecha, cada lote en su costo por BTC, tamaño = monto, color
   ganancia/pérdida, líneas de precio actual y costo promedio); tabla de lotes; conciliación de traspasos.
3. **Total**: bolsa + crypto juntos por periodo: valor, capital aportado neto, ganancia, barra de reparto,
   gráfico de largo vs corto plazo (con mi lista de tickers de largo plazo, ajustable) y tabla de distribución.
4. **Dashboard** (por año) con barra fija de atajos a sus secciones: Resumen, Cascada (waterfall de
   inicio → aportes → retiros → ganancia → cierre), Origen de la ganancia, Dividendos (barras mensuales
   apiladas por acción con color fijo por ticker), Ventas, Margen (si aplica), Depósitos. Cada gráfico
   lleva su tabla.
5. **Impuestos**: año, tasa, incluir dividendos, crédito por retención (guardado en localStorage);
   hero, mosaicos, tabla de cálculo, base por mes y todos los años.

## Paso 4 · Diseño
Minimalismo editorial cálido: monocromo (#F7F6F3 / #111 en claro, carbón #191918 en oscuro), pasteles
solo para significado (ganancia verde, pérdida rojo, tipos de operación), acento azul desaturado para
barras y naranja pastel para el acumulado. Cifras tabulares; Instrument Serif para títulos y cifras
grandes, Geist para la interfaz, Geist Mono para ejes y tickers. Selector de tema Auto/Claro/Oscuro.
Entrada escalonada de bloques con IntersectionObserver que respeta prefers-reduced-motion. Responsive
(cortes en 900 y 640 px), sin scroll horizontal en móvil, SVG que se ajustan al ancho real
(ResizeObserver). Estructura accesible: skip-link, header, nav, main, section por pestaña.

## Paso 5 · Verificación y entrega
- Calcula unas "cifras de control" (realizada total, rendimiento total, aportes netos, valor al cierre,
  traspasos a Bakkt) y compáralas con los PDFs; anótalas en HISTORIAL.md.
- Levanta la app con `npx serve .`, revisa cada pestaña en claro/oscuro y en ancho de móvil.
- Explícame cómo agregar un mes nuevo: fila en D, operaciones en T_RAW, dividendos en DIV_RAW,
  precios en PR, traspasos en X, y actualizar etiquetas de fechas.
- Recuérdame que los montos viajan dentro del código: si el sitio es público, cualquiera los ve
  (protégelo con contraseña en Vercel o usa un repo/sitio privado).

Trabaja por pasos y muéstrame el resumen mensual validado antes de empezar a programar.
```
