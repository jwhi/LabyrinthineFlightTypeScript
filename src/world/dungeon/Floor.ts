import ROT = require('rot-js');

import Constants from '@utilities/GameConstants'
import DungeonMap from '@world/dungeon/DungeonMap';

import TownData from '@maps/startingTown.json';
import { CreateTile } from '@world/Tile';



const TILE_MAP = {
    "OPEN_DOOR": CreateTile('+', "door"),
    // Floor Tiles
    "DUNGEON_FLOOR": CreateTile("",""),
    "CAVE_FLOOR": CreateTile("",""),
    
    // Walls
    "GENERIC_WALL": CreateTile("#","wall_1"),
    "DUNGEON_WALL": CreateTile("",""),
    "CAVE_WALL": CreateTile("","")
}

export default class Floor {
    map: DungeonMap;
    width: number;
    height: number;
    playerX: number;
    playerY: number;
    levelNumber: number;
    characters: NPC[] = [];
    rooms;
    dijkstra;
    // Map Explored also contains the FOV for the player
    mapExplored: Object = {};
    // Difference between map explored from previous check is stored so we can do a comparison to only send updated values to client
    diffMapExplored: Object;

    constructor(width, height, levelNumber, spawnOnDownStairs = false) {
        this.width = width;
        this.height = height;
        this.levelNumber = levelNumber;

        if (this.levelNumber == 0) {
            // TownData will get updated by players, so doors will be opened by previous players...
            // This parse(stringify(TownData)) creates a fresh copy of the original town data for all players.
            var mapData = JSON.parse(JSON.stringify(TownData));
            this.map = new DungeonMap(mapData);
            this.playerX = 32;
            this.playerY = 31;
            return;
        }

        return;

        // TODO: Update this to the new Map object.
        if ((this.levelNumber) % 5 == 0) {

        /* create a connected map where the player can reach all non-wall sections. Changed in new Rot.js version */
            // var options = { connected: true }
            var cellMap = new ROT.Map.Cellular(width, height);

            /* cells with 1/2 probability */
            cellMap.randomize(0.43);

            /* make a few generations */
            for (var i = 0; i < 5; i++) cellMap.create();

            for (var j = 0; j < height; j++) {
                for (var i = 0; i < width; i++) {
                    if (cellMap._map[i][j]) {
                        // Cave floor
                        this.map.tiles[i + ',' + j] = '`';
                    } else {
                        this.map.tiles[i + ',' + j] = ' '
                    }
                }
            }

            var digger = new ROT.Map.Digger(width, height, { roomWidth: [3, 7], roomHeight: [3, 7], corridorLength: [2, 10], dugPercentage: 0.2 });
            var digCallback = function (x, y, value) {
                var key = x + "," + y;
                // Only add room wall if there isn't a cave floor there.
                if (value) { if (this.map[x + ',' + y] != '`') { this.map[key] = ' '; } }
                else { this.map[key] = "."; }// Walls: ' ' Floor: '.'
            }

            var nullConnectCallback = (x: number, y: number, contents: number) => { return null }
            cellMap.connect(nullConnectCallback, 0, null)
        } else {
            var digger = new ROT.Map.Digger(width, height, { roomWidth: [3, 7], roomHeight: [3, 7], corridorLength: [2, 4], dugPercentage: 0.24 });
            //new ROT.Map.Uniform(width, height, {roomWidth: [3,6], roomHeight: [3,6], roomDugPercentage: 0.5});

            var digCallback = function (x, y, value) {
                var key = x + "," + y;
                if (value) { this.map[key] = " "; }
                else { this.map[key] = "."; }// Walls: ' ' Floor: '.'
            }
        }
        digger.create(digCallback.bind(this));

        this.rooms = digger.getRooms();
        var worldMap = this.map;
        var drawDoor = function (x, y) {
            worldMap[x + "," + y] = "+";
        }
        for (var i = 0; i < this.rooms.length; i++) {
            var room = this.rooms[i];
            room.getDoors(drawDoor);
        }

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                if (this.map[i + "," + j] === ".") {
                    if (!(this.inRoom(i, j))) {
                        this.map[i + "," + j] = ",";
                    }
                }
                this.mapExplored[i + "," + j] = 0;
            }
        }

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                if (this.map[x + "," + y] === " ") {
                    var surroundingTiles = [this.map[x + "," + (y - 1)], this.map[x + "," + (y + 1)], this.map[(x - 1) + "," + y], this.map[(x + 1) + "," + y],
                    this.map[(x + 1) + "," + (y - 1)], this.map[(x + 1) + "," + (y + 1)], this.map[(x - 1) + "," + (y - 1)], this.map[(x - 1) + "," + (y + 1)]].join('').trim();
                    if (surroundingTiles.includes(".")) {
                        // If a blank tile has a floor tile around it, then the blank tile needs to be a wall
                        this.map[x + "," + y] = "#";
                    } else if (surroundingTiles.includes(",")) {
                        // If the surrounding tile includes a hallway or a cave floor, add a cave wall.
                        this.map[x + "," + y] = "&";
                    } else if (surroundingTiles.includes("`")) {
                        this.map[x + "," + y] = "%";
                    }
                }
            }
        }

        //var playerStartRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))];
        if (this.levelNumber != 0) {
            this.map[this.rooms[0].getCenter()[0] + "," + this.rooms[0].getCenter()[1]] = "<";
        }

        //var stairsDownRoom = playerStartRoom;
        //while (stairsDownRoom == playerStartRoom) { stairsDownRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length-1))]; }

        this.map[this.rooms[this.rooms.length - 1].getCenter()[0] + "," + this.rooms[this.rooms.length - 1].getCenter()[1]] = ">";

        var roomID = 0;
        if (spawnOnDownStairs) {
            roomID = this.rooms.length - 1;
        }
        this.playerX = this.rooms[roomID].getCenter()[0];
        this.playerY = this.rooms[roomID].getCenter()[1];

        // Initiate Enemies and Dijkstra path-finding passed function
        //this.placeEnemies();
        this.dijkstra = new ROT.Path.Dijkstra(this.playerX, this.playerY, function (x, y) {
            if (this.map) {
                return ((this.map[x + ',' + y] === '.') || (this.map[x + ',' + y] === ',') || (this.map[x + ',' + y] === '-') || (this.map[x + ',' + y] === '+') || (this.map[x + ',' + y] === '`'))
            } else {
                return false;
            }
        }, null);
    }

    updateFOV(pX, pY) {
        var localMap = this.map.getAsciiTiles();
        var localMapExplored = this.mapExplored;


        var previousMapExplored = {}
        Object.keys(this.mapExplored).forEach(key => {
            previousMapExplored[key] = this.mapExplored[key]
        })

        // Player's field-of-view light input callback
        var lightPasses = function (x, y) {
            var key = x + "," + y;
            if (key in localMap) { return (Constants.TILES_NONWALKABLE_LIGHT_PASSES.includes(localMap[key]) || Constants.TILES_WALKABLE_LIGHT_PASSES.includes(localMap[key])) }
            // If the tile is undefined, return true.
            return true;
        }

        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        // Output callback for player's field-of-view
        fov.compute(pX, pY, Constants.PLAYER_FOV_RADIUS, function (x, y, r, visibility) {
            var ch = (r ? "" : "@");
            localMapExplored[x + "," + y] = 2;
        });

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                var tileAlpha = this.mapExplored[i + "," + j];
                if (tileAlpha == 1) {
                    tileAlpha = Constants.PREVIOUSLY_EXPLORED_ALPHA;
                } else if (tileAlpha == 2) {
                    tileAlpha = 1;
                } else if (tileAlpha != Constants.PREVIOUSLY_EXPLORED_ALPHA) {
                    tileAlpha = 0;
                }
                this.mapExplored[i + "," + j] = tileAlpha;
            }
        }

        if (this.diffMapExplored == null) {
            this.diffMapExplored = this.mapExplored;
        } else {
            // Calculate which tiles had updated FOV values
            var diff = {}

            Object.keys(this.mapExplored).forEach(pos => {
                if (this.mapExplored[pos] != previousMapExplored[pos]) {
                    diff[pos] = this.mapExplored[pos];
                }
            });

            if (Object.keys(diff).length > 0) {
                // Only update when the diff is different to prevent deleting data not sent to player.
                this.diffMapExplored = diff;
            } else {
                // FOV values are the same from previous turn.
                this.diffMapExplored = {}
            }
        }

        return this.mapExplored;
    }
    getDiffMapExplored() {
        return this.diffMapExplored;
    }

    getMap() {
        return this.map;
    }
    getPlayerPosition() {
        return { x: this.playerX, y: this.playerY };
    }
    inRoom(x, y) {
        for (var i = 0; i < this.rooms.length; i++) {
            var room = this.rooms[i];
            if (x >= room.getLeft() && x <= room.getRight() && y >= room.getTop() && y <= room.getBottom()) {
                return i + 1;
            }
        }
        return 0;
    }
    setPlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
        if (this.map.getTile(x, y)) {
            if (this.map.getTile(x, y).ascii === '+') {
                this.map.setTileAscii(x, y, '-');;
            } else if (this.map.getTile(x, y).ascii === '╣') {
                this.map.setTileAscii(x, y, '╠');
            }
        }
    }
    getExploredMap() {
        return this.mapExplored;
    }
    openDoor(x, y) {
        if (this.map[x + "," + y] === '+') {
            this.map[x + "," + y] = '-';
            return true;
        } else {
            return false;
        }
    }
    canWalk(x, y) {
        if (x > this.width || y > this.height || x < 0 || y < 0) {
            return false;
        }

        switch (this.map[x + "," + y]) {
            // Hallway Wall
            case '&':
            // Room Wall
            case '#':
            // Cave Wall
            case '%':
                return false;
            default:
                return true;
        }
    }
    /*
    placeEnemies() {
        var enemyStartRoom, enemyX, enemyY, attempts = 0;
        // TODO: Improve enemy placement
        // Attempts is to prevent infinite loops that might happen during test. Will place enemies different in final implementation
        do {
            enemyStartRoom = this.rooms[Math.floor(Math.random() * (this.rooms.length - 1))];
            enemyX = enemyStartRoom.getCenter()[0];
            enemyY = enemyStartRoom.getCenter()[1];
            attempts++;
        } while (this.inRoom(enemyX, enemyY) == this.inRoom(this.playerX, this.playerY) && attempts < 3);
        this.enemies.push(new Enemy('goblin', enemyX, enemyY));
    }
    getEnemies() {
        return this.enemies;
    }
    getEnemyAt(x, y) {
        for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];

            if (enemy.x == x && enemy.y == y) {
                return enemy;
            }
        }
        return null;
    }*/
    generateTileData() {
        // Instead of placing individual tiles, store all tile sprites together in an array
        // in the layout of map[x+","+y] with the key being tile coordinates. This will allow
        // easier updating of an individual tiles alpha value.


        /*

        Logic for new tile names.
        Create dictionary if possible. Would need to allow wildcards or subsets
        Not sure if better to create custom class, database, or rely on other methods.
        Dictionary string would be 8 digits long that represent all surround tiles (9x9 grid with tile getting name for in center)
        |0|1|2|
        |3|X|4|
        |5|6|7|

        TODO: Rotation of tiles that require it will need to have their pivot x and y values set to 16, middle of sprite

        FLOOR DECORATIONS
        wall_borders floor tiles (low percentage):
            Check wall and door location
            | wall locations  | tile name       |
            | wall (x-1)(y+1) | floor_border_NW |
            | wall ( x )(y+1) | floor_border_N  |
            | wall (x+1)(y+1) | floor_border_NE |
            | wall (x-1)( y ) | floor_border_W  |
            | wall (x+1)( y ) | floor_border_E  |
            | wall (x-1)(y-1) | floor_border_SW |
            | wall ( x )(y-1) | floor_border_S  |
            | wall (x+1)(y-1) | floor_border_SE |

            floor_border_ + join()
                if wall(y+1) N
                if wall(y-1) S
                if wall(x+1) E
                if wall(x-1) W

        if no surrounding walls (use NSEW joined screen from above)
            Choose secondary floor texture
                floor_1-8

        if hall_way:
            cave_floor_1-3 and prioritize lower numbers

        if cave_floor:
            cave_floor_2-6 and prioritize higher numbers


            TODO: Modify the map creation and tiles to add cave walls.
            % is the cave floor tiles.
                     #####  %%%%%#####&&
                    #...# %%`````...+,&
                    #...# %``````...`,&
                    #...# %%`````...`,&
                    #...#  %%%%%`````,&
                &&#...#&&&&&&&&&```,&
            %%%&,+...+,,,,,,,,,&%&,&
            %%``&,#...#&&######+##&,&
            %```&,#####  #.......+,,&
        %%%  %``%&,&      #.......#&&&
        %%`%% %``%&,&      #.......#   
        %```% %``%&,&      #.......#   
    %%```% %%%%&,&    %%#.......#   
    %```%%     &,&   %%``.......#   
    %```%      &,&   %```+#######   
    %```%      &,&   %```,&%        
    %%%%%#######+#####%``,`%        
            #....#......#%%`,&%        
            #....#......# %&,&         
    %%%%%  #....+...<..#  &,&         
    %```%  ######......#  &,&         
    %```%       #......#  &,&         
    %%`%%   %%% ########  &,&   ##### 
    %%%    %`%%       ####+#   #...# 
            %``%       #....#%  #.>.# 
            %`%%       #....`%  #...# 
            %%%        #....#%#####+# 
                    %#....# #.....# 
                    %%``+### #.....# 
                    %```,&%  #.....# 
        %%%        %```,`%% #.....# 
        %%`%%       %%``,``% #.....# 
        %```%        %%`,`&&&##+#### 
        %```%         %&,,,,,,,,&    
        %%%%%          &&&&&&&&&&        
                                                    


        */


        var mapTileData = {};
        var tileName: string;
        var mapData = ' ';
        var localMap = this.map;

        for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
            for (let x = 0; x < Constants.MAP_WIDTH; x++) {
                mapData = this.map[x + "," + y];
                switch (mapData) {
                    case '&':
                        /*
                        This code block is trying to figure out making caves walls that work like the connecting room walls.

                        // This .join('').trim() will return an empty string if this is a map tile in the void.
                        // TODO: This doesn't work when one of these tiles is null!
                        function getMapTile(x, y) {
                            var tile = localMap[x+","+y];
                            if (tile)
                                return tile
                            return " "
                        }
                        var surroundingTiles = [getMapTile(x,y-1), getMapTile(x,y+1), getMapTile(x-1,y), getMapTile(x+1,y),
                                            getMapTile(x+1,y-1), getMapTile(x+1,y+1), getMapTile(x-1,y-1), getMapTile(x-1,y+1)].join('');
                        
                        
                        var countCaveFloors = (surroundingTiles.substring(0,4).match(/,/g) || []).length;
                        if (countCaveFloors == 0) {
                            // If the cave floor doesn't have an immediate neighbor, then it is a corner piece so check diagonal tiles.
                            countCaveFloors = (surroundingTiles.substring(4).match(/,/g) || []).length;
                        }
                        var surroundingWalls = "";
                        if (countCaveFloors == 1) {
                            // This will give location of the closest cave floor tile that the wall should be positioned around.
                            var floorLocation = surroundingTiles.indexOf(",");

                            var caveWallSpriteFromFloor = {
                                0: 'EW',
                                1: 'EW',
                                2: 'NS',
                                3: 'NS',
                                4: 'SW',
                                5: 'NW',
                                6: 'SE',
                                7: 'NE'
                            }

                            tileData = "cave_wall_" + caveWallSpriteFromFloor[floorLocation];
                            //console.log(`Cave wall tile: ${tileData}`);
                        } else {
                            if (surroundingTiles[0] == ',') {
                                surroundingWalls += "N"
                            }
                            if (surroundingTiles[1] == ',') {
                                surroundingWalls += "S"
                            }
                            if (surroundingTiles[3] == ',') {
                                surroundingWalls += "E"
                            }
                            if (surroundingTiles[2] == ',') {
                                surroundingWalls += "W"
                            }

                            tileData = "cave_wall_" + surroundingWalls;
                        }


                        // TODO: Create an object with all the valid floor names and check against it.
                        var validTiles = ["cave_wall_NS", "cave_wall_EW", "cave_wall_NW", "cave_wall_NE", "cave_wall_SE", "cave_wall_SW", "cave_wall_NSE", "cave_wall_SEW", "cave_wall_NSW", "cave_wall_NEW", "cave_wall_NSEW"]

                        if (!tileData || validTiles.indexOf(tileData) == -1) {
                            console.log(`map position ${x},${y} has invalid tile name: ${tileData}`);
                            tileData = "player_defeated"
                        }
                        */
                        var randomNumberBasedOnMapLocation = this.chooseTexture(x, y, 100);
                        if (randomNumberBasedOnMapLocation < 90) {
                            tileName = "hallway_wall_1";
                        } else {
                            tileName = "hallway_wall_2";
                        }
                        break;
                    case '.':
                        tileName = "room_floor_" + this.chooseTexture(x, y, 7);
                        break;
                    case ',':
                        tileName = "cave_floor_" + this.chooseTexture(x, y, 4);
                        break;
                    case '>':
                        tileName = "stairs_down";
                        break;
                    case '<':
                        tileName = "stairs_up";
                        break;
                    case '+':
                        tileName = "door";
                        break;
                    case '-':
                        tileName = "doorOpen";
                        break;
                    case '`':
                        // Cave floor
                        tileName = "cave";
                        break;
                    case '#':
                        // Surround Tiles is an array of the results from checking if the tiles surrounding a wall are in rooms or not.
                        // Each direction is used twice so wanted to reduce the number of calls to inRoom
                        // Order is in 0)N, 1)S, 2)E, 3)W, 4)NE, 5)NW, 6)SE, 7)SW
                        var surroundingTilesInRooms: number[] = [this.inRoom(x, (y - 1)), this.inRoom(x, (y + 1)), this.inRoom((x + 1), y), this.inRoom((x - 1), y),
                        this.inRoom((x + 1), (y - 1)), this.inRoom((x - 1), (y - 1)), this.inRoom((x + 1), (y + 1)), this.inRoom((x - 1), (y + 1))];
                        var name = "";
                        if (!surroundingTilesInRooms[0] && (surroundingTilesInRooms[2] + surroundingTilesInRooms[3] + surroundingTilesInRooms[4] + surroundingTilesInRooms[5])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            name += "N";
                        } else {
                            name += "_";
                        }

                        if (!surroundingTilesInRooms[1] && (surroundingTilesInRooms[2] + surroundingTilesInRooms[3] + surroundingTilesInRooms[6] + surroundingTilesInRooms[7])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            name += "S";
                        } else {
                            name += "_";
                        }
                        if (!surroundingTilesInRooms[2] && (surroundingTilesInRooms[0] + surroundingTilesInRooms[1] + surroundingTilesInRooms[4] + surroundingTilesInRooms[6])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            name += "E";
                        } else {
                            name += "_";
                        }
                        if (!surroundingTilesInRooms[3] && (surroundingTilesInRooms[0] + surroundingTilesInRooms[1] + surroundingTilesInRooms[5] + surroundingTilesInRooms[7])) {
                            // If there is a room to the East or West of the wall, it's a wall that connects on the North and South side.
                            name += "W";
                        } else {
                            name += "_";
                        }
                        tileName = name;
                        break;
                    case '%':
                        var getMapTile = (x, y): string => {
                            var tile = localMap[x + "," + y];
                            if (tile)
                                return tile
                            return " "
                        }
                        var surroundingTiles: string[] = [getMapTile(x, y - 1), getMapTile(x, y + 1), getMapTile(x + 1, y), getMapTile(x - 1, y)];

                        var connectedWalls = ['', '', '', ''];
                        // Trying to find the best wall to connect cave wall sprites.

                        // First check for any nearby cave walls that this tile should connect to
                        if (surroundingTiles[0] == '%') {
                            connectedWalls[0] = 'N';
                        }
                        if (surroundingTiles[1] == '%') {
                            connectedWalls[1] = 'S';
                        }
                        if (surroundingTiles[2] == '%') {
                            connectedWalls[2] = 'E';
                        }
                        if (surroundingTiles[3] == '%') {
                            connectedWalls[3] = 'W';
                        }

                        // If the tile could only connect to 1 cave wall, try to see if there are other wall tiles nearby to connect to
                        if (connectedWalls.join('').trim().length <= 1) {
                            if (Constants.WALL_TILES.includes(surroundingTiles[0])) {
                                connectedWalls[0] = 'N';
                            }
                            if (Constants.WALL_TILES.includes(surroundingTiles[1])) {
                                connectedWalls[1] = 'S';
                            }
                            if (Constants.WALL_TILES.includes(surroundingTiles[2])) {
                                connectedWalls[2] = 'E';
                            }
                            if (Constants.WALL_TILES.includes(surroundingTiles[3])) {
                                connectedWalls[3] = 'W';
                            }
                        }

                        tileName = "cave_wall_" + connectedWalls.join('').trim();

                        var validTiles = [
                            "cave_wall_NS",
                            "cave_wall_EW",
                            "cave_wall_SE",
                            "cave_wall_SW",
                            "cave_wall_NW",
                            "cave_wall_NE",
                            "cave_wall_NEW",
                            "cave_wall_NSE",
                            "cave_wall_SEW",
                            "cave_wall_NSW",
                            "cave_wall_NSEW"
                        ];
                        if (!validTiles.includes(tileName)) {
                            console.log(`ERROR: Invalid tile at ${x},${y}: ${tileName}`)
                            tileName = "door_floor_wear_1";
                        }

                        break;
                    default:
                        tileName = mapData;
                }
                if (tileName) {
                    // Only add the tile if it contains data.
                    mapTileData[x + "," + y] = tileName;
                }
            }
        }
        return mapTileData;
    }

    getTileInfoFromAscii(ascii: String) {
        
    }

    chooseTexture(x, y, z) {
        // https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
        // x and y in the below equation should be divided by total height or width so that way x and y
        // will always be between 0 and 1.
        var number = (Math.sin((x / this.width) * 12.9898 + (y / this.height) * 78.233) * 43758.5453) % 1;
        //console.log(number);
        var newNumber = Math.abs(Math.floor(number * z)) + 1;

        if (newNumber > z) {
            return newNumber - z;
        } else {
            return newNumber;
        }
    }

    getInteractables() {
        return this.map.interactables;
    }
}
