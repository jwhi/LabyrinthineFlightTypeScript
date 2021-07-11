class Tile {
    ascii: string;
    sprite: string;
    constructor(tileData) {
        if (tileData.ascii) {
            this.ascii = tileData.ascii;
        }
        if (tileData.sprite) {
            this.sprite = tileData.sprite;
        }
    }
}

function CreateTileData(ascii: string, sprite: string) {
    return {"ascii": ascii, "sprite": sprite}
}

export { Tile, CreateTileData }