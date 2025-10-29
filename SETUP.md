# 🚀 Supply Chain Tracker - Setup Guide

Esta guía te llevará paso a paso desde una instalación limpia hasta tener el proyecto completamente funcional.

## 📋 Prerequisitos del Sistema

### 1. Verificar Node.js (versión 18 o superior)

```bash
node --version
npm --version
```

**Resultado esperado:**

```
v20.19.0 (o superior)
10.8.2 (o superior)
```

### 2. Verificar Git

```bash
git --version
```

**Resultado esperado:**

```
git version 2.50.1 (o superior)
```

### 3. Instalar Foundry

Verificar si ya está instalado:

```bash
forge --version
```

Si no está instalado, ejecutar:

```bash
# Descargar e instalar foundryup
curl -L https://foundry.paradigm.xyz | bash

# Cargar la configuración en el shell actual
source ~/.zshenv

# Instalar las herramientas de Foundry
foundryup
```

Verificar instalación:

```bash
forge --version && anvil --version
```

**Resultado esperado:**

```
forge Version: 1.4.3-stable (o superior)
anvil Version: 1.4.3-stable (o superior)
```

## 🛠️ Configuración del Proyecto

### 4. Configurar Smart Contracts

```bash
# Ir al directorio de smart contracts
cd supply-chain-tracker/sc

# Instalar dependencias de Foundry
forge install

# Compilar contratos
forge build

# Ejecutar tests (verificación)
forge test
```

**Resultado esperado en forge test:**

```
Ran 27 tests for test/SupplyChain.t.sol:SupplyChainTest
[PASS] testAcceptTransferMovesBalance() (gas: 706271)
[PASS] testAdminApproveUser() (gas: 148284)
...
Suite result: ok. 27 passed; 0 failed; 0 skipped
```

### 5. Configurar Frontend

```bash
# Ir al directorio del frontend
cd ../web

# Instalar dependencias de Node.js
npm install
```

**Nota:** Es normal que aparezcan algunos warnings. El comando `npm run build` puede fallar debido a tests en desarrollo, pero esto no afecta el setup inicial.

## 🔗 Configuración de Blockchain Local

### 6. Iniciar Anvil (Terminal 1)

⚠️ **IMPORTANTE:** Este terminal debe mantenerse abierto durante todo el desarrollo.

```bash
# Desde el directorio sc/
cd supply-chain-tracker/sc
anvil
```

**Resultado esperado:**

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...

Chain ID: 31337
Listening on 127.0.0.1:8545
```

### 7. Desplegar Smart Contract (Terminal 2)

En un **nuevo terminal**:

```bash
# Ir al directorio de smart contracts
cd supply-chain-tracker/sc

# Desplegar el contrato
forge script script/Deploy.s.sol:DeploySupplyChain \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Resultado esperado:**

```
== Logs ==
  Deployed SupplyChain at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

⚠️ **IMPORTANTE:** Anota la dirección del contrato desplegado (será diferente en cada deploy).

### 8. Sincronizar Configuración Frontend (Terminal 3)

En un **nuevo terminal**:

```bash
# Ir al directorio del frontend
cd supply-chain-tracker/web

# Regenerar configuración del contrato
npm run regen:contracts
```

### 9. Iniciar Frontend (Terminal 4)

En un **nuevo terminal**:

```bash
# Desde el directorio web/
cd supply-chain-tracker/web

# Iniciar servidor de desarrollo
npm run dev
```

**Resultado esperado:**

```
Local:   http://localhost:5173/
Network: use --host to expose
```

## 🦊 Configuración de MetaMask

### 10. Agregar Red Local en MetaMask

1. Abrir MetaMask
2. Ir a Settings > Networks > Add Network
3. Configurar:
   - **Network Name:** `Anvil Local`
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`

### 11. Importar Cuentas de Prueba

Importar las siguientes private keys en MetaMask:

- **Admin:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Producer:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Factory:** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Retailer:** `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Consumer:** `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

### 12. Verificar Configuración

1. Abrir `http://localhost:5173` en el navegador
2. Conectar MetaMask con la cuenta Admin
3. Verificar que se puede acceder al panel de administración

## 📱 Roles y Cuentas Sugeridas

| Rol      | Dirección                                    | Private Key                                                          |
| -------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Admin    | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Producer | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Factory  | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| Retailer | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| Consumer | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

## ⚠️ Troubleshooting

### Error: "Connection refused" en deploy

- Verificar que Anvil esté ejecutándose en Terminal 1
- Comprobar que no hay otro proceso usando el puerto 8545

### Error: "MetaMask not detected"

- Instalar la extensión MetaMask en el navegador
- Asegurarse de estar conectado a la red "Anvil Local"

### Error: "Wrong network"

- Verificar que MetaMask esté conectado a Chain ID 31337
- Cambiar a la red "Anvil Local" en MetaMask

### Frontend no carga

- Verificar que `npm run dev` esté ejecutándose sin errores
- Comprobar que el puerto 5173 no esté ocupado
- Limpiar caché del navegador

## 🔄 Flujo de Desarrollo Diario

Para reanudar el desarrollo después del setup inicial:

1. **Iniciar Anvil:** `cd supply-chain-tracker/sc && anvil`
2. **Redesplegar contrato:** `forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast`
3. **Regenerar config:** `cd ../web && npm run regen:contracts`
4. **Iniciar frontend:** `npm run dev`

## ✅ Verificación Final

Después de completar todos los pasos, deberías poder:

- [ ] Acceder a `http://localhost:5173`
- [ ] Conectar MetaMask con diferentes cuentas
- [ ] Ver el dashboard correspondiente a cada rol
- [ ] Realizar operaciones básicas (registro, creación de tokens, transferencias)

---

**¡Setup completado!** 🎉

El proyecto está listo para desarrollo y testing.
