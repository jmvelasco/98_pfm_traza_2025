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
}
