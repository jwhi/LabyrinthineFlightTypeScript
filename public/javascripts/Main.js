'use strict';
/**
 * Main.js
 * 
 * This file will handle:
 *  1. Graphics with PIXI.js
 *  2. Socket.IO calls to the server
 *  3. Local storage
 *  4. User input
 *
 */


/* PIXI.js Aliases */

const Application = PIXI.Application;
const Sprite = PIXI.Sprite;


/* Sprite Constants */

// Size of sprites used on the game map
const TILE_SIZE = 32;

// Size of individual sprites of characters in color-font spritesheets.
const FONT_WIDTH = 24;
const FONT_HEIGHT = 32;

const MAP_WIDTH = 75;
const MAP_HEIGHT = 40;

const APP_WIDTH = MAP_WIDTH * TILE_SIZE;
const APP_HEIGHT = MAP_HEIGHT * TILE_SIZE;


/* User-Input Variables */

// These variables allow players to hold down buttons to help navigate the map faster
let xDirectionHeld = 0;
let yDirectionHeld = 0;
let directionKeyHeld = '';
let timeoutFunction;


/* Sprite Objects */

let loader = new PIXI.Loader();
let resources = loader.resources;

// Map sprites stores all the map sprites currently drawn on the screen
let mapSprites = {};
let characterSprites = {};
let playerSprite = null;

// PIXI can store sprites in a container. This allows all game sprites to be deleted
// and redrawn easily after a player changes floors
let gameTiles = new PIXI.Container();
let infoTiles = new PIXI.Container();

// Stores the PIXI loader for all the map textures, initiated in setup function.
let mapTextures;
let characterTextures;
let gameTextures;

/* Graphic Renderers */

let renderer = new PIXI.Renderer({ width: APP_WIDTH, height: APP_HEIGHT, transparent: true });
let infoRenderer = new PIXI.Renderer({ width: APP_HEIGHT, height: FONT_HEIGHT * 10, transparent: true });


/* App Variables */

// This can equal a function that will be executed in the main application loop.
let state = null;

// Initial screen players will see when the enter a menu is the main game menu.
let menuScreen = 'main';

// Holds the socket that handles communication with the server from Socket.IO. Set in the setup function along with the socket's listening events.
let socket;

// Define Labyrinthine Flight game object, will be assigned when level loads from data with server.
let labyrinthineFlight;

let playerData;

/* Graphics Setup */

let gameApp = new Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    antialias: true,
    transparent: false,
    resolution: 1,
    sharedTicker: true
});

let gameInfoApp = new Application({
    width: APP_WIDTH,
    height: FONT_HEIGHT * 10,
    antialias: true,
    transparent: false,
    resolution: 1,
    sharedTicker: true
});

// Texture loading of font and map sprite sheets. Calls setup function after textures are loaded.
// This currently causes a large number of the warning "pixi.min.js:8 Texture added to the cache with an id 'text-id' that already had an entry"
// This is caused by me using the same texture names in the JSON font files.
// map is all the kenney 1-bit textures used for the map. kenney-1bit.json has player and enemy sprites. needs to be reorganized.
loader.add('kenney-1bit', 'assets/1bit2x-expanded.json')
    .add('map', 'assets/1bit-map.json')
    .add('characters', 'assets/1bit-character.json')
    .add(['assets/orange_font.json', 'assets/white_font.json', 'assets/grey_font.json', 'assets/blue_font.json', 'assets/red_font.json'])
    .load(setup);

/**
 * setup
 * Called after PIXI loads assets.Begin adding functionality for user control.
 * Also where the listener events for socket.io are defined.
 * @returns null
 */
function setup() {
    // Mobile controls are possible but focusing on desktop gameplay first.
    //Capture the keyboard arrow keys
    let left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40),
        period = keyboard(190),
        comma = keyboard(188),
        esc = keyboard(27),
        space = keyboard(32);

    // Arrow keys all call directionPressed and directionReleased
    // Moves player and attacks
    left.press = () => {
        directionPressed('L');
    };
    left.release = () => {
        directionReleased();
    };

    up.press = () => {
        directionPressed('U');
    };
    up.release = () => {
        directionReleased();
    };

    right.press = () => {
        directionPressed('R');
    };
    right.release = () => {
        directionReleased();
    };

    down.press = () => {
        directionPressed('D');
    };
    down.release = () => {
        directionReleased();
    };

    // Keys that navigate stairs.
    period.press = () => {
        useStairs('>');
    };

    comma.press = () => {
        useStairs('<');
    };

    space.press = () => {
        // TODO: Make generic interaction key.
        socket.emit('interact')
        // useStairs();
    }


    /* Socket.IO Data Received Functions */
    // Sending data between server and client handled by Socket.io
    socket = io();

    // When the page receives these packets, update the webpage as needed
    socket.on('debug', function (message) {
        console.log(message);
    });

    socket.on('alert', function (message) {
        alert(message);
    });

    // The dungeon object received from the server. Defined in the server's Rogue.js file
    // Dungeons are only received at the start of games and when player travels up or down a staircase.
    socket.on('dungeon', function (gameData) {
        console.log(gameData);
        /* Clear the screen */
        clearApplication(gameApp);
        clearApplication(gameInfoApp);

        /* Save game data to LabyrinthineFlight object */
        // Info included in gameData
        /*
         *
            map: exactly what is in townData json.
            enemies: null for town implementation phase
            playerX
            playerY
            tileData: not needed anymore since this is included in map.
            fov:
            player = {name, title, health, attack}
        */
        if (gameData.player)
            playerData = gameData.player
        labyrinthineFlight = new LabyrinthineFlight(gameData.map, playerData);

        /*
         * Draw map/player/enemy/item sprites to the screen.
         */
        var spriteToDraw = labyrinthineFlight.getSpriteNames();
        Object.keys(spriteToDraw).forEach(tileLocation => {
            var x, y;
            [x, y] = tileLocation.split(',');
            mapSprites[tileLocation] = placeMapTile(spriteToDraw[tileLocation], x * TILE_SIZE, y * TILE_SIZE);
        });

        // Draw NPCs to the screen
        var charactersToDraw = labyrinthineFlight.getCharacterSprites();
        charactersToDraw.forEach(npc => {
            characterSprites[npc.x + ',' + npc.y] = placeCharacterTile(npc.sprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);
        });

        /*
         * Adjust tint of sprites so it reflects the player's field-of-vision
         */
        updateMapFOV(labyrinthineFlight.getFOV());

        playerSprite = placeCharacterTile('basic_sword_shield', labyrinthineFlight.player.x * TILE_SIZE, labyrinthineFlight.player.y * TILE_SIZE);

        gameApp.stage.addChild(gameTiles);
        gameApp.stage.addChild(playerSprite);
        renderer.render(gameApp.stage);

        // Draw items

        // Draw NPCs

        // Draw enemies

        // Draw player

        /*
         * Display player's info
         * Set application state to 'play'
         */
        state = play;
    });

    // Received after every time a player moves or interacts with object/character.
    socket.on('worldTurn', function (worldTurnData) {
        /**
         * Move and update enemies (health)
         * Update enemy sprites to new position and change tint if damaged
         * Update LabyrinthineFlight map data
         * Update map sprites (open doors)
         * Update player (field-of-vision, health)
         * Update map sprites' tint using player's field-of-vision
         */
        labyrinthineFlight.processServerUpdate(worldTurnData);
        updateMapFOV(labyrinthineFlight.getFOV());
        renderer.render(gameApp.stage);
    });

    socket.on('interactables', function (interactables) {
        if (interactables && JSON.stringify(interactables) != '{}') {
            alert(JSON.stringify(interactables));
            // TODO: Display window with interaction text.
        } else {
            // TODO: Display message that there is nothing to interact with.
        }
    });

    // If the player disconnects from the server, the server will no
    // longer have the player's dungeon data loaded in memory.
    // In order to continue the game, the server needs to discreetly load the user's
    // game save to allow them to keep playing. Displays an error screen if there is
    // an issue and the server can't recover. Once the server finishes loading the game,
    // the user will snap to the location last saved on the server, but then will be
    // able to continue as normal.
    // Loading the game currently causes all previous floors to lose their map data
    // so exploration will be reset and doors will be closed for all floors except the
    // current one.
    socket.on('missing', function (err) {
        /**
         * If server sends error 'no dungeon', emit 'load game' with the game id stored in local variable.
         * If there is save id stored in the local variable, display an error screen.
         * 
         * If the server doesn't have a game with the save id stored locally, server will return the error 'load'
         * Display a different error screen.
         */
    });


    /* Initialize Game Loop and Add Graphic Elements to Page */

    // Start the game loop by adding the `gameLoop` function to
    // PIXI.js `ticker` and providing it with a 'delta' argument
    gameApp.ticker.add(delta => gameLoop(delta));

    // Add the canvases that PIXI.js creates to the HTML page
    // These screens will handle rendering different parts of the game
    document.getElementById('gameScreen').appendChild(renderer.view);
    document.getElementById('gameInfo').appendChild(infoRenderer.view);

    // Resize the game window to the browser window so player does not need to scroll
    // to see the entire game board or find where the player is on the screen.
    resize();

    // mapTextures and characterTextures are aliases for all the texture atlas frame id textures
    mapTextures = resources['map'].textures;
    characterTextures = resources['characters'].textures;
    /**
     * Direct the application to go to the main menu
     * From the main menu players can select:
     *  1. New Game: Quickly start a new game with a new dungeon
     *  2. Load Game: Return to a previous game that is in browser's local storage
    */
    socket.emit('new game');
}

/**
 * gameLoop
 * The main loop of the PIXI app. Runs the function assigned to the state variable,
 * e.g. play, with the delta time
 * @param delta
 */
function gameLoop(delta) {
    // State should not exist until the level or menu is loaded.
    // Prevents the player taking control before the game is ready.
    if (state)
        state(delta);
}

// Function that is called to draw menu text/sprites
function updateMenu() {
    /**
     * Adds menu text for main or load menu
     * Creates cursor to select options
     * Adds option for user to load game from save id not stored in local storage
     */
}

// Main state loop when a user is on the menu before a game begins.
function menu(delta) {
    /**
     * Move cursor when user presses arrow keys
     * If user selects 'new game', emit 'new game' to server to begin process of creating a new game
     * If user selects 'load game', update menu to display previous games
     */
}

/**
 * play
 * Main state loop when game is being played.
 * The function is called every frame, but should only updates when the user provides input.
 * @param delta
 */
function play(delta) {
    /**
     * 1. Wait for player to perform valid action (move, attack, interact)
     * 2. When a player presses move key:
     *      a. Check if tile is walkable. Move player if empty.
     *      b. Update tile player moved to if needed (open door)
     *      c. Attack if an enemy occupies tile with the player's equipped weapon
     * 3. Interaction key is pressed:
     *      a. Check 8 tiles around player and tile player is on.
     *      b. If only 1 interactive object, do default action on object (talk, pickup, open, read)
     *      c. If multiple objects, prompt user to pick.
     * 4. Update player and map sprites if needed
     * 5. Update server when player performs valid option
     *      a. Retrieves data from server for interaction (if not stored locally)
     *      b. End's player turn if player moved or attacked and will have server return enemy movements and other updates. 
     */
    if (playerSprite.vx || playerSprite.vy) {
        // heldButtonDelay is used in the directionHeld helper function.
        // Declaring up here so only call playerDistanceFromEnemy once which decides if the player
        // has to wait for the server before moving.
        // The speed the player moves while holding down varies when there is an enemy close to them.
        var heldButtonDelay = 170;

        if (labyrinthineFlight.playerCanWalk(playerSprite.vx, playerSprite.vy)) {
            var playerX;
            var playerY;
            [playerX, playerY] = labyrinthineFlight.playerMovement(playerSprite.vx, playerSprite.vy);
            playerSprite.x = playerX * TILE_SIZE;
            playerSprite.y = playerY * TILE_SIZE;
            socket.emit('playerTurn', { x: playerX, y: playerY });
            while (labyrinthineFlight.updatedSprites.length > 0) {
                var tileLocation = labyrinthineFlight.updatedSprites.pop();
                var x, y;
                [x, y] = tileLocation.split(',');
                mapSprites[tileLocation].texture = mapTextures[labyrinthineFlight.getSpriteName(x, y)];
            }

            renderer.render(gameApp.stage);

            if (directionKeyHeld) {
                xDirectionHeld = playerSprite.vx;
                yDirectionHeld = playerSprite.vy;
                timeoutFunction = setTimeout(function () {
                    playerSprite.vx = xDirectionHeld;
                    playerSprite.vy = yDirectionHeld;
                    xDirectionHeld = 0;
                    yDirectionHeld = 0;
                    //ticker.start();

                }, heldButtonDelay);
            }
            playerSprite.vx = 0;
            playerSprite.vy = 0;
        }
    }
}

function placeMapTile(tileName, x, y) {
    return placeTile(gameTiles, mapTextures, tileName, x, y);
}

function placeCharacterTile(tileName, x, y) {
    return placeTile(gameTiles, characterTextures, tileName, x, y);
}

/**
 * placeTile
 * @param {PIXI.Container} spriteContainer PIXI container to draw the application.
 * @param {!Object<Sprite>} textureResource Map with keys assigned to Sprite objects in texture atlas. 
 * @param {string} tileName Name of the tile to be drawn. Can be found in the sprite sheets JSON
 * @param {number} x The X position the tile will be drawn on the PIXI application window
 * @param {number} y The Y position the tile will be drawn on the PIXI application window
 * @returns the placed tile so the tile can be assigned to a list to allow the alpha value to be updated.
 */
function placeTile(spriteContainer, textureResource, tileName, x, y) {
    var tile = new Sprite(textureResource[tileName]);
    if (tile) {
        tile.position.set(x, y);
        tile.alpha = 1;
        spriteContainer.addChild(tile);
    }
    return tile;
}

function updateMapFOV(tileValues) {
    var valueToTintDict = {
        1: 0xFFFFFF, // Tile with value 1 is fully visible and is currently in player's field-of-vision
        0.4: 0x333333 // Tile with value 0.4 is a previously explored tile that is NOT currently in player's field-of-vision.
    }
    Object.keys(tileValues).forEach(tileLocation => {
        var t = mapSprites[tileLocation];
        var c = characterSprites[tileLocation];
        if (t) {
            if (tileValues[tileLocation] != 0) {
                t.alpha = 1;
                t.tint = valueToTintDict[tileValues[tileLocation]];

            } else {
                t.alpha = 0;
            }
        }
        if (c) {
            if (tileValues[tileLocation] == 1) {
                c.alpha = 1;
            } else {
                c.alpha = 0;
            }
        }
    });
}

/**
 * clearApplication
 * Removes all sprites from the PIXI.js application. This is used whenever the
 * map needs to update when the player changes levels or whenever a new screen
 * needs to be created.
 * @param {PIXI.Application} app 
 */
function clearApplication(app) {
    app.stage.children.forEach(c => {
        c.removeChildren();
    });
    app.stage.removeChildren();
}

/**
 * keyboard
 * Modified from code that appears in the PIXI tutorial.
 * https://github.com/kittykatattack/learningPixi#textureatlas
 * @param keyCode
 */
function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        'keydown', key.downHandler.bind(key), false
    );
    window.addEventListener(
        'keyup', key.upHandler.bind(key), false
    );
    return key;
}

// The directionPressed and directionReleased functions handle clearing the timeout function
// which allows players hold down a direction instead of having to press the key every time they want to move
function directionReleased() {
    var inputObject;
    if (state == menu) {
        inputObject = menuInput;
    } else {
        inputObject = playerSprite;
    }
    clearTimeout(timeoutFunction);
    directionKeyHeld = '';
    inputObject.vx = 0;
    inputObject.vy = 0;
}
function directionPressed(direction) {
    // Start the ticker once a direction is pressed if manually controlling pixi ticker.
    //ticker.start();
    clearTimeout(timeoutFunction);
    var inputObject;
    if (state == menu) {
        inputObject = menuInput;
    } else {
        inputObject = playerSprite;
    }
    if (direction != directionKeyHeld) {
        directionKeyHeld = direction;
        switch (direction) {
            case 'U':
                inputObject.vy = -1;
                inputObject.vx = 0;
                break;
            case 'D':
                inputObject.vy = 1;
                inputObject.vx = 0;
                break;
            case 'L':
                inputObject.vx = -1;
                inputObject.vy = 0;
                break;
            case 'R':
                inputObject.vx = 1;
                inputObject.vy = 0;
                break;
            default:
                directionReleased();
                break;
        }
    }
}


/**
 * resize
 * Code taken from stack overflow question that linked the js fiddle example.
 * http://jsfiddle.net/2wjw043f/
 * https://stackoverflow.com/questions/30554533/dynamically-resize-the-pixi-stage-and-its-contents-on-window-resize-and-window
 * This function allows the PIXI application window to resize to fit the browser window.
 */
function resize() {
    var ratio = APP_WIDTH / APP_HEIGHT;

    if (window.innerWidth / window.innerHeight >= ratio) {
        var w = window.innerHeight * ratio;
        var h = window.innerHeight;
    } else {
        var w = window.innerWidth;
        var h = window.innerWidth / ratio;
    }
    renderer.view.style.width = w * 0.8 + 'px';
    renderer.view.style.height = h * 0.8 + 'px';


    window.onresize = function (event) {
        resize();
    };
}

// keyPressed reflects whether '.' or ',' was pressed by user
// '>' gets passed in for '.'; '<' gets passed in for ',';
// Don't need to have distinction, but most desktop roguelikes have the two seperate
// stairs buttons for up or down so I figured I should too for desktop controls.
// If no key is passed in, function just uses whatever tile at player's position
/**
 * useStairs
 * Called whenever the user presses the 'Use Stairs' button or pressed the button
 * on the keyboard that corresponds to the stairs up or stairs down. Function will
 * request the floor above or below from the sever based on the tile the player is
 * standing on. While waiting for the server to respond, a 'Loading' screen will be
 * loaded. keyPressed should be '>' if a '.' was pressed and a '<' if a ',' is pressed.
 * @param keyPressed The key on the keyboard the use pressed. Null when use presses the button.
 */
function useStairs(keyPressed) {
    // TODO: prevent player from moving after request for new floor is send. Maybe switch
    // to a loading screen until new floor arrives.
    console.log('stairs');
    console.log(keyPressed);
    if (!keyPressed) {
        keyPressed = labyrinthineFlight.getTileAtPlayer().ascii;
    }
    if (keyPressed === labyrinthineFlight.getTileAtPlayer().ascii) {
        if (keyPressed === '>') {
            socket.emit('request', 'floor down');
        } else if (keyPressed === '<') {
            socket.emit('request', 'floor up');
        }
    }
}
