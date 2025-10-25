# PAGINATION COMPONENT DEBUG — Análisis Forense y Plan de Implementación (25 Oct 2025)

## Resumen Ejecutivo

**Objetivo**: Diagnosticar y solucionar el problema de paginación en el componente `PendingTransfersSent` donde los controles Prev/Next y el contador "Showing X-Y of Z" no funcionan correctamente cuando hay más de 5 transfers.

**Síntoma reportado**: En Dashboard (Outgoing Transfers con `showAllStatuses={true}`), la paginación no responde correctamente a los clicks de Prev/Next, y el contador puede mostrar valores incorrectos.

**Hipótesis inicial**: El código de paginación está duplicado en dos componentes (`PendingTransfersSent` y `PendingTransfersReceived`) con implementaciones ligeramente diferentes. Extraer la lógica a un componente reutilizable permitirá:

1. Aislar y debugear el problema en un solo lugar
2. Aplicar el fix una sola vez
3. Mantener consistencia visual y funcional entre ambos listados

**Enfoque propuesto**:

1. **Análisis forense** del código actual de paginación
2. **Diagnóstico** del bug específico mediante tests reproducibles
3. **Extracción** de lógica de paginación a componente `TransfersPagination`
4. **Fix** del bug identificado
5. **Integración** en ambos componentes existentes
6. **QA Manual** exhaustiva con Anvil

**Riesgo**: ⚠️ MEDIO — La paginación funciona en `PendingTransfersReceived` según tests existentes, pero falla en `PendingTransfersSent` con `includeAllStatuses=true`. El bug podría estar en:

- El hook `useTransfersList` cuando `includeAllStatuses=true` (event sourcing)
- La lógica de cálculo de offset/totalPages en componente
- Interacción con real-time updates (eventos de SC)

---

## 1. ANÁLISIS DOCUMENTAL COMPLETO

### Archivos de documentación revisados

| Archivo       | Relevancia | Hallazgos clave                                                                                                                       |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ADR 002`     | ✅ Alta    | Documenta implementación de paginación SC-native para pending transfers. Define pageSize=5 como estándar.                             |
| `ADR 005`     | ✅ Alta    | Documenta decisión de event sourcing para all-statuses con paginación client-side (slice).                                            |
| `PROGRESS.md` | ⚠️ Media   | Documenta implementación de `useTransfersList` unificado (25 Oct), pero no menciona validación exhaustiva de paginación all-statuses. |

### Intención de diseño extraída

**Paginación SC-native (pending-only)**:

- Smart contract mantiene índices `pendingBySender[address]` y `pendingByRecipient[address]`
- Getter `getPendingBySender(address, offset, limit)` retorna página específica + total
- Frontend calcula `totalPages = ceil(total / pageSize)`
- Componente usa `page` state y calcula `offset = (page - 1) * pageSize`

**Paginación client-side (all-statuses con event sourcing)**:

- Frontend query todos los eventos `TransferRequested`
- Filtra por sender/recipient en JS
- Ordena por `createdAt desc`
- **Slice client-side**: `items.slice(offset, offset + pageSize)`
- **Total**: longitud del array filtrado completo

**Desafío identificado**: Dos estrategias diferentes de paginación en el mismo hook (`useTransfersList`) según `includeAllStatuses`. Si hay inconsistencia en cálculo de `totalPages` o manejo de `page` state, puede causar desincronización.

---

## 2. AUDITORÍA DE IMPLEMENTACIÓN (CÓDIGO ACTUAL)

### 2.1 Estructura de archivos

```
supply-chain-tracker/web/src/components/tokenOps/
├── PendingTransfersSent.tsx          [220 lines] — ⚠️ Paginación duplicada
├── PendingTransfersReceived.tsx      [166 lines] — ⚠️ Paginación duplicada
└── PendingTransfers.tsx              [115 lines] — ⚠️ Legacy, similar pattern
```

### 2.2 Análisis de `PendingTransfersSent.tsx` (líneas 173-206)

**Código de paginación actual**:

```tsx
<div className="flex items-center justify-between p-3 border-t bg-gray-50">
  <div className="text-xs text-gray-500">
    {(() => {
      const offset = (page - 1) * 5;
      return (
        <span>
          Showing {Math.min(total, offset + 1)}–
          {Math.min(total, offset + items.length)} of {total}
        </span>
      );
    })()}
  </div>
  <div className="space-x-2">
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() => setPage(Math.max(1, page - 1))}
      disabled={page <= 1}
    >
      Prev
    </button>
    <span className="text-xs text-gray-600">
      Page {page} / {Math.max(1, Math.ceil(total / 5))}
    </span>
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() =>
        setPage(Math.min(Math.max(1, Math.ceil(total / 5)), page + 1))
      }
      disabled={page >= Math.max(1, Math.ceil(total / 5))}
      aria-label="Next"
    >
      Next
    </button>
  </div>
</div>
```

**Problemas potenciales identificados**:

1. **Hardcoded pageSize**: `const offset = (page - 1) * 5` usa literal `5` en lugar de `pageSize` variable. Si el hook usa `pageSize` diferente, hay desincronización.

2. **Cálculo inline de totalPages**: `Math.max(1, Math.ceil(total / 5))` repetido 3 veces. Debería ser un `useMemo` o prop del hook.

3. **onClick de Next button**: Lógica compleja `setPage(Math.min(Math.max(1, Math.ceil(total / 5)), page + 1))`. ¿Por qué `Math.max(1, ...)`? Parece defensive programming innecesario si `totalPages` ya está calculado correctamente.

4. **No usa `pageSize` del hook**: El hook `useTransfersList` tiene `pageSize: 5` explícito, pero el componente calcula offset con literal `5`. Si cambia el pageSize del hook, la UI queda desincronizada.

### 2.3 Análisis de `PendingTransfersReceived.tsx` (líneas 127-157)

**Código de paginación** (casi idéntico a `PendingTransfersSent`):

```tsx
<div className="flex items-center justify-between p-3 border-t bg-gray-50">
  <div className="text-xs text-gray-500">
    {(() => {
      const offset = (page - 1) * 5;
      return (
        <span>
          Showing {Math.min(total, offset + 1)}–
          {Math.min(total, offset + items.length)} of {total}
        </span>
      );
    })()}
  </div>
  <div className="space-x-2">
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() => setPage(Math.max(1, page - 1))}
      disabled={page <= 1}
    >
      Prev
    </button>
    <span className="text-xs text-gray-600">
      Page {page} / {Math.max(1, Math.ceil(total / 5))}
    </span>
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() =>
        setPage(Math.min(Math.max(1, Math.ceil(total / 5)), page + 1))
      }
      disabled={page >= Math.max(1, Math.ceil(total / 5))}
    >
      Next
    </button>
  </div>
</div>
```

**Observación crítica**: El código es **idéntico** (copy-paste evidente). Sin embargo:

- Tests de `PendingTransfersReceived` pasan (ver `factory.transfers.test.tsx` línea 51: `expect(screen.getByText(/showing 1–2 of 3/i)).toBeInTheDocument();`)
- Usuario reporta que `PendingTransfersSent` con `showAllStatuses={true}` no funciona

**Hipótesis**: El bug NO está en el componente UI, sino en el **hook `useTransfersList`** cuando `includeAllStatuses=true`.

### 2.4 Análisis de `useTransfersList` (líneas 38-163)

**Branch pending-only** (líneas 138-142):

```typescript
const result =
  mode === "sender"
    ? await contract.getPendingBySender(address, offset, pageSize)
    : await contract.getPendingByRecipient(address, offset, pageSize);
items = result.items as TransfersListResult["items"];
total = result.total;
```

✅ **Correcto**: SC retorna `items` de la página actual y `total` correcto.

**Branch all-statuses** (líneas 58-134):

```typescript
if (includeAllStatuses) {
  // 1) Query all TransferRequested events
  const logs: any[] = await (contractInstance as any).queryFilter(requestFilter, 0, 'latest');

  // 2) Filter by participant
  const byAddr = logs.filter(...);

  // 3) Collect unique transfer IDs
  const ids = Array.from(idSet);

  // 4) Fetch transfer details
  const transfersRaw: TransfersListResult['items'] = await Promise.all(...);
  const valid = transfersRaw.filter(Boolean);

  // 5) Sort and paginate CLIENT-SIDE
  valid.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  total = valid.length;
  items = valid.slice(offset, offset + pageSize);
}
```

**🔴 BUG IDENTIFICADO**:

La línea `items = valid.slice(offset, offset + pageSize);` usa `offset` que fue calculado en línea 39:

```typescript
const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
```

**Escenario problemático**:

1. Usuario está en `page=1`, ve items 1-5 de 12 total
2. Usuario click "Next" → `setPage(2)`
3. Hook re-ejecuta con `page=2`, calcula `offset=5` ✅
4. Event sourcing query obtiene TODOS los transfers (12), ordena, hace slice(5, 10) ✅
5. **Pero**: Si hay race condition entre `page` state update y `useEffect` re-run, o si el componente calcula offset con valor stale de `page`, puede mostrar datos incorrectos

**Problema adicional**: El hook tiene lógica de auto-ajuste de página (líneas 147-151):

```typescript
const totalPages = Math.max(1, Math.ceil(total / pageSize));
if (total > 0 && page > totalPages) {
  setPage(totalPages);
  return; // ← EARLY RETURN sin actualizar items/total
}
```

Si el usuario está en `page=2` con 12 items, luego acepta todos los items de esa página y quedan solo 5 items totales (`totalPages=1`), el hook hace `setPage(1)` y **retorna sin setear `items` ni `total`**. En el siguiente render, `page=1` pero `items` y `total` pueden estar stale.

### 2.5 Comparación con `PendingTransfers.tsx` (legacy, líneas 84-104)

**Código de paginación del componente legacy**:

```tsx
<div className="flex items-center justify-between p-3 border-t bg-gray-50">
  <div className="text-xs text-gray-500">
    Showing {Math.min(total, offset + 1)}–
    {Math.min(total, offset + rows.length)} of {total}
  </div>
  <div className="space-x-2">
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page <= 1}
    >
      Prev
    </button>
    <span className="text-xs text-gray-600">
      Page {page} / {totalPages}
    </span>
    <button
      className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page >= totalPages}
    >
      Next
    </button>
  </div>
</div>
```

**Diferencias clave**:

1. ✅ **Usa variable `totalPages`**: Calculada con `useMemo` (línea 23)
2. ✅ **setPage con función**: `setPage((p) => Math.max(1, p - 1))` es más seguro que `setPage(page - 1)` en caso de rapid clicks
3. ✅ **Más legible**: No hay nested `Math.max(Math.max(...))` en Next button

**Conclusión**: El componente legacy tiene mejor patrón de paginación UI.

---

## 3. DIAGNÓSTICO DEL BUG

### 3.1 Reproducción del bug (Pasos manuales)

**Setup necesario**:

1. Anvil corriendo con SC desplegado
2. Usuario Producer registrado y aprobado
3. Usuario Factory registrado y aprobado
4. Producer crea 1 token raw material
5. Producer envía 7 transfers del mismo token a Factory
6. Factory acepta 2, rechaza 2, deja 3 pending
7. Producer abre Dashboard → Outgoing Transfers (muestra 7 con `showAllStatuses={true}`)

**Pasos de reproducción**:

1. Verificar contador inicial: "Showing 1–5 of 7"
2. Click "Next" button
3. **Esperado**: Contador cambia a "Showing 6–7 of 7", tabla muestra items 6-7
4. **Actual** (bug reportado): ¿Qué sucede exactamente? Necesitamos validar.

**Posibles síntomas**:

- Contador no cambia (se queda "1–5 of 7")
- Contador cambia pero tabla sigue mostrando items 1-5
- Contador muestra valores incorrectos (ej: "Showing 6–10 of 7")
- Botones Prev/Next se deshabilitan incorrectamente

### 3.2 Tests existentes de paginación

**Test que SÍ valida paginación** (`factory.transfers.test.tsx` líneas 17-53):

```typescript
it("lists pending transfers received (paginated)", async () => {
  const mockItems = [
    /* 2 items */
  ];
  (contract as any).getPendingByRecipient.mockResolvedValue({
    items: mockItems,
    total: 3,
  });
  // ...
  expect(screen.getByText(/showing 1–2 of 3/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
});
```

✅ **Pasa** porque `PendingTransfersReceived` usa pending-only mode (SC getter).

**Test que valida paginación post-action** (`factory.transfers.test.tsx` líneas 241-280):

```typescript
it("respects pagination after actions", async () => {
  // Page 1: 5 items of 6 total
  // Click Next → Page 2: 1 item of 6 total
  // Accept last item → total becomes 5
  // Hook auto-adjusts page back to 1
  // ...
});
```

✅ **Pasa** y valida el auto-ajuste de página del hook.

**Test FALTANTE**:
❌ No hay test que valide paginación en `PendingTransfersSent` con `showAllStatuses={true}`.
❌ No hay test que valide clicks de Prev/Next en all-statuses mode.

### 3.3 Root Cause Analysis

**Hipótesis principal**: El bug está en el hook `useTransfersList` branch all-statuses:

1. **Race condition en `page` state**: Cuando user click "Next", `setPage(2)` se ejecuta, pero el `useEffect` puede correr con `page` stale si el componente re-renderiza antes que el state update propague.

2. **Early return sin cleanup**: Líneas 147-151 del hook hacen `setPage(totalPages); return;` sin actualizar `items` ni `total`. El componente queda con state inconsistente hasta el siguiente render.

3. **Hardcoded pageSize en componente**: El componente calcula `offset = (page - 1) * 5` pero el hook usa `pageSize` del param. Si hay desincronización (unlikely pero posible), el contador muestra valores incorrectos.

**Hipótesis secundaria**: Bug en el componente UI:

4. **Cálculo inline de offset**: El componente calcula `offset` dentro de la función de render del contador, no usa `useMemo`. Puede causar cálculos con props stale.

**Validación necesaria**: Crear test que reproduzca el bug antes de fixear.

---

## 4. PLAN DE IMPLEMENTACIÓN (TDD INCREMENTAL)

### Fase 1: RED — Crear test que reproduzca el bug ⏸️ PENDIENTE

**Objetivo**: Test que falle demostrando el problema de paginación en all-statuses mode.

**Paso 1.1: Crear test nuevo** (15 min)

- Archivo: `web/src/__tests__/pending.transfers.sent.pagination.test.tsx` (nuevo)
- Test case: "pagination controls work correctly with showAllStatuses=true"
- Mock `useTransfersList` para retornar 7 items en página 1, 2 items en página 2
- Render `<PendingTransfersSent showAllStatuses={true} />`
- Validar contador inicial: "Showing 1–5 of 7"
- User click "Next"
- **Expected**: Contador cambia a "Showing 6–7 of 7"
- **Expected**: Tabla muestra items 6-7

**Paso 1.2: Ejecutar test** (2 min)

- `npm test -- pending.transfers.sent.pagination.test.tsx --run`
- **Esperado**: Test falla (RED) demostrando el bug

**Commit**: `test(red): pagination breaks in PendingTransfersSent with showAllStatuses`

---

### Fase 2: DIAGNÓSTICO — Identificar línea exacta del bug ⏸️ PENDIENTE

**Objetivo**: Mediante debugs en test, identificar si el bug está en hook o componente.

**Paso 2.1: Instrumentar hook con console.log** (10 min)

- En `useTransfersList.ts`, añadir logs antes de `setItems`, `setTotal`, `setPage`
- Re-ejecutar test RED y analizar output
- Identificar si:
  - Hook retorna items/total correctos pero componente los renderiza mal
  - Hook retorna items/total incorrectos (bug en event sourcing pagination)
  - Hook hace setPage early return y deja state inconsistente

**Paso 2.2: Documentar hallazgo** (5 min)

- Actualizar este documento sección 3.3 con root cause confirmado
- Crear sub-sección "3.4 Root Cause Confirmado"

---

### Fase 3: GREEN (Opción A) — Fix en hook si el bug está ahí ⏸️ PENDIENTE

**Objetivo**: Corregir el hook `useTransfersList` para que maneje pagination all-statuses correctamente.

**Paso 3A.1: Fix early return sin cleanup** (10 min)

```typescript
// ANTES (líneas 147-151)
const totalPages = Math.max(1, Math.ceil(total / pageSize));
if (total > 0 && page > totalPages) {
  setPage(totalPages);
  return; // ← BUG: no setea items/total
}

// DESPUÉS
const totalPages = Math.max(1, Math.ceil(total / pageSize));
if (total > 0 && page > totalPages) {
  setPage(totalPages);
  // NO return aquí; continuar para setear items/total con página ajustada
}
// Recalcular offset con página ajustada
const adjustedOffset = (Math.min(page, totalPages) - 1) * pageSize;
items = includeAllStatuses
  ? valid.slice(adjustedOffset, adjustedOffset + pageSize)
  : result.items;
```

**Paso 3A.2: Añadir `totalPages` al return del hook** (5 min)

```typescript
export interface TransfersListResult {
  items: Array<
    contract.PendingTransfer & { status?: "Pending" | "Accepted" | "Rejected" }
  >;
  total: number;
  page: number;
  totalPages: number; // ← NUEVO
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

- Calcular `totalPages` con `useMemo` en el hook
- Retornarlo para que componentes lo usen directamente

**Paso 3A.3: Ejecutar test** (2 min)

- `npm test -- pending.transfers.sent.pagination.test.tsx --run`
- **Esperado**: Test pasa (GREEN)

**Commit**: `fix(green): useTransfersList pagination handles all-statuses correctly`

---

### Fase 3: GREEN (Opción B) — Fix en componente si el bug está ahí ⏸️ PENDIENTE

**Objetivo**: Corregir cálculos de paginación en componente para usar props del hook correctamente.

**Paso 3B.1: Extraer paginación a componente reutilizable** (30 min)

**Crear** `web/src/components/ui/TransfersPagination.tsx`:

```tsx
interface TransfersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  itemsInCurrentPage: number;
  onPageChange: (newPage: number) => void;
}

export default function TransfersPagination({
  page,
  totalPages,
  total,
  pageSize,
  itemsInCurrentPage,
  onPageChange,
}: TransfersPaginationProps) {
  const offset = (page - 1) * pageSize;

  return (
    <div className="flex items-center justify-between p-3 border-t bg-gray-50">
      <div className="text-xs text-gray-500">
        Showing {Math.min(total, offset + 1)}–
        {Math.min(total, offset + itemsInCurrentPage)} of {total}
      </div>
      <div className="space-x-2">
        <button
          className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="text-xs text-gray-600">
          Page {page} / {totalPages}
        </span>
        <button
          className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

**Paso 3B.2: Integrar en `PendingTransfersSent`** (10 min)

```tsx
import TransfersPagination from "../ui/TransfersPagination";

// ... dentro del render, reemplazar el div de paginación:
<TransfersPagination
  page={page}
  totalPages={Math.max(1, Math.ceil(total / 5))} // ← TEMPORAL hasta que hook retorne totalPages
  total={total}
  pageSize={5}
  itemsInCurrentPage={items.length}
  onPageChange={setPage}
/>;
```

**Paso 3B.3: Integrar en `PendingTransfersReceived`** (10 min)

- Mismo patrón que 3B.2

**Paso 3B.4: Ejecutar tests** (5 min)

- `npm test -- pending.transfers.sent.pagination.test.tsx --run` → GREEN
- `npm test -- factory.transfers.test.tsx --run` → GREEN (no regresión)

**Commit**: `refactor(green): extract TransfersPagination component and fix calculation`

---

### Fase 4: Optimización — Hacer que hook retorne `totalPages` ⏸️ PENDIENTE

**Objetivo**: Eliminar duplicación de cálculo de `totalPages` en componentes.

**Paso 4.1: Modificar hook** (ver Paso 3A.2 arriba)

**Paso 4.2: Actualizar componentes** (10 min)

```tsx
const { items, total, page, totalPages, setPage, loading, error, refresh } =
  useTransfersList({
    mode: "sender",
    address,
    pageSize: 5,
    includeAllStatuses: showAllStatuses,
  });

// En paginación:
<TransfersPagination
  page={page}
  totalPages={totalPages} // ← Ya no calcular aquí
  total={total}
  pageSize={5}
  itemsInCurrentPage={items.length}
  onPageChange={setPage}
/>;
```

**Paso 4.3: Eliminar cálculos hardcoded** (5 min)

- Buscar `Math.ceil(total / 5)` en componentes y reemplazar por `totalPages`

**Paso 4.4: Ejecutar suite completa** (5 min)

- `npm test` → 100/100 passing

**Commit**: `refactor: hook returns totalPages to eliminate duplication`

---

### Fase 5: Tests adicionales ⏸️ PENDIENTE

**Objetivo**: Asegurar cobertura completa de paginación en ambos modos.

**Paso 5.1: Test de clicks múltiples** (15 min)

- Test: "handles multiple Next/Prev clicks correctly"
- Setup: 12 items, pageSize=5 → 3 páginas
- Simular: Next → Next → Prev
- Validar: Contador y items correctos en cada paso

**Paso 5.2: Test de edge case: página vacía post-action** (15 min)

- Test: "auto-adjusts page when last item on page is removed"
- Setup: 11 items (3 páginas), user en página 3 (item 11)
- Simular: Accept item 11 → total=10 (2 páginas)
- Validar: Hook auto-ajusta a página 2, items correctos

**Commit**: `test: add comprehensive pagination edge cases`

---

### Fase 6: Cleanup y documentación ⏸️ PENDIENTE

**Paso 6.1: Eliminar componente legacy** (5 min)

- `web/src/components/tokenOps/PendingTransfers.tsx` → DELETE
- Verificar no hay imports huérfanos: `grep -r "PendingTransfers[^SR]" src/`

**Paso 6.2: Actualizar PROGRESS.md** (10 min)

```markdown
## 🔧 Fix — Sistema de paginación unificado y corregido (25 Oct 2025 - 16:00)

### Contexto

Post-refactor useTransfersList, se detectó bug en paginación con all-statuses mode:
controles Prev/Next no respondían correctamente cuando >5 transfers.

### Cambios

- Creado componente reutilizable `TransfersPagination`
- Corregido hook `useTransfersList` para manejar page auto-adjust sin early return
- Hook ahora retorna `totalPages` para eliminar cálculos duplicados
- Aplicado en `PendingTransfersSent` y `PendingTransfersReceived`

### Resultado

- Tests: 100/100 passing (incluyendo nuevos tests de paginación all-statuses)
- QA manual: Paginación funciona correctamente con 12+ transfers en Dashboard
- Eliminada duplicación de código de paginación UI
```

**Paso 6.3: Actualizar este análisis** (5 min)

- Marcar fases como "✅ COMPLETADA"
- Añadir sección "5. POST-MORTEM" si se encontraron lecciones adicionales

**Commit**: `docs: document pagination fix and component extraction`

---

### Fase 7: QA Manual exhaustiva ⏸️ PENDIENTE

**Prerequisitos - Terminal Setup**:

1. **Terminal 1 - Start Anvil**:

   ```bash
   cd supply-chain-tracker/sc
   anvil
   ```

2. **Terminal 2 - Deploy Contract**:

   ```bash
   cd supply-chain-tracker/sc
   forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --broadcast
   ```

3. **Terminal 3 - Sync Contract Config**:

   ```bash
   cd supply-chain-tracker/web
   npm run regen:contracts
   ```

4. **Terminal 4 - Start Frontend**:
   ```bash
   cd supply-chain-tracker/web
   npm run dev
   ```

**Checklist de Validación**:

1. **Setup en Browser** (http://localhost:5173):

   - [ ] Registrar Producer (cuenta 0x1)
   - [ ] Admin aprueba Producer
   - [ ] Registrar Factory (cuenta 0x2)
   - [ ] Admin aprueba Factory
   - [ ] Producer: crear 1 token "Wheat" con supply 100

2. **Escenario: Exactamente 5 transfers** (edge case página única):

   - [ ] Producer: enviar 5 transfers a Factory (amounts: 10, 15, 10, 20, 15)
   - [ ] Producer Dashboard → Outgoing Transfers
   - [ ] Validar: Contador "Showing 1–5 of 5"
   - [ ] Validar: Botón "Prev" disabled
   - [ ] Validar: Botón "Next" disabled
   - [ ] Validar: "Page 1 / 1"

3. **Escenario: 7 transfers** (2 páginas):

   - [ ] Producer: enviar 2 transfers más (amounts: 10, 5)
   - [ ] Producer Dashboard → Outgoing Transfers
   - [ ] **Página 1**:
     - [ ] Contador: "Showing 1–5 of 7"
     - [ ] Prev: disabled
     - [ ] Next: enabled
     - [ ] "Page 1 / 2"
   - [ ] Click "Next"
   - [ ] **Página 2**:
     - [ ] Contador: "Showing 6–7 of 7"
     - [ ] Prev: enabled
     - [ ] Next: disabled
     - [ ] "Page 2 / 2"
     - [ ] Tabla muestra los 2 últimos transfers
   - [ ] Click "Prev"
   - [ ] **Vuelta a Página 1**:
     - [ ] Contador: "Showing 1–5 of 7"
     - [ ] Tabla muestra primeros 5 transfers

4. **Escenario: 12 transfers** (3 páginas):

   - [ ] Producer: enviar 5 transfers más
   - [ ] Navegar: Página 1 → Página 2 → Página 3
   - [ ] En página 3: validar contador "Showing 11–12 of 12"
   - [ ] Navegar de vuelta: Página 3 → Página 2 → Página 1

5. **Escenario: Cambio de statuses** (all-statuses mode):

   - [ ] Como Factory: aceptar 3 transfers
   - [ ] Como Factory: rechazar 2 transfers
   - [ ] Como Producer: verificar Dashboard Outgoing muestra 12 transfers con badges de colores
   - [ ] Validar paginación sigue funcionando con mix de statuses

6. **Escenario: Real-time update durante paginación**:

   - [ ] Producer en página 2 del Dashboard
   - [ ] Como Producer (otra pestaña): enviar transfer nuevo
   - [ ] Verificar que página 2 se actualiza o total cambia correctamente

7. **Escenario: PendingTransfersReceived (incoming)** (pending-only mode):
   - [ ] Factory Dashboard → Incoming Transfers
   - [ ] Si hay >5 pending, validar paginación funciona igual que outgoing

**Expected result**: Todas las validaciones ✅

---

## 5. CRITERIOS DE ACEPTACIÓN

### Must-have (Bloquean merge)

- [ ] ✅ **Tests**: 100/100 passing incluyendo nuevos tests de paginación all-statuses
- [ ] ✅ **Build**: `npm run build` exitoso sin errores TypeScript
- [ ] ✅ **QA Manual**: Todas las validaciones de Fase 7 pasadas
- [ ] ✅ **Componente reutilizable**: `TransfersPagination` creado y usado en ambos componentes
- [ ] ✅ **Hook optimizado**: Retorna `totalPages`, no hace early return sin cleanup
- [ ] ✅ **Documentación**: PROGRESS.md actualizado con post-fix summary

### Nice-to-have (Post-merge)

- [ ] 🎯 Storybook story para `TransfersPagination` con diferentes props
- [ ] 🎯 Test de performance: tiempo de render con 100+ transfers en all-statuses mode
- [ ] 🎯 Refactor adicional: extraer lógica de tabla a `TransfersTable` component
- [ ] 🎯 Accessibility audit: validar que paginación es keyboard-navigable (Tab + Enter)

---

## 6. RIESGOS Y MITIGACIONES

| Riesgo                                              | Probabilidad | Impacto  | Mitigación                                                                |
| --------------------------------------------------- | ------------ | -------- | ------------------------------------------------------------------------- |
| **Bug está en event sourcing (hook)**               | 🟡 Media     | 🔴 Alto  | Fase 2 diagnostica antes de implementar; tests RED reproducen bug primero |
| **Regresión en PendingTransfersReceived**           | 🟢 Baja      | 🔴 Alto  | Tests existentes validan; ejecutar suite completa antes de commit         |
| **TransfersPagination introduce nueva complejidad** | 🟢 Baja      | 🟡 Medio | Componente pequeño y bien tipado; tests cubren edge cases                 |
| **Real-time updates rompen paginación**             | 🟡 Media     | 🟡 Medio | QA manual valida escenario 6; considerar debounce en refresh()            |
| **Performance con 100+ transfers**                  | 🟢 Baja      | 🟢 Bajo  | Event sourcing query puede ser lento; considerar caché (out of scope)     |

**Riesgo global**: ⚠️ **MEDIO** — La paginación es feature crítica pero bien aislada. Tests y QA manual minimizan riesgo de regresión.

---

## 7. ALTERNATIVAS CONSIDERADAS

### Alternativa A: Fix quick sin extraer componente

**Pros**:

- Más rápido (1 hora vs 2-3 horas)
- Menos líneas de código modificadas

**Cons**:

- No resuelve duplicación de código
- Si el bug reaparece, hay que fixearlo en dos lugares
- No mejora mantenibilidad

**Veredicto**: ❌ **No recomendado** — Proyecto busca calidad de código, no shortcuts.

### Alternativa B: Refactor completo a tabla paginada genérica

**Pros**:

- Máxima reutilización (podría usarse para tokens, users, etc.)
- Consistencia total en toda la app

**Cons**:

- Scope creep (3-4 días de trabajo)
- Riesgo de over-engineering para proyecto educativo
- Puede romper otros componentes que usan tablas

**Veredicto**: ⏸️ **Posponer** — Buena idea para post-demo, no para fix urgente.

### Alternativa C: Solo crear componente `TransfersPagination`, no tocar hook

**Pros**:

- Soluciona duplicación UI sin riesgo en hook
- Si bug está en hook, se diagnostica después

**Cons**:

- Puede no resolver el bug reportado
- Dos fases de trabajo en lugar de una

**Veredicto**: ✅ **Viable como Plan B** si Fase 2 diagnóstica que bug NO está en hook.

---

## 8. CONCLUSIÓN Y PRÓXIMO PASO

**Veredicto**: ✅ **PROCEDER CON ANÁLISIS Y FIX**

**Justificación**:

1. Bug reportado afecta funcionalidad core (paginación en Dashboard principal)
2. Duplicación de código de paginación es deuda técnica clara
3. Extracción a componente mejora mantenibilidad sin over-engineering
4. Tests existentes dan buena red de seguridad contra regresión

**Timeline estimado**: 3-4 horas (diagnóstico + fix + tests + QA manual)

**Próximo paso**: **Solicitar aprobación del usuario** con pregunta:

> "¿Procedo con la implementación del plan (Fases 1-7)? Comenzaré con test RED que reproduzca el bug (Fase 1), luego diagnóstico (Fase 2), y según hallazgo implementaré fix en hook (3A) o componente (3B). ¿Alguna preferencia o restricción de tiempo?"

---

## 9. REFERENCIAS

### Archivos clave a modificar

**Si bug en hook**:

- `web/src/hooks/useTransfersList.ts` (líneas 38-163)

**Si bug en componentes**:

- `web/src/components/tokenOps/PendingTransfersSent.tsx` (líneas 173-206)
- `web/src/components/tokenOps/PendingTransfersReceived.tsx` (líneas 127-157)

**Nuevo archivo a crear**:

- `web/src/components/ui/TransfersPagination.tsx` (nuevo, ~60 líneas)
- `web/src/__tests__/pending.transfers.sent.pagination.test.tsx` (nuevo, ~80 líneas)

### Documentación consultada

- `docs/adr/002-pending-transfers-migration-to-c2.md` (paginación SC-native)
- `docs/adr/005-frontend-event-sourcing-transfer-history.md` (event sourcing strategy)
- `docs/features/HOOKS_REFACTOR_UNIFIED_TRANSFERS_LIST_ANALYSIS.md` (refactor previo)
- `docs/progress/PROGRESS.md` (estado actual del proyecto)

### Tests relacionados

| Test file                                              | Lines   | Validación                             |
| ------------------------------------------------------ | ------- | -------------------------------------- |
| `factory.transfers.test.tsx`                           | 17-53   | Paginación pending-only ✅             |
| `factory.transfers.test.tsx`                           | 241-280 | Auto-ajuste de página ✅               |
| _(nuevo)_ `pending.transfers.sent.pagination.test.tsx` | N/A     | Paginación all-statuses ❌ (pendiente) |

---

_Análisis completado: 25 octubre 2025 - 15:30 CET_  
_Autor: GitHub Copilot (AI Coding Agent)_  
_Status: PENDIENTE DE APROBACIÓN PARA IMPLEMENTACIÓN_
