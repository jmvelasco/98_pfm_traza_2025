# Supply Chain Smart Contract Deployment Guide

This document outlines the step-by-step process for deploying and verifying the SupplyChain smart contract using Foundry.

## Prerequisites

- Foundry installed and properly configured
- Access to a local or remote Ethereum node (we use Anvil for local testing)
- Basic understanding of Ethereum smart contracts and Solidity

## Step 1: Start Local Testnet

Launch Anvil (Foundry's local testnet) to simulate an Ethereum network:

```bash
anvil
```

This will start a local testnet with:
- Chain ID: 31337
- RPC URL: http://localhost:8545
- Available test accounts with 10000 ETH each
- Pre-funded accounts and their private keys for testing

## Step 2: Create Deployment Script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract DeploySupplyChain is Script {
    function run() public returns (SupplyChain) {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the contract
        SupplyChain supplyChain = new SupplyChain();

        // Stop broadcasting transactions
        vm.stopBroadcast();

        return supplyChain;
    }
}
```

## Step 3: Deploy the Contract

Deploy using Forge with the following command:

```bash
forge script script/Deploy.s.sol \
    --fork-url http://localhost:8545 \
    --broadcast \
    --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Important parameters:
- `--fork-url`: Points to your Ethereum node (Anvil in this case)
- `--broadcast`: Actually sends the transactions
- `--sender`: The address that will deploy the contract (use one from Anvil's output)
- `--private-key`: The corresponding private key (without 0x prefix)

## Step 4: Create Verification Script

Create `script/Verify.s.sol` to verify the deployment:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract VerifyDeployment is Script {
    function run() public {
        // Address of our deployed contract
        address deployedContract = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        
        // Create an instance of our contract
        SupplyChain supplyChain = SupplyChain(deployedContract);
        
        // Start broadcast for any state-changing calls
        vm.startBroadcast();
        
        // Get admin and user info
        address admin = supplyChain.admin();
        SupplyChain.User memory ourUser = supplyChain.getUserInfo(msg.sender);
        
        // Log verification details
        console2.log("Contract admin:", admin);
        console2.log("Our address:", msg.sender);
        console2.log("Our role:", ourUser.role);
        console2.log("Our status:", uint256(ourUser.status));
        
        // Get all users to verify initialization
        SupplyChain.User[] memory users = supplyChain.getAllUsers();
        console2.log("Number of users:", users.length);
        
        if (users.length > 0) {
            console2.log("First user address:", users[0].userAddress);
            console2.log("First user role:", users[0].role);
            console2.log("First user status:", uint256(users[0].status));
        }
        
        vm.stopBroadcast();
    }
}
```

## Step 5: Run Verification

Run the verification script:

```bash
forge script script/Verify.s.sol \
    --fork-url http://localhost:8545 \
    --broadcast \
    --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Expected Verification Output

A successful deployment should show:
- Contract admin matches the deployer address
- Admin user is properly initialized
- User status is Approved (1)
- Initial user count is 1 (just the admin)

## Important Considerations

1. **Local vs Production Deployment**
   - This guide uses Anvil for local testing
   - For production, replace the RPC URL with your target network
   - Use proper private keys and addresses for production deployments
   - Consider gas costs on mainnet or public testnets

2. **Security**
   - Never commit private keys to version control
   - Use environment variables or secure key management in production
   - Verify contract code on block explorers after mainnet deployment

3. **Contract Verification**
   - The verification script checks critical initial state
   - Admin role and permissions are properly set
   - Initial user is created with correct status

4. **Contract Upgrades**
   - This is a non-upgradeable contract
   - Any changes require a new deployment
   - Consider implementing upgrade patterns if needed

## Next Steps

After successful deployment and verification, you can:
1. Create test tokens
2. Add and approve new users
3. Test transfer functionality
4. Verify token lineage tracking

Remember to always test thoroughly on testnets before deploying to mainnet.