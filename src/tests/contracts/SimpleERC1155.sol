// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleERC1155 {
    // Token name
    string private _name;
    
    // Token URI prefix
    string private _uri;

    // Mapping from (account, token ID) to balance
    mapping(address => mapping(uint256 => uint256)) private _balances;
    
    // Mapping from account to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    
    event ApprovalForAll(
        address indexed account,
        address indexed operator,
        bool approved
    );
    
    event URI(string value, uint256 indexed id);

    constructor(string memory name_, string memory uri_) {
        _name = name_;
        _uri = uri_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function uri(uint256 tokenId) public view returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        
        // If token-specific URI exists, return it
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        
        // Otherwise return the base URI
        return _uri;
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) public {
        _tokenURIs[tokenId] = tokenURI;
        emit URI(tokenURI, tokenId);
    }

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "ERC1155: balance query for the zero address");
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    ) public view returns (uint256[] memory) {
        require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public {
        require(to != address(0), "ERC1155: mint to the zero address");

        address operator = msg.sender;

        _balances[to][id] += amount;
        emit TransferSingle(operator, address(0), to, id, amount);
        
        // Simplified implementation - no receiver checks
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        require(to != address(0), "ERC1155: mint to the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        address operator = msg.sender;

        for (uint256 i = 0; i < ids.length; i++) {
            _balances[to][ids[i]] += amounts[i];
        }

        emit TransferBatch(operator, address(0), to, ids, amounts);
        
        // Simplified implementation - no receiver checks
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        require(to != address(0), "ERC1155: transfer to the zero address");
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "ERC1155: caller is not owner nor approved"
        );

        address operator = msg.sender;

        uint256 fromBalance = _balances[from][id];
        require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
        _balances[from][id] = fromBalance - amount;
        _balances[to][id] += amount;

        emit TransferSingle(operator, from, to, id, amount);
        
        // Simplified implementation - no receiver checks
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(to != address(0), "ERC1155: transfer to the zero address");
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "ERC1155: transfer caller is not owner nor approved"
        );

        address operator = msg.sender;

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = _balances[from][id];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            _balances[from][id] = fromBalance - amount;
            _balances[to][id] += amount;
        }

        emit TransferBatch(operator, from, to, ids, amounts);
        
        // Simplified implementation - no receiver checks
    }
} 