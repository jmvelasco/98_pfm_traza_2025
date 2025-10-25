# TRANSFER_LIST_DISPLAYS_ALL_STATUS — Análisis y Plan TDD (25 Oct 2025)

## Resumen Ejecutivo

Objetivo: la sección "Outgoing Transfers" (y equivalente para destinatario si aplica) debe mostrar no solo transferencias Pending, sino también Accepted y Rejected con su estado correspondiente. Actualmente, el frontend solo lista las pendientes vía `getPendingBySender/Recipient` (SC) y refresca en tiempo real con el evento `TransferRequested`. Para incluir Accepted/Rejected, proponemos un enfoque incremental de frontend (event-sourced) que reconstruye el historial a partir de eventos (`TransferRequested`, `TransferAccepted`, `TransferRejected`) y lo combina con el backend paginado de pendientes. Se definen criterios de aceptación, plan TDD y diseño técnico, manteniendo compatibilidad con el patrón de paginación vigente y sin migraciones de SC por ahora.

Riesgos: coste de consulta de eventos en redes grandes, sincronización ante reinicios de Anvil (blockTag), y consistencia temporal entre eventos múltiples. Mitigaciones: ventana temporal de bloques, caché en memoria/LocalStorage con invalidación por eventos, y uso de `JsonRpcProvider` para lecturas (evitando BlockOutOfRangeError).

---

## Documentación y referencias

- [PROGRESS.md]
- [ROADMAP.md]
- ADR 002 — `docs/adr/002-pending-transfers-migration-to-c2.md` (estrategia de paginación e índices C2 para pendientes)
- `supply-chain-tracker/sc/src/SupplyChain.sol` (eventos y getters)
- Frontend actual:
  - `web/src/components/tokenOps/PendingTransfersSent.tsx`
  - `web/src/hooks/usePendingTransfersList.ts`
  - `web/src/lib/contract.ts`
  - Tests: `web/src/__tests__/pending.transfers.test.tsx`, `factory.transfers.test.tsx`

---

## Estado actual (forense)

- Smart Contract:

  - Soporta paginación de pendientes con `getPendingBySender(address, offset, limit)` y `getPendingByRecipient(address, offset, limit)`.
  - Emite eventos:
    - `TransferRequested(transferId, from, to, tokenId, amount)`
    - `TransferAccepted(transferId)`
    - `TransferRejected(transferId)`
  - Al aceptar/rechazar, la transferencia se elimina de las estructuras de pendientes (índices C2), no existiendo actualmente un índice de "histórico" por usuario.

- Frontend:
  - `PendingTransfersSent` usa `usePendingTransfersList({ mode: 'sender' })` para listar solo pendientes.
  - Hay suscripción en tiempo real a `TransferRequested` (refresca).
  - No existe historial ni combinación de Accepted/Rejected.

Conclusión: la UI refleja únicamente el estado Pending, alineada con las capacidades de lectura actuales del SC.

---

## Requisitos (Definición de Hecho)

- Outgoing Transfers muestra transferencias del remitente en estado: Pending, Accepted, Rejected.
- Cada ítem refleja: token (nombre o fallback `Token #ID`), amount, destinatario, y `status` correcto.
- Transiciones en tiempo real:
  - Al solicitar transferencia: aparece como Pending (ya implementado).
  - Al aceptarse/rechazarse: el ítem cambia a Accepted/Rejected sin recargar.
- Paginación coherente (tamaño de página consistente, orden cronológico descendente por `createdAt`).
- Sin duplicados; clave por `transferId`.
- Errores de red/lectura visibles en la UI, no silenciosos.

No objetivos:

- Persistencia/consulta histórica completa a gran escala en mainnet (se prioriza entorno educativo/local).

---

## Opciones de implementación

1. Solo Frontend (event-sourced):

- Consultar eventos pasados con `queryFilter`:
  - `TransferRequested` (filtrado por `from = address`)
  - Mapear por `transferId` y enriquecer con `createdAt` (timestamp del bloque del log).
  - Cruzar con `TransferAccepted`/`TransferRejected` para fijar estado final.
- Combinar con `getPendingBySender` para pendings actuales.
- En tiempo real: suscribirse a `TransferAccepted/Rejected` y actualizar el estado de cada `transferId`.

Pros: sin cambios en SC; rápida de implementar; encaja con dual provider.
Contras: coste de escaneo en muchas redes; complejidad de fusión y ordenación; timestamps adicionales por bloque.

2. Cambios en Smart Contract (histórico indexado):

- Añadir arrays + mapas de posición `transfersBySender/Recipient` con estado y paginación tipo C2.
- Actualizar índices en `requestTransfer`, `acceptTransfer`, `rejectTransfer`.
- Exponer `getTransfersBySender/Recipient(offset,limit)` que traiga todos los estados.

Pros: consistente, O(1) en actualizaciones y O(page) en lecturas; sin reconstrucción de eventos.
Contras: cambio de ABI, redeploy y sincronización frontend; mayor complejidad on-chain.

3. Híbrido:

- Mantener `pending` vía SC; Accepted/Rejected vía eventos recientes (ventana configurable) con caché.

Pros: reduce coste de escaneo; equilibrio sin tocar SC inicialmente.
Contras: complejidad doble fuente; casos borde si un Accepted/Rejected cae fuera de la ventana.

Recomendación inicial: Opción 1 (frontend-only) para entorno educativo con dataset pequeño. Documentar en ROADMAP una evolución a Opción 2 post-entrega.

---

## Diseño técnico propuesto (Opción 1)

- Nuevo tipo `TransferListItem` (frontend):
  - `{ id: string; transferId: number; tokenId: number; tokenName?: string | null; amount: number; from: string; to: string; status: 'Pending'|'Accepted'|'Rejected'; createdAt: number; updatedAt?: number }`
- Origen de datos:
  - Pendings: `getPendingBySender(address, offset, limit)` (como hoy).
  - Historial A/R: construir mapa `byId` con `queryFilter`:
    - `TransferRequested` (from = address) → seed items; `createdAt` por bloque.
    - `TransferAccepted` y `TransferRejected` → actualizar `status` y `updatedAt`.
- Orden y paginación:
  - Fusionar pendings + historial en memoria → ordenar por `createdAt desc` → slice a `pageSize`.
  - Nota: pendings ya incluidos en `TransferRequested`, dedupe por `transferId`.
- Realtime:
  - Listener para `TransferAccepted/Rejected`: actualizar estado del item (si existe) y forzar re-render.
  - Ya existe listener para `TransferRequested`.
- Performance/robustez:
  - `JsonRpcProvider` para lecturas (evita BlockOutOfRange en reinicios Anvil).
  - Rango de bloques: por defecto desde el deployment (configurable); para local, coste aceptable.
  - Caché en memoria + `localStorage` opcional con `lastScannedBlock`; invalidación por eventos.
- Accesibilidad/UX:
  - Badge/status con color por estado.
  - Tooltips para fechas (created vs updated).

---

## Plan TDD (RED → GREEN)

1. Tests de render estático (unit/RTL):

   - "renderiza Accepted y Rejected junto a Pending" (mocks de datos).
   - "muestra fallback Token #ID cuando `tokenName` no está".

2. Realtime (eventos):

   - "actualiza a Accepted al recibir TransferAccepted(transferId)".
   - "actualiza a Rejected al recibir TransferRejected(transferId)".
   - "ignora eventos de otros usuarios (from distinto)".
   - "evita duplicados por re-emisión de eventos".

3. Fusión y paginación:

   - "combina pendings del SC con historial por eventos".
   - "mantiene orden por createdAt desc y paginación estable".
   - "al vaciar la última página, retrocede una página" (ya existe patrón en el hook; validar que se preserva).

4. Errores:
   - "muestra error de carga si falla query de eventos".

Commits:

- `test(red): pending transfers list shows accepted/rejected`
- `feat(green): event history builder and merge with pendings`
- `test(red): realtime accepted/rejected updates`
- `feat(green): event listeners for accepted/rejected`
- `test(red): pagination and ordering with mixed statuses`
- `feat(green): merge + slice + stable paging`

---

## Ficheros afectados (estimado)

- `web/src/hooks/useTransfersListAll.ts` (nuevo) O extender `usePendingTransfersList.ts` con modo `all` (preferible crear hook específico para mantener SRP y no romper pendings).
- `web/src/components/tokenOps/PendingTransfersSent.tsx` (usar nuevo hook o prop `showAllStatuses`).
- `web/src/lib/contract.ts` (helpers: `fetchTransferEventsBySender`, `enrichWithTokenName` si se requiere nombre del token).
- Tests:
  - `web/src/__tests__/pending.transfers.all-status.test.tsx` (nuevo)
  - Ajustes menores en `pending.transfers.test.tsx` para isolar casos.

---

## Consideraciones de eventos (ethers v6)

- Filtros:
  - `contract.filters.TransferRequested()` y filtrado en handler por `from === address`.
  - `contract.filters.TransferAccepted()` / `TransferRejected()`; correlación por `transferId`.
- Handler defensivo (v6 typed event obj con `.args`).
- Cleanup sólido (`off/removeListener/removeAllListeners`).

---

## Riesgos y mitigaciones

- Alto número de logs: limitar por rango, cachear, o paginar por bloques.
- Inconsistencias de tiempo: usar timestamps de bloque del log; caída a `Date.now()` si falla.
- Reorgs poco probables en local: tolerancia mediante idempotencia y dedupe.

---

## Pasos de entrega (sin cambios SC)

1. Implementar hook de historial + tests unitarios.
2. Integrar en `PendingTransfersSent` con bandera `showAllStatuses` o nuevo componente.
3. Listeners para Accepted/Rejected.
4. QA manual en Anvil: flujo Producer → Factory.
5. Documentar en `PROGRESS.md` y añadir nota de mejora a `ROADMAP.md` (opción SC post-entrega).

---

## Apéndice — Contrato y formas de datos

- Eventos relevantes (según TypeChain):

  - `TransferRequested(transferId, from, to, tokenId, amount)`
  - `TransferAccepted(transferId)`
  - `TransferRejected(transferId)`

- Shape propuesto `TransferListItem`:

```
{
  id: string;             // UUID/UI, puede ser String(transferId)
  transferId: number;
  tokenId: number;
  tokenName?: string | null;
  amount: number;
  from: string;
  to: string;
  status: 'Pending'|'Accepted'|'Rejected';
  createdAt: number;      // ts del bloque del TransferRequested
  updatedAt?: number;     // ts del bloque de Accepted/Rejected
}
```

---

## Decisión de diseño

Se adopta inicialmente el enfoque Frontend-Only (event sourcing) por su facilidad y por el carácter educativo del proyecto. Se documenta en `ROADMAP.md` una iteración futura para añadir un índice de histórico en el SC (aprovechando la estrategia C2 para O(1) en actualizaciones y paginación estable).

---

## Estado de implementación (25 Oct 2025)

✅ **Completado**:

- Hook `useTransfersListAll` implementado con event sourcing (queryFilter + getTransfer + getToken).
- Componente `PendingTransfersSent` acepta prop `showAllStatuses` y selecciona hook correspondiente.
- Dashboard wired para pasar `showAllStatuses={true}` en "Outgoing Transfers".
- Listeners de eventos Accepted/Rejected implementados con tick-based re-render.
- Tests de integración creados y pasando (98/98):
  - `pending.transfers.all-status.test.tsx` (component-level)
  - `dashboard.outgoing.all-status.test.tsx` (page-level)
- Documentado en `PROGRESS.md`.

---

## TODOs (próximas mejoras)

### 🔧 Performance y escalabilidad

- [ ] **Optimizar `useTransfersListAll` con indexed topics**:

  - Usar filtro `contract.filters.TransferRequested(null, address, null)` para filtrar por `from` en el topic indexed.
  - Similar para `recipient` mode.
  - Reducirá volumen de logs descargados en redes con alto tráfico.

- [ ] **Implementar caché de eventos con block range**:
  - Guardar `lastScannedBlock` en memoria/localStorage.
  - En refresh, solo consultar eventos desde `lastScannedBlock + 1`.
  - Invalidar caché al cambiar de cuenta o red.
- [ ] **Caché de token names**:

  - Mantener mapa `tokenId -> name` en memoria para evitar llamadas redundantes a `getToken`.
  - Invalidar solo si se detecta evento `TokenCreated` para ese `tokenId`.

- [ ] **Configurar ventana temporal de eventos**:
  - Añadir prop o config para limitar `queryFilter` a últimos N bloques.
  - Ejemplo: `fromBlock: currentBlock - 10000`.
  - Útil para producción; educativo puede usar desde deployment.

### 🧪 Testing adicional

- [ ] **Test de integración con mixed statuses paginados**:
  - Mockear `useTransfersListAll` con 15+ items (Pending/Accepted/Rejected mezclados).
  - Verificar paginación estable y transiciones de página sin duplicados.
- [ ] **Test de performance con dataset grande**:
  - Simular 100+ eventos en mock; validar tiempos de carga aceptables.
  - Proponer optimizaciones si excede umbral (ej. 500ms).

### 🎨 UX/UI enhancements

- [ ] **Visual status badges**:

  - Color-coded badges: Pending (amarillo), Accepted (verde), Rejected (rojo).
  - Iconos opcionales (⏳, ✅, ❌).

- [ ] **Tooltips con timestamps**:

  - Mostrar `createdAt` y `updatedAt` (si existe) en hover.
  - Formato human-readable (ej. "Requested 2 hours ago, Accepted 1 hour ago").

- [ ] **Filtrado por estado**:
  - Añadir dropdown/tabs para filtrar por "All", "Pending", "Accepted", "Rejected".
  - Útil cuando el historial crece.

### 📊 Smart Contract evolution (post-entrega)

- [ ] **Implementar índice histórico on-chain** (Opción 2 del análisis):

  - Arrays `transfersBySender[user]` y `transfersByRecipient[user]`.
  - Mapas de posición tipo C2 para O(1) insert/update.
  - Getters `getTransfersBySender(address, offset, limit)` con paginación.
  - Actualizar en `requestTransfer`, `acceptTransfer`, `rejectTransfer`.
  - **Ventajas**: elimina event sourcing en frontend; queries O(page); soporta networks sin archive nodes.
  - **Requiere**: redeploy, regenerar ABI, actualizar `lib/contract.ts`.

- [ ] **Eventos con indexed topics**:
  - Marcar `from` y `to` como `indexed` en eventos de transferencia.
  - Permitirá filtrado eficiente en `queryFilter` sin post-procesamiento.

### 📝 Documentación

- [ ] **Actualizar `docs/adr/`**:

  - Crear ADR 005: "Frontend Event Sourcing for Transfer History".
  - Documentar decisión de event sourcing, trade-offs, y criterios de éxito.
  - Incluir benchmark de performance y recomendaciones para escalar.

- [ ] **Ampliar guía de testing**:
  - Añadir sección en `docs/guides/` sobre testing de event listeners.
  - Patrones de mock para ethers v6 `queryFilter` y `on/off`.

---

_Análisis inicial: 25 Oct 2025_  
_Implementación completada: 25 Oct 2025_  
_Estado: ✅ Feature completa en entorno educativo; TODOs para optimización y evolución SC_
