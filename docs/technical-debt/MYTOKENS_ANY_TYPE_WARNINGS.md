# Deuda técnica: Warnings de tipo `any` en MyTokens

## Contexto

Tras la mejora de diseño en las cards de MyTokens para diferenciar tokens con balance 0, han quedado warnings de tipo en el código:

- Uso de `event: any` en handlers de eventos (líneas 74 y 110 de `MyTokens.tsx`).
- Mensaje: `Unexpected any. Specify a different type.`

## Riesgos

- El uso de `any` reduce la seguridad de tipos y puede ocultar errores en tiempo de compilación.
- No sigue las mejores prácticas de TypeScript.

## Acción recomendada

- Revisar y tipar correctamente los eventos, usando los tipos de React (`React.MouseEvent<HTMLDivElement>`, etc.)
- Eliminar el uso de `any` en handlers y funciones relacionadas.

## Prioridad

Media: No bloquea la funcionalidad ni la UI, pero debe corregirse para mantener la calidad y robustez del código.

---

**Fecha:** 2025-10-31
**Autor:** GitHub Copilot

---

## Iteraciones Futuras Pendientes

- Tipar todos los handlers y eventos en `MyTokens.tsx` y componentes relacionados, eliminando el uso de `any`.
- Revisar el resto de componentes para detectar posibles usos de `any` en lógica de eventos y corregirlos.
- Añadir tests de tipado y cobertura para asegurar que no se reintroducen tipos inseguros.
- Sincronizar la corrección con la documentación en DELIVERY.md y actualizar el estado de deuda técnica.

**Referencia:** Ver sección "Outstanding Items" en DELIVERY.md para priorización y seguimiento.
