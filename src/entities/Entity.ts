import Constants from "@utilities/GameConstants";

export default class Entity {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    getPositionString() {
        return `${this.x},${this.y}`;
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    getNeighboringPositions() {
        // Used to get the tiles x-1, x, x+1 and y-1, y, y+1 easily using some loops
        var touchingTilesReach = [-1, 0, 1];
        var neighboringTilesString = [`${this.x},${this.y}`];

        touchingTilesReach.forEach(xMod => {
            touchingTilesReach.forEach(yMod => {
                if (Math.abs(xMod) != Math.abs(yMod)) {
                    var tileX = this.x + xMod;
                    var tileY = this.y + yMod;
                    if (tileX >= 0 && tileX < Constants.MAP_WIDTH &&
                        tileY >= 0 && tileY < Constants.MAP_HEIGHT) {
                        neighboringTilesString.push(`${tileX},${tileY}`);
                    }
                }
            });
        });
        return neighboringTilesString;
    }
    // This function covers tiles diagonal from entity
    getAllNeighboringPositions() {
        // Used to get the tiles x-1, x, x+1 and y-1, y, y+1 easily using some loops
        var touchingTilesReach = [-1, 0, 1];
        var neighboringTilesString = [];

        touchingTilesReach.forEach(xMod => {
            touchingTilesReach.forEach(yMod => {
                var tileX = this.x + xMod;
                var tileY = this.y + yMod;
                if (tileX >= 0 && tileX < Constants.MAP_WIDTH &&
                    tileY >= 0 && tileY < Constants.MAP_HEIGHT) {
                    neighboringTilesString.push(`${tileX},${tileY}`);
                }
            });
        });
        return neighboringTilesString;
    }
}
