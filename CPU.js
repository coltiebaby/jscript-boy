var MAX_BYTES = 255;

FLAGS = {
    /**
     * Flag Register -- There are 4 flags for a Z80
     *
     * These are determined from the last operation produced
     *                   Set if the last operation ..
     * Zero (0x80):      .. produced was a zero
     * Operation (0x40): .. was a subtraction
     * Half-carry(0x20): .. a result where the lower half of the byte
     *                      overflowed passed 15
     * Carry(0x10):      .. a result that is over 255 (addition) or under
     *                      0 (subtraction)
     */

    ZERO:       0x80,
    OPERATION:  0x40,
    HALF_CARRY: 0x20,
    CARRY:      0x10
}

function check_for_zero(x) {
    // Assigns the biggest number
    // var a; a = 0x20; (32)
    // a |= 0x10; (16)
    // a == 0x20;  returns `true`
    // a |= 0x30;
    // a == 0x20;  returns `false`
    // a == 0x30;  returns `true`
    if ((x & MAX_BYTES)) {
        return true;
    } else {
        return false;
    }

}

function check_for_underflow(x) {
    if (x < 0) {
        return false;
    } else {
        return true;
    }
}

function check_for_overflow(x) {
    /* Example
     * var alpha = 260
     * if (check_for_overflow(alpha)) {
     *    // Flag for carry operation
     *    register.f = 0x10;
     *    // Mask 8 bit
     *    alpha &= MAX_BYTES;  alpha === 4
     *    // Get total number back
     *    if (register.f == CARRY) {
     *      return alpha + MAX_BYTES;  returns 260
     *    }
     * }
     **/
    if (x > MAX_BYTES) {
        return true;
    } else {
        return false;
    }
}

// The processor is a Z80 -- based on intel 8080
Z80 = {

    // Time Clock: The Z80 holds two types of clocks (m and t)
    _clock: { m: 0, t: 0},

   ._r: {
        // 8-bit
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0,
        h: 0,
        l:0,
        f:0,

        // 16-bit
        pc: 0,                              // Program Counter
        sp: 0,

        // Clock for laster instruction
        m: 0,
        t: 0
    },

    /* Function ADDr_e
     *
     * Adds the register e to a, leaving data in a (ADD A,E)
     */
    ADDr_e: function() {

        // Add e into a
        Z80._r.a += Z80._r.e;

        // Clear flag
        Z80._r.f = 0;

        // Check for zero
        if (check_for_zero(Z80._r.a)) {
            Z80._r.f |= 0x80
        }
        // Check for overflow or carry
        if (check_for_overflow(Z80._r.a)) {
            Z80._r.f |= 0x10
        }
        // Makes sure we're staying in the 8-bit range
        Z80._r.a &= MAX_BYTES;
        Z80._r.m = 1; Z80._r.t = 4;
    },

    // Compares b to a, setting flags (CP A, B)
    COMPAREr_b: function() {
        var i = Z80._r.a;  //temp copy of A
        i -= Z80._r.b;
        Z80.register.f |= 0x40;  // set subtraction flag
        if (check_for_zero(i)) {
            Z80._r.f |= 0x80
        }
        if (check_for_underflow(i)) {
            Z80._r.f |= 0x10;
        }
        Z80._r.m = 1; Z80._r.t = 4;
    },

    // No Operation (NOP)
    NOP: function() {
        Z80._r.m = 1; Z80._r.t = 4;
    },

    // Push b and c to the stack
    PUSHb_c: function() {
        Z80._r.sp--;                         // Drop through stack
        MMU.wb(Z80._r.sp, Z80._r.b);  // Write B
        Z80._r.sp--;                         // Drop through stoack
        MMU.wb(Z80._r.sp, Z80._r.c);  // Write C
        Z80._r.m = 3; Z80._r.t = 12;                // 4 M-times taken
    },

    // Push h and l off the stack
    POPb_c: function() {
        Z80._r.l = MMU.rb(Z80._r.sp);               // Read L
        Z80._r.sp++;                         // Move back up into stack
        Z80._r.h = MMU.rb(Z80._r.sp);               // Read L
        Z80._r.sp++;                         // Move back up into stack
    },

    // Read a byte from absolute location into A (LD A, addr)
    LDAmm: function() {
        var addr = MMU.rw(Z80._r.sp);        // Get address from instr
        Z80._r.pc += 2;                      // Advance PC
        Z80._r.a = MMU.rb(addr)              // Read from address
        Z80._r.m = 4; Z80._r.t=16;           // 4 M-times taken
    },

    reset: function() {
        Z80._r = {
            // 8-bit
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            e: 0,
            h: 0,
            l:0,
            f:0,

            // 16-bit
            pc: 0,
            sp: 0,

            // Clock for laster instruction
            m: 0,
            t: 0
        }

        Z80._clock = {
            m: 0,
            t: 0
        }
    }
}


console.log('Close out to stop the beast');


/**
 * Dispatch loop
 */
while (true) {
    var op = MMU.(Z80._r.pc++);              // Fetch instruct
    Z80._map[op]();
    Z80._r.pc &= 65535;
    Z80._clock.m += Z80._r.m;
    Z80._clock.t += Z80._r.t;
}

// List of operations
Z80._map = {
    Z80._ops.NOP,
    Z80._ops.
    Z80._ops.
    Z80._ops.
    Z80._ops.
}
