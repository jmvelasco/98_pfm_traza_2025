La situación actual requiere una **revisión drástica del plan** debido a la proximidad de la fecha límite. Hoy, 11 de octubre de 2025, solo quedan aproximadamente **tres semanas** para la entrega final del proyecto "Supply Chain Tracker" (31 de octubre de 2025).

El enfoque debe pasar de la implementación exhaustiva a la **ejecución prioritaria** de los elementos críticos para asegurar la nota de aprobación mínima (6.0/10) y, posteriormente, la máxima puntuación (10.0/10).

A continuación, se presenta un plan de emergencia de 3 semanas, basado en los criterios de evaluación y el *Checklist de Desarrollo* proporcionado en los documentos:

---

## Plan de Choque (11 de Octubre - 31 de Octubre de 2025)

El plan asume que la **Parte 1: Smart Contract (4.0 puntos)** está completamente terminada, incluyendo que **TODOS** los tests unitarios están pasando y el contrato ha sido desplegado exitosamente en Anvil. Si el Smart Contract tiene fallos, se debe detener inmediatamente el desarrollo del Frontend para corregirlos, ya que los fallos críticos conllevan penalizaciones severas (hasta -1.0 pt por test fallando).

### Semana 1: (11 de Octubre – 17 de Octubre) - Fundación Web3 y Mínimo Viable (MVP)

**Objetivo Primordial: Asegurar la Conexión Web3 y las 3 Páginas Mínimas para la Aprobación (6.0/10)**.

| Días | Tareas Clave (Prioridad Alta) | Criterio Cubierto | Puntos Implicados |
| :--- | :--- | :--- | :--- |
| **Día 1-2** | **Verificación del Contrato:** Desplegar el contrato `SupplyChain.sol` en Anvil, asegurando que `forge test` pase completamente y que se obtenga la dirección y el ABI. **Actualizar `web/src/contracts/config.ts`** con la dirección y el ABI. | Deploy y Configuración (SC) | 4.0 (Base) |
| **Día 3-4** | **Configuración Frontend:** Inicializar Next.js con TypeScript y Tailwind. Instalar dependencias (ethers, etc.). Implementar el **`Web3Context.tsx`** y el *hook* **`useWallet.ts`**. | Integración Web3 | 3.0 (Parcial) |
| **Día 5** | **Servicio y Conexión:** Crear la clase `Web3Service` (`lib/web3.ts`) para manejar la conexión con MetaMask y el `eth_chainId` (debe ser 31337). Implementar la **conexión con MetaMask** y la **persistencia en `localStorage`**. | Conexión MetaMask, Persistencia | 3.0 (Parcial) |
| **Día 6-7** | **Página Principal y Registro (1ª Página):** Crear la página `/` para: conexión, formulario de `requestUserRole` y vista de estado `Pending`. **Panel de Administración (2ª Página):** Implementar la página `/admin/users` (solo la funcionalidad de **aprobación** `changeStatusUser`). | Conexión, Flujo básico de registro, 2 páginas funcionales | 6.0 (Mínimo) |

### Semana 2: (18 de Octubre – 24 de Octubre) - Funcionalidad Core y Tokens

**Objetivo Primordial: Implementar la Creación de Tokens y la Trazabilidad Básica para subir la puntuación del Frontend.**

| Días | Tareas Clave (Prioridad Alta) | Criterio Cubierto | Puntos Implicados |
| :--- | :--- | :--- | :--- |
| **Día 8-10** | **Gestión de Tokens (3ª Página):** Implementar `/tokens/create` (interfaz para crear tokens) y `/tokens` (lista de tokens). Implementar la llamada a `createToken` para el `Producer` (sin *Parent ID* inicialmente). Asegurar la lectura del balance individual (`getTokenBalance`) y la visualización de tokens. | 3 páginas funcionales, Flujo básico de tokens | 7.0 (Aprox.) |
| **Día 11-12** | **Flujo de Parentesco:** Expandir `/tokens/create` para que `Factory` y `Retailer` puedan crear tokens derivados (usando *Parent ID* e implementando el flujo de `createToken` en el Frontend). | Creación de tokens con metadatos y parentesco | 7.5 (Aprox.) |
| **Día 13-14** | **Inicio de Transferencia:** Implementar la página `/tokens/[id]/transfer`. Esta debe permitir al propietario **iniciar una transferencia** (usando la función `transfer`) al siguiente actor de la cadena (`Producer` a `Factory`, `Factory` a `Retailer`, etc.), validando los permisos por rol. | Flujo dirigido de transferencias | 8.0 (Aprox.) |

### Semana 3: (25 de Octubre – 31 de Octubre) - Finalización, Video y Entrega

**Objetivo Primordial: Completar el Flujo de Aprobación de Transferencias (trazabilidad completa) y preparar la entrega final (Video y `IA.md`).**

| Días | Tareas Clave (Prioridad Máxima) | Criterio Cubierto | Puntos Implicados |
| :--- | :--- | :--- | :--- |
| **Día 15-17** | **Aprobación de Transferencias:** Implementar la página `/transfers` para listar las transferencias pendientes (`TransferStatus.Pending`). Implementar la lógica para que el receptor pueda llamar a `acceptTransfer` o `rejectTransfer`. | Sistema de transferencias completo, Aceptar/Rechazar | 9.0 (Aprox.) |
| **Día 18** | **Trazabilidad Completa y Dashboard:** Implementar la lógica para mostrar la trazabilidad completa del token en la página de detalles (`/tokens/[id]`). Finalizar el `/dashboard` con el resumen personalizado por rol. | Trazabilidad completa, Flujo completo P→F→R→C | 9.5 (Aprox.) |
| **Día 19** | **Documentación IA:** Crear el fichero **`IA.md`** detallando: IAs usadas, tiempo consumido (SC vs. Frontend), errores habituales y ficheros de chat. | Objetivo IA, Calidad/Documentación | 9.5 - 10.0 |
| **Día 20** | **Revisión General:** Corregir errores, asegurar el **`Design responsive`** y realizar un `npm run build` para capturar errores de TypeScript o compilación. | Calidad del código, Manejo de errores | 10.0 (Aprox.) |
| **Día 21 (31 de Octubre)** | **Entrega Final:** Grabar, editar y subir el **Video demo de máximo 5 minutos** que muestre el flujo completo Producer → Factory → Retailer → Consumer. Asegurar que el `README` esté actualizado con las instrucciones de instalación. | Video demo, Demo funcionando completamente | **10.0** |

### Resumen de Riesgos y Penalizaciones

Dado el tiempo limitado, el mayor riesgo reside en la integración Web3 y en que la demostración del flujo completo falle.

| Penalización (Riesgo Alto) | Puntos de Penalización | Requisito a Cubrir Urgente |
| :--- | :--- | :--- |
| **Aplicación no funcional** | -2.0 pts | La DApp debe ejecutar el flujo P→F→R→C. |
| **Smart Contract sin deploy** | -1.5 pts | Asegurar que Anvil esté corriendo y el contrato desplegado. |
| **Sin conexión MetaMask** | -1.0 pt | Implementar `Web3Context` y `useWallet` en la Semana 1. |
| **Tests fallando** | -1.0 pt por test crítico | Verificar el *Smart Contract* antes de empezar el Frontend. |

**Priorizar rigurosamente las tareas de la Semana 1 es la clave para asegurar la aprobación mínima (6.0/10)**, ya que cubre el contrato desplegado, la conexión Web3 y el flujo básico de registro.