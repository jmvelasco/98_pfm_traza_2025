# Análisis de Datos Específicos por Rol - Supply Chain Widget

## Contexto

Análisis para optimizar la reutilización de código en el widget premium, definiendo qué información específica necesita cada rol y qué puede ser común.

## Roles Actualmente Implementados vs Faltantes

### ✅ Producer (Implementado)

- Tokens creados por el usuario
- Producción total acumulada
- Transferencias pendientes salientes
- Stock disponible por token
- Histórico de transferencias realizadas

### ✅ Factory (Implementado)

- Materias primas recibidas (stock)
- Productos procesados creados
- Eficiencia de procesamiento (ratio)
- Materiales disponibles para procesar
- Productos pendientes de transferir

### ❌ Retailer (NO IMPLEMENTADO)

**Información esperada:**

- Productos recibidos de fábricas (inventario)
- Ventas realizadas a consumidores
- Stock disponible por producto
- Transferencias pendientes (entrantes/salientes)
- Rotación de inventario
- Proveedores (fábricas) activos

### ❌ Consumer (NO IMPLEMENTADO)

**Información esperada:**

- Productos adquiridos (historial de compras)
- Trazabilidad completa de productos
- Proveedores en la cadena (Retailer → Factory → Producer)
- Estado de productos (activos/consumidos)
- Certificaciones/validaciones de autenticidad

### 🔧 Admin (Parcialmente implementado)

**Información adicional requerida:**

- Estadísticas globales del sistema
- Usuarios registrados por rol
- Transferencias totales en el sistema
- Tokens totales creados
- Actividad reciente del sistema

## Análisis de Reutilización de Código

### 🟢 Componentes Completamente Reutilizables (90%+)

#### 1. **Estructura Base del Widget**

```typescript
interface BaseWidgetStructure {
  header: {
    title: string;
    subtitle: string;
    lastUpdated: Date;
    realTimeIndicator: boolean;
  };
  metricsPanel: {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    metrics: MetricItem[];
  };
  contentSections: ContentSection[];
  footer?: {
    realTimeEvents: Event[];
    actionButtons?: ActionButton[];
  };
}
```

#### 2. **Sistema de Métricas**

```typescript
interface MetricItem {
  label: string;
  value: string | number;
  icon?: string;
  colorScheme: "primary" | "success" | "warning" | "info";
}
```

#### 3. **Pipeline de Transferencias**

- Componente TransferPipeline es 100% reutilizable
- Solo cambian los filtros de datos (entrantes/salientes por rol)

### 🟡 Componentes Configurables (70% reutilización)

#### 1. **Secciones de Inventario/Stock**

```typescript
interface InventorySection {
  title: string;
  items: InventoryItem[];
  displayMode: "grid" | "list";
  itemRenderer: (item: InventoryItem) => JSX.Element;
}

interface InventoryItem {
  id: string;
  name: string;
  primaryMetric: { label: string; value: number; color: string };
  secondaryMetrics: Array<{ label: string; value: number; color?: string }>;
  metadata?: Record<string, any>;
}
```

### 🔴 Componentes Específicos por Rol (30% reutilización)

#### 1. **Traceability Component (Consumer)**

- Visualización de cadena completa de un producto
- Árbol genealógico de tokens
- Validaciones de autenticidad

#### 2. **Processing Efficiency (Factory)**

- Cálculos específicos de transformación
- Ratios de materias primas a productos

#### 3. **Sales Analytics (Retailer)**

- Métricas de ventas y rotación
- Análisis de demanda por producto

## Estrategia de Implementación Recomendada

### 🎯 Arquitectura Modular

```typescript
// Estructura base completamente reutilizable
const SupplyChainWidget: React.FC<SupplyChainWidgetProps> = ({
  role,
  userAddress,
}) => {
  const config = useRoleConfig(role);
  const data = useRoleSpecificData(role, userAddress);

  return (
    <BaseWidget config={config}>
      <MetricsPanel metrics={data.metrics} colorScheme={config.colorScheme} />
      <ContentGrid sections={data.contentSections} />
      <TransferPipeline transfers={data.transfers} />
      {config.hasSpecialFeatures && (
        <SpecialFeaturesRenderer role={role} data={data} />
      )}
    </BaseWidget>
  );
};

// Configuración por rol
const roleConfigs: Record<UserRole, RoleConfig> = {
  Producer: {
    colorScheme: "green",
    title: "Panel Productor",
    metricsLayout: "standard",
    contentSections: ["created-tokens", "pending-transfers"],
    hasSpecialFeatures: false,
  },
  Factory: {
    colorScheme: "blue",
    title: "Panel Fábrica",
    metricsLayout: "efficiency",
    contentSections: ["raw-materials", "processed-products"],
    hasSpecialFeatures: true, // Para efficiency calculator
  },
  Retailer: {
    colorScheme: "purple",
    title: "Panel Minorista",
    metricsLayout: "inventory",
    contentSections: ["inventory", "sales", "suppliers"],
    hasSpecialFeatures: true, // Para sales analytics
  },
  Consumer: {
    colorScheme: "orange",
    title: "Panel Consumidor",
    metricsLayout: "purchases",
    contentSections: ["purchases", "traceability"],
    hasSpecialFeatures: true, // Para traceability tree
  },
  Admin: {
    colorScheme: "gray",
    title: "Panel Administrador",
    metricsLayout: "system",
    contentSections: ["system-stats", "user-activity", "recent-activity"],
    hasSpecialFeatures: true, // Para system analytics
  },
};
```

### 📊 Datos Específicos por Rol

#### Consumer Data Structure

```typescript
interface ConsumerWidgetData {
  purchases: Array<{
    tokenId: bigint;
    name: string;
    purchaseDate: Date;
    retailer: string;
    status: "active" | "consumed";
    traceabilityChain: {
      producer: { address: string; name: string; createdAt: Date };
      factory: { address: string; name: string; processedAt: Date };
      retailer: { address: string; name: string; soldAt: Date };
    };
  }>;
  totalPurchases: number;
  activePurchases: number;
  consumedPurchases: number;
  uniqueRetailers: number;
  avgTraceabilityDepth: number;
}
```

#### Retailer Data Structure

```typescript
interface RetailerWidgetData {
  inventory: Array<{
    tokenId: bigint;
    name: string;
    currentStock: bigint;
    receivedFrom: string; // Factory address
    receivedAt: Date;
    unitsSold: bigint;
    availableForSale: bigint;
    averageSaleTime: number; // días
  }>;
  salesMetrics: {
    totalSales: number;
    salesThisMonth: number;
    inventoryTurnover: number;
    topSellingProducts: Array<{ name: string; units: number }>;
  };
  supplierRelations: Array<{
    factoryAddress: string;
    productsReceived: number;
    lastDelivery: Date;
    reliability: number; // 0-1
  }>;
  pendingIncoming: Array<TransferFromFactory>;
  pendingOutgoing: Array<TransferToConsumer>;
}
```

## Conclusiones para el Developer

### ✅ Alta Reutilización Posible (85%)

- **Estructura base**: 100% reutilizable
- **Sistema de métricas**: 100% reutilizable
- **Transfer pipeline**: 100% reutilizable
- **Inventory grids**: 90% reutilizable (solo cambian renderers)
- **Color schemes**: 100% reutilizable via configuración

### 🎯 Implementación Requerida

1. **Completar Consumer y Retailer roles** (crítico)
2. **Refactorizar a arquitectura modular** con configuración por rol
3. **Eliminar React.FC** y usar modern practices
4. **Crear hooks específicos** para cada tipo de datos
5. **Sistema de configuración** centralizado por rol

### 📋 Estimación de Esfuerzo

- **Refactoring base**: 2-3 horas
- **Consumer implementation**: 4-5 horas
- **Retailer implementation**: 4-5 horas
- **Admin enhancements**: 2 horas
- **Testing & polish**: 2-3 horas
- **Total**: ~15-18 horas

La alta reutilización justifica completamente la inversión en hacer la implementación completa y de calidad.
