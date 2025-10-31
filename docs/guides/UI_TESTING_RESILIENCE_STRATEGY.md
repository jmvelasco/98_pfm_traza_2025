# 🧪 UI Testing Resilience Strategy - Supply Chain Tracker

## Guía de Testing para Cambios de UI y Estrategias de Robustez

Esta guía documenta las mejores prácticas para crear tests resilientes que mantengan su valor ante cambios de UI, basada en el análisis del impacto del rediseño visual implementado en el proyecto Supply Chain Tracker.

---

## 🎯 **Contexto y Objetivo**

### **Problema Identificado**

Durante la implementación del rediseño visual de token cards (flat layout → semantic HTML5 grid), algunos tests se rompieron debido a cambios en la estructura DOM y presentación visual. Este documento analiza por qué ocurrió y cómo prevenir fragilidad innecesaria en futuros cambios.

### **Scope de la Guía**

- **Target audience**: Developers y QA engineers implementando tests
- **Aplicabilidad**: Proyectos React con @testing-library
- **Enfoque**: Balancear robustez vs especificidad en testing

---

## 📊 **Análisis del Caso: Rediseño Token Cards**

### **Cambios Implementados**

```tsx
// ANTES: Estructura plana
<span className="font-medium">Balance:</span> {token.balance}
<span className="font-medium">Token ID:</span> {token.id}

// DESPUÉS: Estructura semántica HTML5
<dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</dt>
<dd className="text-lg font-bold text-gray-900 mt-1">{token.balance}</dd>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shrink-0">
  #{token.id}
</span>
```

### **Impacto en Tests**

- **Tests afectados**: 2 archivos de ~20 total (10% impacto)
- **Naturaleza de fallos**: Búsquedas de texto exacto + estructura DOM
- **Tests preservados**: 85%+ mantuvieron funcionalidad

### **Evaluación QA**: ✅ **NO RED FLAG**

- Cambio arquitectónico legítimo (mejor accesibilidad + UX)
- Impacto controlado y predecible
- Core functionality intacta

---

## 🛡️ **Estrategias de Testing Resiliente**

### **1. Jerarquía de Selectores (Más Robusto → Más Frágil)**

#### **🏆 Nivel 1: Selectores Semánticos (MÁS ROBUSTO)**

```tsx
// ✅ EXCELENTE: Basado en rol y accesibilidad
expect(
  screen.getByRole("button", { name: /trace product journey/i })
).toBeInTheDocument();
expect(
  screen.getByRole("heading", { name: /consumer dashboard/i })
).toBeInTheDocument();
expect(screen.getByLabelText("Token Balance")).toBeInTheDocument();

// ✅ EXCELENTE: Basado en comportamiento
expect(screen.getByRole("button")).toHaveAttribute("disabled");
```

#### **🥈 Nivel 2: Data Attributes Estratégicos (ROBUSTO)**

```tsx
// ✅ BUENO: Para elementos UI críticos
<button data-testid="trace-button">🔍 Trace Product Journey</button>
<div data-testid="token-card" data-token-id={token.id}>...</div>

// En tests
expect(screen.getByTestId('trace-button')).toBeInTheDocument();
expect(screen.getByTestId('token-card')).toHaveAttribute('data-token-id', '123');
```

#### **🥉 Nivel 3: Contenido Específico (MODERADAMENTE ROBUSTO)**

```tsx
// ✅ ACEPTABLE: Para contenido dinámico único
expect(screen.getByText("Organic Tomatoes")).toBeInTheDocument();
expect(screen.getByText("José Manuel")).toBeInTheDocument();

// ⚠️ CUIDADO: Para contenido que puede cambiar formato
expect(screen.getByText("1000")).toBeInTheDocument(); // Puede cambiar a "1,000"
```

#### **🚨 Nivel 4: Estructura UI Específica (FRÁGIL)**

```tsx
// ❌ FRÁGIL: Depende de texto exacto con formato
expect(screen.getByText("🔍 Trace Product Journey")).toBeInTheDocument();
expect(screen.getByText("Token ID: 123")).toBeInTheDocument();
expect(screen.getByText("Balance:")).toBeInTheDocument();

// ❌ MUY FRÁGIL: Depende de clases CSS específicas
expect(screen.getByText("Trace Product Journey")).toHaveClass(
  "hover:bg-blue-700"
);
```

### **2. Estrategias por Tipo de Test**

#### **Tests Funcionales (Prioritarios)**

```tsx
describe("Token Transfer Functionality", () => {
  it("should transfer token when user clicks transfer button", async () => {
    const user = userEvent.setup();

    // ✅ ROBUSTO: Busca por comportamiento
    const transferButton = screen.getByRole("button", { name: /transfer/i });
    await user.click(transferButton);

    // ✅ ROBUSTO: Verifica resultado funcional
    expect(await screen.findByText(/transfer successful/i)).toBeInTheDocument();
  });
});
```

#### **Tests de Integración**

```tsx
describe("Consumer Dashboard Integration", () => {
  it("should display user products and allow traceability", async () => {
    render(<Dashboard />);

    // ✅ ROBUSTO: Usa contenido específico del usuario
    await waitFor(() => {
      expect(screen.getByText("Organic Tomatoes")).toBeInTheDocument();
    });

    // ✅ ROBUSTO: Busca por funcionalidad
    const traceButton = screen.getByRole("button", { name: /trace/i });
    expect(traceButton).toBeInTheDocument();
  });
});
```

#### **Tests Visuales (Separados)**

```tsx
describe("Token Card Visual Styling", () => {
  it("should display token with correct visual structure", () => {
    render(<TokenCard token={mockToken} />);

    // ✅ ACEPTABLE: Test específico de UI
    const tokenCard = screen.getByTestId("token-card");
    expect(tokenCard).toHaveClass("grid");

    // ✅ ACEPTABLE: Verificación de estructura esperada
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("#123")).toBeInTheDocument();
  });
});
```

### **3. Patrones de Búsqueda Flexibles**

#### **Texto Flexible**

```tsx
// ✅ BUENO: Case insensitive + partial match
expect(screen.getByText(/balance/i)).toBeInTheDocument();
expect(screen.getByText(/trace.*product/i)).toBeInTheDocument();

// ✅ BUENO: Función matcher personalizada
expect(
  screen.getByText((content, node) => {
    return content.includes("Token") && content.includes("123");
  })
).toBeInTheDocument();
```

#### **Combinación de Estrategias**

```tsx
it("should handle token interaction correctly", async () => {
  const user = userEvent.setup();

  // Primero: buscar por contenido específico
  const tokenName = screen.getByText("Organic Tomatoes");
  expect(tokenName).toBeInTheDocument();

  // Segundo: buscar funcionalidad por rol/comportamiento
  const actionButton = screen.getByRole("button", { name: /trace/i });
  await user.click(actionButton);

  // Tercero: verificar resultado funcional
  expect(screen.getByTestId("traceability-modal")).toBeInTheDocument();
});
```

---

## 🔄 **Workflow de Actualización de Tests**

### **Cuando Cambios de UI Rompen Tests**

#### **Paso 1: Evaluar Legitimidad del Fallo**

```typescript
// Preguntas clave:
// ¿El cambio mejora accesibilidad/UX?
// ¿La funcionalidad core se mantiene?
// ¿Es un refactor arquitectónico válido?

// Si YES → Actualizar tests
// Si NO → Reconsiderar el cambio UI
```

#### **Paso 2: Clasificar Tipo de Test Roto**

```tsx
// FUNCIONAL (alta prioridad) - Actualizar inmediatamente
expect(screen.getByRole("button")).toBeInTheDocument(); // ← Mantener

// VISUAL/ESTRUCTURA (menor prioridad) - Evaluar necesidad
expect(screen.getByText("Balance:")).toBeInTheDocument(); // ← Actualizar formato

// COSMÉTICO (opcional) - Considerar eliminar
expect(element).toHaveClass("specific-css-class"); // ← ¿Es necesario?
```

#### **Paso 3: Aplicar Mejoras de Robustez**

```tsx
// ANTES (frágil)
expect(screen.getByText("🔍 Trace Product Journey")).toBeInTheDocument();

// DESPUÉS (robusto)
expect(
  screen.getByRole("button", { name: /trace product journey/i })
).toBeInTheDocument();

// ALTERNATIVA (semi-robusto)
expect(screen.getByTestId("trace-button")).toBeInTheDocument();
```

---

## 📋 **Checklist de Testing Resiliente**

### **✅ Para Nuevos Tests**

**Funcionalidad Core**:

- [ ] Usar `getByRole()` cuando sea posible
- [ ] Preferir `getByLabelText()` para inputs
- [ ] Usar `getByText()` para contenido específico del dominio
- [ ] Evitar selectores de clases CSS en tests funcionales

**Interacciones de Usuario**:

- [ ] Usar `@testing-library/user-event` para interacciones
- [ ] Probar flujos completos end-to-end
- [ ] Verificar estados de loading/error/success

**Data Testing**:

- [ ] Usar `data-testid` estratégicamente (elementos críticos)
- [ ] No sobrecargar DOM con test attributes innecesarios
- [ ] Mantener naming consistente (`kebab-case`)

### **✅ Para Actualizaciones de Tests Existentes**

**Evaluación**:

- [ ] ¿El cambio UI mejora la experiencia del usuario?
- [ ] ¿Se mantiene la funcionalidad core?
- [ ] ¿Es un cambio arquitectónico legítimo?

**Refactoring**:

- [ ] Actualizar selectores a más robustos cuando sea posible
- [ ] Mantener tests de funcionalidad intactos
- [ ] Separar tests visuales de funcionales
- [ ] Documentar cambios significativos

---

## 🎯 **Ejemplos Prácticos: Supply Chain Tracker**

### **Caso 1: Token Balance Display**

```tsx
// ❌ FRÁGIL (se rompió con el rediseño)
expect(screen.getByText("Balance:")).toBeInTheDocument();
expect(screen.getByText("100")).toBeInTheDocument();

// ✅ ROBUSTO (resistente a cambios de formato)
expect(
  screen.getByRole("definition", { name: /balance/i })
).toBeInTheDocument();
// O alternativamente:
expect(screen.getByText(/balance/i)).toBeInTheDocument();
expect(screen.getByDisplayValue("100")).toBeInTheDocument();
```

### **Caso 2: Token ID Badge**

```tsx
// ❌ FRÁGIL (se rompió: "Token ID: 123" → "#123")
expect(screen.getByText("Token ID: 123")).toBeInTheDocument();

// ✅ ROBUSTO (adaptable a formato)
expect(screen.getByText("#123")).toBeInTheDocument();
// O mejor aún:
expect(screen.getByTestId("token-badge")).toHaveTextContent("123");
```

### **Caso 3: Trace Product Button**

```tsx
// ❌ FRÁGIL (se rompió por estructura del botón)
expect(screen.getByText("🔍 Trace Product Journey")).toBeInTheDocument();

// ✅ ROBUSTO (enfoque semántico)
expect(
  screen.getByRole("button", { name: /trace product journey/i })
).toBeInTheDocument();

// ✅ ALTERNATIVA (texto parcial)
expect(screen.getByText(/trace product journey/i)).toBeInTheDocument();
```

---

## 🚨 **Red Flags vs Cambios Normales**

### **🚨 RED FLAGS (Revisar el cambio)**

- 50%+ de tests funcionales rotos
- Tests de lógica de negocio fallando
- Cambios en APIs/contratos de datos
- Pérdida de funcionalidad core
- Tests de integración sistémica rotos

### **✅ CAMBIOS NORMALES (Actualizar tests)**

- Tests de formato/presentación rotos
- Cambios en estructura HTML semántica
- Mejoras de accesibilidad
- Refactoring de componentes UI
- 10-20% de tests visuales afectados

---

## 📚 **Referencias y Recursos**

### **Testing Library Best Practices**

- [Testing Library Queries Priority](https://testing-library.com/docs/queries/about/#priority)
- [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### **Accessibility Testing**

- [ARIA Roles Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)

### **Supply Chain Tracker Context**

- [ADR 008: Dashboard-Centric Token Management](../adr/008-dashboard-centric-token-management-strategy.md)
- [TDD Methodology](./METODOLOGY_PROMPT.md)

---

## 🔄 **Mantenimiento de este Documento**

**Actualizar cuando**:

- Nuevos patrones de testing emerjan
- Cambios significativos en la arquitectura UI
- Herramientas de testing evolucionen
- Lecciones aprendidas de futuras implementaciones

**Responsabilidad**:

- QA Engineers: Mantener estrategias actualizadas
- Developers: Reportar patrones problemáticos
- Tech Leads: Revisar y aprobar cambios

---

_Este documento está basado en el análisis del rediseño visual implementado en Supply Chain Tracker (octubre 2025) y las mejores prácticas de testing establecidas por Testing Library y la comunidad React._
