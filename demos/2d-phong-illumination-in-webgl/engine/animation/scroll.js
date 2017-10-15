function ScrollContext(initial, padding, size) {
    this.translate = initial;
    this.padding = padding;
    this.min = [padding, padding];
    this.max = [size[0] - padding, size[1] - padding];
}

ScrollContext.prototype.update = function(position) {
    var change = [0, 0];

    for (var i = 0;i<=1;i++) {
        if (position[i] < this.min[i]) {
            change[i] = position[i] - this.min[i];
        } else if (position[i] > this.max[i]) {
            change[i] = position[i] - this.max[i];
        }
    }

    this.translate = this.translate.v2_sub(change);
}

ScrollContext.prototype.set_next = function(next) {
    this.next = next;
}

ScrollContext.prototype.proceed = function() {
    this.update(this.next);
}
