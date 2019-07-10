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
    constructor(mapInfomation, playerInformation, enemyInformation) {
        this.player = new Player(playerInformation);
        this.width = 75;
        this.height = 40;
        this.map = map;
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
        var nonWalkableTiles = ['&', '#', '%', '♠', 'ƒ', '╬', '☺', '☻', 'Æ', 'æ', 'µ', '╤', '☼', ':', 'Φ', '═', '≈', '║', '♀', '¶', '₧'];
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
        return this.map.asciiTiles[x + ',' + y];
    }

    setAsciiTile(x, y, character) {
        this.map.asciiTiles[x + ',' + y] = character;
    }

    getSpriteName(x, y) {
        return this.map.spriteNames[x + ',' + y];
    }

    setSpriteName(x, y, spriteName) {
        this.map.spriteNames[x + ',' + y] = spriteName;
    }
}

class Entity {
    constructer(x, y) {
        this.x = x;
        this.y = y;
    }

    setLocation(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Player extends Entity {
    constructor(playerInfo) {
        /**
         * Contains:
         * 1. Name
         * 2. Title
         * 3. Stats
         * 4. Backstory
         * 5. Inventory
         */
        super(playerInfo.x, playerInfo.y);
    }
}

class Map {
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
        this.asciiTiles = mapData.asciiTiles;
        this.spriteNames = mapData.spriteNames;
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