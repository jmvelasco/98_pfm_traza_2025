# 🧪 Guía de Testing Manual - Supply Chain Tracker (TERCER CICLO)

## Contexto y Preparación

- **Entorno:** Anvil corriendo, contrato desplegado, `npm run dev` activo, MetaMask configurado con las 5 cuentas de testing.
- **Usuarios:** Todos los roles ya aprobados y con acceso a sus dashboards.
- **Cadena Nueva:** Cacao → Chocolate → Tabletas → Consumidor

---

## 🔄 Pre-Test: Validación de Estado Inicial

1. Ingresa con cada cuenta y verifica:
   - Dashboard correcto según rol.
   - Secciones vacías: "My Tokens", "Inventario", "Compras Recientes".
   - Mensajes de estado vacíos ("No tienes inventario aún", "No tienes compras aún").

---

## 🌱 BLOQUE 1: Flujo Completo de Nueva Cadena

### Test 1.1: Producer - Crear Materia Prima

- Ingresa como Producer.
- Usa "Create Raw Material" para crear "Cacao Orgánico" (100 unidades).
- Verifica en "Tokens Creados":
  - Aparece "Cacao Orgánico" con 100 producidos, 100 disponibles, 0 transferidos.
  - El dashboard muestra el conteo correcto de tokens y producción total.

### Test 1.2: Producer → Factory Transfer

- Usa "Transfer to Factory" para enviar 60 unidades de "Cacao Orgánico" al Factory.
- Verifica en "Transferencias Pendientes":
  - Transferencia aparece con estado "Pending".
  - Balance del Producer sigue en 100 hasta aceptación.

### Test 1.3: Factory - Aceptar Transferencia

- Ingresa como Factory.
- En "Materias Primas", acepta la transferencia.
- Verifica:
  - "Cacao Orgánico" aparece en stock con 60 unidades.
  - "Transferencias Pendientes" se actualiza.
  - Eficiencia y métricas reflejan el nuevo stock.

### Test 1.4: Factory - Procesar Materiales

- Usa "Process Materials" para crear "Chocolate Puro" (40 unidades) usando "Cacao Orgánico".
- Verifica:
  - "Chocolate Puro" aparece en "Productos Procesados" con stock y referencia al cacao consumido.
  - Stock de "Cacao Orgánico" se reduce correctamente.

### Test 1.5: Factory → Retailer Transfer

- Transfiere 25 unidades de "Chocolate Puro" al Retailer.
- Verifica en "Transferencias Pendientes" y "Productos Procesados".

### Test 1.6: Retailer - Aceptar y Empaquetar

- Ingresa como Retailer.
- Acepta la transferencia de "Chocolate Puro".
- Usa "Package Products" para crear "Tableta Chocolate 70%" (15 unidades).
- Verifica:
  - Inventario muestra ambos productos con fechas y stock.
  - "Transferencias Pendientes" actualiza correctamente.

### Test 1.7: Retailer → Consumer Transfer

- Transfiere 5 unidades de "Tableta Chocolate 70%" al Consumer.
- Verifica estado "Pending" en transferencias.

### Test 1.8: Consumer - Recibir Producto Final

- Ingresa como Consumer.
- Acepta la transferencia.
- Verifica en "Compras Recientes":
  - "Tableta Chocolate 70%" aparece con fecha, token ID, y estado "Verificado".
  - Métricas de compras y tiendas únicas se actualizan.

---

## 🔍 BLOQUE 2: Trazabilidad y Métricas

### Test 2.1: Consumer - Ver Trazabilidad

- Haz click en el producto recibido.
- Verifica que el modal de trazabilidad muestra:
  - Origen, transformación, empaque y transferencia final.
  - Direcciones, balances y timestamps correctos.
  - Porcentaje de trazabilidad promedio actualizado.

### Test 2.2: Validación de Métricas

- Revisa métricas en cada dashboard:
  - Producer: tokens creados, producción total, transferencias.
  - Factory: eficiencia, materias primas, productos procesados.
  - Retailer: inventario, ventas, transferencias.
  - Consumer: compras, trazabilidad, tiendas únicas.

---

## ⚠️ BLOQUE 3: Edge Cases y Validaciones

### Test 3.1: Rechazar Transferencia

- Producer crea nueva transferencia al Factory.
- Factory rechaza la transferencia.
- Verifica:
  - Estado "Rejected" en historial.
  - Balances no se alteran.

### Test 3.2: Restricciones de Roles

- Intenta transferir saltando roles (Producer → Retailer, Factory → Consumer).
- Verifica que la UI bloquea la acción y muestra mensaje de error.

### Test 3.3: Validaciones de Balance

- Intenta transferir más unidades de las disponibles.
- Verifica que el botón "Transfer" está deshabilitado y aparece mensaje "Insufficient balance".

### Test 3.4: Validaciones de Dirección

- Intenta transferir con dirección inválida, vacía o propia.
- Verifica que la UI bloquea la acción y muestra mensaje de error.

### Test 3.5: Usuario No Aprobado

- Registra nuevo usuario y no lo apruebes.
- Verifica que no puede crear tokens ni transferir, solo ve su estado pendiente.

---

## ✅ BLOQUE 4: Estado Final y Conservación

- Revisa balances finales en cada dashboard.
- Verifica que la suma total de unidades por token se conserva.
- Confirma que la trazabilidad y los historiales son completos y correctos.

---

**Notas de QA:**

- Valida todos los mensajes de error y estados vacíos.
- Verifica que los componentes muestran datos reales y actualizados tras cada acción.
- Asegúrate de que los modales y botones funcionan correctamente en todos los roles.

---

Este ciclo cubre la funcionalidad real y los flujos de tu aplicación, asegurando que la UI, lógica y blockchain están correctamente integrados y probados.
