// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DidLabBadge is ERC721, Ownable {
    uint256 public nextId = 1;
    mapping(uint256 => string) private _tokenURIs;
    
    constructor(address initialOwner) 
        ERC721("DIDLab Hackathon Badge", "DLHB") 
        Ownable(initialOwner) 
    {}

    function mintTo(address to, string memory uri) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no token");
        return _tokenURIs[tokenId];
    }
}