// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAggregatorV3
 * @notice Chainlink Price Feed interface.
 * @dev AVAX/USD on Avalanche Fuji: 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
 */
interface IAggregatorV3 {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
}
