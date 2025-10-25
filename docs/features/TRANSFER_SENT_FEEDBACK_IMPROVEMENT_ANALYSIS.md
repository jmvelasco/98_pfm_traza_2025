# TRANSFER_SENT_FEEDBACK_IMPROVEMENT — Análisis y Plan TDD (25 Oct 2025)

## Resumen Ejecutivo

Objetivo: lograr que, cuando un Producer realiza "Transfer to Factory", el ítem aparezca en tiempo real en la lista "Outgoing Transfers" sin recargar la página, replicando el enfoque ya implementado en "MyTokens" para `TokenCreated`.

Hallazgos:

- El contrato emite `TransferRequested(transferId, from, to, tokenId, amount)`; la UI de envíos pendientes (sender) actualmente obtiene datos vía `getPendingBySender(address, offset, limit)` pero no escucha a eventos.
- "MyTokens" ya resuelve el problema similar escuchando `TokenCreated` y actualizando el estado con deduplicación.

Decisión: reproducir el patrón de eventos de "MyTokens" en `PendingTransfersSent` usando `TransferRequested` (y opcionalmente `TransferAccepted/Rejected` para coherencia del listado), con TDD incremental.

---

## Documentación y Código de Referencia

- Documentación
  - `docs/adr/002-pending-transfers-migration-to-c2.md` — paginación e indexación en SC
  - `docs/progress/ROADMAP.md` — checklists de roles y flujos
  - `docs/guides/METODOLOGY_PROMPT.md` — ciclo RED→GREEN→COMMIT
- Contrato Inteligente
  - `supply-chain-tracker/sc/src/SupplyChain.sol`
    - Eventos: `TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount)`, `TransferAccepted`, `TransferRejected`
    - Getters: `getPendingBySender(address, offset, limit)` / `getPendingByRecipient(...)`
- Frontend
  - Eventos ya implementados: `web/src/components/tokenOps/MyTokens.tsx` (escucha `TokenCreated`)
  - Listado origen: `web/src/components/tokenOps/PendingTransfersSent.tsx`
  - Abstracciones: `web/src/lib/contract.ts` (mapea tipos, llamadas SC)
  - Tests existentes: `web/src/__tests__/pending.transfers.test.tsx`, `factory.transfers.test.tsx`

---

## Estado Actual vs. Deseado

- Actual
  - `PendingTransfersSent` obtiene la primera página con `getPendingBySender` y renderiza tabla/empty state.
  - No hay suscripción a eventos, por lo que tras crear una transferencia, el usuario debe refrescar para verla.
- Deseado
  - Al llamar "Transfer to Factory" y emitirse `TransferRequested`, la lista "Outgoing Transfers" del Producer se actualiza en vivo:
    - Prepend/append del nuevo ítem (decidir UX: prepend para visibilidad inmediata)
    - Deduplicación por `transferId`
    - Mantenimiento de `total` y coherencia con paginación (mostrar `Load more` si aplica)

---

## Criterios de Aceptación

- Al crear una transferencia válida:
  - "Outgoing Transfers" muestra la nueva transferencia sin recarga.
  - No se crean duplicados si el evento se dispara dos veces.
  - Un evento para otro `from` distinto no modifica la lista.
- Opcional (recomendado):
  - Al aceptar o rechazar (desde receptor), si el Producer está en la vista, el elemento desaparece automáticamente (escuchar `TransferAccepted/Rejected` o invalidar/refrescar el item).
- Persisten estados de carga/empty y paginación.

---

## Plan TDD (RED → GREEN → COMMIT)

1. Tests de UI (Outgoing Transfers)

- RED: `pending.transfers.test.tsx`
  - "appends new transfer on TransferRequested for sender"
    - Mock contract: primera página vacía
    - Emitir evento con `{ from = address, ... }` y esperar aparición de la fila
  - "ignores TransferRequested from other address"
  - "deduplicates when same TransferRequested fires twice"
- GREEN: implementar suscripción en `PendingTransfersSent` con deduplicación y actualización de `items` y `total`.

2. Tests de Integración (Producer Dashboard)

- RED: `dashboard.mytokens.test.tsx` o suite nueva `dashboard.transfers.sent.test.tsx`
  - Verifica que tras "requestTransfer" el bloque de Outgoing se actualiza sin recargar (mock de evento + callback).
- GREEN: mantener comportamiento tras refactor de `PendingTransfersSent`.

3. Tests de Coherencia (opcional)

- RED: aceptar/rechazar desde receptor provoca desaparición del ítem en vista de sender (o en su defecto un `refetch` controlado tras evento `Accepted/Rejected`).
- GREEN: escuchar `TransferAccepted/Rejected` y quitar por `transferId` o invalidar estado.

Commits sugeridos:

- `test(red): pending transfers update on TransferRequested`
- `feat(green): PendingTransfersSent subscribe to TransferRequested with dedupe`
- `test(red): remove on Accepted/Rejected`
- `feat(green): handle Accepted/Rejected events`

---

## Diseño Técnico Propuesto

- Suscripción a eventos (paralelo a MyTokens):
  - Conectar contrato vía `SupplyChain__factory.connect(CONTRACT_CONFIG.address, new ethers.BrowserProvider(window.ethereum).getSigner())` o provider de sólo lectura si no se requiere firma.
  - Crear filtro `contract.filters.TransferRequested(null, address, null)` para filtrar por `from = sender` (ethers v6 soporta filtros por args indexados).
  - Registrar `on(filter, handler)` y limpiar en `useEffect` unmount.
- Handler de `TransferRequested`:
  - Extraer `transferId, from, to, tokenId, amount` desde `event.args`
  - Construir `PendingTransfer` mínimo (enriquecer `tokenName` de forma lazy con `getToken(tokenId)` si UI lo muestra; usar caché por `tokenId` para no sobre-llamar)
  - `setState(prev => dedupeById([nuevo, ...prev.items]))`; `total++`.
- Deduplicación:
  - `seenIdsRef: Set<string>` como en `MyTokens.tsx`.
- Paginación:
  - Mantener `offset/limit` actual; si la UI está en página 1, prepend; si no, incrementar `total` y (opcional) mostrar un banner "1 nuevo" para volver a primera página.
- Accepted/Rejected (opcional):
  - Filtros `TransferAccepted(transferId)` / `TransferRejected(transferId)`; handler que hace `removeById(transferId)` y `total--`.

---

## Riesgos, Edge Cases y Salvaguardas

- Múltiples páginas: nuevos ítems podrían quedar fuera de la página visible; mantener `total` correcto y decidir estrategia de visibilidad.
- Duplicados por StrictMode/rehidratación: usar `seenIdsRef`.
- Eventos cruzados: validar `from` contra `address` actual; limpiar listeners en `accountsChanged`/`chainChanged`.
- Reinicios de Anvil: preferir proveedor de sólo lectura para eventos y reintentar en errores (véase patrón en `lib/contract.ts`).
- Enriquecimiento de nombre de token: cache local por `tokenId`.

---

## Alineamiento con ROADMAP y ADRs

- Encaja con ADR-002 (paginación y getters indexados) sin romper la API; añadimos sólo feedback en tiempo real.
- Mejora UX de Producer sin tocar contratos.

---

## Entregables

- Código: actualización de `PendingTransfersSent.tsx` + helpers de evento (si procede en `lib/contract.ts`).
- Tests: suites RED/GREEN descritas.
- Documentación: actualización breve en `PROGRESS.md` tras merge.

---

## Criterios de Hecho (DoD)

- Eventos `TransferRequested` visibles en UI en < 1s sin recarga.
- Deduplicación verificada en tests.
- Tests verde (todas las suites afectadas).
- Limpieza de listeners en unmount y en cambios de cuenta/red.
