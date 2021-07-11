export default class Constants {
    static readonly MAP_WIDTH = 75
    static readonly MAP_HEIGHT = 40

    static readonly PLAYER_FOV_RADIUS = 8
    static readonly PREVIOUSLY_EXPLORED_ALPHA = 0.4

    static readonly TESTING_DUNGEON_GEN = true
    static readonly DEFAULT_FLOOR_NUMBER = 0

    // #: Room wall
    // &: Hallway wall
    // %: Cave wall
    static readonly WALL_TILES = ['#', '&', '%'];

    // .: Room floor
    // ,: Hallway floor
    // `: Cave floor
    static readonly FLOOR_TILES = ['.', ',', '`'];

    static readonly TILES_NONWALKABLE_BLOCKS_LIGHT = ['&', '#', '%', '♠', 'ƒ', '☺', '☻'];

    static readonly TILES_NONWALKABLE_LIGHT_PASSES = ['Æ', 'æ', 'µ', '╤', '☼', ':', 'Φ', '═', '≈', '║', '♀', '¶', '╬', '₧', '╦', 'Ω'];

    static readonly TILES_WALKABLE_BLOCKS_LIGHT = ['+', '⌠'];

    static readonly TILES_WALKABLE_LIGHT_PASSES = [' ', '.', ',', '`', '"', '-', '<', '>', 'Θ', '╥', '~', '╣', '╠', '⌡', 'ⁿ', '░'];
}
