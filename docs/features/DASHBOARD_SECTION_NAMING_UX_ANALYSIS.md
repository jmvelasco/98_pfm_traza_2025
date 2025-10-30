# 🎯 UX ANALYSIS: Section Naming Strategy per Role - Dashboard Optimization

## 📊 **Current State Analysis**

### **Actual Implementation**

- **Current title**: "Assets" (línea 152, Dashboard.tsx)
- **Previous title**: "My Tokens" (visible en tests fallidos)
- **Content**: MyTokens component showing owned tokens with balances and metadata

---

## 🧠 **UX Expert Assessment**

### ✅ **"Assets" - Strengths**

- ✅ **Generic and professional** - funciona para todos los roles
- ✅ **Financial/business terminology** - apropiado para supply chain context
- ✅ **Avoids technical jargon** - "tokens" puede confundir a usuarios no-crypto
- ✅ **Scalable** - funciona si en futuro se añaden otros tipos de assets

### ⚠️ **"Assets" - Potential Issues**

- ⚠️ **Too generic** - podría incluir equipos, propiedades, etc.
- ⚠️ **Lacks context specificity** - no refleja que son materiales/productos
- ⚠️ **Business ambiguity** - assets podría referirse a activos fijos

---

## 🎨 **Role-Specific Analysis & Recommendations**

### 🌾 **Producer Dashboard**

**Función**: Crea materias primas iniciales (parentId=0)
**Contenido mostrado**: Organic Wheat, Cotton, etc.

**🎯 Nombres recomendados**:

1. **"Raw Materials"** ⭐ ÓPTIMO
   - Específico al contexto del Producer
   - Clarifica que son materias primas base
   - Align con terminología supply chain
2. **"Materials"** ✅ Alternativa sólida
3. **"Inventory"** ✅ Profesional pero menos específico

### 🏭 **Factory Dashboard**

**Función**: Recibe materias primas + crea productos procesados (parentId>0)
**Contenido mostrado**: Raw materials recibidas + productos procesados creados

**🎯 Nombres recomendados**:

1. **"Production"** ⭐ ÓPTIMO
   - Refleja su rol de transformación
   - Incluye tanto inputs como outputs
   - Terminology familiar para factories
2. **"Materials & Products"** ✅ Descriptivo pero largo
3. **"Inventory"** ✅ Genérico profesional

### 🏪 **Retailer Dashboard**

**Función**: Recibe productos + crea unidades retail (packaging)
**Contenido mostrado**: Productos recibidos + retail units empaquetados

**🎯 Nombres recomendados**:

1. **"Inventory"** ⭐ ÓPTIMO
   - Término estándar en retail
   - Cubre productos recibidos y empaquetados
   - Familiar para retailers
2. **"Products"** ✅ Simple y claro
3. **"Stock"** ✅ Alternativa retail-friendly

### 🛒 **Consumer Dashboard**

**Función**: Recibe productos finales, NO crea tokens
**Contenido mostrado**: Productos adquiridos (solo recepción)
**Título actual**: "Products" (línea 114, Dashboard.tsx) ✅

**🎯 Evaluación**:

- **"Products"** es PERFECTO para Consumer ⭐
- Refleja que son productos adquiridos finales
- No genera confusión sobre capacidad de creación
- **NO necesita cambio**

---

## 🔄 **Estrategia de Implementación Recomendada**

### **Opción 1: Role-Specific Titles (RECOMENDADA)**

```tsx
// Dynamic title based on role context
const getSectionTitle = (role: UserRole) => {
  switch (role) {
    case UserRole.Producer:
      return "Raw Materials";
    case UserRole.Factory:
      return "Production";
    case UserRole.Retailer:
      return "Inventory";
    case UserRole.Consumer:
      return "Products"; // Ya implementado
    default:
      return "Assets"; // fallback
  }
};
```

### **Opción 2: Universal Title Evolution**

Si se prefiere mantener consistencia visual:

1. **"Inventory"** - Término profesional que funciona para todos
2. **"Materials"** - Más específico al supply chain context
3. **"Assets"** (current) - Mantener si stakeholders prefieren consistency

---

## 🎯 **Recomendación Final**

### **⭐ RECOMENDACIÓN PRINCIPAL: Role-Specific Titles**

**Rationale**:

- **UX Clarity**: Cada rol ve terminología relevante a su contexto
- **Cognitive Load**: Reduce confusión sobre qué se puede hacer en esta sección
- **Professional Feel**: Usa vocabulario familiar para cada industria role
- **Scalability**: Permite future expansion con titles específicos

**Implementation Priority**: **HIGH**

- Impacto UX significativo
- Implementation simple (conditional rendering)
- Mejora comprehension inmediatamente

---

## 📋 **Developer Implementation Guide**

### **Files to Modify**:

1. **`src/pages/Dashboard.tsx`** - línea 152 (section title)
2. **Test files** - Update expectations para role-specific titles

### **Implementation Strategy**:

```tsx
// Add helper function
const getSectionTitle = (role: UserRole): string => {
  switch (role) {
    case UserRole.Producer:
      return "Raw Materials";
    case UserRole.Factory:
      return "Production";
    case UserRole.Retailer:
      return "Inventory";
    case UserRole.Consumer:
      return "Products";
    default:
      return "Assets";
  }
};

// Replace line 152
<h2 className="text-xl font-semibold text-blue-400 mb-4">
  {getSectionTitle(role)}
</h2>;
```

### **Testing Requirements**:

- Update failing tests que buscan "My Tokens"
- Add tests for role-specific titles
- Verify Consumer section remains "Products"

---

## 💡 **Additional UX Enhancements (Future)**

1. **Contextual Icons** per role:

   - Producer: 🌾 Raw Materials
   - Factory: 🏭 Production
   - Retailer: 📦 Inventory
   - Consumer: 🛒 Products

2. **Descriptive Subtitles**:
   - Producer: "Materials you've created"
   - Factory: "Received materials and produced items"
   - Retailer: "Products and packaged units"
   - Consumer: "Your acquired products"

---

**Created**: 30 octubre 2025  
**Priority**: HIGH (UX Impact)  
**Effort**: LOW (Simple conditional logic)  
**Risk**: MINIMAL (Non-breaking change)
