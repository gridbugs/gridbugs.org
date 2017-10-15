function ColourDebugger(colours) {
    this.pos = 0;
    this.colours = colours;
}

ColourDebugger.prototype.get_colour = function() {
    return this.colours[this.pos];
}

ColourDebugger.prototype.next_colour = function() {
    this.pos = (this.pos + 1) % this.colours.length;
    return this.get_colour();
}
