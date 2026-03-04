// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAggregatorV3.sol";

/**
 * @title ArenaPriceFeed
 * @notice Chainlink price feed integration for Avalanche Arena marketplace.
 * @dev Provides USD-denominated pricing for marketplace items.
 *
 * Features:
 *   - AVAX/USD price feed via Chainlink
 *   - Convert marketplace prices from AVAX to USD and vice versa
 *   - Stale price protection (max 1 hour age)
 *   - Multi-feed support for future token pairs
 *
 * Chainlink on Avalanche Fuji:
 *   AVAX/USD: 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
 */
contract ArenaPriceFeed is Ownable {

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Chainlink AVAX/USD price feed
    IAggregatorV3 public avaxUsdFeed;

    /// @notice Additional price feeds: symbol => feed address
    mapping(string => IAggregatorV3) public priceFeeds;

    /// @notice Maximum staleness allowed (seconds)
    uint256 public maxStaleness = 3600; // 1 hour

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PriceFeedSet(string indexed symbol, address feedAddress);
    event MaxStalenessUpdated(uint256 newMaxStaleness);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _avaxUsdFeed) Ownable(msg.sender) {
        require(_avaxUsdFeed != address(0), "PriceFeed: zero address");
        avaxUsdFeed = IAggregatorV3(_avaxUsdFeed);
    }

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setAvaxUsdFeed(address _feed) external onlyOwner {
        require(_feed != address(0), "PriceFeed: zero address");
        avaxUsdFeed = IAggregatorV3(_feed);
        emit PriceFeedSet("AVAX/USD", _feed);
    }

    function addPriceFeed(string calldata symbol, address _feed) external onlyOwner {
        require(_feed != address(0), "PriceFeed: zero address");
        priceFeeds[symbol] = IAggregatorV3(_feed);
        emit PriceFeedSet(symbol, _feed);
    }

    function setMaxStaleness(uint256 _maxStaleness) external onlyOwner {
        require(_maxStaleness >= 60, "PriceFeed: too short");
        maxStaleness = _maxStaleness;
        emit MaxStalenessUpdated(_maxStaleness);
    }

    // ──────────────────────────────────────────────
    //  Price Queries
    // ──────────────────────────────────────────────

    /**
     * @notice Get the current AVAX/USD price
     * @return price The price with 8 decimals (Chainlink standard)
     */
    function getAvaxUsdPrice() public view returns (uint256 price) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = avaxUsdFeed.latestRoundData();

        require(answer > 0, "PriceFeed: invalid price");
        require(block.timestamp - updatedAt <= maxStaleness, "PriceFeed: stale price");

        return uint256(answer);
    }

    /**
     * @notice Convert AVAX amount to USD value
     * @param avaxAmount Amount in wei (18 decimals)
     * @return usdValue USD value with 8 decimals
     */
    function avaxToUsd(uint256 avaxAmount) external view returns (uint256 usdValue) {
        uint256 avaxPrice = getAvaxUsdPrice(); // 8 decimals
        // avaxAmount (18 dec) * avaxPrice (8 dec) / 1e18 = result (8 dec)
        return (avaxAmount * avaxPrice) / 1e18;
    }

    /**
     * @notice Convert USD amount to AVAX
     * @param usdAmount USD amount with 8 decimals
     * @return avaxAmount Amount in wei (18 decimals)
     */
    function usdToAvax(uint256 usdAmount) external view returns (uint256 avaxAmount) {
        uint256 avaxPrice = getAvaxUsdPrice(); // 8 decimals
        require(avaxPrice > 0, "PriceFeed: zero price");
        // usdAmount (8 dec) * 1e18 / avaxPrice (8 dec) = result (18 dec)
        return (usdAmount * 1e18) / avaxPrice;
    }

    /**
     * @notice Check if a marketplace payment is sufficient for a USD-priced item
     * @param usdPriceWith8Dec The item price in USD (8 decimals, e.g., 1000000000 = $10)
     * @param avaxPayment The AVAX payment in wei
     * @return sufficient True if payment is enough
     * @return overpayment The excess AVAX (refundable)
     */
    function isPaymentSufficient(
        uint256 usdPriceWith8Dec,
        uint256 avaxPayment
    ) external view returns (bool sufficient, uint256 overpayment) {
        uint256 avaxPrice = getAvaxUsdPrice();
        uint256 requiredAvax = (usdPriceWith8Dec * 1e18) / avaxPrice;

        if (avaxPayment >= requiredAvax) {
            return (true, avaxPayment - requiredAvax);
        }
        return (false, 0);
    }

    /**
     * @notice Get price from a named feed
     * @param symbol The feed symbol (e.g., "AVAX/USD", "ETH/USD")
     */
    function getPrice(string calldata symbol) external view returns (uint256) {
        IAggregatorV3 feed = priceFeeds[symbol];
        require(address(feed) != address(0), "PriceFeed: feed not found");

        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = feed.latestRoundData();

        require(answer > 0, "PriceFeed: invalid price");
        require(block.timestamp - updatedAt <= maxStaleness, "PriceFeed: stale price");

        return uint256(answer);
    }

    /**
     * @notice Get the feed decimals for AVAX/USD
     */
    function getDecimals() external view returns (uint8) {
        return avaxUsdFeed.decimals();
    }
}
