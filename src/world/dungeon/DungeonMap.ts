import { Tile } from "@world/Tile";

export default class DungeonMap {
    tiles = {};
    npcs = {};
    interactables = {};
    constructor(townData: Object) {
        var tilesData = {};
        if (townData.hasOwnProperty("tiles")) {
            tilesData = (<any>townData).tiles;
        }
        Object.keys(tilesData).forEach(tileLocation => {
            tilesData[tileLocation] = new Tile(tilesData[tileLocation]);
        });
        this.tiles = tilesData;
        if (townData.hasOwnProperty("npcs")) {
            this.npcs = (<any>townData).npcs;
        }
        if (townData.hasOwnProperty("interactables")) {
            this.interactables = (<any>townData).interactables;
        }
    }

    getAsciiTiles() {
        var asciiTiles = {};
        Object.keys(this.tiles).forEach(tileLocation => {
            if (this.tiles[tileLocation].ascii) {
                asciiTiles[tileLocation] = this.tiles[tileLocation].ascii;
            }
        });
        return asciiTiles;
    }

    getTile(x, y) {
        return this.tiles[x + ',' + y];
    }

    setTileAscii(x, y, value) {
        this.tiles[x + ',' + y] = value;
    }
}
