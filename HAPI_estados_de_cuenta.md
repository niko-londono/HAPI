# HAPI — Base de datos consolidada de estados de cuenta (Apex Clearing)

> **Cobertura actual:** Jun 2025 a Sep 2026 (16 PDFs, 16 meses). **Ultimo mes incorporado: Sep 2026.**  
> **Fuente:** estados de cuenta mensuales de la cuenta de inversion HAPI (corredor introductor HAPI, custodio Apex Clearing Corporation). Moneda: USD.  
> **Objetivo de este archivo:** que NO haga falta volver a leer los PDFs ya procesados. Para un mes nuevo se lee SOLO el PDF nuevo y se anexa su informacion aqui (ver seccion 0).  
> **Validacion:** todos los meses cuadran contra los totales impresos en los PDFs (suma de posiciones = Securities; Securities + FDIC + Cash = valor total; suma de compras/ventas = totales de la seccion de actividad; saldo de apertura = cierre del mes anterior; dividendos = YTD impreso).

---

## 0. Protocolo para agregar un PDF nuevo (ahorro de tokens)

1. **Leer solo el PDF nuevo y solo sus primeras paginas utiles.** Lo util esta antes del bloque "IMPORTANT INFORMATION" / "ANNOUNCEMENTS" (todo lo que viene despues es texto legal repetido y se puede ignorar). Algunos meses traen paginas extra al INICIO (aviso de privacidad / Annual Disclosure Statement): saltarlas hasta llegar a "ACCOUNT STATEMENT" con el rango de fechas del mes.
2. **Extraer, en este orden:**
   - Pagina 1 (resumen): *Opening/Closing balance* de Cash account / Margin account, FDIC Insured Deposits, Securities y **Total Equity Holdings (= valor total real de la cuenta)**; recuadro THIS PERIOD / YEAR TO DATE (dividendos, retencion, intereses).
   - Tabla de posiciones: simbolo, cantidad, precio, valor de mercado al cierre.
   - ACCOUNT ACTIVITY: *Buy / Sell Transactions*, *Dividends and Interest*, *Funds Paid and Received*, *Executed Trades Pending Settlement* (si existe), *Debit Interest* (si existe).
3. **Anexar** una fila en las secciones 2, 3 y 4; un bloque en la seccion 5 (posiciones) y otro en la 6 (operaciones); actualizar los totales de la seccion 7 y el log de la seccion 8.
4. **Verificar antes de cerrar:** (a) suma de valores de posiciones = Securities; (b) Securities + FDIC + Cash = Total Equity Holdings; (c) apertura del mes = cierre del mes anterior; (d) suma de compras y de ventas = "Total Buy / Sell Transactions"; (e) dividendos del mes = THIS PERIOD del PDF.
5. Si el mes nuevo trae algo que no aparece en las convenciones de la seccion 1, anotarlo ahi.

---

## 1. Convenciones y reglas de lectura (leer antes de calcular)

- **Valor total de la cuenta** = la linea *Total Equity Holdings* de la pagina 1 (incluye Securities + FDIC sweep + efectivo/margen). OJO: la linea *TOTAL PRICED PORTFOLIO* del encabezado NO siempre incluye el efectivo del "Cash account" (difiere en jun-oct 2025 y mar-jun 2026 por centavos o por el efectivo); usar siempre *Total Equity Holdings* / la suma Securities + FDIC + Cash.
- **Aportes (depositos):** lineas `JOURNAL ... Journal from HAPI******142eSEN(...)` en *Funds Paid and Received*. Aumentan el capital aportado.
- **Retiros del portafolio Bolsa:** lineas `TOU ... Journal to BAKKT CRYPTO SOLUTIONS, LLC`. Es dinero que pasa a la wallet crypto del usuario (las crypto NO estan en HAPI): tratarlo como **retiro** del portafolio Bolsa y como entrada al portafolio Crypto. Una linea `TIN ... Journal from BAKKT` (jun 2026, 0.92) es el sentido contrario (entra a la cuenta).
- **Cash sweep / FDIC (PAZ):** el efectivo sin invertir se barre automaticamente a un banco (`THE INSURED DEPOSIT PROGRAM`). Los movimientos SWEEP / REDEEMED / DIV REINV de esa seccion NO son aportes ni operaciones; solo mueven efectivo entre la cuenta y el banco. El nombre del banco cambia mes a mes (irrelevante).
- **Liquidacion T+1:** las posiciones al cierre reflejan la fecha de LIQUIDACION. Una operacion hecha el ultimo dia habil del mes aparece como "Executed Trades Pending Settlement" y se lista en el mes siguiente (la cartera de cierre aun no la refleja). Casos: 2025-10-31 (2 ventas -> noviembre), 2026-04-30 (2 compras -> mayo), 2026-06-30 (venta de TQQQ -> julio). En la seccion 6 llevan la marca *op. MM-DD* con la fecha real de la operacion.
- **Tipo de cuenta (columna ACCOUNT TYPE):** `C` = cash (tipo 1), `M` = margen (tipo 7). **Desde el 2026-07-02 la cartera esta en cuenta de margen** y los PDFs muestran "Margin account"; los movimientos `TFR CASH TO MARGIN`, `TFR MARGIN TO CASH`, `TYP ... TFR MARGIN FROM CASH` y `XFER` son traspasos internos (suman cero): NO son aportes ni operaciones. El mismo tipo de ruido aparece en mar 2026 (journals de 15 TQQQ entre tipo 1 y 7).
- **Intereses de margen (Debit interest):** primer cargo en ago 2026 (2.00, 8%, saldo promedio 643, periodo 07-16 a 08-15). Restan al rendimiento.
- **Dividendos:** los montos de la seccion 4 son BRUTOS (los de la seccion "Dividends and Interest"); la retencion de impuesto de no residentes (~30%) se muestra aparte como *WH*. Dividendo neto = bruto - WH. Excepciones sin retencion: NVDA (0.01).
- **Split:** NFLX hizo split 10:1 en nov 2025 (0.32139 -> 3.2139 acciones, costo 0). Ajustar historicos de precio de NFLX anteriores al 2025-11-17 si se grafican precios.
- **Resultado mensual** (columna de la seccion 2) = valor total de cierre - valor total de apertura - (aportes - retiros + entradas desde Bakkt). Incluye ganancia realizada + no realizada + dividendos netos de intereses; los dividendos estan expresados antes de retencion en la seccion 4 pero el valor de la cuenta ya los refleja netos.
- Datos personales (direccion, numero de cuenta) intencionalmente omitidos de este archivo.

---

## 2. Resumen mensual

| Mes | Apertura | Securities | FDIC sweep | Efectivo/Margen | **Cierre (total)** | Aportes | Retiros a Bakkt | Entrada Bakkt | Resultado del mes | Compras | Ventas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Jun 2025 | 0.00 | 294.11 | 0.00 | 0.29 | **294.40** | 288.98 | 0.00 | 0.00 | 5.42 | 359.11 | 70.13 |
| Jul 2025 | 294.40 | 491.21 | 0.01 | 0.04 | **491.26** | 188.00 | 0.00 | 0.00 | 8.86 | 231.58 | 43.05 |
| Ago 2025 | 491.26 | 518.98 | 0.05 | 0.00 | **519.03** | 0.00 | 0.00 | 0.00 | 27.77 | 0.00 | 0.00 |
| Sep 2025 | 519.03 | 1054.93 | 0.67 | 0.00 | **1055.60** | 485.00 | 0.00 | 0.00 | 51.57 | 484.79 | 0.00 |
| Oct 2025 | 1055.60 | 1226.58 | 0.03 | 0.07 | **1226.68** | 160.00 | 60.60 | 0.00 | 71.68 | 302.99 | 202.46 |
| Nov 2025 | 1226.68 | 2905.72 | 0.05 | 0.00 | **2905.77** | 1780.01 | 124.55 | 0.00 | 23.63 | 2160.13 | 504.62 |
| Dic 2025 | 2905.77 | 3731.10 | 580.09 | 0.64 | **4311.83** | 1680.00 | 202.00 | 0.00 | -71.94 | 900.16 | 0.00 |
| Ene 2026 | 4311.83 | 4453.29 | 54.68 | 0.00 | **4507.97** | 382.34 | 162.58 | 0.00 | -23.62 | 1828.73 | 1082.92 |
| Feb 2026 | 4507.97 | 5207.02 | 0.00 | 0.00 | **5207.02** | 788.04 | 77.57 | 0.00 | -11.42 | 765.15 | 0.00 |
| Mar 2026 | 5207.02 | 5251.69 | 1.41 | 442.61 | **5695.71** | 890.00 | 0.00 | 0.00 | -401.31 | 450.00 | 0.00 |
| Abr 2026 | 5695.71 | 5192.92 | 928.33 | 360.00 | **6481.25** | 360.00 | 43.43 | 0.00 | 468.97 | 1200.90 | 1728.63 |
| May 2026 | 6481.25 | 5762.45 | 1112.75 | 0.00 | **6875.20** | 0.00 | 0.00 | 0.00 | 393.95 | 500.60 | 325.01 |
| Jun 2026 | 6875.20 | 6319.57 | 200.08 | 2.64 | **6522.29** | 0.00 | 0.00 | 0.92 | -353.83 | 1782.49 | 866.58 |
| Jul 2026 | 6522.29 | 7084.81 | 0.00 | 42.49 | **7127.30** | 420.00 | 0.00 | 0.00 | 185.01 | 3992.57 | 3411.63 |
| Ago 2026 | 7127.30 | 7391.27 | 100.89 | 0.00 | **7492.16** | 394.00 | 404.00 | 0.00 | 374.86 | 1009.74 | 1080.14 |
| Sep 2026 | 7492.16 | 7278.33 | 1087.69 | 1.78 | **8367.80** | 325.00 | 0.00 | 0.00 | 550.64 | 1651.45 | 2310.60 |
| **Total** | | | | | **8367.80** | **8141.37** | **1074.73** | **0.92** | **1300.24** | 17620.39 | 11625.77 |

Notas por mes:

- **Jun 2025:** Primer mes de la cuenta (saldo inicial 0). NDAQ y SPY se compraron el 06-23 y se vendieron el 06-24 (no quedan en cartera).
- **Jul 2025:** Se vendio SCHD completo y se abrio GOOGL.
- **Ago 2025:** Mes sin operaciones ni aportes (solo movimiento de mercado).
- **Sep 2025:** Se abre NVDA.
- **Oct 2025:** Se vende VT completo y se compra VGT. Al 10-31 quedaron 2 ventas pendientes de liquidacion (GOOGL 0.5166 = 144.73 y VGT 0.27224 = 216.82; liquidan 11-03); por eso GOOGL y VGT siguen en la cartera de cierre y esas ventas aparecen en noviembre.
- **Nov 2025:** Split 10:1 de NFLX (2.89251 acciones nuevas el 11-18, costo 0; 0.32139 -> 3.2139). GOOGL y VGT se vendieron completos. Mes de mayor aporte (1,780.01).
- **Dic 2025:** Se abre SPOT. Quedaron 580.09 en efectivo (FDIC sweep) sin invertir. El PDF trae el Annual Disclosure Statement (14 pags) antes del estado.
- **Ene 2026:** Se abre TQQQ con trading de corto plazo (compra 01-05, venta 01-12, recompra 01-15, venta 01-16, compra 01-30).
- **Feb 2026:** Se abren GLD, MSFT y AMZN. Sin dividendos este mes.
- **Mar 2026:** Los 440.00 del 03-31 quedaron como efectivo al cierre (442.61 en cuenta). Hay 8 journals internos de 15 TQQQ entre tipo de cuenta 1 y 7 (03-16 a 03-25): NO son compras/ventas ni flujos de dinero, ignorar. El PDF trae 2 paginas de aviso de privacidad al inicio.
- **Abr 2026:** Salen AMZN y NVDA completos; venta parcial de NFLX (5) y casi todo TQQQ. Al 04-30 quedaron 2 compras pendientes (META 0.24847 = 150.15 y MSFT 0.37395 = 150.15; liquidan 05-01), por eso NO estan en la cartera de cierre y aparecen en mayo. El aporte de 360.00 del 04-30 figura como efectivo.
- **May 2026:** Mes sin aportes. Primer interes bancario (0.01 el 05-18). TQQQ queda en 0.
- **Jun 2026:** Sin aportes desde HAPI; unico flujo: 0.92 que ENTRA desde Bakkt (journal TIN, 06-03). Al 06-30 quedo pendiente la venta de TODO el TQQQ (10.87017 a 79.7901 = 867.20, liquida 07-01): por eso TQQQ sigue en la cartera de cierre y la venta aparece en julio.
- **Jul 2026:** CAMBIO DE CUENTA: desde el 07-02 la cartera pasa a cuenta de MARGEN (tipo M; el PDF muestra "Approved for Margin"). Los ~34 movimientos TFR CASH TO MARGIN / MARGIN TO CASH / TYP son traspasos internos entre sub-cuentas: NO son flujos ni operaciones. NFLX y SPOT salen completos. El efectivo ya no aparece como FDIC sweep al cierre sino como saldo de margen (42.49). El PDF tiene 14 paginas.
- **Ago 2026:** Primer cargo por interes de margen (debit interest): 2.00 (periodo 07-16 a 08-15, tasa 8%, saldo promedio 643). El PDF trae la pagina 2 con una tabla de "YTD" y de ahi en adelante las paginas numeradas corridas.
- **Sep 2026:** Se vende TODO el TQQQ (queda en 0) y se rota META -> GOOGL (GOOGL pasa a ser la posicion mas grande, 28.6%). Los 1,084.60 de la venta de TQQQ quedaron como efectivo (FDIC sweep).

---

## 3. Aportes y retiros (detalle)

Tipo: **Aporte** = Journal from HAPI; **Retiro** = Journal to BAKKT (pasa a Crypto); **Entrada Bakkt** = Journal from BAKKT.

| Fecha | Tipo | Monto |
|---|---|---:|
| 2025-06-20 | Aporte | 140.00 |
| 2025-06-23 | Aporte | 148.98 |
| 2025-07-21 | Aporte | 188.00 |
| 2025-09-02 | Aporte | 45.00 |
| 2025-09-22 | Aporte | 440.00 |
| 2025-10-02 | Aporte | 160.00 |
| 2025-10-06 | Retiro (a Bakkt/Crypto) | 60.60 |
| 2025-11-04 | Aporte | 135.00 |
| 2025-11-06 | Aporte | 220.00 |
| 2025-11-17 | Aporte | 1425.01 |
| 2025-11-18 | Retiro (a Bakkt/Crypto) | 20.20 |
| 2025-11-19 | Retiro (a Bakkt/Crypto) | 104.35 |
| 2025-12-01 | Aporte | 300.00 |
| 2025-12-11 | Aporte | 1380.00 |
| 2025-12-17 | Retiro (a Bakkt/Crypto) | 202.00 |
| 2026-01-02 | Aporte | 382.34 |
| 2026-01-08 | Retiro (a Bakkt/Crypto) | 162.58 |
| 2026-02-02 | Aporte | 423.04 |
| 2026-02-02 | Retiro (a Bakkt/Crypto) | 54.67 |
| 2026-02-03 | Retiro (a Bakkt/Crypto) | 22.90 |
| 2026-02-05 | Aporte | 365.00 |
| 2026-03-02 | Aporte | 450.00 |
| 2026-03-31 | Aporte | 440.00 |
| 2026-04-16 | Retiro (a Bakkt/Crypto) | 43.43 |
| 2026-04-30 | Aporte | 360.00 |
| 2026-06-03 | Entrada desde Bakkt | 0.92 |
| 2026-07-31 | Aporte | 420.00 |
| 2026-08-11 | Retiro (a Bakkt/Crypto) | 404.00 |
| 2026-08-17 | Aporte | 394.00 |
| 2026-09-01 | Aporte | 325.00 |

**Totales:** aportes 8141.37 | retiros 1074.73 | entradas desde Bakkt 0.92 | **capital neto aportado 7067.56**.

---

## 4. Dividendos e intereses

| Fecha | Simbolo | Bruto | Retencion (WH) | Neto |
|---|---|---:|---:|---:|
| 2025-06-30 | SCHD | 0.42 | 0.13 | 0.29 |
| 2025-07-02 | VOO | 0.36 | 0.11 | 0.25 |
| 2025-07-31 | QQQ | 0.06 | 0.02 | 0.04 |
| 2025-09-15 | GOOGL | 0.22 | 0.07 | 0.15 |
| 2025-09-23 | VT | 0.37 | 0.11 | 0.26 |
| 2025-10-01 | VOO | 0.70 | 0.21 | 0.49 |
| 2025-10-31 | QQQ | 0.10 | 0.03 | 0.07 |
| 2025-12-23 | META | 0.66 | 0.20 | 0.46 |
| 2025-12-24 | VOO | 2.47 | 0.74 | 1.73 |
| 2025-12-26 | NVDA | 0.01 | 0.00 | 0.01 |
| 2025-12-31 | QQQ | 0.91 | 0.27 | 0.64 |
| 2026-03-12 | MSFT | 0.46 | 0.14 | 0.32 |
| 2026-03-26 | META | 0.66 | 0.20 | 0.46 |
| 2026-03-27 | QQQ | 0.90 | 0.27 | 0.63 |
| 2026-03-31 | TQQQ | 1.12 | 0.34 | 0.78 |
| 2026-03-31 | VOO | 2.61 | 0.78 | 1.83 |
| 2026-04-01 | NVDA | 0.01 | 0.00 | 0.01 |
| 2026-06-11 | MSFT | 2.35 | 0.71 | 1.64 |
| 2026-06-25 | META | 0.97 | 0.29 | 0.68 |
| 2026-06-30 | TQQQ | 1.03 | 0.31 | 0.72 |
| 2026-06-30 | VOO | 2.74 | 0.82 | 1.92 |
| 2026-07-10 | QQQ | 1.00 | 0.30 | 0.70 |
| 2026-09-10 | MSFT | 2.27 | 0.68 | 1.59 |
| 2026-09-14 | GOOGL | 0.71 | 0.21 | 0.50 |
| 2026-09-28 | META | 0.80 | 0.24 | 0.56 |
| 2026-09-30 | VOO | 2.54 | 0.76 | 1.78 |

Totales por periodo:

| Periodo | Bruto | Retencion | Neto |
|---|---:|---:|---:|
| 2025 (jun-dic) | 6.28 | 1.89 | 4.39 |
| 2026 (ene-sep) | 20.17 | 6.05 | 14.12 |
| **Total** | **26.45** | **7.94** | **18.51** |

Otros: intereses bancarios recibidos 0.02 (05-18: 0.01; 07-16: 0.01); intereses de margen pagados 2.00 (ago 2026).

---

## 5. Posiciones al cierre de cada mes

Formato: simbolo | cantidad | precio | valor. El "% cartera" se puede recalcular con Securities del mes.

### Jun 2025 — Securities 294.11 | FDIC 0.00 | Efectivo/Margen 0.29 | **Total 294.40**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| QQQ | 0.10622 | 551.64 | 58.60 |
| SCHD | 1.60262 | 26.50 | 42.47 |
| VT | 0.59739 | 128.52 | 76.78 |
| VOO | 0.20467 | 568.03 | 116.26 |

### Jul 2025 — Securities 491.21 | FDIC 0.01 | Efectivo/Margen 0.04 | **Total 491.26**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 1.03331 | 191.90 | 198.29 |
| QQQ | 0.12213 | 565.01 | 69.00 |
| VT | 0.66128 | 129.93 | 85.92 |
| VOO | 0.23751 | 581.02 | 138.00 |

### Ago 2025 — Securities 518.98 | FDIC 0.05 | Efectivo/Margen 0.00 | **Total 519.03**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 1.03331 | 212.91 | 220.00 |
| QQQ | 0.12213 | 570.40 | 69.66 |
| VT | 0.66128 | 133.77 | 88.46 |
| VOO | 0.23751 | 593.08 | 140.86 |

### Sep 2025 — Securities 1054.93 | FDIC 0.67 | Efectivo/Margen 0.00 | **Total 1055.60**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 1.03331 | 243.10 | 251.20 |
| QQQ | 0.29907 | 600.37 | 179.55 |
| NVDA | 0.93735 | 186.58 | 174.89 |
| VT | 1.47984 | 137.80 | 203.92 |
| VOO | 0.40069 | 612.38 | 245.37 |

### Oct 2025 — Securities 1226.58 | FDIC 0.03 | Efectivo/Margen 0.07 | **Total 1226.68**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 1.03331 | 281.19 | 290.56 |
| META | 0.14019 | 648.35 | 90.89 |
| QQQ | 0.29907 | 629.07 | 188.14 |
| NVDA | 0.93735 | 202.49 | 189.80 |
| VGT | 0.27224 | 793.21 | 215.94 |
| VOO | 0.40069 | 627.04 | 251.25 |

### Nov 2025 — Securities 2905.72 | FDIC 0.05 | Efectivo/Margen 0.00 | **Total 2905.77**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| META | 1.25278 | 647.95 | 811.74 |
| QQQ | 1.14002 | 619.25 | 705.96 |
| NVDA | 0.93735 | 177.00 | 165.91 |
| NFLX | 3.2139 | 107.58 | 345.75 |
| VOO | 1.39456 | 628.41 | 876.36 |

### Dic 2025 — Securities 3731.10 | FDIC 580.09 | Efectivo/Margen 0.64 | **Total 4311.83**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| META | 1.25278 | 660.09 | 826.95 |
| QQQ | 1.14002 | 614.31 | 700.33 |
| NVDA | 0.93735 | 186.50 | 174.82 |
| NFLX | 6.13651 | 93.76 | 575.36 |
| SPOT | 0.99717 | 580.71 | 579.07 |
| VOO | 1.39456 | 627.13 | 874.57 |

### Ene 2026 — Securities 4453.29 | FDIC 54.68 | Efectivo/Margen 0.00 | **Total 4507.97**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| META | 1.25278 | 716.50 | 897.62 |
| QQQ | 1.14002 | 621.87 | 708.94 |
| NVDA | 0.93735 | 191.13 | 179.16 |
| NFLX | 7.21694 | 83.49 | 602.54 |
| TQQQ | 9.34404 | 54.00 | 504.58 |
| SPOT | 1.34546 | 500.35 | 673.20 |
| VOO | 1.39456 | 636.22 | 887.25 |

### Feb 2026 — Securities 5207.02 | FDIC 0.00 | Efectivo/Margen 0.00 | **Total 5207.02**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| AMZN | 0.31746 | 210.00 | 66.67 |
| META | 1.25278 | 648.18 | 812.03 |
| QQQ | 1.14002 | 607.29 | 692.32 |
| MSFT | 0.50005 | 392.74 | 196.39 |
| NVDA | 0.93735 | 177.19 | 166.09 |
| NFLX | 7.21694 | 96.24 | 694.56 |
| TQQQ | 11.38326 | 49.52 | 563.70 |
| GLD | 0.91455 | 483.75 | 442.41 |
| SPOT | 1.34546 | 514.94 | 692.83 |
| VOO | 1.39456 | 631.04 | 880.02 |

### Mar 2026 — Securities 5251.69 | FDIC 1.41 | Efectivo/Margen 442.61 | **Total 5695.71**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| AMZN | 0.31746 | 208.27 | 66.12 |
| META | 1.25278 | 572.13 | 716.75 |
| QQQ | 1.22349 | 577.18 | 706.17 |
| MSFT | 1.00637 | 370.17 | 372.53 |
| NVDA | 0.93735 | 174.40 | 163.47 |
| NFLX | 7.21694 | 96.15 | 693.91 |
| TQQQ | 15.67833 | 41.68 | 653.47 |
| GLD | 0.91455 | 430.29 | 393.52 |
| SPOT | 1.34546 | 484.91 | 652.43 |
| VOO | 1.39456 | 597.55 | 833.32 |

### Abr 2026 — Securities 5192.92 | FDIC 928.33 | Efectivo/Margen 360.00 | **Total 6481.25**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| META | 1.60208 | 611.91 | 980.33 |
| QQQ | 1.22349 | 667.74 | 816.97 |
| MSFT | 2.21031 | 407.78 | 901.32 |
| NFLX | 2.21694 | 93.61 | 207.53 |
| TQQQ | 1.51171 | 63.54 | 96.05 |
| GLD | 0.91455 | 423.66 | 387.46 |
| SPOT | 1.97523 | 446.55 | 882.04 |
| VOO | 1.39456 | 660.58 | 921.22 |

### May 2026 — Securities 5762.45 | FDIC 1112.75 | Efectivo/Margen 0.00 | **Total 6875.20**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| META | 1.85055 | 632.51 | 1170.49 |
| QQQ | 1.22349 | 738.31 | 903.31 |
| MSFT | 2.58426 | 450.24 | 1163.54 |
| NFLX | 2.21694 | 86.02 | 190.70 |
| GLD | 0.91455 | 417.12 | 381.48 |
| SPOT | 1.97523 | 497.68 | 983.03 |
| VOO | 1.39456 | 695.49 | 969.90 |

### Jun 2026 — Securities 6319.57 | FDIC 200.08 | Efectivo/Margen 2.64 | **Total 6522.29**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 0.19564 | 357.37 | 69.92 |
| META | 1.85055 | 563.29 | 1042.40 |
| QQQ | 1.22349 | 736.40 | 900.98 |
| MSFT | 2.58426 | 373.02 | 963.98 |
| NFLX | 2.21694 | 71.40 | 158.29 |
| TQQQ | 10.87017 | 81.00 | 880.48 |
| GLD | 1.19124 | 368.38 | 438.83 |
| SPOT | 1.97523 | 459.13 | 906.89 |
| VOO | 1.39456 | 686.81 | 957.80 |

### Jul 2026 — Securities 7084.81 | FDIC 0.00 | Efectivo/Margen 42.49 | **Total 7127.30**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 3.21729 | 356.13 | 1145.77 |
| META | 2.68966 | 556.71 | 1497.36 |
| QQQ | 1.22349 | 687.99 | 841.75 |
| MSFT | 2.49708 | 464.72 | 1160.44 |
| TQQQ | 15.07901 | 64.62 | 974.41 |
| GLD | 1.19124 | 371.54 | 442.59 |
| VOO | 1.39456 | 686.65 | 957.57 |
| SMH | 0.1201 | 540.53 | 64.92 |

### Ago 2026 — Securities 7391.27 | FDIC 100.89 | Efectivo/Margen 0.00 | **Total 7492.16**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 3.21729 | 339.35 | 1091.79 |
| META | 3.41914 | 572.34 | 1956.91 |
| QQQ | 1.22349 | 716.76 | 876.95 |
| MSFT | 2.49708 | 507.29 | 1266.74 |
| TQQQ | 7.98323 | 71.92 | 574.15 |
| GLD | 1.19124 | 408.42 | 486.53 |
| VOO | 1.39456 | 704.89 | 983.01 |
| SMH | 0.2788 | 556.63 | 155.19 |

### Sep 2026 — Securities 7278.33 | FDIC 1087.69 | Efectivo/Margen 1.78 | **Total 8367.80**

| Simbolo | Cantidad | Precio | Valor |
|---|---:|---:|---:|
| GOOGL | 6.94601 | 344.08 | 2389.98 |
| META | 1.51914 | 725.18 | 1101.65 |
| QQQ | 1.22349 | 739.77 | 905.10 |
| MSFT | 2.49708 | 512.90 | 1280.75 |
| GLD | 1.19124 | 380.84 | 453.67 |
| VOO | 1.39456 | 700.86 | 977.39 |
| SMH | 0.2788 | 609.00 | 169.79 |

Simbolos: QQQ = Invesco QQQ Trust; SCHD = Schwab US Dividend Equity ETF; VT = Vanguard Total World Stock ETF; VOO = Vanguard S&P 500 ETF; NDAQ = Nasdaq Inc; SPY = SPDR S&P 500 ETF Trust; GOOGL = Alphabet Inc Clase A; NVDA = NVIDIA; META = Meta Platforms Clase A; VGT = Vanguard Information Technology ETF; NFLX = Netflix; SPOT = Spotify Technology; TQQQ = ProShares UltraPro QQQ (3x); AMZN = Amazon; MSFT = Microsoft; GLD = SPDR Gold Shares; SMH = VanEck Semiconductor ETF.

---

## 6. Operaciones (compras y ventas) por mes

Importe = debito (compra) o credito (venta) segun el PDF. Fecha = fecha de liquidacion que muestra la seccion de actividad; la marca *op.* indica la fecha real de la operacion cuando difiere.

### Jun 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-06-23 | COMPRA | QQQ | 0.09505 | 525.99 | 50.15 |
| 2025-06-23 | COMPRA | NDAQ | 0.23142 | 86.42 | 20.15 |
| 2025-06-23 | COMPRA | SPY | 0.08421 | 593.695 | 50.15 |
| 2025-06-23 | COMPRA | VOO | 0.0274 | 547.38 | 15.15 |
| 2025-06-24 | VENTA | NDAQ | 0.23142 | 86.61 | 19.88 |
| 2025-06-24 | VENTA | SPY | 0.08421 | 598.64 | 50.25 |
| 2025-06-25 | COMPRA | QQQ | 0.01117 | 536.80 | 6.15 |
| 2025-06-25 | COMPRA | SCHD | 1.60262 | 26.675 | 42.90 |
| 2025-06-25 | COMPRA | VT | 0.59739 | 126.215 | 75.55 |
| 2025-06-25 | COMPRA | VOO | 0.17727 | 557.10 | 98.91 |

Total compras 359.11 | Total ventas 70.13

### Jul 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-07-18 | VENTA | SCHD | 1.60262 | 26.93 | 43.05 |
| 2025-07-21 | COMPRA | GOOGL | 0.23566 | 184.33 | 43.59 |
| 2025-07-22 | COMPRA | GOOGL | 0.79765 | 189.33 | 151.17 |
| 2025-07-22 | COMPRA | QQQ | 0.01591 | 565.365 | 9.14 |
| 2025-07-22 | COMPRA | VT | 0.06389 | 130.53 | 8.49 |
| 2025-07-22 | COMPRA | VOO | 0.03284 | 579.69 | 19.19 |

Total compras 231.58 | Total ventas 43.05

### Ago 2025

Sin operaciones.

### Sep 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-09-03 | COMPRA | QQQ | 0.01704 | 563.34 | 9.75 |
| 2025-09-03 | COMPRA | NVDA | 0.11714 | 170.73 | 20.15 |
| 2025-09-03 | COMPRA | VT | 0.11342 | 132.25 | 15.15 |
| 2025-09-23 | COMPRA | QQQ | 0.1599 | 600.34 | 96.14 |
| 2025-09-23 | COMPRA | NVDA | 0.38116 | 175.775 | 67.15 |
| 2025-09-23 | COMPRA | VT | 0.70514 | 137.56 | 97.15 |
| 2025-09-23 | COMPRA | VOO | 0.16318 | 612.81 | 100.15 |
| 2025-09-24 | COMPRA | NVDA | 0.43905 | 179.93 | 79.15 |

Total compras 484.79 | Total ventas 0.00

### Oct 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-10-03 | COMPRA | META | 0.06884 | 726.23 | 50.14 |
| 2025-10-07 | COMPRA | META | 0.07135 | 704.24 | 50.40 |
| 2025-10-14 | VENTA | VT | 1.47984 | 136.885 | 202.46 |
| 2025-10-15 | COMPRA | VGT | 0.27224 | 743.11 | 202.45 |

Total compras 302.99 | Total ventas 202.46

### Nov 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-11-03 *(op. 10-31)* | VENTA | GOOGL | 0.5166 | 280.475 | 144.73 |
| 2025-11-03 *(op. 10-31)* | VENTA | VGT | 0.27224 | 797.03 | 216.82 |
| 2025-11-04 | COMPRA | NFLX | 0.32139 | 1124.68 | 361.61 |
| 2025-11-05 | COMPRA | META | 0.2126 | 634.28 | 135.00 |
| 2025-11-10 | COMPRA | QQQ | 0.18182 | 604.985 | 110.15 |
| 2025-11-10 | COMPRA | VOO | 0.17817 | 611.77 | 109.15 |
| 2025-11-10 | VENTA | GOOGL | 0.51671 | 277.195 | 143.07 |
| 2025-11-14 | COMPRA | META | 0.23342 | 615.265 | 143.77 |
| 2025-11-18 | COMPRA | META | 0.66657 | 600.08 | 400.15 |
| 2025-11-18 | COMPRA | QQQ | 0.65913 | 606.86 | 400.15 |
| 2025-11-18 | COMPRA | VOO | 0.8157 | 612.97 | 500.15 |

Total compras 2160.13 | Total ventas 504.62

### Dic 2025

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2025-12-04 | COMPRA | NFLX | 2.92261 | 102.60 | 300.01 |
| 2025-12-12 | COMPRA | SPOT | 0.99717 | 601.70 | 600.15 |

Total compras 900.16 | Total ventas 0.00

### Ene 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-01-05 | COMPRA | NFLX | 1.08043 | 92.555 | 100.15 |
| 2026-01-05 | COMPRA | TQQQ | 9.6043 | 52.06 | 500.15 |
| 2026-01-08 | COMPRA | SPOT | 0.34829 | 574.225 | 200.15 |
| 2026-01-12 | VENTA | TQQQ | 9.6043 | 55.00 | 528.13 |
| 2026-01-15 | COMPRA | TQQQ | 10.0243 | 52.67 | 528.13 |
| 2026-01-16 | VENTA | TQQQ | 10.0243 | 55.355 | 554.79 |
| 2026-01-30 | COMPRA | TQQQ | 9.34404 | 53.51 | 500.15 |

Total compras 1828.73 | Total ventas 1082.92

### Feb 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-02-03 | COMPRA | GLD | 0.91455 | 437.37 | 400.15 |
| 2026-02-06 | COMPRA | MSFT | 0.50005 | 399.96 | 200.15 |
| 2026-02-09 | COMPRA | TQQQ | 1.00623 | 49.69 | 50.15 |
| 2026-02-13 | COMPRA | AMZN | 0.31746 | 201.60 | 64.15 |
| 2026-02-13 | COMPRA | TQQQ | 1.03299 | 48.79 | 50.55 |

Total compras 765.15 | Total ventas 0.00

### Mar 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-03-04 | COMPRA | QQQ | 0.08347 | 593.615 | 49.70 |
| 2026-03-04 | COMPRA | MSFT | 0.50632 | 395.00 | 200.15 |
| 2026-03-04 | COMPRA | TQQQ | 4.29507 | 46.565 | 200.15 |

Total compras 450.00 | Total ventas 0.00

### Abr 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-04-02 | COMPRA | TQQQ | 4.63338 | 43.165 | 200.15 |
| 2026-04-06 | COMPRA | META | 0.3493 | 572.56 | 200.15 |
| 2026-04-10 | VENTA | AMZN | 0.31746 | 232.405 | 73.61 |
| 2026-04-14 | VENTA | NVDA | 0.93735 | 188.92 | 176.91 |
| 2026-04-14 | VENTA | TQQQ | 17.0 | 49.7733 | 846.02 |
| 2026-04-15 | VENTA | NFLX | 5.0 | 105.55 | 527.62 |
| 2026-04-17 | COMPRA | SPOT | 0.27917 | 537.30 | 150.15 |
| 2026-04-21 | COMPRA | MSFT | 0.59792 | 418.11 | 250.15 |
| 2026-04-22 | VENTA | TQQQ | 1.8 | 58.105 | 104.47 |
| 2026-04-24 | COMPRA | MSFT | 0.60602 | 412.525 | 250.15 |
| 2026-04-29 | COMPRA | SPOT | 0.3506 | 427.835 | 150.15 |

Total compras 1200.90 | Total ventas 1728.63

### May 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-05-01 *(op. 04-30)* | COMPRA | META | 0.24847 | 603.685 | 150.15 |
| 2026-05-01 *(op. 04-30)* | COMPRA | MSFT | 0.37395 | 401.12 | 150.15 |
| 2026-05-07 | VENTA | TQQQ | 1.51171 | 69.60 | 105.10 |
| 2026-05-13 | COMPRA | TQQQ | 1.26294 | 73.6375 | 93.15 |
| 2026-05-19 | COMPRA | TQQQ | 1.44912 | 73.8375 | 107.15 |
| 2026-05-27 | VENTA | TQQQ | 2.71206 | 81.131 | 219.91 |

Total compras 500.60 | Total ventas 325.01

### Jun 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-06-04 | COMPRA | GLD | 0.27669 | 408.385 | 113.15 |
| 2026-06-08 | COMPRA | TQQQ | 4.57456 | 76.51 | 350.15 |
| 2026-06-08 | COMPRA | TQQQ | 5.64702 | 79.688 | 450.15 |
| 2026-06-16 | VENTA | TQQQ | 10.22158 | 84.7923 | 866.58 |
| 2026-06-23 | COMPRA | GOOGL | 0.19564 | 350.5832 | 68.74 |
| 2026-06-24 | COMPRA | TQQQ | 5.98838 | 75.1455 | 450.15 |
| 2026-06-25 | COMPRA | TQQQ | 4.88179 | 71.695 | 350.15 |

Total compras 1782.49 | Total ventas 866.58

### Jul 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-07-01 *(op. 06-30)* | VENTA | TQQQ | 10.87017 | 79.7901 | 867.20 |
| 2026-07-08 | COMPRA | TQQQ | 6.15782 | 73.0777 | 450.15 |
| 2026-07-08 | COMPRA | SMH | 0.1201 | 582.817 | 70.15 |
| 2026-07-09 | COMPRA | TQQQ | 4.98323 | 70.2355 | 350.15 |
| 2026-07-10 | VENTA | TQQQ | 11.14105 | 75.9723 | 846.28 |
| 2026-07-14 | COMPRA | TQQQ | 7.51492 | 73.1877 | 550.15 |
| 2026-07-17 | COMPRA | GOOGL | 0.12795 | 359.512 | 46.15 |
| 2026-07-17 | COMPRA | TQQQ | 6.42144 | 70.0777 | 450.15 |
| 2026-07-20 | COMPRA | GOOGL | 2.8937 | 345.5772 | 1000.15 |
| 2026-07-24 | COMPRA | MSFT | 1.31282 | 380.8585 | 500.15 |
| 2026-07-24 | COMPRA | TQQQ | 1.14265 | 65.6977 | 75.22 |
| 2026-07-24 | VENTA | NFLX | 2.21694 | 68.7623 | 152.32 |
| 2026-07-24 | VENTA | SPOT | 1.97523 | 467.2973 | 922.89 |
| 2026-07-28 | COMPRA | META | 0.83911 | 595.865 | 500.15 |
| 2026-07-31 | VENTA | MSFT | 1.4 | 445.0504 | 622.94 |

Total compras 3992.57 | Total ventas 3411.63

### Ago 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-08-04 | COMPRA | TQQQ | 0.6431 | 65.3077 | 42.15 |
| 2026-08-05 | VENTA | TQQQ | 14.5 | 74.5023 | 1080.14 |
| 2026-08-12 | COMPRA | TQQQ | 1.09923 | 72.7777 | 80.15 |
| 2026-08-19 | COMPRA | META | 0.72948 | 548.3297 | 400.15 |
| 2026-08-21 | COMPRA | TQQQ | 5.66189 | 70.6477 | 400.15 |
| 2026-08-25 | COMPRA | SMH | 0.1587 | 548.1717 | 87.14 |

Total compras 1009.74 | Total ventas 1080.14

### Sep 2026

| Fecha | Op. | Simbolo | Cantidad | Precio | Importe |
|---|---|---|---:|---:|---:|
| 2026-09-02 | COMPRA | TQQQ | 1.45734 | 68.6177 | 100.15 |
| 2026-09-02 | COMPRA | TQQQ | 4.75162 | 68.3977 | 325.15 |
| 2026-09-10 | COMPRA | GOOGL | 3.72872 | 328.7987 | 1226.15 |
| 2026-09-10 | VENTA | META | 1.9 | 645.3388 | 1226.00 |
| 2026-09-22 | VENTA | TQQQ | 14.19219 | 76.4323 | 1084.60 |

Total compras 1651.45 | Total ventas 2310.60

---

## 7. Metricas acumuladas (jun 2025 - Sep 2026)

| Concepto | Monto USD |
|---|---:|
| Aportes totales (Journal from HAPI) | 8141.37 |
| Retiros a Bakkt/Crypto (Journal to BAKKT) | 1074.73 |
| Entradas desde Bakkt | 0.92 |
| **Capital neto aportado a Bolsa** | **7067.56** |
| Valor total de la cuenta al cierre (Sep 2026) | 8367.80 |
| **Resultado acumulado (valor - capital neto)** | **1300.24** |
| Rendimiento simple sobre capital neto | 18.40% |
| Dividendos brutos / retencion / netos | 26.45 / 7.94 / 18.51 |
| Intereses de margen pagados | 2.00 |

El resultado acumulado incluye ganancia realizada + no realizada + dividendos netos - intereses de margen. Es un rendimiento simple (no ponderado por tiempo); para un TWR/MWR usar los flujos fechados de la seccion 3 y los valores de cierre de la seccion 2.

---

## 8. Log de meses incorporados

| Mes | PDF de origen |
|---|---|
| Jun 2025 | JUNIO 2025.pdf |
| Jul 2025 | JULIO 2025.pdf |
| Ago 2025 | AGOSTO 2025.pdf |
| Sep 2025 | SEPTIEMBRE 2025.pdf |
| Oct 2025 | OCTUBRE 2025.pdf |
| Nov 2025 | NOVIEMBRE 2025.pdf |
| Dic 2025 | DICIEMBRE 2025.pdf |
| Ene 2026 | ENERO2026.pdf |
| Feb 2026 | STATEMENT-2_27_2026.pdf |
| Mar 2026 | STATEMENT-3_31_2026.pdf |
| Abr 2026 | STATEMENT-4_30_2026.pdf |
| May 2026 | MAYO2026.pdf |
| Jun 2026 | JUNIO2026.pdf |
| Jul 2026 | JULIO2026.pdf |
| Ago 2026 | AGOSTO2026.pdf |
| Sep 2026 | SEPTIEMBRE2026.pdf |

**Pendiente:** octubre 2026 (el estado se genera despues del cierre del mes). Al llegar, seguir el protocolo de la seccion 0 y anotar aqui el nombre del PDF.
