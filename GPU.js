/**
 * Gameboy Screen is 160x144
 *
 * Graphics Processing Unit Emulation
 *
 * Notes:
 *   - After initialization you can set indivual colors with a formula
 *   pixel = y * 160 + x
 *
 * Period                        |  GPU mode number  |  Time spent (clocks)
 * Scanline (accessing OAM)      |   2               |	80
 * Scanline (accessing VRAM)     |   3               |  172
 * Horizontal blank              |   0               |  204
 * One line (scan and blank)     |                   |  456
 * Vertical blank                |   1               |  4560 (10 lines)
 * Full frame (scans and vblank) |                   |  70224
 **/

GPU = {
    _canvas: {},
    _mode: 0,
    _modeclock: 0,
    _line: 0,
    _screen: {},
    _tileset: [],
    _scx = 0,
    _scy = 0,

    reset: function() {
        var screen = document.getElementById('screen');

        /**
         * elem.getContext is related to some special javascript stuff
         * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
         **/
        if (screen && screen.getContext) {
            GPU._canvas = screen.getContext('2d');
            if (GPU._canvas) {
                if (GPU._canvas.createImageData) {
                    GPU._screen = GPU._canvas.createImageData(160, 144);
                } else if (GPU._canvas.getImageData) {
                    GPU._screen = GPU._canvas.getImageData(0,0, 160,144);
                } else {
                    GPU._screen = {
                        'width':  160,
                        'height': 144,
                        'data':   new Array(160*144*4)
                    };
                }
            }

            // making a grey screen
            for (var i=0; i < (160*144*4); i++) {
                GPU._screen.data[i] = 0;
            }

            GPU._canvas.putImageData(GPU._screen, 0,0);
        }

        GPU._tileset = [];
        for (var i=0; i < 384; i++) {
            GPU._tileset[i] = [];

            // Making the screen black. :) 8*8*4 screen
            for (var j=0; j < 8; j++) {
                GPU._tileset[i][j] = [0,0,0,0,0,0,0,0];
            }
        }
    }

    step: function() {

        GPU._modeclock = CPU._r.t;

        switch(GPU._mode) {
            /*
             * Cases match the modes in the table at the top
             */
            case 0:
                /**
                 * HBlank [Horizontal Blanking]
                 * This is the part where the light goes back to make a new
                 * line -- Think typerwriter
                 * After the last hblank, push the screen data to canvas
                 **/

                if (GPU._modeclock >= 204) {
                    GPU._modeclock = 0;
                    GPU._line++;

                    if (GPU._line === 143) {
                        // Enter VBlank
                        GPU._mode = 1;
                        GPU._canvas.putImageData(GPU._screen, 0, 0);
                    } else {
                        GPU._mode = 2;
                    }
                break;
            case 1:
                /**
                 * Vblank [Vertial Blanking] (10 lines)
                 * This is where we go back to the top of the screen to start
                 * again.
                 **/

                if (GPU._modeclock >= 456) {
                    GPU._modeclock = 0;
                    GPU._line++;
                    if (GPU._line > 153) {
                        // Restart scanning modes
                        GPU._mode = 2;
                        GPU._line = 0;
                    }
                }
                break;
            case 2:
                /*
                 * OAM read mode, scanline active
                 */
                if (GPU._modeclock >= 80) {
                    // Enter scanline mode 3
                    GPU._mode = 3;
                    GPU._modeclock = 0;
                }
                break;
            case 3:
                /*
                 * VRAM read mode, scanline active
                 * Treat end of mode 3 as end of scanline
                 */
                if (GPU._modeclock >= 172) {
                    // Enter hblank
                    GPU._mode = 0;
                    GPU._line = 0;

                    // Write a scanline to the framebuffer
                    GPU.renderscan();
                }
                break;

        }
    },

    updatetile: function(addr, val) {
        // Get the "base address" for this tile row
        addr &= 0x1FFE;

        // Work out which tile and row was update
        var tile = (addr >> 4) & 511;
        var y = (addr >> 1) & 7;

        var sx;
        for (x = 0; x < 8; x++) {
            sx = 1 << (7 - x);

            // Update tile set
            GPU._tileset[tile][y][x] =
                ((GPU._vram[addr] & sx) ? 1 : 0) +
                ((GPU._vram[addr + 1] & sx) ? 2 : 0);
        }
    },

    /**
     * Gameboy screen is 160*144
     * Map can have 256*256 though
     * scx scy show the position of the view from the top left pixel
     **/
    renderscan: function() {
        // VRAM offset for the tile map
        var mapoffs = GPU._bgmap ? 0x1C00 : 0x1800;

        // Which line of tiles to use in the map
        mapoffs += ((GPU._line + GPU._scy) & 255) >> 3;

        // Which tile to start with in the map line
        var lineoffs = (GPU._scx >> 3);

        // Which line of pixels to use in the tiles
        var y = (GPU._line + GPU._scy) & 7;

        // Where in the tileline to start
        var x = GPU._scx & 7;

        // Where to render on the canvas
        var canvasoffs = GPU._line * 160 * 4;

        // Read tile index from background map
        var colour;
        var tile = GPU._vram[mapoffs + lineoffs];

        // If the tile data set in use is number 1,
        // the indices are signed; calculate a real tile offset
        if (GPU._bgtile === 1 && tile < 128) {
            tile += 256;
        }

        for (var i = 0; i < 160; i++) {
            // Remap the tile pixel through the palette
            colour = GPU._pal[GPU._tileset[tile][x][y]];

            // Plot the pixel to the canvas
            GPU._screen.data[canvasoffs + 0] = colour[0];
            GPU._screen.data[canvasoffs + 1] = colour[1];
            GPU._screen.data[canvasoffs + 2] = colour[2];
            GPU._screen.data[canvasoffs + 3] = colour[3];
            canvasoffs += 4;
        }

        // When this tile ends, read another
        x++;
        if (x === 8) {
            x = 0;
            lineoffs = (lineoffs + 1) & 31;
            tile = GPU._vram[mapoffs + lineoffs];
            if (GPU._bgtile === 1 && tile < 128) {
                tile += 256;
            }
        }
    }
}
