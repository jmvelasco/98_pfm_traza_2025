# PROMPT.md — Plantilla de Instrucciones para Análisis de Implementación

## Instrucciones de análisis forense y planificación TDD

**Contexto:**
Eres un **Ingeniero de Software Senior** y **Auditor de Proyectos**. Tu misión es realizar un análisis forense exhaustivo del estado de desarrollo de este repositorio, contrastando rigurosamente la documentación del proyecto (README, ROADMAP, STATUS_x.md, PROGRESS.md, documentación técnica de contratos inteligentes) con la implementación real del código (frontend y smart contracts).

---

## Tareas paso a paso

1. **ANÁLISIS DOCUMENTAL COMPLETO**

   - Analiza los archivos de documentación progresiva: `STATUS_x.md`, `PROGRESS.md`, y cualquier documentación técnica relevante (`SMART_CONTRACT.md`, `DEPLOYMENT.md`, etc.).
   - Extrae la **intención de diseño final**, los **requisitos funcionales** (especialmente de SC), los **cambios arquitectónicos clave** y el **estado de progreso reportado**.
   - Identifica cualquier inconsistencia entre la documentación de SC y el progreso reportado.

2. **AUDITORÍA DE IMPLEMENTACIÓN (CÓDIGO Y TESTS)**

   - Examina el código fuente actual (archivos `*.js`, `*.ts`, `*.sol`, etc.) y la carpeta de tests.
   - Verifica la existencia, la funcionalidad básica y la **cobertura de pruebas** para los módulos principales.
   - Contrasta directamente el código de los Contratos Inteligentes con los diseños y especificaciones de la documentación técnica y los tests implementados.

3. **CONTRASTE Y DETERMINACIÓN DEL ESTADO (ROADMAP)**

   - Compara línea por línea el _checklist_ del archivo `ROADMAP.md` con las conclusiones obtenidas en los Pasos 1 y 2.
   - Usa los siguientes criterios de verificación:
     - **HECHO (DONE):** Característica implementada en el código, confirmada como funcional (por código/estructura/tests) y que cumple con la documentación.
     - **EN PROGRESO (IN PROGRESS):** Característica presente en el código, pero incompleta, o mencionada como en desarrollo.
     - **PENDIENTE (PENDING):** Característica que no tiene rastro en el código fuente, tests o la documentación reciente.

4. **GENERACIÓN DEL INFORME FINAL**
   - Genera un archivo markdown de salida (ej: `[FEATURE]_ANALYSIS.md`).
   - El contenido debe ser una copia fiel del checklist original, pero con un prefijo/sufijo de estado (`[✅ DONE]`, `[⏳ IN PROGRESS]`, `[❌ PENDING]`).
   - Incluye una sección de **Resumen Ejecutivo** al inicio que resuma logros, inconsistencias y el alineamiento entre documentación y código.
   - Si el análisis es para una feature concreta, adapta el nombre y el foco del archivo y del resumen.

---

## Consideraciones adicionales

- Si el README menciona rutas o flujos que no son necesarios para el objetivo actual, justifica su exclusión en el análisis.
- Si el enfoque implementado difiere del propuesto pero cumple el objetivo, deja constancia crítica y razonada.
- Mantén el análisis y la documentación lo más claros y trazables posible para futuras iteraciones.

---

**Placeholders a adaptar:**

- `[FEATURE]`: nombre de la funcionalidad o módulo analizado (ej: TRANSFER_TO_FACTORY)
- `[FECHA]`: fecha del análisis
- `[ARCHIVOS_DOC]`: archivos de documentación relevantes
- `[ARCHIVOS_CODIGO]`: archivos de código y tests relevantes
- `[CRITERIOS]`: criterios de aceptación o definición de hecho

---

Esta plantilla sirve como referencia para repetir el proceso de análisis y planificación TDD en futuras funcionalidades o auditorías del proyecto.
