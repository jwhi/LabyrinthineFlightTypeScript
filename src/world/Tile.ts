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

function CreateTile(ascii: string, sprite: string) {
    return new Tile({ascii: ascii, sprite: sprite})
}

export { Tile, CreateTile }