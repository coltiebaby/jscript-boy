// Memory interface

MMU = {
    
    /*
     * bool _inbios
     *
     * Unmapped at first instruction above 0x00FF
     *
     * Note:
     *    You are always in the bios at the start.
     */

    _inbios: 1,

    /* Memory Regions */
    _bios: [],
    _rom:  [],
    _wram: [],
    _eram: [],
    _zram: [],

    // READING
    
    // read byte
    rb: function(addr) {
        /* Read 8 bit byte from a given address */

        /** 
         * TODO: Look up how bit operator AND works
         *
         * 0xF000 based 16 == 61440 based 10
         **/
        switch (addr & 0xF000) {
            case 0x0000: // addr < 4096
                if (MMU._inbios) {
                    if (addr < 0x0100) {
                        return MMU._bios[addr];
                    } else if (Z80._r.pc == 0x0100) {
                        MMU._inbios = 0;
                    }
                }

                return MMU._rom[addr];

            case 0x1000: 
            case 0x2000: 
            case 0x3000: 
            case 0x4000: 
            case 0x5000: 
            case 0x6000: 
            case 0x7000: 
                return MMU._rom[addr];

            // GPU
            case 0x8000: 
            case 0x9000: 
                return GPU._vram[addr & 0x1FFF];

            // External RAM (8k)
            case 0xA000:
            case 0xB000:
                return MMU._eram[addr & 0x1FFF];

            // Working RAM (8k)
            case 0xC000:
            case 0xD000:
                return MMU._wram[addr & 0x1FFF];

            // Working RAM shadow
            case 0xE000:
                return MMU._wram[addr & 0x1FFF];

            // Working RAM
            case 0xF000:
                switch (addr & 0x0F00) {
                    case 0x000:
                    case 0x200:
                    case 0x300:
                    case 0x400:
                    case 0x500:
                    case 0x600:
                    case 0x700:
                    case 0x800:
                    case 0x900:
                    case 0xA00:
                    case 0xB00:
                    case 0xC00:
                    case 0xD00:
                        return MMU._wram[addr & 0x1FFF];

                    /*
                     * Graphics: Object Attribute Memory
                     * OAM is 160 bytes, remaining bytes read as 0
                     */
                    case 0xE00:
                        if (addr < 0xFEA0):
                            return GPU._oam[addr & 0xFF];
                        else:
                            return 0;
                        

                    // Zero Page
                    case 0xF00:
                        if (addr >= 0xFF80) { // 65408
                            return MMU._zram[addr & 0x7F];
                        } else {
                            return 0;
                        }

                }

        }
            

    },
    rw: function(addr) {
        /* Read 16 bit word from a given address */

        // TODO: Find out why this is getting shifted over
        return MMU.rb(addr) + (MMU.rb(addr+1) << 8);
    },
    wb: function(addr, val) {
        switch (addr & 0xF000) {
            // Only the VRAM case is shown:
            case 0x8000:
            case 0x9000:
                GPU._vram[addr & 0x1FFF] = val;
                GPU.updatetile(addr, val);
                break;
        }
    },
    ww: function(addr) {
        /* Write 16 bit word from a given address */
    },
}

MMU.load = function(file) {
    var b = new BinFileReader(file);
    MMU._rom = b.readString(b.getFileSize(), 0);
}
