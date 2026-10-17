# HAPI — Portafolio Crypto (seguimiento mensual por foto)

> Archivo complementario de `HAPI_estados_de_cuenta.md` (que cubre solo la Bolsa/Apex).
> HAPI/Apex registra el dinero que va a crypto como un simple "Journal to BAKKT CRYPTO SOLUTIONS" (retiro de la Bolsa), por lo que **no es rastreable ahi**. El detalle real de la cartera crypto se calcula en otra app y se actualiza aqui con una foto mensual (tabla "Share Lots").

---

## 0. Protocolo para actualizar (cada mes)

1. Nicolas envia la foto nueva de la tabla Share Lots (por activo, hoy solo BTC-USD).
2. Transcribir la **fila resumen** del activo (encabezado) a la tabla de la seccion 2 (una fila por corte).
3. Si aparecen **lotes nuevos**, agregarlos a la tabla de lotes de la seccion 3 (nunca borrar lotes viejos; solo actualizar sus valores de mercado si se quiere el corte vigente) y registrar el corte en el historial.
4. Validar antes de guardar: suma de acciones de lotes = acciones del resumen; suma de costo = costo total; suma de valor de mercado = valor de mercado; valor - costo = ganancia $.
5. Si hay un activo nuevo (ETH, etc.), crear su bloque igual al de BTC-USD en la seccion 3 y una fila por activo en la seccion 2.
6. Anotar el corte en el log (seccion 6).

Formato de fechas de la foto: **DD/MM/YYYY**. Aqui se guardan como **YYYY-MM-DD**.

---

## 1. Convenciones

- Los lotes son compras de crypto financiadas desde la Bolsa via Bakkt. Su fecha es la fecha del lote en la app de calculo (puede diferir 1-2 dias del journal en el estado de cuenta de Apex).
- "Costo total" = lo invertido en el lote; "Valor de mercado" = cantidad x precio del corte.
- "Ganancia total" = valor de mercado - costo total (no realizada; no hay ventas registradas).
- Columnas Ann Gain, Low/High Limit y Note de la foto venian vacias (`--`, `0`); se omiten.

---

## 2. Resumen por corte (una fila por activo y corte)

| Corte | Activo | Cantidad | Precio mercado | Costo total | Valor mercado | Ganancia total $ | Ganancia total % | Dia % | Dia $ |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-10-17 (foto recibida) | BTC-USD | 0.013244 | 81,276.05 | 1,006.74 | 1,076.39 | +69.65 | +6.92% | -0.28% | -2.97 |

Nota: la fila de resumen de la foto mostraba otro valor sin etiqueta visible, **75,673.49**, junto al precio 81,276.05. El precio de mercado es 81,276.05 (cuadra: 0.013244 x 81,276.05 = 1,076.4). 75,673.49 no coincide exactamente con el costo promedio ponderado (1,006.74 / 0.013244 = 76,016); confirmar con Nicolas que significa esa columna si se necesita.

---

## 3. Lotes por activo

### BTC-USD (estado: Open)

Corte 2026-10-17 — precio 81,276.05

| Fecha lote | Cantidad | Costo/accion | Costo total | Valor mercado | Dia % | Dia $ | Ganancia % | Ganancia $ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-11 | 0.006294 | 63,557.00 | 400.03 | 511.55 | -0.27% | -1.41 | +27.88% | +111.52 |
| 2026-04-16 | 0.000576 | 74,704.65 | 43.00 | 46.78 | -0.28% | -0.13 | +8.80% | +3.78 |
| 2026-02-02 | 0.000289 | 78,404.92 | 23.89 | 23.49 | -0.25% | -0.06 | -1.68% | -0.40 |
| 2026-01-31 | 0.000667 | 81,207.99 | 54.71 | 54.21 | -0.28% | -0.15 | -0.90% | -0.49 |
| 2026-01-08 | 0.001778 | 90,529.72 | 162.57 | 144.51 | -0.28% | -0.40 | -11.11% | -18.06 |
| 2025-12-17 | 0.002313 | 86,461.43 | 201.16 | 187.99 | -0.28% | -0.52 | -6.54% | -13.16 |
| 2025-11-19 | 0.001110 | 91,423.11 | 101.48 | 90.22 | -0.28% | -0.25 | -11.10% | -11.26 |
| 2025-11-17 | 0.000217 | 91,751.53 | 19.91 | 17.64 | -0.28% | -0.05 | -11.42% | -2.27 |
| **Total** | **0.013244** | prom. 76,016 | **1,006.75** | **1,076.39** | | **-2.97** | **+6.92%** | **+69.65** |

Validacion: cantidades suman 0.013244 (ok); valor de mercado suma 1,076.39 (ok); costo suma 1,006.75 vs 1,006.74 del resumen (diferencia de 0.01 por redondeo).

---

## 4. Cruce con los retiros a Bakkt del estado de cuenta (referencia aproximada)

Cada lote corresponde, en general, a un retiro de la Bolsa (seccion 3 de `HAPI_estados_de_cuenta.md`). Diferencias pequenas = spreads/comisiones o desfase de fechas.

| Retiro HAPI (fecha) | Retiro USD | Lote crypto (fecha) | Costo lote USD |
|---|---:|---|---:|
| 2025-11-18 | 20.20 | 2025-11-17 | 19.91 |
| 2025-11-19 | 104.35 | 2025-11-19 | 101.48 |
| 2025-12-17 | 202.00 | 2025-12-17 | 201.16 |
| 2026-01-08 | 162.58 | 2026-01-08 | 162.57 |
| 2026-02-02 | 54.67 | 2026-01-31 | 54.71 |
| 2026-02-03 | 22.90 | 2026-02-02 | 23.89 |
| 2026-04-16 | 43.43 | 2026-04-16 | 43.00 |
| 2026-08-11 | 404.00 | 2026-08-11 | 400.03 |
| **Total** | **1,074.73** | | **1,006.75** |

Diferencia total retirado vs costo invertido en lotes: 67.98 USD. Entrada desde Bakkt registrada en Apex: 0.92 (2026-06-03). Esta diferencia no esta explicada aun (posible efectivo sin invertir en la cuenta crypto, comisiones o retiros posteriores); confirmar con Nicolas antes de usarla como metrica.

---

## 5. Metricas del ultimo corte (2026-10-17)

| Concepto | Valor |
|---|---:|
| Capital invertido en crypto (costo) | 1,006.74 |
| Valor de mercado | 1,076.39 |
| Ganancia no realizada | +69.65 (+6.92%) |
| Mejor lote | 2026-08-11: +27.88% (+111.52) |
| Peor lote (%) | 2025-11-17: -11.42% (-2.27) |
| Peor lote ($) | 2026-01-08: -11.11% (-18.06) |
| Lotes en ganancia / en perdida | 2 / 6 |
| Precio de equilibrio (costo promedio) | ~76,016 |

Para el total del patrimonio de Nicolas: Bolsa (cierre en `HAPI_estados_de_cuenta.md`) + Crypto (valor de mercado de la seccion 2). Cuidado con duplicar: el capital crypto sale de la Bolsa como "retiro" y ya no esta en el valor de la cuenta Apex.

---

## 6. Log de cortes incorporados

| Corte | Fuente | Notas |
|---|---|---|
| 2026-10-17 | Foto Share Lots BTC-USD (recibida 2026-10-17) | Primer corte; 8 lotes. Confirmar si representa cierre de septiembre u octubre 2026. |
