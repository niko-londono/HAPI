# HAPI · Portafolio de Inversiones

Dashboard web moderno e interactivo para el seguimiento y resumen consolidado de inversiones en bolsa y crypto a partir de los estados de cuenta mensuales de Apex Clearing y HAPI (jun 2025 – sep 2026).

---

## 📁 Arquitectura de Archivos Maestros

El proyecto está organizado en **3 archivos maestros** desacoplados, limpios y fáciles de mantener:

1. **`MAESTRO.js`** *(Motor de Datos y Lógica Financiera)*:
   - Datos crudos: `D` (estados mensuales), `T_RAW` (historial de operaciones), `PR` (precios de activos al cierre), `N` (catálogo de nombres) y `X` (traspasos a Bakkt Crypto).
   - Motor de cálculo: algoritmo de costo promedio por activo, cálculo de ganancias realizadas por operación y mes, cálculo de ganancias no realizadas (`ur`), rendimiento total mensual (`pl`) y base de capital promedio ponderado (Modified Dietz).
   - Consulta a Yahoo Finance vía proxies CORS con respaldos y persistencia en `localStorage`.
   - Funciones utilitarias de formateo monetario, porcentual y fechas.

2. **`MAESTRO.css`** *(Sistema de Diseño y Estilos)*:
   - Estilo minimalista casi monocromo, modo oscuro por defecto y modo claro.
   - Tipografía única *Inter* con cifras tabulares.
   - Verde/rojo solo para ganancia/pérdida; diseño responsivo para móvil y escritorio.

3. **`MAESTRO.jsx`** *(Interfaz y Componentes React 18)*:
   - Desarrollado con Hooks (`useState`, `useMemo`, `useEffect`, `useCallback`, `useRef`).
   - **Gráfico interactivo SVG**: barras apiladas de ganancia realizada vs no realizada, curva de ganancia acumulada, marcas de depósitos y tooltip flotante dinámico con detalles al pasar el cursor.
   - **Tarjetas KPI**: Realizada, No realizada, Ganancia de capital, Dividendos/cargos y Rendimiento total con porcentaje sobre el capital promedio.
   - **Filtros por período**: `1M`, `3M`, `6M`, `YTD`, `1A`, `2025`, `2026`, `ALL`.
   - **Tablas dinámicas**:
     - *Posiciones*: buscador en tiempo real, desglose de activos, precio, valor de mercado, % de cartera y reserva de efectivo FDIC.
     - *Rendimiento mensual*: balance cronológico de depósitos, retiros y retornos.
     - *Operaciones*: filtro por tipo de orden (Compras, Ventas, Splits) y búsqueda por ticker.
   - **Módulo Crypto (Bakkt)**:
     - Lotes BTC reales tomados de la foto "Share Lots" (ver `HAPI_crypto.md`), con valor, ganancia y costo promedio.
     - Precio del corte por defecto; opción de precio en vivo (Yahoo Finance) o manual para revaluar.
     - Gráfico del costo por BTC de cada lote frente al precio actual y al costo promedio.
     - Conciliación de los traspasos "Journal to BAKKT" de la bolsa con cada lote.

4. **`index.html`** *(Punto de Entrada)*:
   - Carga las fuentes, `MAESTRO.css`, las librerías CDN de React 18 y Babel Standalone para transpilar el JSX en caliente, enlazando `MAESTRO.js` y `MAESTRO.jsx`.

---

## 📊 Metodología de Cálculo

- **Rendimiento total del mes**: `Valor al cierre − Valor al cierre anterior − Depósitos netos (depósitos − retiros)`.
- **Ganancia realizada**: calculada en cada venta contrastando el monto recibido contra el costo promedio ponderado de las acciones adquiridas previamente en la lista `T`.
- **Ganancia no realizada**: `Rendimiento total − Realizada − Dividendos netos y cargos`.
- **Porcentajes de retorno**: calculados sobre el capital promedio ponderado del período (Modified Dietz: saldo inicial + mitad de los flujos netos).
- **Traspasos a Bakkt**: se tratan como retiros de la bolsa y alimentan el módulo de Crypto.

---

## 🚀 Cómo Ejecutar y Desplegar

### En Producción (GitHub Pages)
El repositorio cuenta con el flujo automatizado `.github/workflows/deploy.yml` y el archivo `.nojekyll`:
1. En GitHub, ve a **Settings** → **Pages**.
2. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
3. Cada `push` a la rama `main` desplegará el portafolio automáticamente en `https://niko-londono.github.io/HAPI/`.

### En Producción (Vercel)
También compatible con **Vercel** (`portafolio-finanzas`) como sitio estático sin comando de compilación (`build command: none`), ya que el navegador compila `MAESTRO.jsx` en tiempo de ejecución.

### En Local
Debido a que `MAESTRO.jsx` es interpretado por Babel en el navegador, para visualizarlo localmente utiliza cualquier servidor HTTP estático (para evitar bloqueos CORS locales de `file:///`):

```bash
# Opción 1: Con npx serve
npx serve .

# Opción 2: Con la extensión Live Server de VS Code
# Clic derecho en index.html → "Open with Live Server"
```

---

## 📝 Actualización de Datos Mensuales

Para registrar un nuevo mes o nuevas operaciones, abre **`MAESTRO.js`**:
1. Agrega una nueva fila al arreglo `D`: `['YYYY-MM', valor_cierre, depositos, retiros, dividendos]`.
2. Añade las nuevas transacciones al string `T_RAW`: `YYMMDD,Tipo,Ticker,Cantidad,Monto;`.
3. Actualiza los precios de mercado en el objeto `PR` para los activos en cartera.
4. Si realizaste traspasos a Crypto, añade la fila en el arreglo `X`: `['YYYY-MM-DD', monto]`.
