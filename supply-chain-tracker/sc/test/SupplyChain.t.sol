// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;

    // Cuentas de prueba predefinidas por Anvil
    address constant ADMIN =
        address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address constant PRODUCER_ADDRESS =
        address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant FACTORY_ADDRESS =
        address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant RETAILER_ADDRESS =
        address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address constant CONSUMER_ADDRESS =
        address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);

    function setUp() public {
        // 1. Decirle a Foundry que el próximo msg.sender será el ADMIN predefinido (0xf39...)
        vm.startPrank(ADMIN);

        // 2. Inicializa el contrato. Ahora msg.sender es ADMIN.
        supplyChain = new SupplyChain();

        // 3. Detener la suplantación de identidad.
        vm.stopPrank();
        // Verificar que el constructor haya configurado correctamente el admin
        assertEq(supplyChain.admin(), ADMIN, "Setup: Admin address mismatch.");
    }

    // Tests de gestión de usuarios
    function testUserRegistration() public {
        // 1. Arrange: Cambiamos el remitente a una dirección de prueba (Producer).
        vm.prank(PRODUCER_ADDRESS);

        // 2. Act: Llamamos a la función que aún no está implementada.
        supplyChain.requestUserRole("Producer");

        // 3. Assert
        // Verificamos que el usuario ahora esté en estado Pending.
        SupplyChain.User memory user = supplyChain.getUserInfo(
            PRODUCER_ADDRESS
        );

        assertEq(
            user.userAddress,
            PRODUCER_ADDRESS,
            "User address must match."
        );
        assertEq(
            uint8(user.status),
            uint8(SupplyChain.UserStatus.Pending),
            "User status must be Pending after request."
        );
        assertEq(
            keccak256(abi.encodePacked(user.role)),
            keccak256(abi.encodePacked("Producer")),
            "User role must be Producer."
        );
    }

    function testAdminApproveUser() public {
        address userToApprove = PRODUCER_ADDRESS;

        // 1. Arrange: El usuario solicita el rol.
        vm.prank(userToApprove);
        supplyChain.requestUserRole("Producer");

        // Verificamos que esté en Pending.
        SupplyChain.User memory userBefore = supplyChain.getUserInfo(
            userToApprove
        );
        assertEq(
            uint8(userBefore.status),
            uint8(SupplyChain.UserStatus.Pending),
            "Pre-condition: User must be Pending."
        );

        // 2. Act: El Admin aprueba la solicitud.
        vm.prank(ADMIN);
        supplyChain.changeStatusUser(
            userToApprove,
            SupplyChain.UserStatus.Approved
        );

        // 3. Assert: Verificamos que el estado del usuario haya cambiado a Approved.
        SupplyChain.User memory userAfter = supplyChain.getUserInfo(
            userToApprove
        );
        assertEq(
            uint8(userAfter.status),
            uint8(SupplyChain.UserStatus.Approved),
            "Post-condition: User status must be Approved."
        );
    }

    function testOnlyAdminCanChangeStatus() public {
        address nonAdmin = PRODUCER_ADDRESS;
        address userToChange = FACTORY_ADDRESS;

        // 1. Arrange: Factory solicita rol.
        vm.prank(userToChange);
        supplyChain.requestUserRole("Factory");

        // 2. Act & Assert (Revert esperado): Intentar cambiar el estado como un usuario NO-Admin
        vm.prank(nonAdmin);

        // Assert que la transacción revierta con el mensaje esperado del modificador 'onlyAdmin'.
        // Nota: Foundry revierte automáticamente si se usa 'expectRevert' con una llamada.
        vm.expectRevert("SupplyChain: Only admin can call this function.");
        supplyChain.changeStatusUser(
            userToChange,
            SupplyChain.UserStatus.Approved
        );
    }

    function testAdminRejectUser() public {
        address userToReject = RETAILER_ADDRESS;

        // 1. Arrange: Retailer solicita rol.
        vm.prank(userToReject);
        supplyChain.requestUserRole("Retailer");

        // Verificamos que esté en Pending.
        SupplyChain.User memory userBefore = supplyChain.getUserInfo(
            userToReject
        );
        assertEq(
            uint8(userBefore.status),
            uint8(SupplyChain.UserStatus.Pending),
            "Pre-condition: User must be Pending."
        );

        // 2. Act: El Admin rechaza la solicitud.
        vm.prank(ADMIN);
        supplyChain.changeStatusUser(
            userToReject,
            SupplyChain.UserStatus.Rejected
        );

        // 3. Assert: Verificamos que el estado del usuario haya cambiado a Rejected.
        SupplyChain.User memory userAfter = supplyChain.getUserInfo(
            userToReject
        );
        assertEq(
            uint8(userAfter.status),
            uint8(SupplyChain.UserStatus.Rejected),
            "Post-condition: User status must be Rejected."
        );
    }

    function testOnlyApprovedUsersCanOperate() public {
        address producer = PRODUCER_ADDRESS;

        // 1. Caso 1: Usuario No Registrado (ROJO esperado)
        vm.prank(producer);
        vm.expectRevert("SupplyChain: User not registered.");
        supplyChain.createToken("TokenName", 100, "{}", 0);

        // 2. Arrange: Registrar al usuario. Ahora está en PENDING.
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        // 3. Caso 2: Usuario PENDIENTE (ROJO esperado)
        vm.prank(producer);
        vm.expectRevert("SupplyChain: User not approved.");
        supplyChain.createToken("TokenName", 100, "{}", 0);

        // 4. Arrange: Admin aprueba al usuario.
        vm.prank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);

        // 5. Caso 3: Usuario APROBADO (VERDE esperado)
        vm.prank(producer);
        // We don't expect a revert, just a successful call
        supplyChain.createToken("TokenName", 100, "{}", 0);
        // Assert on a meaningful state change if the function returns void or something else
        // For example, check if the token count increased or if the token exists.
        assertTrue(
            supplyChain.nextTokenId() > 1,
            "Token should have been created."
        );
        /*
        // Original assertion - remove if createToken returns void
        assertTrue(
            supplyChain.createToken(),
            "Approved user must be able to operate."
        );
        */
    }

    function testCreateTokenByProducer() public {
        address producer = PRODUCER_ADDRESS;
        string memory tokenName = "Wheat Grain";
        uint256 initialSupply = 1000;
        string memory tokenFeatures = '{"country": "Spain", "year": 2025}';

        // 1. Arrange: El Producer solicita y es aprobado (Pre-condición de 'onlyApprovedUser').
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        vm.prank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);

        // 2. Act: El Producer crea el token de materia prima (parentId = 0).
        vm.prank(producer);
        // La función aún no está implementada, por lo que este test debería fallar.
        supplyChain.createToken(tokenName, initialSupply, tokenFeatures, 0);

        // 3. Assert (ROJO esperado inicialmente)
        uint256 tokenId = 1; // Primer token, id = 1

        // Verificamos el balance del creador y los detalles del token.
        assertEq(
            supplyChain.getTokenBalance(tokenId, producer),
            initialSupply,
            "Producer balance must equal initial supply."
        );

        // Verificamos los datos básicos del token usando getToken (que aún debemos implementar).
        (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            string memory features,
            uint256 parentId,

        ) = supplyChain.getToken(tokenId);

        assertEq(id, tokenId, "Token ID must be 1.");
        assertEq(creator, producer, "Creator must be Producer.");
        assertEq(totalSupply, initialSupply, "Total supply must match.");
        assertEq(parentId, 0, "Parent ID must be 0 for raw material.");
        assertEq(
            keccak256(abi.encodePacked(name)),
            keccak256(abi.encodePacked(tokenName)),
            "Token name must match."
        );
        assertEq(
            keccak256(abi.encodePacked(features)),
            keccak256(abi.encodePacked(tokenFeatures)),
            "Features must match."
        );
    }

    function testOnlyProducerCanCreateRawMaterial() public {
        address factory = FACTORY_ADDRESS;

        // 1. Arrange: Factory solicita y es aprobado.
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        vm.prank(ADMIN);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);

        // 2. Act & Assert (Revert esperado): Intentar crear materia prima (parentId = 0) como Factory.
        vm.prank(factory);
        vm.expectRevert(
            "SupplyChain: Only Producer can create raw material (parentId must be 0)."
        );
        supplyChain.createToken("Flour", 500, "{}", 0);
    }

    function testCreateTokenByFactory() public {
        address producer = PRODUCER_ADDRESS;
        address factory = FACTORY_ADDRESS;
        uint256 rawMaterialId = 1;
        uint256 rawSupply = 1000;
        uint256 derivedProductSupply = 500; // La Factory consumirá 500 para producir
        string memory derivedName = "Processed Flour";

        // 1. Arrange (Pre-condición de la Cadena de Suministro)

        // A. Aprobar Producer y Factory
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        vm.startPrank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        vm.stopPrank();

        // B. El Producer crea la materia prima (Raw Material)
        vm.prank(producer);
        supplyChain.createToken("Wheat", rawSupply, "{}", 0); // Token #1 creado con 1000 stock

        // 🟢 INYECCIÓN DE LA SOLUCIÓN: SIMULACIÓN DE TRANSFERENCIA DE STOCK
        // Para que la Factory pueda consumir 500, primero debe tener el stock de Token #1.
        vm.startPrank(ADMIN);
        // Transferir el stock del Producer (1000) al Factory.
        supplyChain.setTokenBalance(rawMaterialId, producer, 0); // Producer pierde 1000
        supplyChain.setTokenBalance(rawMaterialId, factory, rawSupply); // Factory gana 1000
        vm.stopPrank();

        // 2. Act: El Factory crea el producto derivado (parentId = 1).
        vm.prank(factory);
        supplyChain.createToken(
            derivedName,
            derivedProductSupply, // Consume 500 del stock que acaba de recibir
            "{}",
            rawMaterialId
        );

        // 3. Assert (VERDE esperado)
        uint256 derivedTokenId = 2; // Segundo token creado

        // Verificamos los datos básicos del token derivado
        (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            ,
            uint256 parentId,

        ) = supplyChain.getToken(derivedTokenId);

        assertEq(id, derivedTokenId, "Token ID must be 2.");
        assertEq(creator, factory, "Creator must be Factory.");
        assertEq(totalSupply, derivedProductSupply, "Total supply must match.");
        assertEq(parentId, rawMaterialId, "Parent ID must be 1.");
        assertEq(
            keccak256(abi.encodePacked(name)),
            keccak256(abi.encodePacked(derivedName)),
            "Token name must match."
        );

        // Verificamos el balance del token derivado
        assertEq(
            supplyChain.getTokenBalance(derivedTokenId, factory),
            derivedProductSupply,
            "Factory must own the derived supply."
        );

        // 🟢 NUEVO ASSERT DE LIMPIEZA: Verificar que el balance del token padre fue deducido
        // Balance esperado: 1000 (inicial) - 500 (consumido) = 500
        uint256 expectedRemainingRawSupply = rawSupply - derivedProductSupply;
        assertEq(
            supplyChain.getTokenBalance(rawMaterialId, factory),
            expectedRemainingRawSupply,
            "Raw material balance must be correctly deducted after production."
        );
    }

    function testCreateTokenByRetailer() public {
        address producer = PRODUCER_ADDRESS;
        address retailer = RETAILER_ADDRESS;
        uint256 rawMaterialId = 1;
        uint256 rawSupply = 1000;
        uint256 derivedProductSupply = 500; // El Retailer consumirá 500 para producir
        string memory derivedName = "Packaged Goods";

        // 1. Arrange: Configurar roles y crear token padre.

        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");

        vm.startPrank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        vm.stopPrank();

        // Aseguramos que el Producer ya tiene un token que transferir
        vm.prank(producer);
        supplyChain.createToken("Raw Plastic", rawSupply, "{}", 0); // Token #1 creado con 1000 stock

        // 🟢 INYECCIÓN DE LA SOLUCIÓN: SIMULACIÓN DE TRANSFERENCIA DE STOCK
        // El Retailer debe tener el balance del token padre (Token #1) para poder consumirlo.
        vm.startPrank(ADMIN);
        // Transferir el stock del Producer (1000) al Retailer.
        supplyChain.setTokenBalance(rawMaterialId, producer, 0); // Producer pierde 1000
        supplyChain.setTokenBalance(rawMaterialId, retailer, rawSupply); // Retailer gana 1000
        vm.stopPrank();

        // 2. Act: El Retailer crea el producto derivado (parentId = 1).
        vm.prank(retailer);
        supplyChain.createToken(
            derivedName,
            derivedProductSupply, // Consume 500 del stock que acaba de recibir
            "{}",
            rawMaterialId
        );

        // 3. Assert (VERDE esperado)
        uint256 derivedTokenId = 2; // Token derivado

        // Verificamos los datos básicos del token derivado
        (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            ,
            uint256 parentId,
            
        ) = supplyChain.getToken(derivedTokenId);

        assertEq(id, derivedTokenId, "Token ID must be 2.");
        assertEq(creator, retailer, "Creator must be Retailer.");
        assertEq(
            keccak256(abi.encodePacked(name)),
            keccak256(abi.encodePacked(derivedName)),
            "Token name must match."
        );
        assertEq(totalSupply, derivedProductSupply, "Total supply must match.");
        assertEq(parentId, rawMaterialId, "Parent ID must be 1.");

        // 🟢 NUEVO ASSERT DE LIMPIEZA: Verificar que el balance del token padre fue deducido
        // Balance esperado: 1000 (inicial) - 500 (consumido) = 500
        uint256 expectedRemainingRawSupply = rawSupply - derivedProductSupply;
        assertEq(
            supplyChain.getTokenBalance(rawMaterialId, retailer),
            expectedRemainingRawSupply,
            "Raw material balance must be correctly deducted after production."
        );
    }

    function testOnlyFactoryAndRetailerCanCreateDerivedTokens() public {
        address consumer = CONSUMER_ADDRESS;
        address producer = PRODUCER_ADDRESS;
        uint256 rawMaterialId = 1;

        // 1. Arrange: Aprobar Consumer, Producer.
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");

        vm.startPrank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        vm.stopPrank();

        // 2. Arrange: Crear token padre.
        vm.prank(producer);
        supplyChain.createToken("Raw Plastic", 1000, "{}", 0); // Token #1

        // 3. Act & Assert (ROJO esperado/fallo deseado): Intentar crear un token derivado como Consumer.
        vm.prank(consumer);

        // El Consumer NO es Producer, por lo que el require(rol != Producer) PASA.
        // Pero el test debe REVERTIR para forzar la implementación restrictiva.
        vm.expectRevert(
            "SupplyChain: Only Factory or Retailer can create derived products (parentId > 0)."
        );
        supplyChain.createToken("Consumer Item", 10, "{}", rawMaterialId);

        // 4. Verificación Implícita: Factory y Retailer (ya probados) deben seguir funcionando.
    }

    function testFactoryConsumesParentToken() public {
        address producer = PRODUCER_ADDRESS;
        address factory = FACTORY_ADDRESS;
        uint256 rawSupply = 1000;
        uint256 derivedSupply = 300;

        // 1. Arrange: Configuración de roles y aprobación
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        vm.startPrank(ADMIN);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        vm.stopPrank();

        // A. Producer crea la materia prima (Token #1)
        vm.prank(producer);
        supplyChain.createToken("Wood", rawSupply, "{}", 0);
        uint256 rawTokenId = 1;

        // B. SIMULACIÓN DE TRANSFERENCIA: La Factory recibe la materia prima del Producer.
        // 🚨 PRE-CONDICIÓN: Esto requiere la función auxiliar 'setTokenBalance(..)'
        // y que 'tokenBalances' sea 'internal'/'public' para poder testear el consumo.
        vm.startPrank(ADMIN);
        // Transferir el balance del Producer al Factory
        supplyChain.setTokenBalance(rawTokenId, producer, 0); // Producer pierde 1000
        supplyChain.setTokenBalance(rawTokenId, factory, rawSupply); // Factory gana 1000
        vm.stopPrank();

        // 2. Arrange: Verificar balance ANTES del consumo
        uint256 balanceBefore = supplyChain.getTokenBalance(
            rawTokenId,
            factory
        );
        assertEq(
            balanceBefore,
            rawSupply,
            "Pre-condition: Factory must have full raw supply before consumption."
        );

        // 3. Act: Factory crea el producto derivado (Token #2), que consume 300 del Token #1.
        vm.prank(factory);
        supplyChain.createToken("Table", derivedSupply, "{}", rawTokenId); // Token #2

        // 4. Assert (FALLO ESPERADO): Verificar la deducción de balance.
        // Esperamos 700 (1000 - 300), pero el contrato dará 1000 (porque no hay lógica de consumo aún).
        uint256 expectedBalanceAfter = rawSupply - derivedSupply; // 1000 - 300 = 700
        uint256 actualBalanceAfter = supplyChain.getTokenBalance(
            rawTokenId,
            factory
        );

        // ESTE ASSERT FALLARÁ (ROJO) hasta que implementes la deducción en createToken.
        assertEq(
            actualBalanceAfter,
            expectedBalanceAfter,
            "Post-condition: Balance of parent token must be consumed (Deduction logic missing)."
        );

        // 5. Assert de Restricción (ROJO ESPERADO): Intentar consumir más de lo que se tiene.
        uint256 excessiveSupply = 800; // El balance restante es 700.
        vm.prank(factory);
        // ESTE REVERT FALLARÁ (ROJO) si aún no tienes la validación de balance en createToken.
        vm.expectRevert(
            "SupplyChain: Insufficient parent token balance to create derived product."
        );
        supplyChain.createToken(
            "Large Table",
            excessiveSupply,
            "{}",
            rawTokenId
        );
    }
}
