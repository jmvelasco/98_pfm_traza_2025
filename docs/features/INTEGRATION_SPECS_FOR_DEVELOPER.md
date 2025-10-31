# Especificaciones de Desarrollo: Integración Directa Supply Chain Widget

## 🎯 De: Experto UX + Analista → Para: Developer

### ⚠️ NOTA CRÍTICA

**Es inadmisible que los roles Consumer y Retailer no estén implementados sin haberlo mencionado o preguntado. Esta implementación debe ser completa y de alta calidad siguiendo las mejores prácticas modernas.**

---

## 📋 Resumen Ejecutivo

**Objetivo**: Implementar **Opción A: Integración Directa** reemplazando el widget header actual con la versión premium y eliminando la página separada.

**Scope**:

- Integración completa del widget premium en el header
- Implementación faltante de roles Consumer y Retailer
- Badge de rol integrado en componente Wallet
- Refactoring a arquitectura moderna y modular

---

## 🏗️ Arquitectura Requerida

### 1. **Eliminación de Página Dedicada**

```bash
# Archivos a ELIMINAR:
- src/pages/SupplyChainDashboard.tsx
- Ruta /supply-chain-dashboard de AppRoutes.tsx
- CTA button del header widget actual
```

### 2. **Reemplazo del Widget Header**

```bash
# Archivo a MODIFICAR:
- src/components/layout/SupplyChainOverview.tsx
# ACCIÓN: Reemplazar completamente con SupplyChainOverviewPremium
```

### 3. **Integración en Wallet Component**

```bash
# Archivo a MODIFICAR:
- src/components/wallet/[WalletComponent].tsx
# ACCIÓN: Agregar badge de rol con address display
```

---

## 🎨 Especificaciones UX

### **Header Widget Integrado**

#### Layout Requirements:

```typescript
interface HeaderWidgetLayout {
  maxHeight: "400px"; // Scrollable si excede
  maxWidth: "100%"; // Responsive
  dropdownPosition: "right"; // Alineado a la derecha del header
  showCloseButton: true; // X para cerrar dropdown
  backdropClick: "close"; // Cerrar al hacer click fuera
  animation: "slideDown"; // Entrada suave
}
```

#### Content Priority (orden de importancia):

1. **Métricas principales** (siempre visible)
2. **Inventario/Stock actual** (plegable si es necesario)
3. **Transferencias pendientes** (plegable si es necesario)
4. **Eventos recientes** (opcional, se oculta si falta espacio)

### **Badge de Rol en Wallet**

#### Design Specs:

```typescript
interface RoleBadgeSpecs {
  position: "inline-with-address"; // Junto a la dirección Ethereum
  design: {
    background: "role-specific-color"; // Verde para Producer, etc.
    textColor: "high-contrast"; // Según análisis de accesibilidad
    borderRadius: "rounded-full"; // Pill shape
    padding: "px-3 py-1";
    fontSize: "text-sm";
    fontWeight: "font-medium";
  };
  displayFormat: "{role} • {address}"; // Ej: "Producer • 0x1234...5678"
}
```

---

## 💻 Especificaciones Técnicas de Desarrollo

### **1. Modernización de Código (OBLIGATORIO)**

#### ❌ PROHIBIDO - Patrones Obsoletos:

```typescript
// NO USAR React.FC
const Component: React.FC<Props> = ({ prop }) => { ... }

// NO USAR interfaces vacías sin propósito
interface EmptyProps {}

// NO USAR any o unknown sin justificación
const data: any = fetchData();
```

#### ✅ REQUERIDO - Patrones Modernos:

```typescript
// Usar function components directos
function Component({ prop }: Props) {
  return <div>{prop}</div>;
}

// Usar tipos específicos y estrictos
interface ComponentProps {
  readonly role: UserRole;
  readonly userAddress: `0x${string}`;
  readonly onClose?: () => void;
}

// Usar custom hooks para lógica
function useRoleSpecificData(role: UserRole, address: `0x${string}`) {
  // Implementation
}
```

### **2. Arquitectura Modular REQUERIDA**

#### Core Structure:

```typescript
// src/components/ui/SupplyChainWidget/
├── index.ts                     // Export principal
├── SupplyChainWidget.tsx        // Componente base
├── hooks/
│   ├── useRoleConfig.ts         // Configuración por rol
│   ├── useConsumerData.ts       // NUEVO - Data consumer
│   ├── useRetailerData.ts       // NUEVO - Data retailer
│   └── useRoleSpecificData.ts   // Coordinador general
├── components/
│   ├── MetricsPanel.tsx         // Reutilizable
│   ├── InventoryGrid.tsx        // Reutilizable
│   ├── TransferPipeline.tsx     // Ya existe, reutilizar
│   ├── ConsumerTraceability.tsx // NUEVO - Específico consumer
│   ├── RetailerSalesPanel.tsx   // NUEVO - Específico retailer
│   └── RoleBadge.tsx           // NUEVO - Para wallet
└── config/
    ├── roleConfigs.ts           // Configuraciones por rol
    ├── colorSchemes.ts          // Paletas de color
    └── types.ts                // Tipos específicos
```

### **3. Implementación de Roles Faltantes**

#### Consumer Role - Data Interface:

```typescript
interface ConsumerWidgetData {
  readonly purchases: readonly PurchaseRecord[];
  readonly totalPurchases: number;
  readonly activePurchases: number;
  readonly consumedPurchases: number;
  readonly uniqueRetailers: number;
  readonly traceabilityAverage: number;
}

interface PurchaseRecord {
  readonly tokenId: bigint;
  readonly name: string;
  readonly purchaseDate: Date;
  readonly retailerAddress: `0x${string}`;
  readonly status: "active" | "consumed";
  readonly traceabilityChain: readonly TraceabilityStep[];
}
```

#### Retailer Role - Data Interface:

```typescript
interface RetailerWidgetData {
  readonly inventory: readonly InventoryItem[];
  readonly salesMetrics: SalesMetrics;
  readonly supplierRelations: readonly SupplierRelation[];
  readonly pendingIncoming: readonly IncomingTransfer[];
  readonly pendingOutgoing: readonly OutgoingTransfer[];
}

interface InventoryItem {
  readonly tokenId: bigint;
  readonly name: string;
  readonly currentStock: bigint;
  readonly receivedFrom: `0x${string}`;
  readonly receivedAt: Date;
  readonly unitsSold: bigint;
  readonly availableForSale: bigint;
  readonly averageSaleTime: number;
}
```

### **4. Hooks Implementation Requirements**

#### useConsumerData Hook:

```typescript
function useConsumerData(address: `0x${string}`) {
  // IMPLEMENTAR:
  // 1. Fetch purchased tokens by consumer
  // 2. Calculate traceability chains
  // 3. Compute purchase statistics
  // 4. Real-time updates via events

  return {
    data: ConsumerWidgetData | null,
    isLoading: boolean,
    error: string | null,
    refresh: () => void
  };
}
```

#### useRetailerData Hook:

```typescript
function useRetailerData(address: `0x${string}`) {
  // IMPLEMENTAR:
  // 1. Fetch retailer inventory
  // 2. Calculate sales metrics
  // 3. Analyze supplier relationships
  // 4. Track pending transfers

  return {
    data: RetailerWidgetData | null,
    isLoading: boolean,
    error: string | null,
    refresh: () => void
  };
}
```

### **5. Integration Specifications**

#### Header Widget Replacement:

```typescript
// En src/components/layout/Header.tsx (o similar)
function Header() {
  return (
    <header className="...">
      <nav className="...">
        {/* Otros elementos del header */}
        {/* REEMPLAZAR SupplyChainOverview con: */}
        <SupplyChainWidgetDropdown />
        <WalletComponent /> {/* Incluir RoleBadge aquí */}
      </nav>
    </header>
  );
}
```

#### Wallet Component Enhancement:

```typescript
function WalletComponent() {
  const { address } = useWeb3();
  const { userInfo } = useUserInfo(address);

  return (
    <div className="flex items-center space-x-2">
      {/* Address display */}
      <code className="...">{formatAddress(address)}</code>

      {/* NUEVO: Role Badge */}
      {userInfo && <RoleBadge role={userInfo.role} />}

      {/* Wallet controls */}
      <WalletControls />
    </div>
  );
}
```

---

## 🧪 Testing Requirements

### **Unit Tests OBLIGATORIOS:**

```typescript
// src/components/ui/SupplyChainWidget/__tests__/
├── SupplyChainWidget.test.tsx
├── useConsumerData.test.tsx      // NUEVO
├── useRetailerData.test.tsx      // NUEVO
├── ConsumerTraceability.test.tsx // NUEVO
├── RetailerSalesPanel.test.tsx   // NUEVO
└── RoleBadge.test.tsx           // NUEVO
```

### **Integration Tests:**

- Header dropdown functionality
- Wallet badge integration
- Role switching scenarios
- Real-time updates
- Error states handling

---

## 📊 Quality Metrics

### **Code Quality Requirements:**

- ✅ **TypeScript strict mode**: Debe pasar sin warnings
- ✅ **ESLint compliance**: 0 errors, 0 warnings
- ✅ **Test coverage**: >90% en componentes nuevos
- ✅ **Performance**: <200ms render time
- ✅ **Accessibility**: WCAG AA compliance (ya implementado)

### **UX Quality Requirements:**

- ✅ **Responsive design**: Funcional en mobile/tablet/desktop
- ✅ **Loading states**: Skeleton loaders en todos los casos
- ✅ **Error handling**: Messages claros y actionables
- ✅ **Real-time updates**: Sin necesidad de refresh manual
- ✅ **Smooth animations**: Transiciones de <300ms

---

## ⏰ Timeline y Deliverables

### **Fase 1: Preparación (2 horas)**

- [ ] Análisis de código actual
- [ ] Setup de nueva estructura modular
- [ ] Eliminación de página dedicada

### **Fase 2: Core Implementation (8 horas)**

- [ ] Consumer role complete implementation
- [ ] Retailer role complete implementation
- [ ] Modular architecture refactoring
- [ ] Modern practices upgrade

### **Fase 3: Integration (4 horas)**

- [ ] Header widget replacement
- [ ] Wallet badge integration
- [ ] Route cleanup
- [ ] Cross-component communication

### **Fase 4: Quality Assurance (3 horas)**

- [ ] Unit tests for new components
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Accessibility verification

### **Total Estimado: 17 horas**

---

## 🚨 Expectativas y Estándares

### **Calidad Esperada:**

- **Código**: Producción-ready, no prototipos
- **Tests**: Comprehensive coverage, edge cases incluidos
- **Documentación**: Inline comments y README updates
- **Performance**: Optimizado para real-time updates

### **Comunicación Requerida:**

- ✅ **Progress updates**: Cada 4 horas de trabajo
- ✅ **Blocker escalation**: Inmediato si hay impedimentos
- ✅ **Design questions**: Consultar UX antes de decidir solo
- ✅ **Code review**: Ready para review antes de merge

**Developer**: Esta especificación es completa y no hay excusas para entregas parciales o de baja calidad. La implementación debe ser integral, moderna y robusta. No seas vago - haz el trabajo completo que se requiere para un producto profesional.

---

_Especificación creada por: Experto UX + Analista | Para: Developer_  
_Fecha: 30 octubre 2025 | Proyecto: Supply Chain Tracker Integration_
