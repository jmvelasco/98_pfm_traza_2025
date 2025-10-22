# ON_GOING.md — Implementación TDD: Transfer Token to Factory (Frontend)

Fecha: 22 Oct 2025
Rama: dev

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

1) "renders form and validates basic fields"
- Renderizar `<TransferForm tokenId={1} parentId={0} balance={100} />`.
- Verificar campos destino y amount; botón deshabilitado si inputs inválidos (destino vacío, amount ≤ 0).

2) "blocks transfer of derived tokens (parentId > 0)"
- Renderizar con `parentId={2}`; esperar texto/alerta “Derived tokens cannot be transferred by Producer” y que no se llame a `requestTransfer`.

3) "shows error if destination address is invalid"
- Ingresar dirección inválida; submit; esperar mensaje de error “Invalid address”.

4) "requires Factory approved recipient"
- Mock `getUserInfo` devolviendo rol Retailer o status Pending; submit; esperar “Recipient must be an Approved Factory”.

5) "requires amount > 0 and <= balance"
- amount = 0 → error “Amount must be greater than 0”.
- amount = 101 con balance=100 → error “Insufficient balance”.

6) "calls requestTransfer on valid input and shows success"
- Mock `getUserInfo` → { role: "Factory", status: "Approved" }.
- Mock `requestTransfer` → Promise.resolve();
- Completar destino y amount; submit; esperar estado Pending → Success y reset del formulario.

7) "surfaces contract errors"
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

1) RED: tests y scaffolding del componente (sin implementación de helper ni componente real).
2) GREEN: implementación mínima en `contract.ts` y `TransferForm.tsx`.
3) REFACTOR: ajustes de UX/errores y, si procede, integración inicial desde `MyTokens`.
