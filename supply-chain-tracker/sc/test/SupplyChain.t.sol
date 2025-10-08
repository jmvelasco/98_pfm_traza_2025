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
}
