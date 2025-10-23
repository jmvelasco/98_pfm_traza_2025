# TRANSFER_TO_FACTORY_ANALYSIS.md — Transfer Token to Factory (Frontend) ✅ COMPLETED

Fecha: 22-23 Oct 2025
Rama: dev
Estado: ✅ **IMPLEMENTADO Y TESTEADO** (73/73 tests passing)

## Alcance de esta iteración

Implementar, en el frontend, el flujo para que un usuario con rol Producer (Approved) pueda iniciar la transferencia de un token de materia prima (parentId = 0) hacia una dirección Factory (Approved), conforme al README y al contrato `SupplyChain.sol`.

No se implementará en esta iteración la aceptación/rechazo por parte del receptor (Factory) ni la página `/transfers`; solo el inicio de la transferencia (request).

## Fundamentos y referencias

- Contrato (`sc/src/SupplyChain.sol`):
  - `requestTransfer(tokenId, to, amount)` crea una transferencia en estado Pending, emite `TransferRequested` y exige: usuario Approved, balance suficiente, receptor Approved, y restricción de rol (Producer no puede transferir derivados: `parentId > 0`).
  - `acceptTransfer` y `rejectTransfer` existen pero quedan fuera de esta iteración.
- Documentación (`SMART_CONTRACT.md`): flujo de transferencias en 3 pasos y validaciones de permisos.
- README (sección “Transferencias Controladas”): flujo dirigido Producer → Factory → Retailer → Consumer con aprobación del receptor. No es necesario implementar la ruta `/tokens/[id]/transfer` para cumplir el objetivo funcional; el flujo se resuelve desde el dashboard del Producer.

## Objetivo funcional (Aceptación)

Un Producer aprobado puede:

- Seleccionar uno de sus tokens “raw” (parentId = 0) con balance > 0.
- Indicar una dirección de destino que debe pertenecer a un usuario Approved con rol Factory.
- Indicar un `amount` válido: entero > 0 y ≤ balance del token.
- Enviar la solicitud, ver feedback “Requesting transfer…”, y al confirmarse la tx, ver “Transfer requested!” y reseteo del formulario.

Bloqueos/validaciones:

- Si el token es derivado (`parentId > 0`), no se permite iniciar transferencia (Producer no puede transferir derivados).
- Si `to` no es una dirección válida o no es un usuario Approved con rol Factory, mostrar error y no enviar.
- Si `amount <= 0` o `amount > balance`, mostrar error y no enviar.
- Si la llamada on-chain revierte, mostrar el mensaje de error.

## Diseño de UX (mínimo viable)

- El Producer verá en su dashboard un ActionCard “Transfer to factory” (junto a “Create Raw Material”), que desplegará el formulario de transferencia integrado (`TransferForm`).
- El formulario incluirá:
  - Address destino (input text)
  - Amount (input number)
  - Botón “Request transfer”
  - Estados: idle → pending → success; errores visibles en línea
- Enfoque TDD:
  - Opción A: tests a nivel de componente `TransferForm` aislado (inyectando `tokenId`, `parentId`, `balance`).
  - Luego, integración real en el ActionCard “Transfer to factory” del dashboard del Producer, siguiendo el patrón de “Create Raw Material”.
- (Opcional/futuro): botón “Transfer” en `MyTokens` para tokens raw que abre el formulario (queda para refactor/seguimiento).

### Nota sobre “Pending transfers”

- Tras solicitar una transferencia, el Producer debería ver en su dashboard una sección “Pending transfers” con las transferencias emitidas y aún no aceptadas por la Factory.
- **Esto queda fuera de alcance de esta iteración**, pero se deja explícito como siguiente paso natural para mantener la trazabilidad y el feedback al usuario.

## API/Contratos del frontend a usar

- `getTokenDetails(tokenId, userAddress)` ya disponible — para obtener `parentId` y `balance` (en tests se mockea).
- `getUserInfo(address)` — usado para validar que `to` es Approved y rol Factory (se mockea).
- NUEVO helper a implementar en GREEN: `requestTransfer(tokenId: number, to: string, amount: number): Promise<void>` en `src/lib/contract.ts`.

## Estrategia TDD (RED → GREEN → REFACTOR)

### RED — Conjunto de tests (sin implementación)

Crear `web/src/__tests__/producer.transfer.test.tsx` con los siguientes casos:

1. "renders form and validates basic fields"

- Renderizar `<TransferForm tokenId={1} parentId={0} balance={100} />`.
- Verificar campos destino y amount; botón deshabilitado si inputs inválidos (destino vacío, amount ≤ 0).

2. "blocks transfer of derived tokens (parentId > 0)"

- Renderizar con `parentId={2}`; esperar texto/alerta “Derived tokens cannot be transferred by Producer” y que no se llame a `requestTransfer`.

3. "shows error if destination address is invalid"

- Ingresar dirección inválida; submit; esperar mensaje de error “Invalid address”.

4. "requires Factory approved recipient"

- Mock `getUserInfo` devolviendo rol Retailer o status Pending; submit; esperar “Recipient must be an Approved Factory”.

5. "requires amount > 0 and <= balance"

- amount = 0 → error “Amount must be greater than 0”.
- amount = 101 con balance=100 → error “Insufficient balance”.

6. "calls requestTransfer on valid input and shows success"

- Mock `getUserInfo` → { role: "Factory", status: "Approved" }.
- Mock `requestTransfer` → Promise.resolve();
- Completar destino y amount; submit; esperar estado Pending → Success y reset del formulario.

7. "surfaces contract errors"

- Mock `requestTransfer` → Promise.reject(new Error("Insufficient balance"));
- Submit; verificar mensaje de error visible.

Notas:

- Mockear `useWallet` para devolver una address conectada.
- No se cubre navegación/routing en esta iteración; foco en comportamiento del formulario.

### GREEN — Implementación mínima para pasar tests

- `src/lib/contract.ts`: añadir `export async function requestTransfer(tokenId: number, to: string, amount: number): Promise<void>` usando ethers v6, signer y `SupplyChain__factory.connect(...).requestTransfer(...)` + `await tx.wait()`.
- `src/components/TransferForm.tsx`: implementar formulario controlado con validaciones descritas y estados de feedback.
- (Opcional) Copias de texto centralizadas para reuso.

### REFACTOR — Limpieza y mejoras sin cambiar comportamiento

- Posibles mejoras: extraer validaciones a helpers, mapear errores on-chain a mensajes de UI, integrar botón desde `MyTokens` para abrir el formulario (o ruta `/tokens/[id]/transfer`).
- Añadir snapshots de estados si aporta valor (evitar sobre-testing de implementación).

## Criterios de Hecho (Definition of Done)

- Tests RED → GREEN pasando en `producer.transfer.test.tsx`.
- Linter/Typecheck sin errores.
- UX mínima: feedback Pending/Success y errores claros.
- Sin `console.error` no controlados en tests (excepto logs deliberados capturados por los tests).
- Documentación: este `TRANSFER_TO_FACTORY_ANALYSIS.md` actualizado, y al finalizar, entrada breve en `PROGRESS.md` (Fase 7: Transfer to Factory).

## Riesgos y supuestos

- Supuesto: `getUserInfo(address)` es utilizable para cualquier address, no solo la del conectado (válido por diseño actual).
- Validación de rol por string (Factory) — coherente con contrato que usa strings; optimización a enums queda fuera de alcance.
- Eventos en tiempo real (TransferRequested) no se usan en esta iteración; feedback basado en `tx.wait()`.
- Accesibilidad/UX avanzada se pospone al refactor.

## Plan de commits

1. RED: tests y scaffolding del componente (sin implementación de helper ni componente real).
2. GREEN: implementación mínima en `contract.ts` y `TransferForm.tsx`.
3. REFACTOR: ajustes de UX/errores y, si procede, integración inicial desde `MyTokens`.

---

## 🎉 IMPLEMENTACIÓN COMPLETADA (23 Oct 2025)

### ✅ Tests Implementados (8 tests en producer.transfer.test.tsx)

Todos los casos de prueba definidos en la sección RED han sido implementados y están **pasando**:

1. ✅ "renders form and validates basic fields"
2. ✅ "blocks transfer of derived tokens (parentId > 0)"
3. ✅ "requires Factory approved recipient"
4. ✅ "requires amount > 0 and <= balance"
5. ✅ "calls requestTransfer on valid input and shows success"
6. ✅ "surfaces contract errors"
7. ✅ "disables inputs and button while requesting and shows Requesting… label"
8. ✅ "clears message when user edits inputs after an error"

**Nota sobre validación de dirección**: Se implementó mediante disabled button en lugar de mensaje de error inline. El botón permanece deshabilitado hasta que la dirección cumpla el formato 0x + 40 caracteres hexadecimales.

### ✅ Tests de Integración (3 tests en producer.roleactions.test.tsx)

1. ✅ "shows Transfer to Factory action card in Producer dashboard"
2. ✅ "shows empty state when no raw tokens with balance are available"
3. ✅ "submits valid transfer and shows pending → success feedback"

### ✅ Componentes Implementados

**`src/components/tokenOps/TransferToFactory.tsx`** (231 líneas):

- `TransferToFactoryCard`: Componente principal con ActionCard
- Carga automática de tokens al abrir (`loadTokens()`)
- Filtrado de tokens elegibles: `parentId === 0 && balance > 0`
- Selector de tokens con dropdown
- Estados: loading, empty state, token selector + form
- **Empty state**: "No raw tokens with balance available." (implementado y testeado)

**`TransferForm`** (subcomponente exportado):

- Props: `{ tokenId, parentId, balance }`
- Validaciones:
  - Sintáctica: dirección Ethereum (regex 0x + 40 hex)
  - Negocio: rol Factory + status Approved (via `getUserInfo`)
  - Balance: amount > 0 y <= balance
- Bloqueador: tokens derivados (parentId > 0) muestran mensaje explicativo
- Estados de feedback:
  - Pending: "Requesting transfer" (azul) con flag transitorio para visibilidad en tests
  - Success: "Transfer requested" (verde) + reset de amount
  - Error: Mensajes específicos (rojo)
- Inputs deshabilitados durante loading
- Limpieza de mensajes al editar inputs

### ✅ Helper de Contrato

**`src/lib/contract.ts`**:

```typescript
export async function requestTransfer(
  tokenId: number,
  to: string,
  amount: number
): Promise<void> {
  const { contract } = getWeb3State();
  if (!contract) throw new Error("Contract not initialized");

  const tx = await contract.requestTransfer(tokenId, to, amount);
  await tx.wait(); // Espera confirmación on-chain
}
```

### ✅ Integración en Dashboard

**`src/components/tokenOps/RoleActions.tsx`**:

- Producer role muestra dos ActionCards:
  - Create Raw Material
  - **Transfer to Factory** (NUEVO)
- Grid responsive (1 col móvil, 2 cols desktop)

### ✅ UX Unificada

Aplicados estilos consistentes entre CreateRawMaterial y TransferToFactory:

- Labels: `text-sm font-medium text-gray-700 mb-1`
- Inputs: `w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500`
- Buttons: `bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-60`
- Feedback colors semánticos:
  - Azul (`text-blue-600`): Pending/Loading
  - Verde (`text-green-600`): Success
  - Rojo (`text-red-600`): Error
- `noValidate` en forms para control total de validación

### ✅ Refactorización de Arquitectura

Post-implementación, se reorganizó la estructura de componentes:

**Antes**:

```
src/components/
  TransferForm.tsx
  MyTokens.tsx
  RoleActions.tsx (monolítico)
```

**Después**:

```
src/components/
  tokenOps/
    RoleActions.tsx (orquestador)
    CreateRawMaterial.tsx (extraído, 131 líneas)
    TransferToFactory.tsx (renombrado, 231 líneas)
    MyTokens.tsx (movido, 215 líneas)
  ui/
    ActionCard.tsx (extraído, 50 líneas)
```

**Beneficios**:

- Separación de responsabilidades clara
- Componentes independientes y testeables
- ActionCard reutilizable para todos los roles
- Fácil escalabilidad para Factory/Retailer/Consumer actions

### ✅ Métricas Finales

- **Tests totales**: 73/73 pasando (100%)
  - TransferForm: 8 tests
  - RoleActions (transfer): 3 tests
  - Resto del proyecto: 62 tests previos
- **Build/Typecheck**: Sin errores
- **Commits TDD**: 6 commits estratégicos siguiendo RED→GREEN→REFACTOR
- **Líneas de código**:
  - Tests: ~180 líneas nuevas
  - Componentes: ~380 líneas (TransferToFactory + refactors)
  - Helpers: ~10 líneas (requestTransfer)

### ✅ Criterios de Hecho — CUMPLIDOS

- [x] Tests RED → GREEN pasando
- [x] Linter/Typecheck sin errores
- [x] UX con feedback Pending/Success/Error claro
- [x] Sin console.error no controlados
- [x] Documentación actualizada (este archivo + PROGRESS.md Fase 7)
- [x] Empty state implementado y testeado
- [x] Refactorización de componentes completada

### 📋 Commits Relevantes

1. `red: add transfer form tests (validation, states, submission flow)`
2. `green: implement requestTransfer helper and TransferForm with validations`
3. `green: integrate TransferToFactory in Producer dashboard with token selector`
4. `style: unify form UX between CreateRawMaterial and TransferToFactory`
5. `refactor: organise token operations components` (+ 4 refactors más)
6. `test(green): add empty state test for TransferToFactory (already implemented)`

### 🚀 Próximos Pasos (Fuera de esta Iteración)

1. **Pending Transfers Section**:

   - Mostrar lista de transferencias enviadas (status Pending)
   - Botones para cancelar/ver detalles
   - Actualización en tiempo real con eventos TransferRequested

2. **Factory: Accept/Reject Transfers**:

   - Página `/transfers` o sección en Dashboard Factory
   - Listar transferencias entrantes pendientes
   - Botones Accept/Reject con llamadas a `acceptTransfer(transferId)` y `rejectTransfer(transferId)`
   - Eventos TransferAccepted/TransferRejected en tiempo real

3. **Transferencias Factory→Retailer, Retailer→Consumer**:

   - Reutilizar componente TransferForm adaptado por rol
   - Validaciones específicas por cada flujo

4. **Página `/tokens/[id]/transfer`**:

   - Ruta dedicada para transferir desde detalle de token
   - Botón "Transfer" en MyTokens que navega a esta ruta

5. **Mejoras de UX**:
   - Toasts para feedback global
   - Autocomplete de direcciones Factory aprobadas
   - Historial de transferencias por token

### 📊 Estado del Proyecto

**Completado en Transfer to Factory**:

- ✅ Flujo completo Producer→Factory funcional
- ✅ Validaciones exhaustivas (sintáctica, negocio, balance)
- ✅ UX consistente y pulida
- ✅ Tests robustos (73/73 pasando)
- ✅ Arquitectura escalable y mantenible

**Resto del README pendiente**:

- ⏳ Factory: Accept/Reject transfers (siguiente prioridad)
- ⏳ Transferencias F→R→C
- ⏳ Trazabilidad completa (árbol parentId)
- ⏳ Procesamiento de materiales
- ⏳ Documentación IA.md y demo

---

_Actualizado: 23 de octubre de 2025_  
_Estado: ✅ COMPLETADO_  
_Tests: 73/73 passing_
