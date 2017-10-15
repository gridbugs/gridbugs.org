function Drawer(stack_size) {
    TransformStack.call(this, stack_size);
}
Drawer.inherits_from(TransformStack);

Drawer.prototype.group = function(group) {
    return new DrawableGroup(this, Array.array_or_arguments(group, arguments));
}

function DrawableGroup(drawer, group) {
    this.drawer = drawer;
    this.group = group;
    this.visible = true;
}
DrawableGroup.prototype.draw = function() {
    if (this.visible) {
        for (var i = 0;i<this.group.length;i++) {
            this.group[i].draw();
        }
    }
}
DrawableGroup.prototype.show = function() {
    this.visible = true;
    return this;
}
DrawableGroup.prototype.hide = function() {
    this.visible = false;
    return this;
}
