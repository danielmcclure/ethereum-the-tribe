// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol"; //alows for console.logs in a solidity contract"

contract ETHTheTribeNFT is ERC721URIStorage {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public maxNFTs;
    uint256 public remainingMintableNFTs;

    struct myNFT {
        address owner;
        string tokenURI;
        uint256 tokenId;
    }
    
    myNFT [] public nftCollection;

    /* tokenURI
    {
        "name": "Their name + Tribe Card"
        "description": "Ethereum: The Tribe, is an NFT collection highlighting players and their realms in the Ethereum ecosystem."
        "image": //IPFS pinned file content CID (can be any mime type)
        "other data like version, strenth, etc....": ""
    }
    */
    event NewETTNFTMinted(address sender, uint256 tokenId, string tokenURI);
    event RemainingMintableNFTChange(uint256 remainingMintableNFTs);

    //This sets our collection details. Anything minted by this contract will fall under this header
    constructor() ERC721 ("Ethereum: The Tribe", "ETTNFT") {
        console.log("This is my NFT contract");
        maxNFTs=10000; //set a limit to number of nft's that are mintable
    }

    function mintMyNFT(string memory ipfsURI) public {
        require(_tokenIds.current() < maxNFTs);
        uint256 newItemId = _tokenIds.current();

        myNFT memory newNFT = myNFT ({
            owner: msg.sender,
            tokenURI: ipfsURI,
            tokenId: newItemId
        });

        _safeMint(msg.sender, newItemId);
    
        // Update your URI!!!
        _setTokenURI(newItemId, ipfsURI);
    
        _tokenIds.increment();

        remainingMintableNFTs = maxNFTs-_tokenIds.current();

        nftCollection.push(newNFT);

        emit NewETTNFTMinted(msg.sender, newItemId, ipfsURI);
        emit RemainingMintableNFTChange(remainingMintableNFTs);
    }

    /**
    * @notice helper function to display NFTs for frontends
    */
    function getNFTCollection() public view returns (myNFT [] memory) {
        return nftCollection;
    }

    function getRemainingMintableNFTs() public view returns (uint256) {
        return remainingMintableNFTs;
    }
}