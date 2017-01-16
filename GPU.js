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

    renderscan: function() {
        /* Render Scan Info */
        console.log('Doing stuff in renderscan');
    }
}
