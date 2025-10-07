// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;

    // Cuentas de prueba predefinidas por Anvil
    address constant ADMIN = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address constant PRODUCER_ADDRESS = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant FACTORY_ADDRESS = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant RETAILER_ADDRESS = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address constant CONSUMER_ADDRESS = address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);

    function setUp() public {
        // Inicializa el contrato. El ADMIN es automáticamente msg.sender.
        supplyChain = new SupplyChain();
        // Verificar que el constructor haya configurado correctamente el admin
        assertEq(supplyChain.admin(), ADMIN, "Setup: Admin address mismatch.");
    }

    // Tests de gestión de usuarios
    function testUserRegistration() public {
        // 1. Arrange: Cambiamos el remitente a una dirección de prueba (Producer).
        vm.prank(PRODUCER_ADDRESS);

        // 2. Act: Llamamos a la función que aún no está implementada.
        supplyChain.requestUserRole("Producer");

        // 3. Assert (Debe fallar inicialmente porque la lógica no existe)
        // Verificamos que el usuario ahora esté en estado Pending.
        SupplyChain.User memory user = supplyChain.getUserInfo(PRODUCER_ADDRESS);

        assertEq(user.userAddress, PRODUCER_ADDRESS, "User address must match.");
        assertEq(uint8(user.status), uint8(SupplyChain.UserStatus.Pending), "User status must be Pending after request.");
        assertEq(keccak256(abi.encodePacked(user.role)), keccak256(abi.encodePacked("Producer")), "User role must be Producer.");
    }
}