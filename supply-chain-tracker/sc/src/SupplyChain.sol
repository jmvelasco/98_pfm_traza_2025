// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    // -----------------------------------------------------------
    // ENUMS Y ESTRUCTURAS DE DATOS
    // -----------------------------------------------------------

    enum UserStatus {
        Pending,
        Approved,
        Rejected,
        Canceled
    }
    enum TransferStatus {
        Pending,
        Accepted,
        Rejected
    }

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

    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalSupply
    );
    event TransferRequested(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );
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
        require(
            msg.sender == admin,
            "SupplyChain: Only admin can call this function."
        );
        _;
    }

    modifier onlyApprovedUser() {
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "SupplyChain: User not registered.");
        require(
            users[userId].status == UserStatus.Approved,
            "SupplyChain: User not approved."
        );
        _;
    }

    // TODO: Crear un modificador para validar roles en funciones específicas

    // -----------------------------------------------------------
    // FUNCIONES A IMPLEMENTAR
    // -----------------------------------------------------------

    // Gestión de Usuarios
    function requestUserRole(string memory _role) public {
        // 1. Requerir que el rol sea válido
        require(
            keccak256(abi.encodePacked(_role)) ==
                keccak256(abi.encodePacked("Producer")) ||
                keccak256(abi.encodePacked(_role)) ==
                keccak256(abi.encodePacked("Factory")) ||
                keccak256(abi.encodePacked(_role)) ==
                keccak256(abi.encodePacked("Retailer")) ||
                keccak256(abi.encodePacked(_role)) ==
                keccak256(abi.encodePacked("Consumer")),
            "SupplyChain: Invalid role specified."
        );

        // 2. No permitir al Admin cambiar su rol
        if (msg.sender == admin) {
            // El admin ya está aprobado por defecto. Podemos ignorar peticiones.
            revert("SupplyChain: Admin role cannot be requested.");
        }

        // 3. Crear o actualizar la solicitud
        uint256 userId = addressToUserId[msg.sender];

        if (userId == 0) {
            // Nuevo usuario
            userId = nextUserId;
            addressToUserId[msg.sender] = userId;
            nextUserId++;
        } else {
            // Usuario existente que cambia de rol o vuelve a solicitar
            User memory existingUser = users[userId];
            // No permitir si ya está Aprobado
            require(
                existingUser.status != UserStatus.Approved,
                "SupplyChain: User is already approved."
            );
        }

        users[userId] = User(
            userId,
            msg.sender,
            _role,
            UserStatus.Pending // Siempre inicia en estado Pending
        );

        emit UserRoleRequested(msg.sender, _role);
    }
    function changeStatusUser(
        address userAddress,
        UserStatus newStatus
    ) public onlyAdmin {
        uint256 userId = addressToUserId[userAddress];

        // 1. Requerir que el usuario exista
        require(userId != 0, "SupplyChain: User not registered.");

        // 2. No permitir cambiar el estado del Admin
        require(
            userAddress != admin,
            "SupplyChain: Cannot change Admin status."
        );

        // 3. Actualizar el estado y emitir evento
        users[userId].status = newStatus;

        emit UserStatusChanged(userAddress, newStatus);
    }
    function getUserInfo(
        address userAddress
    ) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        if (userId == 0) {
            // Retorna un struct vacío si no existe
            return User(0, address(0), "", UserStatus.Pending);
        }
        return users[userId];
    }
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // Gestión de Tokens
    // Gestión de Tokens
    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId
    ) public onlyApprovedUser {
        // [ROJO -> VERDE] Paso Mínimo:
        // Requerimiento: El productor debe crear tokens sin parentId.
        require(
            parentId == 0,
            "SupplyChain: Producers can only create raw materials (parentId must be 0)."
        );

        // 1. Asignar ID
        uint256 newId = nextTokenId;

        // 2. Crear el Token (solo con los datos que necesita el test)
        Token storage newToken = tokens[newId];
        newToken.id = newId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId; // Será 0 para el productor
        // Nota: La fecha de creación y otros campos se inicializan a 0 por defecto. Los tests no los están comprobando todavía, por lo que no hace falta implementar `block.timestamp` aun.

        // 3. Asignar Balance al creador
        tokenBalances[newId][msg.sender] = totalSupply;

        // 4. Actualizar estado y emitir evento (paso necesario aunque el test no lo compruebe)
        nextTokenId++;
        // Emitimos el evento (aunque el test aún no lo verifica, es buena práctica)
        emit TokenCreated(newId, msg.sender, name, totalSupply);

        // 5. Actualizar lista de tokens del usuario (Necesario para getUserTokens)
        userTokensList[msg.sender].push(newId);
    }
    function getToken(
        uint tokenId
    )
        public
        view
        returns (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            string memory features,
            uint256 parentId,
            uint256 dateCreated
        )
    {
        require(tokens[tokenId].id != 0, "SupplyChain: Token does not exist.");
        Token storage token = tokens[tokenId];

        // Devolvemos el struct Token, pero desestructurado como tuple
        return (
            token.id,
            token.creator,
            token.name,
            token.totalSupply,
            token.features,
            token.parentId,
            token.dateCreated
        );
    }
    function getTokenBalance(
        uint tokenId,
        address userAddress
    ) public view returns (uint) {
        return tokenBalances[tokenId][userAddress];
    }

    // Gestión de Transferencias
    function transfer(address to, uint tokenId, uint amount) public {
        /* ... */
    }
    function acceptTransfer(uint transferId) public {
        /* ... */
    }
    function rejectTransfer(uint transferId) public {
        /* ... */
    }
    function getTransfer(
        uint transferId
    ) public view returns (Transfer memory) {
        /* ... */
    }

    // Funciones auxiliares
    function getUserTokens(
        address userAddress
    ) public view returns (uint256[] memory) {
        return userTokensList[userAddress];
    }
    function getAllUsers() public view returns (User[] memory) {
        /* ... */
    } // Sugerencia: Añadir para Admin
}
