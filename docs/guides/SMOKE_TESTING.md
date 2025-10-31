# Guía de Smoke Testing – Supply Chain Tracker

Esta guía describe un guión paso a paso para verificar los flujos críticos y permisos en la DApp Supply Chain Tracker, siguiendo un patrón de smoke testing. Cada paso está alineado con los casos de prueba recomendados y validado contra la documentación y el código fuente actual.

---

## 1. Registro y flujo completo de usuario

### 1.1. Registrarse como Producer

- Accede a la aplicación en `/`.
- Haz clic en "Connect" para conectar tu wallet.
- Selecciona el rol "Producer" y completa el registro.
- Espera la aprobación del admin (simulado en test local, o accede como admin y aprueba al usuario en `/admin/users`).
- Verifica que el dashboard muestra acciones de Producer.

### 1.2. Crear token de materia prima

- En el dashboard de Producer, haz clic en "Crear Materia Prima".
- Completa el formulario (nombre, cantidad, unidad).
- Envía y verifica que aparece el nuevo token en "Mis Tokens".

### 1.3. Transferir a Factory

- En "Mis Tokens", selecciona un token y haz clic en "Transferir a Factory".
- Ingresa la dirección de un usuario Factory aprobado y la cantidad.
- Envía la transferencia.
- Verifica que la transferencia aparece en "Outgoing Transfers" con estado "Pending".

### 1.4. Factory crea producto derivado

- Accede como usuario Factory (con wallet distinta o cambia rol).
- Verifica que el dashboard muestra acciones de Factory.
- En "Incoming Transfers", acepta la transferencia recibida.
- En "Mis Tokens", verifica que el balance se actualizó.
- Haz clic en "Procesar Material" para crear un producto derivado.
- Completa el formulario y verifica que el nuevo token aparece en "Mis Tokens".

### 1.5. Continuar hasta Consumer

- Repite el flujo de transferencia: Factory → Retailer, Retailer → Consumer.
- En cada paso, verifica que solo se permiten transferencias al rol siguiente y que los balances se actualizan tras aceptar.

---

## 2. Validación de permisos

### 2.1. Intentar transferir a rol incorrecto

- En el formulario de transferencia, ingresa la dirección de un usuario con rol no permitido (ejemplo: Producer intenta transferir a Retailer).
- Verifica que el botón de envío está deshabilitado o aparece mensaje de error.

### 2.2. Crear token sin estar aprobado

- Regístrate como nuevo usuario Producer pero no apruebes el usuario.
- Accede al dashboard y verifica que la acción "Crear Materia Prima" está deshabilitada o no disponible.

### 2.3. Acceder a páginas de admin sin permisos

- Accede a `/admin/users` con un usuario que no sea admin.
- Verifica que la página muestra mensaje de acceso denegado o redirige al dashboard principal.

---

## 3. Estados de transferencia

### 3.1. Aceptar transferencia

- Como Factory, Retailer o Consumer, accede a "Incoming Transfers".
- Haz clic en "Aceptar" en una transferencia pendiente.
- Verifica que el estado cambia a "Accepted" y el balance se actualiza.

### 3.2. Rechazar transferencia

- En "Incoming Transfers", haz clic en "Rechazar" en una transferencia pendiente.
- Verifica que el estado cambia a "Rejected" y el token regresa al remitente.

### 3.3. Verificar actualización de balances

- Tras aceptar o rechazar una transferencia, accede a "Mis Tokens" y verifica que los balances reflejan la acción realizada.

---

## Notas adicionales

- Todos los formularios deben validar direcciones con `ethers.isAddress()`.
- Los botones de acción deben estar deshabilitados para estados inválidos.
- Los mensajes de error deben mostrarse en el DOM, no como alertas.
- Para pruebas locales, puedes simular múltiples usuarios cambiando la cuenta en MetaMask o usando diferentes wallets en Anvil.

---

**Referencia:**

- Documentación funcional: `docs/DELIVERY.md`, `docs/features/*_ANALYSIS.md`
- Código fuente: `src/components/tokenOps/`, `src/pages/Dashboard.tsx`, `src/lib/contract.ts`
- Metodología QA: `docs/guides/METODOLOGY_PROMPT.md`, `docs/guides/UI_TESTING_RESILIENCE_STRATEGY.md`

---

Este guión cubre los flujos mínimos y validaciones críticas para garantizar la funcionalidad esencial del MVP. Ejecuta cada paso en el orden indicado y documenta cualquier desviación o error encontrado.
