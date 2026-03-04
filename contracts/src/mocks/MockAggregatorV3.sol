// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockAggregatorV3
 * @notice Mock Chainlink price feed for testing.
 */
contract MockAggregatorV3 {
    uint8 private _decimals;
    string private _description;
    int256 private _price;
    uint256 private _updatedAt;
    uint80 private _roundId;

    constructor(uint8 decimals_, string memory description_, int256 initialPrice) {
        _decimals = decimals_;
        _description = description_;
        _price = initialPrice;
        _updatedAt = block.timestamp;
        _roundId = 1;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function description() external view returns (string memory) {
        return _description;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _price, _updatedAt, _updatedAt, _roundId);
    }

    // ── Test helpers ──

    function setPrice(int256 newPrice) external {
        _price = newPrice;
        _updatedAt = block.timestamp;
        _roundId++;
    }

    function setUpdatedAt(uint256 timestamp) external {
        _updatedAt = timestamp;
    }
}
