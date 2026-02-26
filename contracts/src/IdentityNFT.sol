// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title IdentityNFT
 * @notice Dynamic ERC-721 representing a player's evolving cross-game identity.
 * @dev 1 wallet → 1 identity NFT. Metadata evolves based on XP and level.
 *
 * Features:
 *   - On-chain SVG rendering (fully decentralized metadata)
 *   - Level-based visual evolution
 *   - Class/faction system (future)
 *   - Optionally soulbound (non-transferable)
 */
contract IdentityNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;

    // ──────────────────────────────────────────────
    //  Data Structures
    // ──────────────────────────────────────────────

    struct Identity {
        uint256 level;
        uint256 totalXP;
        uint256 questsCompleted;
        uint256 mintedAt;
        string  faction;        // e.g., "Frostborn", "Inferno", "Shadow"
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    uint256 private _nextTokenId;

    mapping(uint256 => Identity) public identities;
    mapping(address => uint256) public playerTokenId;
    mapping(address => bool) public hasMinted;

    address public rewardEngine;
    bool public soulbound; // If true, transfers are disabled

    // Level thresholds for visual tiers
    string[] public tierNames;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event IdentityMinted(address indexed player, uint256 tokenId);
    event IdentityEvolved(address indexed player, uint256 newLevel, uint256 totalXP);
    event FactionSet(address indexed player, string faction);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() ERC721("Avalanche Arena Identity", "ARENA-ID") Ownable(msg.sender) {
        soulbound = true;
        _nextTokenId = 1;

        // Default tier names
        tierNames.push("Novice");      // Level 0-2
        tierNames.push("Adventurer");  // Level 3-5
        tierNames.push("Warrior");     // Level 6-9
        tierNames.push("Champion");    // Level 10-14
        tierNames.push("Legend");      // Level 15-24
        tierNames.push("Mythic");      // Level 25+
    }

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setRewardEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "IdentityNFT: zero address");
        rewardEngine = _engine;
    }

    function setSoulbound(bool _soulbound) external onlyOwner {
        soulbound = _soulbound;
    }

    // ──────────────────────────────────────────────
    //  Mint Identity
    // ──────────────────────────────────────────────

    /**
     * @notice Mint your Arena identity NFT (1 per wallet)
     */
    function mintIdentity() external returns (uint256) {
        require(!hasMinted[msg.sender], "IdentityNFT: already minted");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        identities[tokenId] = Identity({
            level: 0,
            totalXP: 0,
            questsCompleted: 0,
            mintedAt: block.timestamp,
            faction: "Unaligned"
        });

        playerTokenId[msg.sender] = tokenId;
        hasMinted[msg.sender] = true;

        emit IdentityMinted(msg.sender, tokenId);
        return tokenId;
    }

    /**
     * @notice Choose a faction
     */
    function setFaction(string calldata faction) external {
        require(hasMinted[msg.sender], "IdentityNFT: no identity");
        uint256 tokenId = playerTokenId[msg.sender];
        identities[tokenId].faction = faction;
        emit FactionSet(msg.sender, faction);
    }

    // ──────────────────────────────────────────────
    //  Evolution (Only RewardEngine)
    // ──────────────────────────────────────────────

    /**
     * @notice Evolve a player's identity based on new level
     * @dev Called by RewardEngine after XP update
     */
    function evolve(address player, uint256 newLevel) external {
        require(msg.sender == rewardEngine, "IdentityNFT: not reward engine");
        require(hasMinted[player], "IdentityNFT: no identity");

        uint256 tokenId = playerTokenId[player];
        Identity storage id = identities[tokenId];

        id.level = newLevel;
        id.questsCompleted++;

        emit IdentityEvolved(player, newLevel, id.totalXP);
    }

    /**
     * @notice Update XP on identity (called during evolution)
     */
    function updateXP(address player, uint256 xp) external {
        require(msg.sender == rewardEngine, "IdentityNFT: not reward engine");
        if (!hasMinted[player]) return;

        uint256 tokenId = playerTokenId[player];
        identities[tokenId].totalXP = xp;
    }

    // ──────────────────────────────────────────────
    //  Metadata: On-Chain SVG
    // ──────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        Identity memory id = identities[tokenId];
        string memory tier = _getTierName(id.level);
        string memory svg = _generateSVG(id, tier);

        string memory json = string(abi.encodePacked(
            '{"name":"Arena Identity #', tokenId.toString(),
            '","description":"Avalanche Arena - Cross-Game Identity NFT",',
            '"attributes":[',
                '{"trait_type":"Level","value":', id.level.toString(), '},',
                '{"trait_type":"XP","value":', id.totalXP.toString(), '},',
                '{"trait_type":"Quests Completed","value":', id.questsCompleted.toString(), '},',
                '{"trait_type":"Tier","value":"', tier, '"},',
                '{"trait_type":"Faction","value":"', id.faction, '"}',
            '],',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    // ──────────────────────────────────────────────
    //  Internal: SVG Generation
    // ──────────────────────────────────────────────

    function _generateSVG(Identity memory id, string memory tier) internal pure returns (string memory) {
        string memory bgColor = _getTierColor(id.level);
        string memory header = _svgHeader(bgColor);
        string memory character = _generateCharacterSVG(id.level);
        string memory stats = _svgStats(id, tier);

        return string(abi.encodePacked(header, character, stats, '</svg>'));
    }

    function _svgHeader(string memory bgColor) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="background:', bgColor, '">',
            '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#1a1a2e"/><stop offset="100%" style="stop-color:', bgColor, '"/>',
            '</linearGradient></defs>',
            '<rect width="400" height="500" fill="url(#g)" rx="20"/>',
            '<text x="200" y="60" text-anchor="middle" fill="white" font-size="24" font-family="monospace" font-weight="bold">AVALANCHE ARENA</text>',
            '<line x1="50" y1="80" x2="350" y2="80" stroke="white" stroke-opacity="0.3"/>'
        ));
    }

    function _svgStats(Identity memory id, string memory tier) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<text x="200" y="340" text-anchor="middle" fill="white" font-size="20" font-family="monospace">', tier, '</text>',
            '<text x="200" y="380" text-anchor="middle" fill="#aaa" font-size="16" font-family="monospace">Level ', id.level.toString(), '</text>',
            '<text x="200" y="410" text-anchor="middle" fill="#aaa" font-size="14" font-family="monospace">XP: ', id.totalXP.toString(), '</text>',
            '<text x="200" y="440" text-anchor="middle" fill="#aaa" font-size="14" font-family="monospace">Quests: ', id.questsCompleted.toString(), '</text>',
            '<text x="200" y="470" text-anchor="middle" fill="#666" font-size="12" font-family="monospace">', id.faction, '</text>'
        ));
    }

    function _generateCharacterSVG(uint256 level) internal pure returns (string memory) {
        // Simple character that evolves with level
        string memory glowColor = _getTierColor(level);

        if (level < 3) {
            // Novice: simple circle
            return string(abi.encodePacked(
                '<circle cx="200" cy="200" r="60" fill="none" stroke="', glowColor, '" stroke-width="3"/>',
                '<circle cx="200" cy="200" r="30" fill="', glowColor, '" opacity="0.5"/>'
            ));
        } else if (level < 10) {
            // Warrior: diamond
            return string(abi.encodePacked(
                '<polygon points="200,120 260,200 200,280 140,200" fill="none" stroke="', glowColor, '" stroke-width="3"/>',
                '<polygon points="200,150 240,200 200,250 160,200" fill="', glowColor, '" opacity="0.4"/>'
            ));
        } else {
            // Legend+: star
            return string(abi.encodePacked(
                '<polygon points="200,110 220,170 280,170 230,210 250,270 200,235 150,270 170,210 120,170 180,170" fill="none" stroke="', glowColor, '" stroke-width="3"/>',
                '<polygon points="200,130 215,175 265,175 225,205 240,255 200,230 160,255 175,205 135,175 185,175" fill="', glowColor, '" opacity="0.3"/>'
            ));
        }
    }

    function _getTierName(uint256 level) internal view returns (string memory) {
        if (level < 3) return tierNames[0];
        if (level < 6) return tierNames[1];
        if (level < 10) return tierNames[2];
        if (level < 15) return tierNames[3];
        if (level < 25) return tierNames[4];
        return tierNames[5];
    }

    function _getTierColor(uint256 level) internal pure returns (string memory) {
        if (level < 3) return "#4a9eff";     // Blue - Novice
        if (level < 6) return "#50c878";     // Green - Adventurer
        if (level < 10) return "#ff6b35";    // Orange - Warrior
        if (level < 15) return "#9b59b6";    // Purple - Champion
        if (level < 25) return "#f1c40f";    // Gold - Legend
        return "#e74c3c";                     // Red - Mythic
    }

    // ──────────────────────────────────────────────
    //  Soulbound Override
    // ──────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers if soulbound
        if (soulbound && from != address(0) && to != address(0)) {
            revert("IdentityNFT: soulbound - transfers disabled");
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
