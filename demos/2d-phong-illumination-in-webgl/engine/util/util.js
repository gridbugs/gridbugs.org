function default_value(value, def_value) {
    return value == undefined ? def_value : value;
}

/* returns true iff the angle b is between a and c
 */
function angle_between(a, b, c) {
    if (a <= c) {
        return a <= b && b <= c;
    } else {
        return !(c <= b && b <= a);
    }
}

function radians_between(a1, a2) {
    var radians = Math.abs(a1 - a2);
    while (radians > Math.PI) {
        radians -= Math.PI*2;
    }
    return Math.abs(radians);
}

// creates an array populated with undefineds of a given length
function create_undefined_array(length) {
    return Array.apply(null, new Array(length));
}

// creates an array populated with a given value of a given length
function create_array_with_value(length, value) {
    return create_undefined_array(length).map(tofn(value));
}

function d(value, def_value) {
    return value == undefined ? def_value : value;
}

function approx_non_negative(x) {
    if (x < 0 && x > -0.00001) {
        return 0;
    } else {
        return x;
    }
}

function round_to_nearest(value, nearest) {
    var a = Math.floor((value+nearest/2)/nearest);
    var b = a * nearest;
    return b;
}

function obj_merge(a, b) {
    var c = {};
    for (var i in a) {
        c[i] = a[i];
    }
    for (var i in b) {
        c[i] = b[i];
    }
    return c;
}
function obj_merge_with(a, b) {
    for (var i in b) {
        a[i] = b[i];
    }
}

function objs_merge() {
    var r = {};
    for (var i = 0;i<arguments.length;i++) {
        obj_merge_with(r, arguments[i]);
    }
    return r;
}
