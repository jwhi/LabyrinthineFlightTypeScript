import Entity from '@entities/Entity'
import PlayerDetails from '@utilities/PlayerDetails'

export default class Player extends Entity {
    name: string;
    title: string;
    health: number;
    attack: number[];

    constructor(name = null) {
        var playerDetails = new PlayerDetails();
        super(0, 0);
        this.health = 10;
        this.attack = [1, 2];

        if (name) {
            this.name = name;
        } else {
            this.name = playerDetails.getPlayerName();
        }

        this.title = playerDetails.getPlayerTitle();
    }
}
