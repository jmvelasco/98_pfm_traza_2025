# FACTORY_ACCEPT_REJECT_TRANSFERS_ANALYSIS.md — Accept/Reject Transfers (Factory) 📝 PLANNED

Fecha: 24 Oct 2025
Rama: dev
Estado: 📝 PLANIFICADO (pre-implementación con TDD)

## Alcance de esta iteración

Implementar, en el frontend, el flujo para que un usuario con rol Factory (Approved) pueda:

- Ver las transferencias pendientes recibidas (paginado)
- Aceptar o rechazar una transferencia
- Ver actualización automática del balance tras aceptar

Se prioriza completar el ciclo Producer → Factory (request → accept/reject) según README y ROADMAP. Eventos en tiempo real y páginas globales de transfers podrán diferirse a una iteración posterior.

## Viabilidad y alineación con la sugerencia

La propuesta de reutilizar la sección existente de "Pending Transfers" del Dashboard cuando el rol es Factory es viable y deseable:

- Reutiliza el mismo espacio en UI, evitando nuevas rutas ahora.
- Permite listar transferencias PENDING recibidas (por recipient) y añadir CTAs Accept/Reject por fila.
- Considera que Factory también puede ENVIAR transferencias a Retailer: el enfoque de "dos contenedores finos" permite renderizar simultáneamente la lista de recibidas (con acciones) y la lista de enviadas (solo lectura) en la misma sección.
- Aprovecha al máximo componentes y helpers actuales; solo requiere un pequeño refactor del componente `PendingTransfers` o la extracción de un hook/tabla base para soportar ambos modos (sender/recipient) y acciones por fila.
- No requiere cambios en el Smart Contract. Si surgiera una necesidad futura, se abriría un ADR antes de modificar SC.

## Arquitectura propuesta: base compartida + 2 contenedores finos

Para maximizar reutilización y mantener bajo riesgo, se adopta explícitamente:

- Base compartida

  - Hook: `usePendingTransfersList({ mode, address, pageSize }) → { items, total, page, setPage, loading, error, refresh }`
  - Tabla presentacional: `PendingTransfersTable({ items, total, page, pageSize, onPageChange, renderActions })`

- Contenedores finos

  - `PendingTransfersReceived.tsx` (Factory): usa `mode='recipient'`, inyecta `renderActions` con botones Accept/Reject y gestiona estados.
  - `PendingTransfersSent.tsx` (Producer/Factory): usa `mode='sender'`, sin acciones (solo lectura).

- Integración en Dashboard
  - Para rol Factory se renderizan ambos contenedores (Received + Sent) en la sección "Pending Transfers" sin interferencia de estado.

## Fundamentos y referencias

- Smart Contract (`sc/src/SupplyChain.sol`):
  - `acceptTransfer(uint transferId)` y `rejectTransfer(uint transferId)` implementadas.
  - Índices y getters paginados (C2): `getPendingByRecipient(address, offset, limit)` y `getPendingBySender(...)` (Fase 8).
  - Mantenimiento O(1) de índices (swap-and-pop) y guard `isPending`.
  - Tests SC 27/27 pasando, incluyendo lifecycle de pending → accepted/rejected.
- Frontend (STATUS_13 + PROGRESS Fase 8/9):
  - Patrón Split Provider: `JsonRpcProvider` para lecturas, `BrowserProvider` para escrituras.
  - Helpers existentes: `getPendingBySender/ByRecipient` (paginados) en `web/src/lib/contract.ts`.
  - UI Producer: TransferForm y lista de Pending Transfers (sender) ya integradas.
- ADRs relevantes:
  - `docs/adr/001-pending-transfers-strategy-comparison.md` (C2 aceptada)
  - `docs/adr/002-pending-transfers-migration-to-c2.md` (implementación C2)

## Objetivo funcional (Aceptación)

Un Factory aprobado puede:

- Listar transferencias entrantes pendientes (paginadas) con campos: transferId, tokenId, amount, sender, status.
- Aceptar una transferencia (actualiza balances y desaparece de la lista).
- Rechazar una transferencia (desaparece de la lista, balance del sender no cambia).
- Ver feedback claro: pending → success/error para ambas acciones.

Bloqueos/validaciones:

- Solo el destinatario (Factory) conectado y Approved puede aceptar/rechazar.
- No permitir acciones si `isPending == false` (ya aceptada/rechazada).
- Manejar errores on-chain con mensajes claros en UI.
- Respetar paginación (actualizar lista y contadores tras acción).

## Diseño de UX (mínimo viable)

Ubicación: Misma sección ya existente del Dashboard denominada "Pending Transfers". Para rol Factory, se mostrarán dos bloques:

1. "Received Pending Transfers" (por recipient = Factory conectada): con CTAs Accept/Reject por fila.
2. "Sent Pending Transfers" (por sender = Factory conectada, destino Retailer): solo lectura de momento.

Componentes a reutilizar/ajustar:

- Base compartida (nuevos):
  - `usePendingTransfersList` para lógica de fetch y paginación según `mode`.
  - `PendingTransfersTable` para la UI tabular con `renderActions` opcional.
- Contenedores finos (nuevos):
  - `PendingTransfersReceived.tsx` (Factory, recipient + acciones)
  - `PendingTransfersSent.tsx` (Producer/Factory, sender sin acciones)
- Asegurar que instancias independientes mantengan su propio estado (`page`, `pageSize`, `loading`).
- Estados visuales consistentes con TransferForm: azul (pending), verde (success), rojo (error).
- Confirmación opcional antes de rechazar.

Accesibilidad:

- Botones con `aria-disabled` durante loading.
- Mensajes de estado con roles ARIA adecuados.

## API/Contratos del frontend a usar

Nuevos helpers en `web/src/lib/contract.ts`:

- `export async function acceptTransfer(transferId: number): Promise<void>`
- `export async function rejectTransfer(transferId: number): Promise<void>`

Ya existentes y a reutilizar:

- `getPendingByRecipient(address: string, offset: number, limit: number)`
- `getPendingBySender(address: string, offset: number, limit: number)` (modo existente)
- `getReadProvider()`, `getSignerOnCorrectNetwork()` (split provider)

Base compartida propuesta:

- Hook `usePendingTransfersList` consumirá `getPendingBySender` o `getPendingByRecipient` según `mode`.
- Tabla `PendingTransfersTable` recibirá `items`, `total`, paginación y `renderActions` (solo recipient).
- Asegurar que múltiples instancias no comparten estado interno (ej: `page`, `pageSize`, `loading`).

Datos mínimos por fila:

- `transferId`, `tokenId`, `amount`, `from`, `to`, `status` (el getter paginado retorna `Transfer[]`, no debería requerir `getTransfer(id)` adicional).

## Estrategia TDD (RED → GREEN → REFACTOR)

### RED — Suite de tests (sin implementación)

Crear `web/src/__tests__/factory.transfers.test.tsx` con casos:

1. "lists pending transfers received (paginated)"

- Mock `getPendingByRecipient` → total=3, items=[...].
- Renderizar `PendingTransfersReceived` (hook + tabla) con `renderActions`.
- Ver lista, contadores "Showing X–Y of Z" y controles de página.

2. "accepts a transfer and updates UI"

- Mock `acceptTransfer` → resolve y `getPendingByRecipient` de refresco sin el ítem.
- Click en botón Accept (proporcionado por `renderActions`).
- Esperar feedback pending→success y que desaparezca la fila.

3. "rejects a transfer and updates UI"

- Mock `rejectTransfer` → resolve y refresco de lista.
- Click en botón Reject (proporcionado por `renderActions`).
- Feedback pending→success y desaparición de fila.

4. "handles on-chain errors gracefully (accept/reject)"

- Mock `acceptTransfer`/`rejectTransfer` → reject(new Error("..."))
- Mostrar mensaje rojo y no cambiar la lista.

5. "disables buttons while processing"

- Tras click, botones Accept/Reject deshabilitados hasta completar.

6. "respects pagination after actions"

- Si se procesa el último ítem de la página, recargar manteniendo página válida.

7. "guards: only recipient can act"

- Simular wallet no coincidente con `recipient` → ocultar/deshabilitar botones (vía lógica en `renderActions`).

8. "factory sees both received and sent lists without interference"

- Renderizar a la vez `PendingTransfersReceived` (con acciones) y `PendingTransfersSent` (sin acciones).
- Cambiar de página en una lista no afecta la otra.

### GREEN — Implementación mínima

- Implementar helpers `acceptTransfer`/`rejectTransfer` en `contract.ts` usando signer (ethers v6) y `await tx.wait()`.
- Crear base compartida: `usePendingTransfersList` + `PendingTransfersTable`.
- Crear contenedores finos: `PendingTransfersReceived` (recipient + acciones) y `PendingTransfersSent` (sender, solo lectura).
- Integrar en Dashboard Factory reutilizando la misma sección "Pending Transfers" (dos bloques).

### REFACTOR — Limpieza sin cambiar comportamiento

- Unificar estilos y componentes con TransferForm (ActionCard, feedback, estados).
- Extraer lógica de paginación a hook si se repite.
- Preparar wiring para eventos tiempo real (opcional, siguiente iteración).

## Definition of Done (DoD)

- Tests RED → GREEN pasando (mínimo 6-7 tests definidos).
- Linter/Typecheck sin errores.
- UX consistente y accesible (estados, deshabilitado, mensajes).
- Lista paginada funcionando (contadores y navegación) reutilizando hook/tabla base compartida.
- Acciones Accept/Reject (vía `renderActions`) actualizan la lista y muestran feedback.
- Rol Factory visualiza simultáneamente dos listas: recibidas (con acciones) y enviadas (solo lectura) sin interferencia de estado.
- Balance del Factory aumenta tras aceptar (verificado con mock/actualización de UI; integración real opcional en iteración siguiente).
- Documentación: este análisis + entrada en `PROGRESS.md` al finalizar la implementación.

## Edge cases y errores esperados

- Transfer ya procesada (no pending) → revert / mensaje claro.
- Usuario no aprobado o rol incorrecto → revert.
- Provider/network incorrecta → `ensureWalletOnCorrectNetwork()`.
- Paginación: lista vacía en página actual tras acción → retroceder página si corresponde.

## Riesgos y mitigación

- Complejidad UI + paginación + acciones → empezar con lista simple y refactor.
- Eventos en tiempo real fuera de alcance → realizar refresh manual tras acción.
- Inconsistencias de estado tras aceptar (balances) → refrescar secciones relacionadas o posponer a iteración de eventos.

## Plan de commits (TDD)

1. `test(red): factory received transfers list using thin container (hook + table + actions)`
2. `feat(green): contract helpers acceptTransfer/rejectTransfer (ethers v6 + tx.wait)`
3. `feat(green): shared hook/table + thin containers (Received/Sent)`
4. `refactor: unify feedback styles and extract pagination logic`
5. `docs: update PROGRESS with Factory accept/reject feature`

## Métricas de verificación (tras GREEN)

- Frontend tests: +6 a +10 (objetivo 85–90 totales en web)
- Suite global: debe permanecer verde (106/106 → 112+ expected)
- Performance: interacción < 200ms hasta prompt de wallet; refresh lista < 300ms

## Contraste con ROADMAP/README

- Alinea hitos de 24–25 oct (STATUS_13): **CRÍTICO** completar Accept/Reject para P→F viable.
- Cumple requisito README de sistema de transferencias con aprobación del receptor.

## Referencias

- `STATUS_13.md`, `PROGRESS.md` (Fases 8 y 9)
- `docs/adr/001-002` (Strategy C2 + Migración)
- `SMART_CONTRACT.md` y tests en `sc/test/SupplyChain.t.sol`
