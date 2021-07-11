import ROT = require('rot-js');
import Entity from '@entities/Entity';

export default class Enemy extends Entity {
    name: string;
    health: number;
    attack: number[];
    accuracy: number;
    char: string = "";
    loot = [];
    description: string = "";
    path = [];
    maxHealth: number;
    
    constructor(name, x, y) {
        super(x, y);
        this.name = name;
        this.x = x;
        this.y = y;
        this.health = 0;
        this.attack = [1];
        this.accuracy = 0;

        switch (name) {
            case 'goblin':
                this.health = 4;
                this.maxHealth = this.health;
                this.attack = [1];
                this.accuracy = 0.8;
                this.char = "g";
                this.description = "It a goblin.";
                break;
        }
    }
    calculateMove(playerX, playerY, map) {
        var dijkstra = new ROT.Path.Dijkstra(playerX, playerY, function (x, y) {
            if (map) {
                return ((map[x + ',' + y] === '.') || (map[x + ',' + y] === ',') || (map[x + ',' + y] === '-') || (map[x + ',' + y] === '+') || (map[x + ',' + y] === '`'))
            } else {
                return false;
            }
        }, { topology: 4 });
        var localPath = this.path;
        dijkstra.compute(this.x, this.y, function (x, y) {
            // For testing, have the alpha of all the tiles in the enemies path should have the alpha value of 1.
            localPath.push({ x: x, y: y });
        });
        // Remove the first spot in path because it contains the enemy's current location. We want the first spot to be where the enemy's next turn should be.
        this.path.shift();
        return this.path;
    }
}
