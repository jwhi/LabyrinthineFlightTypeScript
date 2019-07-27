"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const uuidv4 = require("uuid/v4");
// import sqlite3 = require('sqlite3');
const Rogue = require("./Rogue");
// Local port the server will listen to connections on.
const PORT = 1337;
let app = express();
var server = new http.Server(app);
var io = socketio.listen(server);
app.use('/js', express.static(__dirname + '/public/javascripts'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.get('/map', function (req, res) {
    res.sendFile(__dirname + '/public/map.html');
});
app.get('/test', function (req, res) {
    res.sendFile(__dirname + '/public/Test.html');
});
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
io.on('connection', function (socket) {
    console.log('a user connected');
    var uuid;
    var dungeon;
    var seed;
    function save() {
        // Save the player's info
        if (dungeon && uuid) {
            // TODO: Save new game to database
        }
        socket.emit('debug', 'save succesful');
    }
    socket.on('disconnect', function () {
        console.log('user disconnected.');
        // Save the player's info
        save();
    });
    socket.on('new game', function (name) {
        uuid = uuidv4();
        // Seed for the concurrent floors is based on the initial seed.
        // Choosing a random number 1,000,000 less than max int so player
        // has plenty of floors before they hit max int. Just needs to be a check
        // but this is quick and planning on just being the implementation during testing.
        seed = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER - 1000000));
        dungeon = new Rogue.Dungeon(seed);
        if (name && name != 'Prisoner') {
            dungeon.player.name = name;
        }
        var initialDungeonData = dungeon.getFloorDataForClient({ includePlayerInfo: true });
        initialDungeonData.saveID = uuid;
        socket.emit('dungeon', initialDungeonData);
        //  create table saves(uuid text primary key, playerData text, mapData text);
        // TODO: Save the player info.
    });
    socket.on('load game', function (loadID) {
        // TODO: Load the save game.
    });
    socket.on('request', function (data) {
        switch (data) {
            case 'tileNames':
                socket.emit('tileData', dungeon.getCurrentFloor().generateTileData());
                break;
            case 'floor down':
                dungeon.gotoFloor(dungeon.floorNumber + 1, "up");
                socket.emit('dungeon', dungeon.getFloorDataForClient());
                break;
            case 'floor up':
                dungeon.gotoFloor(dungeon.floorNumber - 1, "down");
                socket.emit('dungeon', dungeon.getFloorDataForClient());
                break;
            case 'name':
                if (dungeon.player.name) {
                    socket.emit('name', dungeon.player.name);
                }
                else {
                    socket.emit('missing', 'name');
                }
                break;
            case 'save':
                save();
                break;
            default:
                console.log('Bad request.\n' + data);
        }
    });
    socket.on('playerTurn', function (playerTurnData) {
        // TODO: Player's turn will consist of player's position, items used, enemy attacked, any object interactions on the map (trap, books, etc.)
        // TODO: World turn will calculate and send any buffs to the player that continue next player turn, enemy damage/attacks/movement, world updates that happen in response to player or enemy (enemies opening doors, setting off traps, secret passages opening), and the new FOV for the player
        if (dungeon) {
            var updatedMapTiles = {};
            if (playerTurnData.x && playerTurnData.y) {
                /* CALCULATING PLAYER'S TURN */
                // COMBAT: Player possible attacks enemy
                /*
                 * var playerAttackingEnemy = dungeon.getCurrentFloor().getEnemyAt(playerTurnData.x, playerTurnData.y);
                if (playerAttackingEnemy && playerAttackingEnemy.health > 0) {
                    // Player tried to move to a tile with an enemy that has health.
                    // Player attacks the enemy.
                    // Player can have different attack values. Ideally this will be affected by their skills. Right now it chooses a random value in their attack array.
                    var playerDamage = dungeon.player.attack[Math.floor(Math.random() * dungeon.player.attack.length)];
                    playerAttackingEnemy.health -= playerDamage;
                } else {
                */
                // If there isn't an alive enemy in the tile, move the player
                dungeon.getCurrentFloor().setPlayerPosition(playerTurnData.x, playerTurnData.y);
                //}
                var currentPlayerPosition = dungeon.getCurrentFloor().getPlayerPosition();
                /*
                dungeon.getCurrentFloor().enemies.forEach(function (element) {
                    if (element.health > 0) {
                        var enemy = new Rogue.Enemy(element.name, element.x, element.y);
                        element.path = enemy.calculateMove(currentPlayerPosition.x, currentPlayerPosition.y, dungeon.getCurrentFloor().map);
                        var moveTo = element.path.shift();
                        if (moveTo) {
                            // COMBAT: Enemy attacks
                            // TODO: Check if enemy still attacks from one tile away.
                            if (moveTo.x == currentPlayerPosition.x && moveTo.y == currentPlayerPosition.y) {
                                // Enemy tried to move on a tile where the player is at.
                                // Counts as enemy attacking player.
                                dungeon.player.health -= element.attack[Math.floor(Math.random() * element.attack.length)];
                                if (dungeon.player.health < 0) {
                                    dungeon.player.health = 0;
                                }
                            } else {
                                // Tile is free of player.
                                // Enemy is able to move to the spot.
                                element.x = moveTo.x;
                                element.y = moveTo.y;
                            }
                        } else {
                            // Should only be called when player is on the enemy. This shouldn't happen
                            // often so we just instantly kill the enemy.
                            element.x = playerTurnData.x;
                            element.y = playerTurnData.y;
                            element.health = 0;

                        }
                        if (dungeon.getCurrentFloor().map.asciiTiles[element.x + ',' + element.y] == '+') {
                            dungeon.getCurrentFloor().map.asciiTiles[element.x + ',' + element.y] = '-';
                            updatedMapTiles[element.x + ',' + element.y] = '-';
                        }
                    }
                });*/
            }
            dungeon.mapAlphaValues();
            if (Object.keys(updatedMapTiles).length > 0) {
                dungeon.player.x = dungeon.getCurrentFloor().playerX;
                dungeon.player.y = dungeon.getCurrentFloor().playerY;
                socket.emit('worldTurn', { enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.getCurrentFloor().getDiffMapExplored(), map: updatedMapTiles, player: dungeon.player });
            }
            else {
                dungeon.player.x = dungeon.getCurrentFloor().playerX;
                dungeon.player.y = dungeon.getCurrentFloor().playerY;
                socket.emit('worldTurn', { enemies: dungeon.getCurrentFloor().enemies, fov: dungeon.getCurrentFloor().getDiffMapExplored(), player: dungeon.player });
            }
        }
        else {
            socket.emit('missing', 'no dungeon');
        }
    });
    socket.on('interact', function () {
        if (dungeon) {
            var nearbyInteractables = dungeon.getPlayerInteractables();
            socket.emit('debug', nearbyInteractables);
        }
        else {
            socket.emit('debug', "Please refresh the page. Progress will be lost. Lost connection to server.");
        }
    });
});
process.stdout.write(String.fromCharCode(27) + "]0;" + "Labyrinthine Flight Server" + String.fromCharCode(7));
server.listen(PORT, function () {
    console.log('Listening on port ' + PORT + '.');
});
process.on('SIGINT', function () {
    console.log('Shuting down...');
    process.exit(0);
});
//# sourceMappingURL=app.js.map