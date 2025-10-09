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
    mapping(uint256 => mapping(address => uint256)) internal tokenBalances;

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

        // 1. RESTRICCIÓN DE SEGURIDAD DEL ADMIN (Para pasar el test a VERDE)
        // El administrador no puede cambiar su propio estado para evitar un bloqueo del sistema.
        require(
            msg.sender != userAddress,
            "SupplyChain: Admin cannot change own status."
        );

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
    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId
    ) public onlyApprovedUser {
        uint256 userId = addressToUserId[msg.sender];
        string memory userRole = users[userId].role;

        // Validaciones de Rol y Origen
        if (parentId == 0) {
            // Regla: Materia Prima debe ser creada por Producer
            require(
                keccak256(abi.encodePacked(userRole)) ==
                    keccak256(abi.encodePacked("Producer")),
                "SupplyChain: Only Producer can create raw material (parentId must be 0)."
            );
        } else {
            // Regla: Productos derivados no pueden ser creados por Producers
            require(
                keccak256(abi.encodePacked(userRole)) !=
                    keccak256(abi.encodePacked("Producer")),
                "SupplyChain: Producer cannot create derived products (parentId > 0)."
            );

            // Regla: Productos derivados solo pueden ser creados por Factory o Retailer
            bytes32 factoryHash = keccak256(abi.encodePacked("Factory"));
            bytes32 retailerHash = keccak256(abi.encodePacked("Retailer"));

            require(
                keccak256(abi.encodePacked(userRole)) == factoryHash ||
                    keccak256(abi.encodePacked(userRole)) == retailerHash,
                "SupplyChain: Only Factory or Retailer can create derived products (parentId > 0)."
            );

            // Requerimiento: El token padre debe existir
            require(
                tokens[parentId].id != 0,
                "SupplyChain: Parent token does not exist."
            );

            // Lógica de Consumo de Stock
            // 1. Validar que el creador tiene suficiente stock del token padre.
            require(
                tokenBalances[parentId][msg.sender] >= totalSupply, // totalSupply es la cantidad a CONSUMIR
                "SupplyChain: Insufficient parent token balance to create derived product."
            );

            // 2. Deducir la cantidad consumida del balance del creador
            tokenBalances[parentId][msg.sender] -= totalSupply;
        }

        // Creación del Token
        uint256 newId = nextTokenId;
        Token storage newToken = tokens[newId];
        newToken.id = newId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;

        // Asignar Balance al creador del nuevo token
        tokenBalances[newId][msg.sender] = totalSupply;

        // Actualizar estado
        nextTokenId++;
        emit TokenCreated(newId, msg.sender, name, totalSupply);
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
    function setTokenBalance(
        uint256 tokenId,
        address user,
        uint256 amount
    ) public onlyAdmin {
        tokenBalances[tokenId][user] = amount;
    }

    // Gestión de Transferencias
    function transferToken(
        uint256 tokenId,
        address to,
        uint256 amount
    ) public onlyApprovedUser {
        uint256 parentId = tokens[tokenId].parentId;

        // Verificamos si el destinatario es un usuario aprobado
        uint256 recipientId = addressToUserId[to];
        // Asumimos que si no está registrado, addressToUserId[to] devuelve 0 (Invalid/Pending).
        require(
            users[recipientId].status == SupplyChain.UserStatus.Approved,
            "SupplyChain: Recipient must be an approved user."
        );

        // Si el token a transferir NO es materia prima (parentId > 0)
        if (parentId > 0) {
            // Obtenemos el rol del usuario que intenta transferir (msg.sender)
            uint256 userId = addressToUserId[msg.sender];
            string memory userRole = users[userId].role;

            // Verificamos si el usuario es Producer
            require(
                keccak256(abi.encodePacked(userRole)) !=
                    keccak256(abi.encodePacked("Producer")),
                "SupplyChain: Producer role cannot transfer derived products (parentId > 0)."
            );
            // Nota: Con esta lógica, Factory y Retailer pueden transferir derivados sin problema.
        }

        // 2. VERIFICACIÓN DE BALANCE Y EJECUCIÓN
        uint256 balance = getTokenBalance(tokenId, msg.sender);
        require(balance >= amount, "SupplyChain: Insufficient balance.");
        // Ejecución de la transferencia
        tokenBalances[tokenId][msg.sender] -= amount;
        tokenBalances[tokenId][to] += amount;

        emit TransferRequested(nextTransferId, msg.sender, to, tokenId, amount);

        nextTransferId++;
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

    // Visibilidad y Trazabilidad: Historial del Token
    /**
     * @notice Devuelve el linaje (árbol genealógico) de un token, rastreando los IDs de sus padres hasta el origen (parentId = 0).
     * @param tokenId El ID del token a consultar.
     * @return Una matriz de uint256 que contiene los IDs de los tokens padres, empezando por el padre inmediato.
     */
    function getTokenLineage(uint256 tokenId) public view returns (uint256[] memory) {
        // La lista de linaje se construirá aquí. Inicialmente, no sabemos su tamaño.
        uint256[] memory lineage; 
        
        // En Solidity, es más eficiente usar un array temporal con un tamaño máximo conocido 
        // o determinar la longitud primero. Pero lo haremos iterativamente para mayor claridad.
        
        uint256 currentId = tokenId;
        uint256 currentParentId = tokens[currentId].parentId;

        // Primero, contamos el número de padres para dimensionar el array de forma eficiente.
        uint256 lineageCount = 0;
        uint256 tempId = tokenId;
        while (tokens[tempId].parentId != 0) {
            lineageCount++;
            tempId = tokens[tempId].parentId;
        }

        // Si no hay padres (es un token raw), devolvemos un array vacío.
        if (lineageCount == 0) {
            return new uint256[](0);
        }
        
        // Creamos el array de linaje con el tamaño exacto.
        lineage = new uint256[](lineageCount);
        uint256 index = 0;

        // Volvemos al token original e iteramos para llenar el array.
        currentId = tokenId;
        currentParentId = tokens[currentId].parentId;

        while (currentParentId != 0) {
            // El padre actual es el ID que rastreamos
            lineage[index] = currentParentId;
            
            // Movemos el puntero al padre del padre (siguiente eslabón de la cadena)
            currentId = currentParentId;
            currentParentId = tokens[currentId].parentId;
            
            index++;
        }
        
        return lineage;
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
