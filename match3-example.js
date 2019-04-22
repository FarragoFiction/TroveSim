// ------------------------------------------------------------------------
// How To Make A Match-3 Game With HTML5 Canvas
// Copyright (c) 2015 Rembound.com
// 
// This program is free software: you can redistribute it and/or modify  
// it under the terms of the GNU General Public License as published by  
// the Free Software Foundation, either version 3 of the License, or  
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,  
// but WITHOUT ANY WARRANTY; without even the implied warranty of  
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the  
// GNU General Public License for more details.  
// 
// You should have received a copy of the GNU General Public License  
// along with this program.  If not, see http://www.gnu.org/licenses/.
//
// http://rembound.com/articles/how-to-make-a-match3-game-with-html5-canvas
// ------------------------------------------------------------------------
Math.seed = getRandomSeed();  //can be overwritten on load
var initial_seed = Math.seed;

function convertSentenceToNumber(sentence) {
  var ret = 0;
  for(var i =0; i<sentence.length; i++) {
    const s = sentence.charCodeAt(i);
    ret += s;
  }
  return ret;
}

function getRandomSeed() {
	//console.log("getting a random seed, probably to reinit the seed")
	var min = 0;
	var max = 413*612*1025;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

////https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use if i want to have more possible sessions, use 2^32 or 2^64. see wiki
//have modulus be 2^32 (4294967296), a = 1664525, c = 1013904223
Math.seededRandom = function(max, min){
	/*random_number = (lcg.previous * a + c) % modulus
    lcg.previous = random_number
    return random_number
	*/
	max = max || 1;
    min = min || 0;
	Math.seed = (Math.seed * 1664525 + 1013904223) % 4294967296;
    var rnd = Math.seed / 4294967296;

    return min + rnd * (max - min);
}

function getRandomInt(min, max) {
    return Math.floor(Math.seededRandom() * (max - min + 1)) + min;
}

function getRandomElementFromArray(array){
	var min = 0;
	var max = array.length-1;
	var i = Math.floor(Math.seededRandom() * (max - min + 1)) + min;
	return array[i];
}

// The function gets called when the window is fully loaded
window.onload = function() {
    // Get the canvas and context
    const gigglesnort = document.getElementById("gigglesnort");

    const blank = document.getElementById("blank");
    const balloon = document.getElementById("balloon");
    const clover = document.getElementById("clover");
    const diamond = document.getElementById("diamond");
    const heart = document.getElementById("heart");
    const horseshoe = document.getElementById("horseshoe");
    const moon = document.getElementById("moon");
    const potofgold = document.getElementById("potofgold");
    const rainbow = document.getElementById("rainbow");
    const star = document.getElementById("star");

    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");

    var currentTrove;
    // Timing and frames per second
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    
    // Mouse dragging
    var drag = false;
    
    // Level object
    var level = {
        x: 250,         // X position
        y: 113,         // Y position
        columns: 8,     // Number of tile columns
        rows: 8,        // Number of tile rows
        tilewidth: 40,  // Visual width of a tile
        tileheight: 40, // Visual height of a tile
        tiles: [],      // The two-dimensional tile array
        selectedtile: { selected: false, column: 0, row: 0 }
    };
    
    var tileTypes = [balloon, clover, diamond, heart, horseshoe, moon, potofgold, rainbow, star];

    // Clusters and moves that were found
    var clusters = [];  // { column, row, length, horizontal }
    var moves = [];     // { column1, row1, column2, row2 }

    // Current move
    var currentmove = { column1: 0, row1: 0, column2: 0, row2: 0 };
    
    // Game states
    var gamestates = { init: 0, ready: 1, resolve: 2 };
    var gamestate = gamestates.init;
    
    // Score
    var score = 0;
    
    // Animation variables
    var animationstate = 0;
    var animationtime = 0;
    var animationtimetotal = 0.3;
    
    // Show available moves
    var showmoves = false;
    
    // The AI bot
    var aibot = false;
    
    // Game Over
    var gameover = false;
    
    // Gui buttons
    var buttons = [ { x: 30, y: 240, width: 150, height: 50, text: "New Game"},
                    { x: 30, y: 300, width: 150, height: 50, text: "Show Moves"},
                    { x: 30, y: 360, width: 150, height: 50, text: "Enable AI Bot"}];
    
    // Initialize the game
    function init() {
        // Add mouse events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
        
        // Initialize the two-dimensional tile array
        for (var i=0; i<level.columns; i++) {
            level.tiles[i] = [];
            for (var j=0; j<level.rows; j++) {
                // Define a tile type and a shift parameter for animation
                level.tiles[i][j] = { type: 0, shift:0 }
            }
        }
        
        // New game
        newGame();
        
        // Enter main loop
        main(0);
    }
    
    // Main loop
    function main(tframe) {
        // Request animation frames
        window.requestAnimationFrame(main);
        
        // Update and render the game
        update(tframe);
        render();
    }
    
    // Update the game state
    function update(tframe) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        // Update the fps counter
        updateFps(dt);
        
        if (gamestate == gamestates.ready) {
            // Game is ready for player input
            
            // Check for game over
            if (moves.length <= 0) {
                gameover = true;
            }
            
            // Let the AI bot make a move, if enabled
            if (aibot) {
                animationtime += dt;
                if (animationtime > animationtimetotal) {
                    // Check if there are moves available
                    findMoves();
                    
                    if (moves.length > 0) {
                        // Get a random valid move
                        var move = moves[Math.floor(Math.random() * moves.length)];
                        
                        // Simulate a player using the mouse to swap two tiles
                        mouseSwap(move.column1, move.row1, move.column2, move.row2);
                    } else {
                        // No moves left, Game Over. We could start a new game.
                        // newGame();
                    }
                    animationtime = 0;
                }
            }
        } else if (gamestate == gamestates.resolve) {
            // Game is busy resolving and animating clusters
            animationtime += dt;
            
            if (animationstate == 0) {
                // Clusters need to be found and removed
                if (animationtime > animationtimetotal) {
                    // Find clusters
                    findClusters();
                    
                    if (clusters.length > 0) {
                        // Add points to the score
                        for (var i=0; i<clusters.length; i++) {
                            // Add extra points for longer clusters
                            score += 100 * (clusters[i].length - 2);;
                        }
                    
                        // Clusters found, remove them
                        removeClusters();
                        
                        // Tiles need to be shifted
                        animationstate = 1;
                    } else {
                        // No clusters found, animation complete
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate == 1) {
                // Tiles need to be shifted
                if (animationtime > animationtimetotal) {
                    // Shift tiles
                    shiftTiles();
                    
                    // New clusters need to be found
                    animationstate = 0;
                    animationtime = 0;
                    
                    // Check if there are new clusters
                    findClusters();
                    if (clusters.length <= 0) {
                        // Animation complete
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate == 2) {
                // Swapping tiles animation
                if (animationtime > animationtimetotal) {
                    // Swap the tiles
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    
                    // Check if the swap made a cluster
                    findClusters();
                    if (clusters.length > 0) {
                        // Valid swap, found one or more clusters
                        // Prepare animation states
                        animationstate = 0;
                        animationtime = 0;
                        gamestate = gamestates.resolve;
                    } else {
                        // Invalid swap, Rewind swapping animation
                        animationstate = 3;
                        animationtime = 0;
                    }
                    
                    // Update moves and clusters
                    findMoves();
                    findClusters();
                }
            } else if (animationstate == 3) {
                // Rewind swapping animation
                if (animationtime > animationtimetotal) {
                    // Invalid swap, swap back
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    
                    // Animation complete
                    gamestate = gamestates.ready;
                }
            }
            
            // Update moves and clusters
            findMoves();
            findClusters();
        }
    }
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculate fps
            fps = Math.round(framecount / fpstime);
            
            // Reset time and framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Increase time and framecount
        fpstime += dt;
        framecount++;
    }
    
    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }
    
    // Render the game
    function render() {
        // Draw the frame
        drawFrame();
        
        // Draw score
        context.fillStyle = "#000000";
        context.font = "24px Verdana";
        drawCenterText("Score:", 30, level.y+40, 150);
        drawCenterText(score, 30, level.y+70, 150);
        
        // Draw buttons
        drawButtons();
        
        // Draw level background
        var levelwidth = level.columns * level.tilewidth;
        var levelheight = level.rows * level.tileheight;
        context.fillStyle = "#000000";
        context.fillRect(level.x - 4, level.y - 4, levelwidth + 8, levelheight + 8);
        
        // Render tiles
        renderTiles();
        
        // Render clusters
        renderClusters();
        
        // Render moves, when there are no clusters
        if (showmoves && clusters.length <= 0 && gamestate == gamestates.ready) {
            renderMoves();
        }
        
        // Game Over overlay
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelwidth, levelheight);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Game Over!", level.x, level.y + levelheight / 2 + 10, levelwidth);
        }
    }
    
    // Draw a frame with a border
    function drawFrame() {
        // Draw background and a border
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#e8eaec";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);
        
        // Draw header
        context.fillStyle = "#303030";
        context.fillRect(0, 0, canvas.width, 65);
        
        // Draw title
        context.fillStyle = "#ffffff";
        context.font = "24px Verdana";
        context.fillText("Match3 Example - Rembound.com", 10, 30);
        
        // Display fps
        context.fillStyle = "#ffffff";
        context.font = "12px Verdana";
        context.fillText("Fps: " + fps, 13, 50);
    }
    
    // Draw buttons
    function drawButtons() {
        for (var i=0; i<buttons.length; i++) {
            // Draw button shape
            context.fillStyle = "#000000";
            context.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);
            
            // Draw button text
            context.fillStyle = "#ffffff";
            context.font = "18px Verdana";
            var textdim = context.measureText(buttons[i].text);
            context.fillText(buttons[i].text, buttons[i].x + (buttons[i].width-textdim.width)/2, buttons[i].y+30);
        }
    }
    
    // Render tiles
    function renderTiles() {
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                // Get the shift of the tile for animation
                var shift = level.tiles[i][j].shift;
                
                // Calculate the tile coordinates
                var coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);
                
                // Check if there is a tile present
                if (level.tiles[i][j].type >= 0) {
                    // Get the color of the tile
                    var col = tileTypes[level.tiles[i][j].type];
                    
                    // Draw the tile using the color
                    drawTile(coord.tilex, coord.tiley, col);
                }
                
                // Draw the selected tile
                if (level.selectedtile.selected) {
                    if (level.selectedtile.column == i && level.selectedtile.row == j) {
                        // Draw a red tile
                        drawBox(coord.tilex, coord.tiley, 255, 0, 0);
                    }
                }
            }
        }
        
        // Render the swap animation
        if (gamestate == gamestates.resolve && (animationstate == 2 || animationstate == 3)) {
            // Calculate the x and y shift
            var shiftx = currentmove.column2 - currentmove.column1;
            var shifty = currentmove.row2 - currentmove.row1;

            // First tile
            var coord1 = getTileCoordinate(currentmove.column1, currentmove.row1, 0, 0);
            var coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1, (animationtime / animationtimetotal) * shiftx, (animationtime / animationtimetotal) * shifty);
            var col1 = tileTypes[level.tiles[currentmove.column1][currentmove.row1].type];
            
            // Second tile
            var coord2 = getTileCoordinate(currentmove.column2, currentmove.row2, 0, 0);
            var coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2, (animationtime / animationtimetotal) * -shiftx, (animationtime / animationtimetotal) * -shifty);
            var col2 = tileTypes[level.tiles[currentmove.column2][currentmove.row2].type];
            
            // Draw a black background
            drawBox(coord1.tilex, coord1.tiley, 0,0,0);
            drawBox(coord2.tilex, coord2.tiley, 0,0,0);
            
            // Change the order, depending on the animation state
            if (animationstate == 2) {
                // Draw the tiles
                drawTile(coord1shift.tilex, coord1shift.tiley, col1);
                drawTile(coord2shift.tilex, coord2shift.tiley, col2);
            } else {
                // Draw the tiles
                drawTile(coord2shift.tilex, coord2shift.tiley, col2);
                drawTile(coord1shift.tilex, coord1shift.tiley, col1);
            }
        }
    }
    
    // Get the tile coordinate
    function getTileCoordinate(column, row, columnoffset, rowoffset) {
        var tilex = level.x + (column + columnoffset) * level.tilewidth;
        var tiley = level.y + (row + rowoffset) * level.tileheight;
        return { tilex: tilex, tiley: tiley};
    }
    
    // Draw a tile with a color
    function drawTile(x, y, tile) {
        context.drawImage(tile, x+2, y+2, level.tilewidth -4, level.tileheight -4);
        //context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        //context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
    }

     function drawBox(x, y, tile,r,g,b) {
            context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
        }
    
    // Render clusters
    function renderClusters() {
        for (var i=0; i<clusters.length; i++) {
            // Calculate the tile coordinates
            var coord = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);
            
            if (clusters[i].horizontal) {
                // Draw a horizontal line
                context.fillStyle = "#00ff00";
                context.fillRect(coord.tilex + level.tilewidth/2, coord.tiley + level.tileheight/2 - 4, (clusters[i].length - 1) * level.tilewidth, 8);
            } else {
                // Draw a vertical line
                context.fillStyle = "#0000ff";
                context.fillRect(coord.tilex + level.tilewidth/2 - 4, coord.tiley + level.tileheight/2, 8, (clusters[i].length - 1) * level.tileheight);
            }
        }
    }
    
    // Render moves
    function renderMoves() {
        gigglesnort.innerHTML = "";
        for (var i=0; i<moves.length; i++) {
            // Calculate coordinates of tile 1 and 2
            var coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
            var coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);
            
            // Draw a line from tile 1 to tile 2
            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(coord1.tilex + level.tilewidth/2, coord1.tiley + level.tileheight/2);
            context.lineTo(coord2.tilex + level.tilewidth/2, coord2.tiley + level.tileheight/2);
            context.stroke();
        }
    }
    
    // Start a new game
    function newGame() {
        // Reset score
        score = 0;
        
        // Set the gamestate to ready
        gamestate = gamestates.ready;
        
        // Reset game over
        gameover = false;
        
        // Create the level
        createLevel();
        
        // Find initial clusters and moves
        findMoves();
        findClusters(); 
    }
    
    // Create a random level
    function createLevel() {
        var done = false;
        
        // Keep generating levels until it is correct
        while (!done) {
        
            // Create a level with random tiles
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }
            
            // Resolve the clusters
            resolveClusters();
            
            // Check if there are valid moves
            findMoves();
            
            // Done when there is a valid move
            if (moves.length > 0) {
                done = true;
            }
        }
    }
    
    // Get a random tile
    function getRandomTile() {
        return Math.floor(Math.random() * tileTypes.length);
    }
    
    // Remove clusters and insert tiles
    function resolveClusters() {
        // Check for clusters
        findClusters();
        
        // While there are clusters left
        while (clusters.length > 0) {
        
            // Remove clusters
            removeClusters();
            
            // Shift tiles
            shiftTiles();
            
            // Check if there are clusters left
            findClusters();
        }
    }

    function findClustersNew(){
        //verticals aren't troves, you filthy casual
        return findHorizontalClusters();

    }

    function findHorizontalClusters(){
        clusters = []
        // clusters.push({ matchType: matchType, column: i+1-matchlength, row:j,
                                   //               length: matchlength, horizontal: true });
        for (var j=0; j<level.rows; j++) {
            // Start with a single tile, cluster of 1
            var currentSet = [];
            var matchlength = 1;
            for (var i=0; i<level.columns; i++) {
                const currentTile = tileTypes[level.tiles[i][j].type];
                console.log("current tile is ", currentTile, "and currentSet is ", currentSet, "is tile in the set? ", currentSet.includes(currentTile));
                if(currentSet.includes(currentTile)){
                    const matchLength = currentSet.length;
                    //console.log("match length is: ", matchLength); this always prints out 7 this is wrong, but if i do || the end it infinite loops because i'm an idiot
                    if(currentSet.length >=3){
                        clusters.push({currentSet: currentSet, column: i+1-matchlength, row:j, length: matchlength, horizontal: true  });
                    }
                    currentSet = [];
                }else{
                    currentSet.push(currentTile);
                }
            }
        }
        return clusters;
    }

 // Find clusters in the level
     function findClusters() {
         // Reset clusters
         clusters = []

         // Find horizontal clusters
         for (var j=0; j<level.rows; j++) {
             // Start with a single tile, cluster of 1
             var matchlength = 1;
             for (var i=0; i<level.columns; i++) {
                 var checkcluster = false;

                 if (i == level.columns-1) {
                     // Last tile
                     checkcluster = true;
                 } else {
                     // Check the type of the next tile
                     //jr hack is that everything BUT things that match should hit
                     if (level.tiles[i][j].type == level.tiles[i+1][j].type &&
                         level.tiles[i][j].type != -1) {
                         // Same type as the previous tile, increase matchlength
                         //matchlength += 1;
                         //checkcluster = true;

                     } else {
                         // Different type
                         checkcluster = true;
                         matchlength += 1;
                     }
                 }

                 // Check if there was a cluster
                 if (checkcluster) {
                     if (matchlength >=3) {
                         // Found a horizontal cluster
                         clusters.push({column: i+1-matchlength, row:j,
                                         length: matchlength, horizontal: true });
                     }

                     matchlength = 1;
                 }
             }
         }

         // Find vertical clusters
         for (var i=0; i<level.columns; i++) {
             // Start with a single tile, cluster of 1
             var matchlength = 1;
             for (var j=0; j<level.rows; j++) {
                 var checkcluster = false;

                 if (j == level.rows-1) {
                     // Last tile
                     checkcluster = true;
                 } else {
                     // Check the type of the next tile
                     if (level.tiles[i][j].type == level.tiles[i][j+1].type &&
                         level.tiles[i][j].type != -1) {
                         // Same type as the previous tile, increase matchlength
                         matchlength += 1;
                     } else {
                         // Different type
                         checkcluster = true;
                     }
                 }

                 // Check if there was a cluster
                 if (checkcluster) {
                     if (matchlength == 1) {
                         // Found a vertical cluster
                         clusters.push({ column: i, row:j+1-matchlength,
                                         length: matchlength, horizontal: false });
                     }

                     matchlength = 1;
                 }
             }
         }
     }
    
    // Find available moves
    function findMoves() {
        // Reset moves
        moves = []
        
        // Check horizontal swaps
        for (var j=0; j<level.rows; j++) {
            for (var i=0; i<level.columns-1; i++) {
                // Swap, find clusters and swap back
                swap(i, j, i+1, j);
                findClusters();
                swap(i, j, i+1, j);
                
                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({clusters: clusters.slice(0), column1: i, row1: j, column2: i+1, row2: j});
                }
            }
        }
        
        // Check vertical swaps
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows-1; j++) {
                // Swap, find clusters and swap back
                swap(i, j, i, j+1);
                findClusters();
                swap(i, j, i, j+1);
                
                // Check if the swap made a cluster
                if (clusters.length > 0) {
                    // Found a move
                    moves.push({clusters: clusters.slice(0), column1: i, row1: j, column2: i, row2: j+1});
                }
            }
        }

        // Reset clusters
        clusters = []
    }
    
    // Loop over the cluster tiles and execute a function
    function loopClusters(func) {
        for (var i=0; i<clusters.length; i++) {
            //  { column, row, length, horizontal }
            var cluster = clusters[i];
            var coffset = 0;
            var roffset = 0;
            for (var j=0; j<cluster.length; j++) {
                func(i, cluster.column+coffset, cluster.row+roffset, cluster);
                
                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }
    
    // Remove the clusters
    function removeClusters() {
        // Change the type of the tiles to -1, indicating a removed tile
        currentTrove = [];
        gigglesnort.innerHTML = "Current Trove: ";
        loopClusters(function(index, column, row, cluster) {
            currentTrove.push(tileTypes[level.tiles[column][row].type]);
            level.tiles[column][row].type = -1;
         });

        // Calculate how much a tile should be shifted downwards
        for (var i=0; i<level.columns; i++) {
            var shift = 0;
            for (var j=level.rows-1; j>=0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type == -1) {
                    // Tile is removed, increase shift
                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    level.tiles[i][j].shift = shift;
                }
            }
        }

        Math.seed = 0
        for(var i = 0; i< currentTrove.length; i++){
            const troveImage = currentTrove[i];
            var newImage = document.createElement("img");
            newImage.setAttribute('src', troveImage.src);
            Math.seed += convertSentenceToNumber(troveImage.src);
            console.log("seed is ", Math.seed);
            gigglesnort.appendChild(newImage);
        }
        gigglesnort.innerHTML += "<Br><h2>" + getRandomElementFromArray(bullshit) +"</h2>";

    }
    
    // Shift tiles and insert new tiles
    function shiftTiles() {
        // Shift tiles
        for (var i=0; i<level.columns; i++) {
            for (var j=level.rows-1; j>=0; j--) {
                // Loop from bottom to top
                if (level.tiles[i][j].type == -1) {
                    // Insert new random tile
                    level.tiles[i][j].type = getRandomTile();
                } else {
                    // Swap tile to shift it
                    var shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j+shift)
                    }
                }
                
                // Reset shift
                level.tiles[i][j].shift = 0;
            }
        }
    }
    
    // Get the tile under the mouse
    function getMouseTile(pos) {
        // Calculate the index of the tile
        var tx = Math.floor((pos.x - level.x) / level.tilewidth);
        var ty = Math.floor((pos.y - level.y) / level.tileheight);
        
        // Check if the tile is valid
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {
            // Tile is valid
            return {
                valid: true,
                x: tx,
                y: ty
            };
        }
        
        // No valid tile
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }
    
    // Check if two tiles can be swapped
    function canSwap(x1, y1, x2, y2) {
        // Check if the tile is a direct neighbor of the selected tile
        if ((Math.abs(x1 - x2) == 1 && y1 == y2) ||
            (Math.abs(y1 - y2) == 1 && x1 == x2)) {
            return true;
        }
        
        return false;
    }
    
    // Swap two tiles in the level
    function swap(x1, y1, x2, y2) {
        var typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }
    
    // Swap two tiles as a player action
    function mouseSwap(c1, r1, c2, r2) {
        // Save the current move
        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};
    
        // Deselect
        level.selectedtile.selected = false;
        
        // Start animation
        animationstate = 2;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }
    
    // On mouse movement
    function onMouseMove(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        
        // Check if we are dragging with a tile selected
        if (drag && level.selectedtile.selected) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);
            if (mt.valid) {
                // Valid tile
                
                // Check if the tiles can be swapped
                if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){
                    // Swap the tiles
                    mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                }
            }
        }
    }
    
    // On mouse button click
    function onMouseDown(e) {
        // Get the mouse position
        var pos = getMousePos(canvas, e);
        
        // Start dragging
        if (!drag) {
            // Get the tile under the mouse
            mt = getMouseTile(pos);
            
            if (mt.valid) {
                // Valid tile
                var swapped = false;
                if (level.selectedtile.selected) {
                    if (mt.x == level.selectedtile.column && mt.y == level.selectedtile.row) {
                        // Same tile selected, deselect
                        level.selectedtile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){
                        // Tiles can be swapped, swap the tiles
                        mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                        swapped = true;
                    }
                }
                
                if (!swapped) {
                    // Set the new selected tile
                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {
                // Invalid tile
                level.selectedtile.selected = false;
            }

            // Start dragging
            drag = true;
        }
        
        // Check if a button was clicked
        for (var i=0; i<buttons.length; i++) {
            if (pos.x >= buttons[i].x && pos.x < buttons[i].x+buttons[i].width &&
                pos.y >= buttons[i].y && pos.y < buttons[i].y+buttons[i].height) {
                
                // Button i was clicked
                if (i == 0) {
                    // New Game
                    newGame();
                } else if (i == 1) {
                    // Show Moves
                    showmoves = !showmoves;
                    buttons[i].text = (showmoves?"Hide":"Show") + " Moves";
                } else if (i == 2) {
                    // AI Bot
                    aibot = !aibot;
                    buttons[i].text = (aibot?"Disable":"Enable") + " AI Bot";
                }
            }
        }
    }
    
    function onMouseUp(e) {
        // Reset dragging
        drag = false;
    }
    
    function onMouseOut(e) {
        // Reset dragging
        drag = false;
    }
    
    // Get the mouse position
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    
    // Call init to start the game
    init();
};


const bullshit = ["Lizards are reptiles.",
                  "Some lizards can detach their tails if caught by predators.",
                  "The upper and lower eyelids of chameleons are joined, leaving just a small hole for them to see through. They can move their eyes independently however, allowing them to look in two different directions at the same time.",
                  "Chameleons have long tongues which they rapidly extend from their mouth, too fast for human eyes to see properly.",
                  "Chameleons generally eat insects.",
                  "Some chameleons have the ability to change color. This helps them communicate with each other and can also be used for camouflage.",
                  "Geckos have no eyelids.",
                  "Geckos have unique toes which allow them to be good climbers.",
                  "Iguanas have a row of spines which run down their back and tail.",
                  "Green iguanas are popular pets.",
                  "The Komodo dragon is the largest type of lizard, growing up to 3 metres (10 feet) in length.",
                  "They are found on a number of different Indonesian Islands.",
                  "Komodo dragons are carnivores (meat eaters) and can be very aggressive.",
                  "What is a lizard? Lizards are part of a group of animals known as reptiles.",
                  " They are most closely related to snakes.",
                  " In fact, some lizards, called sheltopusiks, look like snakes because they have no legs! Many lizards today resemble the ancient reptiles of the dinosaur era.",
                  " Their ancestors appeared on Earth over 200 million years ago.",
                  "In general, lizards have a small head, short neck, and long body and tail.",
                  " Unlike snakes, most lizards have moveable eyelids.",
                  " There are currently over 4,675 lizard species, including iguanas, chameleons, geckos, Gila monsters, monitors, and skinks.",
                  "Banded Knob-tailed gecko",
                  "Geckos, like this banded-knob tailed gecko, have clear membrane shields over their eyes in lieu of eyelids.",
                  "Most lizards have eyelids, just like we do, that clean and protect their eyes when they blink.",
                  " But some lizards, like geckos, can’t blink! Instead, they have a clear membrane that shields their eyes from dirt or bright sun and use their tongue to clean their eyes.",
                  " Many lizards, such as iguanas, can see in color.",
                  " Their colorful body parts allow them to communicate with each other and help them tell which are male and which are female.",
                  "Blue-tongued skink walking on grass",
                  "Blue-tongued skink using his eponymous tongue to smell.",
                  "Lizards smell stuff with their tongues! Just like snakes, a lizard sticks out its tongue to catch scent particles in the air and then pulls back its tongue and places those particles on the roof of its mouth, where there are special sensory cells.",
                  " The lizard can use these scent “clues” to find food or a mate or to detect enemies.",
                  "Lizards don’t have earflaps like mammals do.",
                  " Instead, they have visible ear openings to catch sound, and their eardrums are just below the surface of their skin.",
                  " Even so, lizards can’t hear as well as we do, but their hearing is better than that of snakes.",
                  "Lizards have dry, scaly skin that does not grow with their bodies.",
                  " Instead, most lizards shed, or molt, their old skin in large flakes to make way for the new skin growth underneath.",
                  " The exception to this is with the alligator lizard, which may shed its skin in one piece, like a snake.",
                  " The scales on lizards vary, depending on their habitat.",
                  " Skinks have smooth scales so mud won’t cling to them; some lizard species have bony plates, called osteoderms, under their scales for added protection against rough terrain.",
                  "Lizards are popular prey for many types of predators, from birds of prey to snakes and carnivorous mammals.",
                  " Their camouflage and ability to stay still for hours helps keep them safe.",
                  " Several types of lizards are able to escape from an enemy’s grasp by breaking off part of their own tail.",
                  " The tail has a weak spot just for this purpose.",
                  " If a predator grabs the lizard by its tail, the tail easily comes off.",
                  " It can grow back over time, although the tail won’t look quite the same.",
                  " Still, it’s better than being someone else’s dinner!",
                  "Other lizards have different ways to stay safe.",
                  " Horned lizards are able to squirt blood from tiny blood vessels in their eyes to scare away or confuse a predator.",
                  " The armadillo lizard has sharp, spiky scales and can roll up into a tight ball to protect its soft belly from attack.",
                  " The sungazer lizard has impressive spikes that cover its body, including the tail.",
                  " The alligator lizard bites, thrashes about to get loose, or voids foul-smelling feces.",
                  " The tropical girdled lizard darts into a crack, expands its body, and lodges itself in so tightly that a predator can’t remove it.",
                  "Shingle-backed skink",
                  "Which end is which? Shingle-backed skink showing off its tail.",
                  "The shingle-backed skink is the reptile equivalent of Dr.",
                  " Doolittle’s two-headed llama, the “push-me-pull-you” with its fat, wide tail that resembles the head.",
                  " If confronted by a predator, the skink bends its body into a C shape, which confuses the predator because it appears as if the skink has two heads.",
                  " The Australian frilled lizard has a “frill” of loose skin around its neck that can stick out when the lizard is frightened.",
                  " This makes the lizard look much bigger than it really is, and a predator may decide to look for something smaller to eat.",
                  " If that doesn’t work, the lizard runs away on its hind feet!",
                  "HABITAT AND DIET",
                  "A pair of sleepy Galapagos marine iguanas half submerged in a shallow tide pool",
                  "Galapagos marine iguanas enjoy a nap in a shallow tide pool.",
                  "Lizards can be found in every continent except Antarctica, and they live in all habitats except extremely cold areas and deep oceans.",
                  " Most lizards live on the ground, but others can be found making their home in a tree, in a burrow, or in the water.",
                  " Tree dwellers have special toes: long with sharp claws or short and wide.",
                  " They often have a prehensile tail for grasping thin branches.",
                  " Those that live in a burrow tend to have smaller legs, or none at all, to help them move underground more easily.",
                  " Marine iguanas spend much of their lives underwater, although they come to shore to rest on rocks or a sandy beach.",
                  " Desert dwellers, like the ground gecko, usually sleep during the day underneath the warm sand and then come out when the sun has gone down.",
                  "Gila monster laying on rocky dirt",
                  "Gila monsters and their cousins, beaded lizards, use their venom to subdue prey.",
                  "Different lizard species eat different types of food.",
                  " Some are predators, eating mammals, birds, and other reptiles.",
                  " Others are mainly vegetarian, eating leaves, fruits, and flowers.",
                  " Two are venomous: the Gila monster and the Mexican beaded lizard.",
                  " Their venom comes from saliva glands in the jaw, and the lizards chew it into the victim.",
                  " Caiman lizards are adept at eating snails and other shelled animals.",
                  " Upon seizing a snail, the lizard raises its head and relaxes its grip, causing the snail to roll to the back of its mouth.",
                  " It then bites down with flattened, molar-like teeth and cracks the shell.",
                  " By alternating bites and rotating the snail with the tongue, the lizard completely removes the shell and pushes the pieces out of the mouth.",
                  "Most lizards are insect eaters, grabbing crickets, flies, grasshoppers, and more with long, sticky tongues or quick bites.",
                  " At the San Diego Zoo and San Diego Zoo Safari Park, our lizards are fed a variety of insects, worms, and meat products as well as fruits and vegetables, depending upon each species’ preference.",
                  "FAMILY LIFE",
                  "A pair of red-headed agama lizards rest on a large granite boulder",
                  "Red-headed agama lizards",
                  "Male lizards use a variety of methods to attract  a female's attention.",
                  " They bob their head vigorously or display their brightest colors or best features.",
                  " The green anole lizard inflates a rust-colored throat sack, called a dewlap, to win over the lady of his choice, sometimes keeping up this display for hours.",
                  " Red-headed agamas are African lizards with brown skin.",
                  " But when the male needs to make sure others see him, his head turns fiery red and his body and tail change to a bright, shiny blue.",
                  " Other males may fight with each other until the weaker one gives up.",
                  "Most female lizards lay soft, leathery eggs and then call it a day—they don’t stick around to protect the eggs from harm or keep them warm.",
                  " Fortunately, the newly hatched lizards are able to take care of themselves right away, without the mother’s help.",
                  " Of course, there are exceptions to soft eggs and lack of care in the lizard world!",
                  "Baby Grand Cayman Blue iguana hatching from its egg.",
                  "Baby Grand Cayman blue iguana hatching from its egg.",
                  "The tokay gecko lays soft eggs that harden in the dry air and stick to the surface on which they were laid.",
                  " The sandstone gecko lays eggs in rocky crevices, so these eggs have a tough cover.",
                  " The Nile monitor lizard lays her eggs in termite mounds.",
                  " The heat from the termites in the mound helps incubate the eggs.",
                  " Some skink mothers return to the nest to warm their eggs, and some female skinks give birth to live young.",
                  "No matter what the circumstances of their start in life, baby lizards look like tiny versions of their parents.",
                  "The San Diego Zoo has had a variety of lizards for our guests to admire since our earliest days, when our collection included Gila monsters, iguanas, European legless lizards (sheltopusiks), and monitor lizards.",
                  " Many of the exotic lizards we acquired in those early years were obtained by trading local specimens.",
                  "Oftentimes members of the military brought animals to the Zoo during their trips abroad.",
                  " In 1930, we were thrilled to receive a shipment of six “beautiful iguanas, by far the handsomest and largest specimens of this creature that the Zoo has ever had” from a lieutenant in the Marine Corps.",
                  " An Australian water dragon was the first lizard to make the cover of our member magazine, ZOONOOZ, back in 1931.",
                  " Several of our iguanas appeared in movies in the 1930s, making the jungle scenes in two Tarzan pictures and Treasure Island  look tropical and dangerous.",
                  "Today, the Zoo is home to an amazing assortment of lizards, including red-headed and blue-headed agamas, bearded dragons, scheltopusiks, geckos, Gila monsters, skinks, caiman lizards, and Komodo dragons.",
                  " We have had several breeding successes over the years, including the first captive hatching of Gila monster eggs in 1963, the first North American births of New Caledonian live-bearing geckos and emperor flat lizards in 2000, and the first successful breeding of Anegada Island iguanas in 2001.",
                  " Also in 2000, the Zoo hatched our first-ever green tree monitor—and we have consistently hatched over 30 since then, making it the most successful green tree monitor program in the US.",
                  "A satanic leaf-tailed gecko made the local news in January 2011 as the first official San Diego Zoo baby of 2011.",
                  " The hatchling was also notable because we are one of only two zoos to breed this unusual species.",
                  " Gecko breeding takes place behind the scenes in one of the reptile buildings.",
                  " Keepers watch the behavior of the female as a clue to when eggs might be found.",
                  " The eggs are placed in a plastic container of moist vermiculite and kept in the gecko’s enclosure to keep an eye on them.",
                  "The Zoo's Reptile Walk features lizard species native to Southern California: the Panamint alligator lizard and giant horned lizard.",
                  "The San Diego Zoo Safari Park is home to a Nile monitor in our Animal Care Center.",
                  " Named Obedass, this adult weighs nearly 40 pounds (18 kilograms).",
                  " With his good looks and impressive size, he causes quite a stir among our guests! Obedass arrived at the Safari Park in 2004 from a zoo in Illinois.",
                  " His diet consists of mice, crawfish, and meat “sausages” made for zoo carnivores.",
                  " A humidifier in his enclosure keeps Obedass’ skin in good condition, and he has special heating and lighting to keep him comfortable.",
                  " In the Park’s Hidden Jungle crevasse, you’ll find the Mali uromastyx, banded velvet gecko, and giant leaf-tailed gecko.",
                  " Griffin Reptile Conservation Center have succeeded in breeding the most critically endangered iguanas in the world, the Caribbean rock iguanas.",
                  " We have been involved with Caribbean iguana conservation and recovery programs for almost two decades, establishing captive breeding facilities for five of the most endangered species on their respective home islands.",
                  " To date, more than 700 Caribbean iguanas have been raised in these facilities and released.",
                  " An initiative is underway to establish a large, centralized, multi-species facility for endangered iguanas on Puerto Rico.",
                  "Closer to home, and in partnership with the U.",
                  "S.",
                  " Geological Survey, we have been monitoring the biological diversity of the Biodiversity Reserve at the Safari Park since 2002.",
                  " This monitoring project provides significant insights into the population ecology of the native species living in the Reserve, including an abundance of native lizard species including whiptails, side-blotch lizards, western fence lizards, granite spiny lizards, western skinks, and Gilbert’s skinks.",
                  " It is amazing how many lizard species are native to our own backyard here in Southern California!",
                  "What can you do to help lizards in Southern California? Be water wise! Over watering our yards in San Diego attracts nonnative Argentine ants, which then displace the native Southern California ants, which then causes the now-endangered San Diego horned lizard to starve!",
                  "Up to 50 years for some species",
                  "Reproduction: Most lizards lay eggs, but in some species the eggs develop inside the mother",
                  "Age of maturity: 18 months to 7 years, depending on species",
                  "SIZE",
                  "Length: Largest - Komodo dragon Varanus komodoensis, up to 10 feet (3 meters); smallest - dwarf gecko Sphaerodactylus ariasae and S.",
                  " parthenopion, .",
                  "6 inches (1.",
                  "6 centimeters)",
                  "Weight: Heaviest - Komodo dragon, up to 176 pounds (80 kilograms); lightest - dwarf gecko, .",
                  "004 ounce (120 milligrams)",
                  "FUN FACTS",
                  "Some lizard species can store up to 60 percent of their body fat in their tail.",
                  "Unlike other lizards, alligator lizards shed their skin in one piece, as snakes do.",
                  "The secret of the gecko's sticky toes is inspiring new kinds of adhesives, including a biodegradable one for surgical use.",
                  "To protect its feet from the hot sand, the sand lizard “dances” by lifting its legs up quickly, one at a time, or by resting its belly on the sand and lifting up all four legs at once.",
                  "The Madagascan chameleon has a sticky-tipped tongue that it can shoot out farther than the length of its body.",
                  "Yellow-rumped warbler with a bee in its beak sitting on a cattail in B.",
                  "C.",
                  "A young tamandua gazes at the camera with a wet nose.",

                  "The face of a year-old Gray's monitor lizard climbing on a branch."];