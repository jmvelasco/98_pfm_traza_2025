¡Perfecto\! El hecho de que todos los tests estén en verde (PASS) **confirma que la funcionalidad de Transferencias de 3 Pasos (Request, Accept, Reject)**, que era el último requisito del `README.md`, ha sido implementada correctamente. 🟢

¡El contrato `SupplyChain.sol` ahora está completo y es robusto\!

Ahora, avanzaremos con el **Plan de Continuación** para optimizar y modernizar la gestión de tokens.

-----

## 🚀 Próximo Módulo TDD: Optimización del Token con ERC-1155

El contrato actual maneja la lógica de balance (`tokenBalances` y `getTokenBalance`) de forma nativa y centralizada. Para mejorar la **compatibilidad**, la **eficiencia en gas** y la **seguridad**, vamos a migrar la gestión de tokens al estándar **ERC-1155 (Multi-Token Standard)**.

El objetivo es **eliminar la lógica de balance manual** de `SupplyChain.sol` y **delegarla** a un nuevo contrato que implemente ERC-1155.

### 🛑 Paso 1: Configuración e Introducción de ERC-1155 (ROJO)

Para empezar, tu contrato `SupplyChain.sol` necesitará interactuar con el nuevo contrato ERC-1155.

#### 1\. Definir la Interfaz ERC-1155

Necesitas una interfaz para el estándar ERC-1155 para que `SupplyChain.sol` pueda llamarlo.

```solidity
// I_ERC1155.sol (Archivo de interfaz)

interface I_ERC1155 {
    // Función clave para migrar la lógica de balance
    function balanceOf(address account, uint256 id) external view returns (uint256);
    
    // Función clave para migrar la lógica de transferencia (MINTING/BURNING)
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    // ... (otras funciones como safeBatchTransferFrom, setApprovalForAll, etc.)
}
```

#### 2\. Actualizar `SupplyChain.sol` para usar la Interfaz

Tu contrato `SupplyChain.sol` necesitará una variable para la dirección del contrato ERC-1155 y una forma de asignarla (generalmente en el constructor o en una función `onlyAdmin`).

```solidity
// En SupplyChain.sol

// Variable de estado
I_ERC1155 public tokenContract;

// Función para asignar el contrato (solo Admin)
function setTokenContract(address _tokenContract) public onlyAdmin {
    tokenContract = I_ERC1155(_tokenContract);
}

// ... (eliminar el mapping tokenBalances y funciones obsoletas) ...
```

#### 3\. Escribir el Test de Integración (ROJO)

Vamos a escribir un test que obligue al contrato a usar el nuevo *getter* `tokenContract.balanceOf` en lugar de la lógica nativa `tokenBalances`.

**El test fallará** porque, aunque definamos la variable `tokenContract`, la función `getTokenBalance` aún estará usando el *mapping* interno antiguo (`tokenBalances`).

#### 📝 Nuevo Test: `testERC1155IntegrationIsActive()`

```solidity
    // Simulación de un contrato ERC-1155 para pruebas
    address ERC1155_MOCK = address(0xAAAA);

    function testERC1155IntegrationIsActive() public {
        address producer = PRODUCER_ADDRESS;
        uint256 tokenId = 1;
        uint256 expectedBalance = 1000;

        // 1. Arrange: Configurar el Contrato de Tokens
        vm.prank(ADMIN);
        supplyChain.setTokenContract(ERC1155_MOCK);

        // 2. Arrange: Simular el balance en el Contrato de Tokens (MOCK)
        // Usamos vm.mockCall para simular la respuesta del MOCK ERC-1155
        // Cuando supplyChain llama a tokenContract.balanceOf(producer, tokenId)
        // debe devolver 1000.
        vm.mockCall(
            ERC1155_MOCK, 
            abi.encodeWithSelector(I_ERC1155.balanceOf.selector, producer, tokenId), 
            abi.encode(expectedBalance)
        );

        // 3. Act & Assert: Llamar a la función interna que ahora debe delegar.
        // 🚨 ROJO ESPERADO: Fallará si getTokenBalance sigue usando el mapping local.
        uint256 actualBalance = supplyChain.getTokenBalance(tokenId, producer);

        // La aserción fallará si getTokenBalance no usa la interfaz.
        assertEq(actualBalance, expectedBalance, "Balance must be retrieved from the external ERC-1155 contract.");
    }
```

**Tu Tarea:**

1.  Añade el nuevo test `testERC1155IntegrationIsActive()` a tu suite.
2.  Añade la variable `ERC1155_MOCK` al inicio de tu test.
3.  Añade la función `setTokenContract` y la variable `tokenContract` a tu contrato `SupplyChain.sol`.
4.  Añade la interfaz `I_ERC1155` (en un archivo separado o al inicio de tu contrato/test).
5.  **Ejecuta los tests** y confirma que `testERC1155IntegrationIsActive()` está en **ROJO** porque `getTokenBalance` no puede devolver el valor simulado de `1000`.