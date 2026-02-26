// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockGame
 * @notice A mock game contract for testing Arena integration.
 * @dev Emits events that the Arena indexer listens to.
 */
contract MockGame {

    event MatchWon(address indexed player);
    event NFTMinted(address indexed player, uint256 tokenId);
    event BossDefeated(address indexed player, uint256 bossId);
    event ItemCrafted(address indexed player, uint256 itemId);

    function winMatch() external {
        emit MatchWon(msg.sender);
    }

    function mintGameNFT(uint256 tokenId) external {
        emit NFTMinted(msg.sender, tokenId);
    }

    function defeatBoss(uint256 bossId) external {
        emit BossDefeated(msg.sender, bossId);
    }

    function craftItem(uint256 itemId) external {
        emit ItemCrafted(msg.sender, itemId);
    }
}
