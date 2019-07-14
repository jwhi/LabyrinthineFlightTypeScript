'use strict';
/**
 * LabyrinthineFlight.js
 * 
 * This file will handle:
 * 1. Storing and updating game data
 * 2. Game logic that is done client-side
 * 3. Counterpart to the server-side Rogue class
 *
 */

class LabyrinthineFlight {
    player: Player;
    width: number = 75;
    height: number = 40;
    map: DungeonMap;
    updatedSprites = {};
    constructor(mapInformation, playerInformation, fovData) {
        this.player = new Player(playerInformation.name, playerInformation.title, playerInformation.x, playerInformation.y);
        this.map = new DungeonMap(mapInformation);
    }

    /**
    * canWalk
    * Walking is handled client side to give the user a better gameplay experience.
    * To test whether a player can move to a tile on the map, check the x,y coordinate
    * on the map passed to the client from the server. So far, blank tiles and '#' are
    * they only tiles that block movement
    * @param x The X value of the tile to be checked
    * @param y The Y value of the tile to be checked
    * @returns a boolean that is true for walkable tiles, false for walls
    */
    canWalk(x, y) {
        if (x > this.width || y > this.height || x < 0 || y < 0) {
            return false;
        }
        var nonWalkableTiles = ['&', '#', '%', '♠', 'ƒ', '╬', '☺', '☻', 'Æ', 'æ', 'µ', '╤', '☼', ':', 'Φ', '═', '≈', '║', '♀', '¶', '₧', '╦', 'Ω'];
        if (nonWalkableTiles.includes(this.getAsciiTile(x, y))) {
            return false;
        }
        return true;
    }

    movePlayer(x, y) {
        this.player.setLocation(x, y);

        if (this.getAsciiTile(x, y) === '+') {
            this.setAsciiTile(x, y, '-');
            this.setSpriteName(x, y, 'door_open');
        } else if (this.getAsciiTile(x, y) === '╣') {
            this.setAsciiTile(x, y, '╠');
            this.setSpriteName(x, y, 'metal_gate_open');
        }
    }

    getAsciiTile(x, y) {
        if (this.map.tiles[x + "," + y]) {
            return this.map.tiles[x + "," + y].ascii;
        }
        return null;
    }

    setAsciiTile(x, y, character) {
        if (this.map.tiles[x + ',' + y]) {
            this.map.tiles[x + ',' + y].ascii = character;
        } else {
            this.map.tiles[x + ',' + y] = { ascii: character };
        }
    }

    getSpriteName(x, y) {
        if (this.map.tiles[x + "," + y]) {
            return this.map.tiles[x + "," + y].sprite;
        }
        return null;
    }


    setSpriteName(x, y, spriteName) {
        if (this.map.tiles[x + ',' + y]) {
            this.map.tiles[x + ',' + y].sprite = spriteName;
        } else {
            this.map.tiles[x + ',' + y] = { sprite: spriteName };
        }
        this.updatedSprites[x + ',' + y] = spriteName;
    }
}

class Entity {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    setLocation(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Player extends Entity {
    name: string;
    title: string;
    constructor(name: string, title: string, x: number, y: number) {
        /**
         * Contains:
         * 1. Name
         * 2. Title
         * 3. Stats
         * 4. Backstory
         * 5. Inventory
         */
        super(x, y);
        this.name = name;
        this.title = title;
    }
}

class NPC extends Entity {
    name: string;
    ascii: string;
    sprite: string;

    constructor(npcInfo) {
        super(npcInfo.x, npcInfo.y);
        this.name = npcInfo.name;
        this.ascii = npcInfo.symbol;
        this.sprite = npcInfo.sprite;
    }
}

class Enemy extends Entity {
    attack: number;
    constructor(enemyInfo) {
        super(enemyInfo.x, enemyInfo.y)
        this.attack = enemyInfo.attack;
    }
}

class DungeonMap {
    tiles = {};
    fov = {};
    constructor(mapData) {
        /**
         * Contains:
         * 1. Player X,Y
         * 2. Player's field-of-vision 
         * 3. Level Number 
         * 4. ASCII Tiles
         * 5. Sprite Names
         * 6. NPCs (including enemies)
         * 7. Interactables (signs, books)
         */
    }


}

class Interactable {
    constructor() {
        // Interacted bool
        // Description string
    }
}

class Book extends Interactable {
    constructor() {
        // Title
        // Author
        // Contents
        super();
    }
}

class Sign extends Interactable {
    constructor() {
        // Contents
        super();
    }
}