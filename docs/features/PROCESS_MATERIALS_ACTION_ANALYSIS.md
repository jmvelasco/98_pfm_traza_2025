# PROCESS_MATERIALS_ACTION_ANALYSIS.md — Factory: Process Materials ✅ COMPLETED

Fecha: 26 Oct 2025
Rama: dev
Estado: ✅ COMPLETADO (implementado con TDD)

## PROMPT

Objetivo: Entregar el hito “Role-Based Actions > Implement Factory actions > ProcessMaterials” descrito en DELIVERY.md (Next Steps e Immediate Focus, Priority 1) bajo el enfoque dashboard-céntrico (ADR 008), implementando la acción “Process Materials” en el Dashboard de Factory.

Alcance de esta fase:

- Preparar y seguir un plan TDD (RED → GREEN → REFACTOR) para un componente `ProcessMaterials` que permita crear productos derivados (`parentId > 0`) consumiendo stock de materias primas (`parentId = 0`).
- Integrar la acción en `RoleActions.tsx` para el rol Factory.
- Mantener consistencia de UX con `CreateRawMaterial` y `TransferToFactory`.
- Documentar el avance en DELIVERY.md con una nueva sección “Milestone 3: Implementation of Process Material feature”, marcada como Planned al inicio y como Completed al finalizar.

Resultado esperado:

- Acción funcional con validaciones y feedback de estado; nuevo token visible en “My Tokens” por evento `TokenCreated`.
- Tests añadidos y en verde; sin errores de build/typecheck.
- Documentación (este análisis + DELIVERY.md) actualizada.

## Alcance de esta iteración

Implementar, en el frontend (dashboard centrado), la acción “Process Materials” para que un usuario con rol Factory (Approved) pueda crear un producto derivado a partir de materias primas que posee, consumiendo stock del token padre. El resultado debe ser la creación de un nuevo token con `parentId > 0` y el decremento del balance del token padre, conforme a las reglas del contrato `SupplyChain.sol`.

No se crearán páginas nuevas; se implementará como una ActionCard dentro del Dashboard (ver ADR 008). Se prioriza un estado funcional con UX mínima y validaciones claras.

## Fundamentos y referencias

- Smart Contract (`sc/src/SupplyChain.sol`):
  - `createToken(name, totalSupply, features, parentId)`:
    - Solo usuarios Approved.
    - `parentId = 0` → solo Producer (materia prima).
    - `parentId > 0` → solo Factory o Retailer (producto derivado).
    - Requiere que el creador tenga balance suficiente del token padre y lo descuenta.
    - Emite `TokenCreated(newId, creator, name, totalSupply)`.
  - Transferencias y flujos de stock ya probados en tests SC.
- Frontend:
  - Patrón de providers dual (lecturas: JsonRpcProvider, escrituras: BrowserProvider) ya aplicado.
  - Helpers centralizados en `web/src/lib/contract.ts` (usar `createToken` existente para escribir).
  - Patrones de UI/formulario y feedback ya implementados en:
    - `CreateRawMaterial.tsx` (Producer)
    - `TransferToFactory.tsx` (Producer → Factory)
  - `RoleActions.tsx` ya muestra placeholders deshabilitados para Factory.
- Documentación/ADRs relevantes:
  - ADR 008: Enfoque dashboard-céntrico (sin rutas `/tokens/*`).
  - README (Flujos “Creación de Token”): Factory selecciona `parentId` para crear derivados.

## Objetivo funcional (Criterios de Aceptación)

Un Factory aprobado puede:

- Abrir la action card “Process Materials”.
- Ver un selector de “Parent token” con tokens que:
  - están en su balance (`balance > 0`), y
  - son materias primas (`parentId === 0`).
- Completar un formulario con:
  - Nombre del producto derivado (obligatorio).
  - Cantidad a producir/consumir (obligatorio, entero > 0 y ≤ balance del parent seleccionado).
  - Notas u observaciones (opcional), que se serializan en `features` JSON.
- Enviar y ver feedback:
  - Estado Pending (“Processing materials…”),
  - Éxito (“Derived token created!”) y reseteo del formulario,
  - Error con mensaje visible si la transacción revierte.
- Ver reflejado el nuevo token en la sección “My Tokens” gracias al evento `TokenCreated` (sin recargar manualmente).

Bloqueos/validaciones:

- Botón “Create” deshabilitado si campos inválidos (nombre vacío, cantidad no válida o sin parent seleccionado).
- Si el usuario no tiene materias primas con balance, mostrar empty state.
- No se permite usar tokens derivados como parent en esta acción (esta pantalla es solo para transformar materias primas). Las transformaciones posteriores (p. ej., “Package Products”) corresponderán a Retailer.

## Diseño de UX (mínimo viable)

- Ubicación: `Dashboard → RoleActions (Factory)`.
- Componente principal: `ProcessMaterials` (nuevo), siguiendo UX de `CreateRawMaterial`/`TransferToFactory`:
  - Al abrir, carga lista de elegibles (fire-and-forget + estado de carga).
  - Si hay elegibles, muestra selector + formulario.
  - Si no, muestra empty state textual ("No raw tokens with balance available.").
- Campos del formulario:
  - Parent Token (select) — etiqueta "Select Token".
  - Name (input text) — etiqueta "Product Name".
  - Amount (input number, min 1, max balance del parent) — etiqueta "Amount".
  - Notes (textarea) — opcional; se serializa como `{ type: 'processed', fromTokenId: <parentId>, notes }` en `features`.
- Estados de feedback (utilizar `Alert` existente): info/éxito/error con textos consistentes.
- Accesibilidad: inputs deshabilitados en loading; `aria-invalid` en inputs con validación activa.

## API/Contratos del frontend a usar

- Lecturas (reutilizar helpers ya existentes):
  - `getUserTokensWithBalance(address)` → ids con balance > 0.
  - `getTokenDetails(id, address)` → filtrar `parentId === 0` y obtener `balance` exacto del parent.
- Escritura (helper existente):
  - `createToken({ name, totalSupply, features, parentId })` → con `parentId` = id del parent seleccionado.
- Eventos: no es necesario programar listener específico; `MyTokens` ya reacciona a `TokenCreated`.

## Contrato “lógico” de la acción

- Input:
  - `parentId: number` (raw token del Factory)
  - `name: string` (1..N chars)
  - `amount: number` (entero, 1..balanceParent)
  - `notes?: string`
- Efectos esperados:
  - On-chain: `createToken(name, amount, featuresJSON, parentId)`
  - Stock del parent: decrementado en `amount` para el Factory
  - Nuevo token: balance `amount` asignado al Factory
  - UI: feedback y limpieza de formulario; nuevo token visible en “My Tokens”
- Errores esperados:
  - “Insufficient parent token balance” (revert del SC)
  - “Only Factory or Retailer…” si el usuario no es Factory Approved
  - Problemas de red/provider (MetaMask), manejados como mensajes de error genéricos

## Estrategia TDD (RED → GREEN → REFACTOR)

Archivo de test propuesto: `web/src/__tests__/factory.roleactions.test.tsx`

### RED — Casos de prueba

1. “renders empty state when no eligible parents”

- Mock `getUserTokensWithBalance` → []
- Abrir card → ver mensaje de empty state

2. “lists eligible raw parents and preselects first”

- Mock tokens: dos `TokenDetails` con `parentId=0`, `balance>0` (usar `buildToken`)
- Ver selector con opciones y preselección del primero

3. “disables submit when fields are invalid”

- Name vacío, amount vacío o <= 0 → botón deshabilitado

4. “sets max amount to parent balance and validates boundary”

- `max` = balance del parent; amount = balance+1 → mostrar error “Insufficient balance” y no enviar

5. “submits createToken with correct payload for derived product”

- Mock `createToken` → resolve
- Completar formulario (name, amount, notes), submit
- Aserción: `createToken({ name, totalSupply: amount, features: JSON.stringify({ type:'processed', fromTokenId, notes }), parentId })`
- Feedback: pending → success + reset de form (mantener parent seleccionado)

6. “surfaces on-chain errors on failure”

- Mock `createToken` → reject(new Error('Insufficient parent token balance'))
- Submit → ver mensaje de error

7. “clears message when user edits inputs”

- Tras un error, al editar name/amount/notes, limpiar mensaje

8. “keeps UI responsive and disables inputs during submission”

- Mientras se resuelve la promesa, inputs/submit deshabilitados y mensaje “Processing materials…” visible

### GREEN — Implementación mínima

- Crear `src/components/tokenOps/ProcessMaterials.tsx`:
  - ActionCard con estado `open` similar a `TransferToFactory`.
  - `loadTokens()` que usa `getUserTokensWithBalance` + `getTokenDetails` + filtro `parentId===0`.
  - Formulario controlado con validaciones y mensajes de estado.
  - Llamada a `createToken` con `features` JSON estructurado (`type: 'processed'`).
- Integrar en `RoleActions.tsx` para el caso Factory (reemplazar el `ActionCard` deshabilitado por el componente nuevo).
- No añadir nuevos helpers en `contract.ts` (reutilizar `createToken`).

### REFACTOR — Limpieza sin cambiar comportamiento

- Extraer utilidades comunes de formularios (opcional) si hay duplicación con `CreateRawMaterial`.
- Homogeneizar mensajes y estilos (usar `Alert`).

## Definition of Done (DoD)

- ✅ Tests RED → GREEN pasando (8 casos usando builders y mocks sobre `lib/contract.ts`).
- ✅ Linter/Typecheck PASS.
- ✅ UX consistente con el resto (estados pending/success/error, disabled mientras carga).
- ✅ Lista de parents elegibles correcta (raw con balance > 0 del Factory).
- ✅ Nuevo token visible en "My Tokens" tras crear (vía evento ya existente).
- ✅ Documentación: este análisis en `docs/features/` y el milestone marcado como Completed en `DELIVERY.md`.
- ✅ Full test suite: 131/131 tests passing (8 new tests added).
- ✅ Component `ProcessMaterials.tsx` created and integrated into `RoleActions.tsx`.
- ✅ No regressions: all existing tests remain passing.
- ✅ Accessibility: `aria-invalid` attributes added to form inputs with validation.

## Edge cases y decisiones

- “¿Permitir derivados de derivados aquí?” → No en esta acción; este flujo se enfoca a materias primas → productos. Derivados de derivados quedarán para Retailer (“Package Products”).
- `features` JSON:
  - Estructura mínima propuesta: `{ type: 'processed', fromTokenId, notes }`.
  - Mantiene coherencia con `CreateRawMaterial` (`{ type: 'raw', content }`).
- Manejo de eventos: no añadimos listeners; `MyTokens` ya escucha `TokenCreated`.

## Riesgos y mitigación

- UX con muchos tokens en selector → paginar/filtrar en el futuro (no en esta iteración).
- Errores on-chain difíciles de mapear → mostrar mensaje genérico y loguear `err.message`.
- Balance desactualizado si Anvil reinicia → usamos `JsonRpcProvider` en lecturas (ya implementado en helpers).

## Plan de commits (TDD)

1. `test(red): factory process materials (empty, validation, success, errors)`
2. `feat(green): ProcessMaterials with createToken(parentId>0) and validations`
3. `feat(green): integrate ProcessMaterials into Factory RoleActions`
4. `refactor: unify form UX with existing tokenOps`
5. `chore: update DELIVERY document`

## Contraste con ROADMAP/README

- Cumple el flujo de “Creación de Token” para Factory (selección de parent + creación de derivado).
- Alineado con el enfoque dashboard-céntrico (ADR 008): sin nuevas rutas, acción integrada en RoleActions.
- Prepara el terreno para siguientes hitos: “Transfer to Retailer” y “Package Products”.

## Artefactos y componentes previstos

- `web/src/components/tokenOps/ProcessMaterials.tsx` (nuevo)
- `web/src/components/tokenOps/RoleActions.tsx` (actualizado para Factory)
- Tests: `web/src/__tests__/factory.roleactions.test.tsx` (nuevo)

---

Actualizado: 26 de octubre de 2025
