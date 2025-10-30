# 🧪 Guía de Testing Manual - Supply Chain Tracker

Esta guía te permitirá verificar paso a paso todos los requisitos funcionales del proyecto Supply Chain Tracker descrito en el README.md.

## 📋 Preparación del Entorno

### 1. **Configuración Inicial**

**Paso 1.1**: Verificar que tienes Anvil ejecutándose

```bash
# Terminal 1 - Debe estar corriendo
cd supply-chain-tracker/sc
anvil
```

**Resultado esperado**:

- ✅ Anvil muestra 10 cuentas con private keys
- ✅ Puerto 8545 disponible
- ✅ Chain ID: 31337

**Paso 1.2**: Verificar contrato desplegado

```bash
# Terminal 2
cd supply-chain-tracker/sc
forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --broadcast
```

**Resultado esperado**:

- ✅ Contrato desplegado exitosamente
- ✅ Dirección del contrato visible en logs

**Paso 1.3**: Iniciar aplicación

```bash
# Terminal 3
cd supply-chain-tracker/web
npm run dev
```

**Resultado esperado**:

- ✅ Servidor corriendo en http://localhost:3000
- ✅ Sin errores en consola

### 2. **Configuración MetaMask**

**Paso 2.1**: Configurar red Anvil Local

- Network Name: `Anvil Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

**Paso 2.2**: Importar cuentas de prueba (usar estas private keys de Anvil):

```
Admin:    0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Producer: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Factory:  0x5de4111afa82c473d97b1dba9b3b74ff299e2c0e395a2b5fc6e45d5f8e5a1361
Retailer: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Consumer: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

**Resultado esperado**:

- ✅ 5 cuentas importadas exitosamente
- ✅ Cada cuenta tiene ~10,000 ETH
- ✅ Red Anvil Local seleccionada

---

## 🔐 BLOQUE 1: Sistema de Autenticación Web3

### Test 1.1: Página Principal - Usuario No Conectado

**Objetivo**: Verificar landing page para usuarios sin conectar

**Pasos**:

1. Abre http://localhost:3000
2. Desconecta MetaMask si está conectado
3. Actualiza la página

**Resultado esperado**:

- ✅ Se muestra invitación a conectar MetaMask
- ✅ Botón "Connect Wallet" visible
- ✅ No se muestra información de usuario
- ✅ No hay acceso a dashboard

### Test 1.2: Conexión con MetaMask

**Objetivo**: Verificar proceso de conexión inicial

**Pasos**:

1. Click en "Connect Wallet"
2. Selecciona la cuenta Admin en MetaMask
3. Acepta la conexión

**Resultado esperado**:

- ✅ MetaMask solicita conexión
- ✅ Después de aceptar: dirección visible en header
- ✅ Balance ETH visible
- ✅ Red "Anvil Local" mostrada
- ✅ Redirección automática o cambio de vista

### Test 1.3: Persistencia en localStorage

**Objetivo**: Verificar que la conexión se mantiene al recargar

**Pasos**:

1. Con MetaMask conectado, actualiza la página (F5)
2. Observa el estado de conexión

**Resultado esperado**:

- ✅ Usuario sigue conectado después de recargar
- ✅ Misma dirección y balance mostrados
- ✅ No solicita reconexión

### Test 1.4: Desconexión

**Objetivo**: Verificar proceso de desconexión

**Pasos**:

1. Con usuario conectado, click en botón de desconexión
2. Observa cambios en la interfaz

**Resultado esperado**:

- ✅ Usuario desconectado exitosamente
- ✅ Vuelta a página de landing
- ✅ LocalStorage limpiado
- ✅ No se muestra información de usuario

### Test 1.5: Cambio de Cuenta en MetaMask

**Objetivo**: Verificar detección automática de cambio de cuenta

**Pasos**:

1. Conecta con cuenta Admin
2. En MetaMask, cambia a cuenta Producer
3. Observa reacción de la aplicación

**Resultado esperado**:

- ✅ Aplicación detecta el cambio automáticamente
- ✅ Nueva dirección mostrada en header
- ✅ Nuevo balance visible
- ✅ Estado de usuario actualizado

---

## 👥 BLOQUE 2: Gestión de Usuarios y Roles

### Test 2.1: Registro como Producer

**Objetivo**: Verificar proceso de registro de nuevo usuario

**Pasos**:

1. Conecta con cuenta Producer (segunda private key)
2. Si aparece formulario de registro, selecciona rol "Producer"
3. Click en "Register" o "Solicitar Rol"

**Resultado esperado**:

- ✅ Formulario de registro aparece para usuario nuevo
- ✅ Dropdown con roles disponibles: Producer, Factory, Retailer, Consumer
- ✅ Después de enviar: mensaje "Registration pending approval"
- ✅ Estado del usuario: "Pending"

### Test 2.2: Admin - Ver Usuarios Pendientes

**Objetivo**: Verificar panel de administración

**Pasos**:

1. Cambia a cuenta Admin
2. Navega a /admin o /admin/users
3. Busca usuarios pendientes de aprobación

**Resultado esperado**:

- ✅ Página admin accesible solo para admin
- ✅ Lista de usuarios pendientes visible
- ✅ Usuario Producer aparece con estado "Pending"
- ✅ Botones "Approve" y "Reject" disponibles

### Test 2.3: Admin - Aprobar Usuario

**Objetivo**: Verificar proceso de aprobación

**Pasos**:

1. En panel admin, encuentra usuario Producer pendiente
2. Click en "Approve"
3. Confirma transacción en MetaMask

**Resultado esperado**:

- ✅ Transacción exitosa
- ✅ Estado del usuario cambia a "Approved"
- ✅ Usuario desaparece de lista pendientes
- ✅ Evento emitido correctamente

### Test 2.4: Producer Aprobado - Acceso al Sistema

**Objetivo**: Verificar acceso después de aprobación

**Pasos**:

1. Cambia a cuenta Producer
2. Actualiza página o navega a dashboard
3. Explora navegación disponible

**Resultado esperado**:

- ✅ Usuario puede acceder al dashboard
- ✅ Navegación según rol Producer visible
- ✅ Enlaces a crear tokens disponibles
- ✅ Sin acceso a páginas admin

### Test 2.5: Registrar Usuarios Restantes

**Objetivo**: Preparar todos los roles para tests siguientes

**Pasos**:

1. Repite proceso de registro para Factory, Retailer, Consumer
2. Como Admin, aprueba todos los usuarios
3. Verifica que todos tengan estado "Approved"

**Resultado esperado**:

- ✅ 4 usuarios aprobados: Producer, Factory, Retailer, Consumer
- ✅ Todos pueden acceder al sistema
- ✅ Cada uno ve navegación según su rol

---

## 🪙 BLOQUE 3: Gestión de Tokens

### Test 3.1: Producer - Crear Materia Prima

**Objetivo**: Verificar creación de token inicial por Producer

**Pasos**:

1. Conecta como Producer
2. Navega a /tokens/create
3. Completa formulario:
   - Name: "Organic Tomatoes"
   - Total Supply: "1000"
   - Features: "{"origin": "Spain", "organic": true, "harvest_date": "2024-10-30"}"
   - Parent ID: dejar vacío (0)
4. Submit y confirma transacción

**Resultado esperado**:

- ✅ Formulario apropiado para Producer (sin parent requerido)
- ✅ Transacción exitosa
- ✅ Token creado con ID #1
- ✅ Balance del Producer: 1000 unidades
- ✅ Redirección a detalles del token

### Test 3.2: Producer - Ver Tokens Propios

**Objetivo**: Verificar listado de tokens del usuario

**Pasos**:

1. Como Producer, navega a /tokens
2. Verifica token creado aparece

**Resultado esperado**:

- ✅ Lista muestra token "Organic Tomatoes"
- ✅ Balance correcto visible (1000)
- ✅ Información de metadatos visible
- ✅ Enlaces a detalles/transferir disponibles

### Test 3.3: Factory - Crear Producto Derivado

**Objetivo**: Verificar creación de producto que deriva de materia prima

**Pasos**:

1. Conecta como Factory
2. Navega a /tokens/create
3. Completa formulario:
   - Name: "Tomato Sauce"
   - Total Supply: "500"
   - Features: "{"type": "sauce", "ingredients": ["tomatoes", "salt", "spices"]}"
   - Parent ID: "1" (el token de tomates)
4. Submit y confirma transacción

**Resultado esperado**:

- ✅ Formulario requiere Parent ID para Factory
- ✅ Dropdown o input para seleccionar parent token
- ✅ Token creado con parent relationship
- ✅ Factory tiene balance de 500 unidades del nuevo producto

### Test 3.4: Ver Detalles del Token

**Objetivo**: Verificar información completa del token

**Pasos**:

1. Click en token "Tomato Sauce" para ver detalles
2. Verifica información mostrada

**Resultado esperado**:

- ✅ ID del token
- ✅ Nombre y descripción
- ✅ Total supply y balance actual
- ✅ Metadatos JSON parseados
- ✅ Parent ID mostrado (relationship)
- ✅ Fecha de creación
- ✅ Creador del token

---

## 📦 BLOQUE 4: Sistema de Transferencias

### Test 4.1: Producer → Factory Transfer

**Objetivo**: Verificar primera transferencia en la cadena

**Pasos**:

1. Como Producer, ve a detalles del token "Organic Tomatoes"
2. Click en "Transfer" o navega a /tokens/1/transfer
3. Completa transferencia:
   - To: dirección de Factory
   - Amount: "500"
4. Submit y confirma transacción

**Resultado esperado**:

- ✅ Formulario de transferencia cargado
- ✅ Validación: Producer solo puede transferir a Factory
- ✅ Transacción exitosa
- ✅ Transfer creado con estado "Pending"
- ✅ Balance del Producer reducido a 500

### Test 4.2: Factory - Ver Transferencias Pendientes

**Objetivo**: Verificar sistema de recepción de transferencias

**Pasos**:

1. Conecta como Factory
2. Navega a /transfers
3. Busca transferencias pendientes de aceptación

**Resultado esperado**:

- ✅ Lista de transferencias entrantes
- ✅ Transfer de "Organic Tomatoes" visible
- ✅ Estado: "Pending"
- ✅ Información del remitente y cantidad
- ✅ Botones "Accept" y "Reject" disponibles

### Test 4.3: Factory - Aceptar Transferencia

**Objetivo**: Verificar proceso de aceptación

**Pasos**:

1. Como Factory, click "Accept" en transferencia pendiente
2. Confirma transacción en MetaMask
3. Verifica cambios

**Resultado esperado**:

- ✅ Transacción exitosa
- ✅ Estado de transfer cambia a "Accepted"
- ✅ Balance de Factory aumenta en 500 tomates
- ✅ Transfer desaparece de pendientes

### Test 4.4: Factory → Retailer Transfer

**Objetivo**: Verificar segundo eslabón de la cadena

**Pasos**:

1. Como Factory, transfiere "Tomato Sauce" a Retailer
   - Token: "Tomato Sauce"
   - Amount: "200"
2. Como Retailer, acepta la transferencia

**Resultado esperado**:

- ✅ Factory solo puede transferir a Retailer
- ✅ Proceso de transferencia exitoso
- ✅ Retailer recibe 200 unidades de salsa

### Test 4.5: Retailer → Consumer Transfer

**Objetivo**: Verificar transferencia final al consumidor

**Pasos**:

1. Como Retailer, transfiere producto a Consumer
   - Amount: "50"
2. Como Consumer, acepta transferencia

**Resultado esperado**:

- ✅ Retailer solo puede transferir a Consumer
- ✅ Consumer recibe producto final
- ✅ Cadena completa: Producer → Factory → Retailer → Consumer

### Test 4.6: Rechazar Transferencia

**Objetivo**: Verificar sistema de rechazo

**Pasos**:

1. Como Producer, intenta otra transferencia a Factory
2. Como Factory, rechaza la transferencia

**Resultado esperado**:

- ✅ Estado cambia a "Rejected"
- ✅ Balance del Producer no cambia
- ✅ Transfer aparece en historial como rechazado

---

## 🔒 BLOQUE 5: Validaciones y Permisos

### Test 5.1: Restricciones por Rol - Transferencias Inválidas

**Objetivo**: Verificar que se respetan las reglas de la cadena

**Pasos**:

1. Como Producer, intenta transferir directamente a Retailer
2. Como Factory, intenta transferir directamente a Consumer
3. Como Consumer, intenta transferir a cualquier rol

**Resultado esperado**:

- ✅ Sistema bloquea transferencias inválidas
- ✅ Mensajes de error apropiados
- ✅ Transacciones revertidas
- ❌ Producer NO puede transferir a Retailer
- ❌ Factory NO puede transferir a Consumer
- ❌ Consumer NO puede transferir a nadie

### Test 5.2: Usuario No Aprobado

**Objetivo**: Verificar restricciones para usuarios pendientes

**Pasos**:

1. Registra nuevo usuario pero NO lo apruebes como Admin
2. Como usuario pendiente, intenta:
   - Crear token
   - Realizar transferencia
   - Acceder a funcionalidades

**Resultado esperado**:

- ❌ Usuario pendiente NO puede crear tokens
- ❌ Usuario pendiente NO puede transferir
- ✅ Mensajes de error apropiados
- ✅ Solo puede ver su estado pendiente

### Test 5.3: Acceso a Páginas de Admin

**Objetivo**: Verificar restricciones de acceso a administración

**Pasos**:

1. Como Producer/Factory/Retailer/Consumer, intenta acceder a:
   - /admin
   - /admin/users
2. Verifica restricciones

**Resultado esperado**:

- ❌ Solo Admin puede acceder a páginas admin
- ✅ Redirección o error 403 para otros usuarios
- ✅ Navegación admin solo visible para Admin

---

## 🔍 BLOQUE 6: Trazabilidad y Transparencia

### Test 6.1: Trazabilidad Completa

**Objetivo**: Verificar sistema de trazabilidad end-to-end

**Pasos**:

1. Como Consumer que tiene productos, busca opción de trazabilidad
2. Selecciona un producto y ve su historial completo
3. Verifica información mostrada

**Resultado esperado**:

- ✅ Historial completo visible: Producer → Factory → Retailer → Consumer
- ✅ Fechas de cada transferencia
- ✅ Información de cada actor en la cadena
- ✅ Metadatos de transformaciones (parent tokens)
- ✅ Estados de cada transferencia
- ✅ Trazabilidad cronológica ordenada

### Test 6.2: Información del Token Original

**Objetivo**: Verificar rastreo hasta origen

**Pasos**:

1. En trazabilidad, verifica que se puede rastrear hasta la materia prima original
2. Comprueba metadatos preservados

**Resultado esperado**:

- ✅ Token original "Organic Tomatoes" visible
- ✅ Información del Producer original
- ✅ Metadatos de origen preservados
- ✅ Cadena parent-child clara

---

## 🎨 BLOQUE 7: Interfaz de Usuario

### Test 7.1: Navegación por Rol

**Objetivo**: Verificar navegación contextual según rol

**Pasos**:

1. Conecta con cada rol y verifica navegación disponible:
   - Producer: crear tokens, ver tokens, transferencias
   - Factory: crear productos derivados, gestionar transferencias
   - Retailer: gestionar transferencias, ver inventario
   - Consumer: ver productos, trazabilidad
   - Admin: panel administración, gestión usuarios

**Resultado esperado**:

- ✅ Cada rol ve navegación apropiada
- ✅ Enlaces no autorizados ocultos
- ✅ Breadcrumbs y navegación clara

### Test 7.2: Dashboard Personalizado

**Objetivo**: Verificar información relevante por rol

**Pasos**:

1. Como cada rol, visita /dashboard
2. Verifica información mostrada

**Resultado esperado**:

- ✅ Producer: tokens creados, transferencias enviadas
- ✅ Factory: materias primas recibidas, productos creados
- ✅ Retailer: productos recibidos, ventas a consumidores
- ✅ Consumer: productos adquiridos, trazabilidad
- ✅ Admin: estadísticas del sistema, usuarios pendientes

### Test 7.3: Responsive Design

**Objetivo**: Verificar diseño en diferentes pantallas

**Pasos**:

1. Prueba aplicación en:
   - Desktop (>1024px)
   - Tablet (768-1024px)
   - Mobile (<768px)
2. Verifica todos los componentes

**Resultado esperado**:

- ✅ Layout responsive funcional
- ✅ Navegación adaptada a móvil
- ✅ Formularios usables en móvil
- ✅ Tablas/listas scrolleables

---

## ⚡ BLOQUE 8: Casos Edge y Robustez

### Test 8.1: Manejo de Errores de Red

**Objetivo**: Verificar comportamiento con problemas de conectividad

**Pasos**:

1. Para Anvil (Ctrl+C en terminal)
2. Intenta realizar operaciones en la aplicación
3. Reinicia Anvil y verifica recuperación

**Resultado esperado**:

- ✅ Mensajes de error apropiados cuando Anvil no disponible
- ✅ Aplicación no se rompe
- ✅ Recuperación automática al restaurar conexión

### Test 8.2: Transacciones Fallidas

**Objetivo**: Verificar manejo de transacciones revertidas

**Pasos**:

1. Intenta transferir más tokens de los que tienes
2. Intenta crear token sin fondos suficientes para gas
3. Cancela transacciones en MetaMask

**Resultado esperado**:

- ✅ Errores manejados graciosamente
- ✅ Mensajes de error informativos
- ✅ Estado de aplicación consistente
- ✅ No hay datos corruptos

### Test 8.3: Balances y Consistencia

**Objetivo**: Verificar integridad de datos

**Pasos**:

1. Realiza múltiples transferencias
2. Suma balances de todos los usuarios para cada token
3. Verifica que coincide con total supply

**Resultado esperado**:

- ✅ Suma de balances = total supply en todo momento
- ✅ No hay tokens "perdidos" o "duplicados"
- ✅ Balances actualizados correctamente

---

## 📊 CHECKLIST DE VALIDACIÓN COMPLETA

### ✅ **Autenticación y Usuarios**

- [ ] Conexión MetaMask funcional
- [ ] Persistencia localStorage
- [ ] Registro por roles
- [ ] Aprobación por admin
- [ ] Validación de permisos

### ✅ **Gestión de Tokens**

- [ ] Creación por Producer (materias primas)
- [ ] Creación por Factory (productos derivados)
- [ ] Metadatos JSON válidos
- [ ] Sistema de parentesco
- [ ] Balances correctos

### ✅ **Transferencias**

- [ ] Flujo Producer → Factory → Retailer → Consumer
- [ ] Sistema accept/reject
- [ ] Validaciones de rol
- [ ] Estados correctos
- [ ] Historial completo

### ✅ **Trazabilidad**

- [ ] Cadena completa visible
- [ ] Información chronológica
- [ ] Metadatos preservados
- [ ] Rastreo a origen

### ✅ **Interfaz**

- [ ] Navegación por rol
- [ ] Dashboard personalizado
- [ ] Design responsive
- [ ] Manejo de errores

### ✅ **Robustez**

- [ ] Errores de red manejados
- [ ] Transacciones fallidas controladas
- [ ] Consistencia de datos
- [ ] Casos edge cubiertos

---

## 🎯 Criterios de Éxito

**✅ MÍNIMO PARA APROBAR:**

- Todos los tests de Autenticación pasan
- Al menos un flujo completo Producer → Consumer funciona
- Admin puede gestionar usuarios
- Trazabilidad básica operativa

**🏆 EXCELENCIA (NOTA ALTA):**

- Todos los bloques de tests pasan
- Manejo robusto de errores
- Interfaz pulida y responsive
- Casos edge controlados
- Performance optimizada

---

## 📝 Notas para el Testing

### **Durante las Pruebas:**

- Documenta cualquier comportamiento inesperado
- Captura screenshots de errores
- Anota tiempos de respuesta
- Verifica console logs del navegador

### **Si Encuentras Problemas:**

- Verifica que Anvil esté corriendo
- Confirma que MetaMask está en red correcta
- Revisa que el contrato esté desplegado
- Comprueba balances de gas suficientes

### **Al Completar:**

- Tienes evidencia de que todos los requisitos funcionales trabajan
- La aplicación está lista para demostración
- Conoces las limitaciones (si las hay)
- Puedes hacer demo confidence 🚀

¡Feliz testing! 🧪✨
