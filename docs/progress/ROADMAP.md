# ROADMAP_ACTUALIZADO.md

## Resumen Ejecutivo

**Logros principales:**

- El contrato inteligente `SupplyChain.sol` está implementado según la especificación de `SMART_CONTRACT.md`, con todos los structs, enums, mappings, modificadores y eventos requeridos.
- Persistencia Web3, eventos MetaMask, servicio Web3 y hook useWallet completados y testeados (20/20 tests).
- Registro de usuario en Home, gestión de roles y panel Admin Users implementados con TDD, cobertura completa (31/31 tests).
- Dashboard Productor: MyTokens en tiempo real y feedback de mint implementados, deduplicación y cleanup robustos, 62/62 tests pasando.
- Ethers v6-only, integración blockchain y UI/UX con feedback visual y componentes limpios.

**Inconsistencias detectadas:**

- La migración a ERC-1155 para balances de tokens está planificada pero no implementada (ver TODO.md en la documentación del smart contract(sc)).
- El contrato actual usa strings para roles en vez de enums, lo que afecta eficiencia de gas (recomendación en SMART_CONTRACT.md en la documentación del smart contract(sc)).
- Las páginas de gestión de tokens (/tokens, /tokens/create, /tokens/[id]) y transferencias dirigidas aún no están implementadas, aunque están planificadas y mencionadas como siguientes pasos.
- Trazabilidad completa por parentId y árbol/lineage en UI pendiente.
- Documentación IA (IA.md) y demo final aún no iniciadas.

**Estado general:**

- El proyecto avanza conforme al README y ROADMAP, con las funcionalidades base y paneles principales completados y testeados. Las funcionalidades avanzadas de tokens, transferencias y trazabilidad están pendientes pero planificadas para la siguiente fase antes del 31/oct.

---

## ✅ Producer Code-Level Checklist

### 1. Mint Raw Material Token

- [✅ DONE] Producer can call `createToken(name, totalSupply, features, parentId=0)`
- [✅ DONE] Only users with Producer role and Approved status can mint raw materials
- [✅ DONE] Token metadata (name, features) is stored and retrievable
- [✅ DONE] Event emitted on token creation for traceability

### 2. View Owned Tokens

- [✅ DONE] Producer can query all tokens they own (function like `getTokensByOwner(address)`)
- [✅ DONE] Token details (metadata, balances) are accessible

### 3. Transfer Token to Factory

- [✅ DONE] Producer can initiate transfer of owned token to Factory (function like `transferToken(tokenId, toAddress)`)
- [✅ DONE] Transfer is only allowed to valid Factory addresses
- [✅ DONE] Transfer event emitted for traceability
- [? PENDING] Token ownership updates correctly

NOTE: Search for UI polish proposals along this section implementation:

- Create Raw Material validation process should be the same as Transfer to Factory validation process (submit button disabled)
- Action cards has the same height and the submit button aligned to the bottom

### 4. Role and Access Control

- [✅ DONE] All Producer actions are protected by `onlyApprovedUser` and role checks
- [✅ DONE] Unauthorized users cannot mint or transfer tokens

### 5. Traceability

- [✅ DONE] Each token has a `parentId` (raw materials: `parentId=0`)
- [✅ DONE] Transfer history is recorded (events or mapping)
- [❌ PENDING] Functions exist to retrieve token lineage (for traceability UI)

### 6. Testing

- [✅ DONE] Unit tests for Producer minting, viewing, and transferring tokens
- [✅ DONE] Tests for access control and edge cases (e.g., double transfer, invalid recipient)
- [✅ DONE] Tests for pending transfers pagination (SC + frontend)
- [✅ DONE] TransferForm validations tests

### 7. Frontend Integration

- [✅ DONE] Dashboard actions for Producer trigger correct contract functions
- [✅ DONE] UI feedback for success/failure of mint and transfer actions
- [✅ DONE] Pending transfers list with pagination in Producer dashboard
- [✅ DONE] TransferForm with validations (address, role, balance)
- [✅ DONE] Empty states and loading spinners

---

## ✅ Factory Code-Level Checklist

### 1. Process Materials

- [❌ PENDING] Factory can process raw material tokens (consume/mutate tokens with `parentId=0`)
- [❌ PENDING] Only users with Factory role and Approved status can process materials
- [❌ PENDING] New product tokens created with `parentId` referencing consumed raw material
- [❌ PENDING] Event emitted on product creation for traceability

### 2. View Owned Tokens

- [❌ PENDING] Factory can query all tokens they own
- [❌ PENDING] Token details (metadata, balances) are accessible

### 3. Transfer Token to Retailer

- [❌ PENDING] Factory can transfer owned product tokens to Retailer
- [❌ PENDING] Transfer is only allowed to valid Retailer addresses
- [❌ PENDING] Transfer event emitted for traceability
- [❌ PENDING] Token ownership updates correctly

### 4. Role and Access Control

- [❌ PENDING] All Factory actions are protected by `onlyApprovedUser` and role checks

### 5. Traceability

- [❌ PENDING] Each product token has a `parentId` referencing its raw material
- [❌ PENDING] Transfer history is recorded
- [❌ PENDING] Functions exist to retrieve token lineage

### 6. Testing

- [❌ PENDING] Unit tests for Factory processing, viewing, and transferring tokens
- [❌ PENDING] Tests for access control and edge cases

### 7. Frontend Integration

- [❌ PENDING] Dashboard actions for Factory trigger correct contract functions
- [❌ PENDING] UI feedback for success/failure

---

## ✅ Retailer Code-Level Checklist

### 1. Package Products

- [❌ PENDING] Retailer can package product tokens (consume/mutate tokens with `parentId>0`)
- [❌ PENDING] Only users with Retailer role and Approved status can package products
- [❌ PENDING] New packaged tokens created with `parentId` referencing processed product
- [❌ PENDING] Event emitted on packaging for traceability

### 2. View Owned Tokens

- [❌ PENDING] Retailer can query all tokens they own
- [❌ PENDING] Token details (metadata, balances) are accessible

### 3. Transfer Token to Consumer

- [❌ PENDING] Retailer can transfer packaged tokens to Consumer
- [❌ PENDING] Transfer is only allowed to valid Consumer addresses
- [❌ PENDING] Transfer event emitted for traceability
- [❌ PENDING] Token ownership updates correctly

### 4. Role and Access Control

- [❌ PENDING] All Retailer actions are protected by `onlyApprovedUser` and role checks

### 5. Traceability

- [❌ PENDING] Each packaged token has a `parentId` referencing its product
- [❌ PENDING] Transfer history is recorded
- [❌ PENDING] Functions exist to retrieve token lineage

### 6. Testing

- [❌ PENDING] Unit tests for Retailer packaging, viewing, and transferring tokens
- [❌ PENDING] Tests for access control and edge cases

### 7. Frontend Integration

- [❌ PENDING] Dashboard actions for Retailer trigger correct contract functions
- [❌ PENDING] UI feedback for success/failure

---

## ✅ Consumer Code-Level Checklist

### 1. View My Products

- [❌ PENDING] Consumer can view all tokens they own
- [❌ PENDING] Token details (metadata, balances) are accessible

### 2. Check Traceability

- [❌ PENDING] Consumer can view full traceability (parentId lineage) of owned tokens
- [❌ PENDING] Functions exist to retrieve and display token history

### 3. Role and Access Control

- [❌ PENDING] All Consumer actions are protected by `onlyApprovedUser` and role checks

### 4. Testing

- [❌ PENDING] Unit tests for Consumer viewing and traceability
- [❌ PENDING] Tests for access control and edge cases

### 5. Frontend Integration

- [❌ PENDING] Dashboard actions for Consumer trigger correct contract functions
- [❌ PENDING] UI feedback for success/failure

---

## ✅ Admin Code-Level Checklist

### 1. Manage Users

- [✅ DONE] Admin can view all users and their roles/statuses
- [✅ DONE] Admin can approve or reject user role requests
- [✅ DONE] Only Admin can call user management functions

### 2. System Statistics

- [❌ PENDING] Admin can view system-wide statistics (number of tokens, transfers, users per role, etc.)

### 3. Role and Access Control

- [✅ DONE] All Admin actions are protected by `onlyAdmin` checks

### 4. Testing

- [✅ DONE] Unit tests for Admin user management and statistics
- [✅ DONE] Tests for access control and edge cases

### 5. Frontend Integration

- [✅ DONE] Dashboard actions for Admin trigger correct contract functions
- [✅ DONE] UI feedback for success/failure

---
