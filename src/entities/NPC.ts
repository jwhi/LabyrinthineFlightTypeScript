import Entity from "@entities/Entity";

export default class NPC extends Entity {
    name: string;
    ascii: string;
    sprite: string;
    hostile: boolean;
    constructor(npcInfo) {
        super(npcInfo.x, npcInfo.y);
        this.name = npcInfo.name;
        this.ascii = npcInfo.symbol;
        this.sprite = npcInfo.sprite;
        this.hostile = npcInfo.hostile;
    }
}
