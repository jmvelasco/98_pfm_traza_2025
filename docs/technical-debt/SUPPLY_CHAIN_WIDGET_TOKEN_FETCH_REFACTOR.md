# Refactor pendiente: Unificación de lógica de obtención de tokens en widgets

## Contexto

El bug corregido en el widget premium de la Supply Chain se debió a que se usaba `getUserTokensWithBalance`, lo que ocultaba tokens con balance 0. Se ha realizado un fix inmediato cambiando a `getUserTokens` para mostrar todos los tokens creados por el usuario.

## Deuda técnica

Actualmente existen dos lógicas paralelas para obtener tokens:

- **getUserTokens**: Devuelve todos los tokens creados por el usuario, sin filtrar por balance.
- **getUserTokensWithBalance**: Devuelve solo los tokens con balance > 0.

Esto genera duplicidad y riesgo de inconsistencias entre componentes (dashboard, widgets, etc.).

## Refactor propuesto

- Unificar la lógica de obtención de tokens en un único helper, parametrizable por balance si es necesario.
- Extraer la lógica común a un hook o helper compartido para todos los componentes que muestran tokens.
- Revisar todos los componentes y hooks que consumen datos de tokens para asegurar consistencia y evitar filtrados divergentes.

## Riesgos de no abordar el refactor

- Bugs recurrentes por tokens ocultos o inconsistencias en la UI.
- Dificultad para mantener y evolucionar la lógica de negocio.
- Mayor coste de QA y debugging en futuras iteraciones.

## Prioridad

Alta: El refactor debe abordarse en el siguiente ciclo de mejora para garantizar robustez y mantenibilidad.

---

**Fecha:** 2025-10-31
**Autor:** GitHub Copilot
