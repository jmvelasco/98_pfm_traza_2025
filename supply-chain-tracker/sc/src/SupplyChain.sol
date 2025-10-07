// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    // -----------------------------------------------------------
    // ENUMS Y ESTRUCTURAS DE DATOS
    // -----------------------------------------------------------

    enum UserStatus { Pending, Approved, Rejected, Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON string para metadatos
        uint256 parentId;
        uint256 dateCreated;
        // El balance individual se gestionará a nivel de mapping fuera del struct
        // para ahorrar gas, o se mapea de otra forma. Dejaremos la estructura
        // como está en el README para seguir el plan, aunque es ineficiente:
        // mapping(address => uint256) balance; // Esta línea no se puede poner en un struct
    }

    // Adaptación del struct Token: Los mappings no pueden estar dentro de structs
    // que se usan en mappings o arrays dinámicos públicos.
    // Vamos a ajustar el diseño para que el balance sea un mapping externo:
    // mapping(uint256 => mapping(address => uint256)) public tokenBalances;

    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 tokenId;
        uint256 dateCreated;
        uint256 amount;
        TransferStatus status;
    }

    struct User {
        uint256 id;
        address userAddress;
        string role; // "Producer", "Factory", "Retailer", "Consumer", "Admin"
        UserStatus status;
    }

    // -----------------------------------------------------------
    // VARIABLES DE ESTADO Y MAPPINGS
    // -----------------------------------------------------------

    address public admin;

    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Mapping: Token ID => Token
    mapping(uint256 => Token) public tokens;
    // Mapping: Transfer ID => Transfer
    mapping(uint256 => Transfer) public transfers;
    // Mapping: User ID => User
    mapping(uint256 => User) public users;
    // Mapping: User Address => User ID (Para búsqueda rápida)
    mapping(address => uint256) public addressToUserId;
    // Mapping: Token ID => User Address => Balance
    mapping(uint256 => mapping(address => uint256)) private tokenBalances;

    // Mapping: User Address => List of Token IDs owned
    mapping(address => uint256[]) private userTokensList;

    // -----------------------------------------------------------
    // EVENTOS
    // -----------------------------------------------------------

    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    // -----------------------------------------------------------
    // CONSTRUCTOR
    // -----------------------------------------------------------

    constructor() {
        admin = msg.sender;
        // Auto-registro del admin como un usuario aprobado
        users[nextUserId] = User(
            nextUserId,
            msg.sender,
            "Admin",
            UserStatus.Approved
        );
        addressToUserId[msg.sender] = nextUserId;
        nextUserId++;
    }

    // -----------------------------------------------------------
    // MODIFICADORES
    // -----------------------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "SupplyChain: Only admin can call this function.");
        _;
    }

    // TODO: Crear un modificador para usuarios aprobados 'onlyApprovedUser'
    // TODO: Crear un modificador para validar roles en funciones específicas

    // -----------------------------------------------------------
    // FUNCIONES A IMPLEMENTAR
    // -----------------------------------------------------------

    // Gestión de Usuarios
    function requestUserRole(string memory role) public { /* ... */ }
    function changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin { /* ... */ }
    function getUserInfo(address userAddress) public view returns (User memory) { /* ... */ }
    function isAdmin(address userAddress) public view returns (bool) { /* ... */ }

    // Gestión de Tokens
    function createToken(string memory name, uint totalSupply, string memory features, uint parentId) public { /* ... */ }
    function getToken(uint tokenId) public view returns (Token memory) { /* ... */ }
    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint) { return tokenBalances[tokenId][userAddress]; }

    // Gestión de Transferencias
    function transfer(address to, uint tokenId, uint amount) public { /* ... */ }
    function acceptTransfer(uint transferId) public { /* ... */ }
    function rejectTransfer(uint transferId) public { /* ... */ }
    function getTransfer(uint transferId) public view returns (Transfer memory) { /* ... */ }

    // Funciones auxiliares
    function getUserTokens(address userAddress) public view returns (uint256[] memory) { return userTokensList[userAddress]; }
    function getAllUsers() public view returns (User[] memory) { /* ... */ } // Sugerencia: Añadir para Admin

}