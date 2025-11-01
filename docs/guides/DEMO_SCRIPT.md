¡Por supuesto! Es crucial mostrar la **dinámica de los balances** y las **acciones de aceptación/rechazo** en la demo. Esto valida la lógica central de la DApp.

He adaptado el guion, integrando los cambios de rol, la revisión de _balances_ (en el widget), y las decisiones de aceptación/rechazo dentro del flujo de 1:40 minutos.

---

# GUION DEMOSTRACIÓN DAPP (Ajuste Final: Trazabilidad y Balance)

Este guion es apto para una arquitectura _dashboard-centric_ y mantiene todas las direcciones completas.

## 1. Introducción Rápida (10s) 🚀

> **VOZ:** ¡Hola! Esta es una **demostración rápida** de nuestra DApp de cadena de suministro. Nos centraremos en la trazabilidad en tiempo real y la **aplicación estricta de permisos por rol** directamente en el _dashboard_.

---

## 2. Acceso y Bloqueo Condicional (40s) 🔒

> **ACCIÓN:** Conectar la _wallet_. Mostrar la vista del _dashboard_ de un usuario **no aprobado**.
>
> **VOZ:** Conecto mi _wallet_. Mi estado es: **Pendiente**.
>
> **ACCIÓN:** Mover el cursor al área del _dashboard_ donde debería estar la funcionalidad "Crear Token". Señalar el área vacía o el mensaje de bloqueo.
>
> **VOZ:** Dado que soy **no aprobado**, la funcionalidad principal ("Crear Token") **no está visible**. Esto demuestra que el sistema bloquea cualquier acción crítica **a nivel de componente**, hasta que el Administrador valide mi rol.

---

## 3. Flujo de Trazabilidad y Balance (2:00 min) 🔗

> **VOZ:** Una vez aprobado, el flujo es inmutable. Demostremos la trazabilidad, las decisiones y cómo se actualizan los _balances_ en tiempo real.

### A. Productor → Fábrica (Creación y Envío)

> **ACCIÓN:** Conectar como **Productor** (usuario aprobado). Crear la materia prima.
>
> **VOZ:** Como **Productor**, creo la materia prima: **Maíz Orgánico** (Cantidad: **100**).
>
> **ACCIÓN:** Mostrar brevemente el widget de Balance/Inventario.
>
> **VOZ:** Mi **Balance** muestra ahora 100 unidades. Lo envío a la Fábrica.
>
> **PEGAR:** **`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`**
>
> **VOZ:** Transacción enviada. Mi balance de 100 ahora es 'Pendiente de Envío'.

### B. Fábrica: Decisión de Rechazo (Simulación de Error) ❌

> **ACCIÓN:** **Cambiar rol a Fábrica**. Mostrar la transferencia Pendiente. **Rechazarla**.
>
> **VOZ:** Ahora, estoy conectado como **Fábrica**. Veo la transferencia entrante. Por alguna razón, la **rechazo**.
>
> **ACCIÓN:** **Cambiar rol a Productor**. Mostrar el widget de Balance.
>
> **VOZ:** Regreso como Productor. Mi Balance se actualizó: la cantidad de **100** unidades está de vuelta en mi inventario, lista para ser enviada de nuevo.

### C. Fábrica → Minorista (Aceptación y Derivación)

> **ACCIÓN:** **Cambiar rol a Productor**. Crear una nueva solicitud de transferencia, esta vez con éxito.
>
> **VOZ:** Bien, volvamos a enviar. Mis 100 unidades van de nuevo a la Fábrica.
>
> **ACCIÓN:** **Cambiar rol a Fábrica**. Mostrar la transferencia Pendiente. **Aceptarla**.
>
> **VOZ:** De vuelta a la Fábrica. **Acepto** la transferencia. Mi Balance aumenta en 100 unidades. Lo proceso en **Harina de Maíz** (Cantidad: 50).
>
> **ACCIÓN:** Transferir la Harina de Maíz al Minorista.
>
> **PEGAR:** **`0x90F79bf6EB2c4f870365E785982E1f101E93b906`**
>
> **VOZ:** Enviando las 50 unidades al Minorista.

### D. Minorista → Consumidor (Venta Final)

> **ACCIÓN:** **Cambiar rol a Minorista**. Mostrar el widget de Balance (debería reflejar 50 unidades pendientes/recibidas). Realizar la última transferencia.
>
> **VOZ:** Con el **Minorista**, confirmo las 50 unidades recibidas. Creo el producto final, **Paquete de Tortillas** (Cantidad: 10), y lo transfiero al **Consumidor**.
>
> **PEGAR:** **`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`**
>
> **VOZ:** El linaje del token es rastreable y el balance de cada actor se actualiza en tiempo real.

---

## 4. Validación de Flujos y Accesibilidad (40s) ✅

> **VOZ:** Confirmemos la seguridad del sistema y la usabilidad.

### 4.1. Restricciones de Flujo

> **ACCIÓN:** Intentar realizar una transferencia no permitida. Mostrar el bloqueo en el campo de destino o mensaje de error.
>
> **VOZ:** El sistema impone **restricciones de flujo**. El _input_ de destino solo me permite seleccionar roles válidos en la cadena. Si intento saltarme la Fábrica, la validación lo impide.

### 4.2. Acceso Administrativo (Ruta Única)

> **ACCIÓN:** Intentar acceder a la ruta `/admin/users` sin ser el Administrador. Mostrar el bloqueo.
>
> **VOZ:** La única excepción de navegación es el panel de **Administrador**. Solo esta dirección [Admin Address: **`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`**] tiene permiso para acceder.

### 4.3. Usabilidad

> **ACCIÓN:** Mostrar brevemente la validación del formulario.
>
> **VOZ:** La DApp ofrece **mensajes de error claros** y valida la entrada de datos antes de la transacción, mejorando la experiencia de usuario.

---

## 5. Resumen y Cierre (10s) 🎬

> **VOZ:** Hemos visto: **acciones condicionales por rol**, **decisiones de aceptación/rechazo** que impactan el balance, y una **trazabilidad inmutable**. Nuestro proyecto asegura que cada paso en la cadena de suministro sea transparente y autorizado. ¡Gracias!
