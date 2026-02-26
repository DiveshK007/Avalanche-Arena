// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ArenaMarketplace
 * @notice Decentralized marketplace for trading in-game items and badges.
 * @dev Supports:
 *   - Fixed-price listings (ERC-721)
 *   - Auction support (future)
 *   - Arena fee (2.5% default, configurable)
 *   - Game developer royalties (optional)
 *
 * Integration:
 *   - Games register their NFT contracts as approved collections
 *   - Players list items from any approved game
 *   - Buyers pay in AVAX
 */
contract ArenaMarketplace is Ownable, ReentrancyGuard {

    // ──────────────────────────────────────────────
    //  Data Structures
    // ──────────────────────────────────────────────

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;          // in wei (AVAX)
        uint256 listedAt;
        bool active;
    }

    struct Collection {
        string gameName;
        address royaltyRecipient;
        uint256 royaltyBps;     // Basis points (e.g., 250 = 2.5%)
        bool approved;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    mapping(address => Collection) public collections;

    uint256 public arenaFeeBps = 250; // 2.5%
    address public feeRecipient;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% max
    uint256 public constant MAX_ROYALTY_BPS = 1000; // 10% max

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event ItemListed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ItemDelisted(uint256 indexed listingId);
    event CollectionApproved(address indexed nftContract, string gameName);
    event CollectionRemoved(address indexed nftContract);
    event ArenaFeeUpdated(uint256 newFeeBps);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Collection Management (Owner)
    // ──────────────────────────────────────────────

    /**
     * @notice Approve an NFT collection for trading
     */
    function approveCollection(
        address nftContract,
        string calldata gameName,
        address royaltyRecipient,
        uint256 royaltyBps
    ) external onlyOwner {
        require(nftContract != address(0), "Marketplace: zero address");
        require(royaltyBps <= MAX_ROYALTY_BPS, "Marketplace: royalty too high");

        collections[nftContract] = Collection({
            gameName: gameName,
            royaltyRecipient: royaltyRecipient,
            royaltyBps: royaltyBps,
            approved: true
        });

        emit CollectionApproved(nftContract, gameName);
    }

    /**
     * @notice Remove a collection from approved list
     */
    function removeCollection(address nftContract) external onlyOwner {
        collections[nftContract].approved = false;
        emit CollectionRemoved(nftContract);
    }

    /**
     * @notice Update arena fee
     */
    function setArenaFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Marketplace: fee too high");
        arenaFeeBps = newFeeBps;
        emit ArenaFeeUpdated(newFeeBps);
    }

    /**
     * @notice Update fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Marketplace: zero address");
        feeRecipient = _recipient;
    }

    // ──────────────────────────────────────────────
    //  Listing Management
    // ──────────────────────────────────────────────

    /**
     * @notice List an NFT for sale
     * @param nftContract The NFT contract address
     * @param tokenId The token ID to list
     * @param price Asking price in wei
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(collections[nftContract].approved, "Marketplace: collection not approved");
        require(price > 0, "Marketplace: zero price");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Marketplace: not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace: not approved"
        );

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            listedAt: block.timestamp,
            active: true
        });

        emit ItemListed(listingCount, msg.sender, nftContract, tokenId, price);
        return listingCount;
    }

    /**
     * @notice Buy a listed NFT
     */
    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "Marketplace: not active");
        require(msg.value >= listing.price, "Marketplace: insufficient payment");
        require(msg.sender != listing.seller, "Marketplace: cannot buy own item");

        listing.active = false;

        // Calculate fees
        uint256 arenaFee = (listing.price * arenaFeeBps) / 10000;
        uint256 royalty = 0;

        Collection memory collection = collections[listing.nftContract];
        if (collection.royaltyRecipient != address(0) && collection.royaltyBps > 0) {
            royalty = (listing.price * collection.royaltyBps) / 10000;
        }

        uint256 sellerProceeds = listing.price - arenaFee - royalty;

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller, msg.sender, listing.tokenId
        );

        // Distribute payments
        payable(listing.seller).transfer(sellerProceeds);
        if (arenaFee > 0) payable(feeRecipient).transfer(arenaFee);
        if (royalty > 0) payable(collection.royaltyRecipient).transfer(royalty);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit ItemSold(listingId, msg.sender, listing.price);
    }

    /**
     * @notice Cancel a listing
     */
    function delistItem(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || msg.sender == owner(), "Marketplace: not authorized");
        require(listing.active, "Marketplace: not active");

        listing.active = false;
        emit ItemDelisted(listingId);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function isCollectionApproved(address nftContract) external view returns (bool) {
        return collections[nftContract].approved;
    }
}
