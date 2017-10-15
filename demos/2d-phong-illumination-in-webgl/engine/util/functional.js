/* takes a function and an array and calls
 * the function on the elements as individual
 * arguments
 */
function element_call(fn, vec) {
    return fn.apply(null, vec);
}

function to_array(x) {
    return [x];
}

/* takes a function and an array and calls
 * the function on each element of the array
 * as individual arguments, enclosing each argument
 * in an array of length 1.
 * This helps with some numeric.js functions.
 */
function element_array_call(fn, vec) {
    return fn.apply(null, vec.map(to_array));
}

function curry2(f, arg1) {
    return function(arg2) {
        return f(arg1, arg2);
    }
}

function swap_args2(f) {
    return function(x, y) {
        return f(y, x);
    }
}

function call_on_split_array(merge, f, arr) {
    return merge(f(arr_left_half(arr)), f(arr_right_half(arr)));
}

// takes a value and returns a function that takes no arguments and returns that value
function tofn(x) {
    return function(){return x};
}

// identity function
function id(x) {
    return x;
}

function Approx(value, tolerance) {
    this.value = value;
    this.tolerance = tolerance == undefined ? 1 : tolerance;
}
function A(value, tolerance) {
    return new Approx(value, tolerance);
}
A.approx = function(x) {
    if (x.constructor == Approx) {
        return x;
    } else {
        return A(x, 0);
    }
}

Approx.prototype.equals = function(b) {
    b = A.approx(b);
    return Math.abs(this.value - b.value) < this.tolerance + b.tolerance;
}

Approx.prototype.fmap = function(f) {
    return A(f(this.value), this.tolerance);
}

function Maybe(v) {
    this.v = v;
}

function maybe(v) {
    return new Maybe(v);
}
Maybe.prototype.fmap = function(f) {
    if (this.v == null) {
        return maybe(null);
    } else {
        return maybe(f(this.v));
    }
}
Maybe.prototype.mmap = function(m) {
    if (this.v == null) {
        return maybe(null);
    } else {
        return maybe(m.call(this.v));
    }
}

function maybe_method(m, v) {
    if (v == null) {
        return null;
    } else {
        return m.call(v);
    }
}

function maybe_function(f, v) {
    if (v == null) {
        return null;
    } else {
        return f(v);
    }
}
function do_nothing() {}


