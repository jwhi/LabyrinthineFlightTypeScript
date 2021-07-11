import ROT = require('rot-js');

import Floor from "@world/dungeon/Floor";
import Player from "@entities/Player"
import Constants from "@utilities/GameConstants";

export default class Dungeon {
    floorNumber: number;
    furthestFloor: number;
    player: Player;
    floors: Floor[];
    seed: number;

    constructor(seed, floorNumber = 0, furthestFloor = floorNumber) {
        console.log("In the dungeon class....")
        this.floorNumber = floorNumber;

        if (furthestFloor) {
            this.furthestFloor = furthestFloor;
        } else {
            this.furthestFloor = floorNumber;
        }

        this.player = new Player();
        this.floors = [];
        this.seed = seed;
        ROT.RNG.setSeed(this.seed + this.floorNumber);
        this.floors[this.floorNumber] = new Floor(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, this.floorNumber);
    }
    gotoFloor(floorNumber, upOrDown? : string) {
        if (floorNumber < 0) return;
        if (!this.floors[floorNumber]) {
            // New level that needs to be created and stored.
            // RNG for ROT set to initial seed + floorNumber
            ROT.RNG.setSeed(this.seed + floorNumber);
            this.floors[floorNumber] = new Floor(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, floorNumber, upOrDown === 'down');
        }
        this.floorNumber = floorNumber;
    }

    getCurrentFloor() {
        return this.floors[this.floorNumber];
    }

    getFloorDataForClient({ includePlayerInfo = false } = {}) {
        var floor = this.getCurrentFloor();
        this.player.x = floor.playerX;
        this.player.y = floor.playerY;
        var returnObject = {
            map: this.getClientMapData(),
            playerX: floor.playerX,
            playerY: floor.playerY,
            player: null
        }
        if (includePlayerInfo) {
            returnObject.player = this.player
        }
        return returnObject;
    }

    useStairs(symbol) {
        var cf = this.getCurrentFloor();
        if (!symbol) {
            symbol = cf.getMap()[cf.playerX + "," + cf.playerY];
        } else if (symbol !== cf.getMap()[cf.playerX + "," + cf.playerY]) {
            return false;
        }
        if (symbol === ">") {
            this.gotoFloor(this.floorNumber + 1);
            return true;
        } else if (symbol === "<") {
            this.gotoFloor(this.floorNumber - 1);
            return true;
        }
        return false;
    }

    getPlayerInteractables() {
        var nearbyInteractables = {};
        var mapInteractables = this.getCurrentFloor().getInteractables();
        // Check map for signs, people, stairs, doors, books, etc. in player's area
        var playerInteractableReach = this.player.getNeighboringPositions();
        Object.keys(mapInteractables).forEach(interactable => {
            playerInteractableReach.forEach(tileLocation => {
                var objectAtLocation = mapInteractables[interactable][tileLocation];
                if (objectAtLocation) {
                    // There is an interactable here
                    if (!nearbyInteractables[interactable]) {
                        nearbyInteractables[interactable] = {};
                    }
                    nearbyInteractables[interactable][tileLocation] = mapInteractables[interactable][tileLocation];
                }
            });
        });

        var mapNPCs = this.getCurrentFloor().getMap().npcs;
        playerInteractableReach.forEach(tileLocation => {
            if (mapNPCs[tileLocation]) {
                if (!nearbyInteractables['npcs']) {
                    nearbyInteractables['npcs'] = {};
                }
                nearbyInteractables['npcs'][tileLocation] = mapNPCs[tileLocation];
            }
        });

        return nearbyInteractables;
    }

    /** mapAlphaValues
     * 
     * @param x Player's X 
     * @param y Player's Y
     * @returns an array of alpha values to be used on the map of the tiles
     * Tiles seen by the player = 1
     * Tiles the player hasn't seen = 0
     * Tiles previously seen but not currently in FOV is a value between 0 and 1.
     */
    mapAlphaValues(x?, y?) {
        if (x && y) {
            return this.getCurrentFloor().updateFOV(x, y);
        } else {
            return this.getCurrentFloor().updateFOV(this.getCurrentFloor().playerX, this.getCurrentFloor().playerY);
        }
    }

    setAlphaValues(alpha) {
        this.getCurrentFloor().mapExplored = alpha;
    }

    updatePlayerPosition(x, y) {
        this.getCurrentFloor().setPlayerPosition(x, y);
    }

    getMap() {
        this.getCurrentFloor().getMap();
    }

    getClientMapData() {
        return {
            tiles: this.getCurrentFloor().getMap().tiles,
            fov: this.mapAlphaValues(),
            npcs: this.getCurrentFloor().getMap().npcs
        }
    }
}
