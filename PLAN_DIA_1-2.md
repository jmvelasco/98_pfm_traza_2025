# 📅 Plan Día 1-2: Configuración Base del Frontend (React + Vite)

## 🎯 Objetivo

Establecer la base del frontend para la integración Web3, asegurando la correcta configuración del contrato inteligente y la estructura del proyecto React + Vite.

---

## 1. Inicializar el Proyecto Web

- Crear el proyecto frontend en el directorio `web/` usando Vite + React + TypeScript:
  ```bash
  cd supply-chain-tracker
  npm create vite@latest web -- --template react-ts
  cd web
  npm install
  # Instalar dependencias necesarias
  npm install ethers@^6 react-router-dom tailwindcss @radix-ui/react-toast
  npx tailwindcss init -p

---

## 📦 Dependencias Principales y Opcionales

**Obligatorias para la DApp:**
- `react`, `react-dom`, `typescript` (core, ya incluidas por Vite)
- `ethers@^6` (interacción con Ethereum/Web3, usar siempre la documentación de ethers v6: https://docs.ethers.org/v6/)
- `react-router-dom` (routing SPA)
- `tailwindcss` (estilos utilitarios)
- `@types/react`, `@types/react-dom`, `@types/react-router-dom` (tipos para TypeScript)

**Opcionales/recomendadas para UI moderna:**
- `@radix-ui/react-toast` (notificaciones accesibles, puedes sustituirla por otra si lo prefieres)
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu` (modales y menús accesibles, opcional)
- `clsx` o `classnames` (utilidad para clases condicionales)
- `shadcn/ui` (colección de componentes UI basada en Radix, opcional)

**Para generación de tipos del contrato:**
- `typechain` (genera tipos TypeScript a partir del ABI)
- `@typechain/ethers-v6` (plugin para ethers v6)
- `ts-node` (si usas scripts de generación)


## 2. Crear el Directorio de Configuración

```text
supply-chain-tracker/
├── sc/                          # (Ya existente)
├── web/                         # Frontend React + Vite
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── ui/             # Componentes base (shadcn/ui)
│   │   │   ├── Header.tsx
│   │   │   ├── TokenCard.tsx
│   │   │   ├── TransferList.tsx
│   │   │   └── UserTable.tsx
│   │   ├── contexts/           # Contexts de React
│   │   │   └── Web3Context.tsx
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useWallet.ts
│   │   ├── lib/              # Servicios y utilidades
│   │   │   └── web3.ts
│   │   ├── config/           # Configuración
│   │   │   └── contracts.ts  # ABI y direcciones
│   │   ├── pages/           # Componentes de página
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tokens.tsx
│   │   │   ├── TokenCreate.tsx
│   │   │   └── ...
│   │   ├── App.tsx          # Componente principal
│   │   ├── main.tsx         # Punto de entrada
│   │   └── routes.tsx       # Configuración de rutas
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## 3. Generar los Tipos TypeScript del Contrato

- Usar herramientas como `typechain` o scripts personalizados para generar los tipos a partir del ABI de `SupplyChain.sol`.
- Guardar los tipos generados en `web/src/types/` o junto al ABI en `web/src/config/`.

---

## 4. Crear el Archivo de Configuración del Contrato

- Crear `web/src/config/contracts.ts` con:
  - Dirección del contrato desplegado (por ejemplo, `0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519`)
  - ABI del contrato (copiado desde `sc/out/SupplyChain.sol/SupplyChain.json`)
  - Admin address (por ejemplo, `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
  - Configuración de red (chainId: 31337, nombre: 'Anvil Local')

```typescript
// web/src/config/contracts.ts
export const CONTRACT_CONFIG = {
  address: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519",
  abi: [/* ... ABI ... */],
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
};

export const NETWORK_CONFIG = {
  chainId: 31337,
  name: "Anvil Local",
  rpcUrl: "http://localhost:8545"
};
```

---

## ✅ Resultado Esperado

- Proyecto React + Vite inicializado en `web/`
- Estructura de carpetas creada según lo propuesto
- Archivo de configuración del contrato listo para ser usado por el contexto Web3
- Tipos TypeScript del contrato generados y disponibles

---

> **Siguiente paso:** Revisar este archivo y, si todo es correcto, proceder con la implementación del contexto Web3 y la integración con MetaMask.
  
---
  
## 🚀 Instalación paso a paso (npm, ejecutar uno a uno)
  
Ejecuta los siguientes comandos desde la raíz del proyecto `supply-chain-tracker` o desde el directorio `web` según se indica. Ejecuta cada comando por separado (no los encadenes) y espera a que termine antes de lanzar el siguiente.
  
1) Ir al directorio del frontend:
  
```bash
cd supply-chain-tracker/web
```
  
2) (Opcional) Instalar dependencias definidas en `package.json` si aún no están instaladas:
  
```bash
npm install
```
  
3) Instalar dependencias runtime necesarias (ethers v6, router y utilidades):
  
```bash
npm install ethers@^6 react-router-dom clsx
```
  
4) Instalar dependencias de desarrollo (Tailwind, TypeChain y utilidades TS):
  
```bash
npm install -D tailwindcss postcss autoprefixer typechain @typechain/ethers-v6 ts-node typescript @types/react @types/react-dom @types/react-router-dom
```
  
5) Inicializar Tailwind (crea `tailwind.config.js` y `postcss.config.js`):
  
```bash
npx tailwindcss init -p
```

- ha fallado la inicialización y se ha realizado manualmente

  
6) (Opcional) Generar tipos TypeScript desde los ABIs compilados usando TypeChain. Desde `web/` apunta a los JSON en `../sc/out`:
  
```bash
npx typechain --target ethers-v6 --out-dir src/types ../sc/out/**/*.json
```
 - apuntar solo a los archivos que contienen un ABI válido:
    ```
    npx typechain --target ethers-v6 --out-dir src/types ../sc/out/SupplyChain.sol/SupplyChain.json
    ```
  
7) Regenerar (o generar) `web/src/config/contracts.ts` desde el ABI y la dirección de despliegue (script ya incluido en el repo):
  
```bash
# Desde la raíz del repo
node scripts/generate-contract-config.js

# O desde web/ (usa la ruta relativa al script)
node ../../scripts/generate-contract-config.js
```
  
8) (Recomendado) Añade un script npm en `web/package.json` para regenerar fácilmente el archivo de configuración:
  
```json
"scripts": {
  "regen:contracts": "node ../../scripts/generate-contract-config.js"
}
```
  
Notas finales:
- Ejecuta cada comando individualmente y revisa la salida por si hay errores.
- Después de generar los tipos (`src/types`) y el archivo `web/src/config/contracts.ts`, estarás listo para integrar el `Web3Context` y crear la instancia del contrato con `ethers` v6.
- Si prefieres usar `pnpm` en otro momento, puedo adaptar los comandos. Ahora hemos especificado `npm` tal y como pediste.
  

