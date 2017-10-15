Array.add_method('left_half', function() {
    return this.slice(0, this.length/2);
});
Array.add_method('right_half', function() {
    return this.slice(this.length/2, this.length);
});

Array.add_method('most_idx', function(fn, scores) {
    fn=fn||id;
    var most_i = 0;
    var best = fn(this[0]);

    var rest = this.slice(1);
    for (var i = 0, len=rest.length;i<len;++i) {
        var val = fn(rest[i]);
        if (scores) {
            scores[i] = val;
        }
        if (val > best) {
            best = val;
            most_i = i+1;
        }
    }

    return most_i;

});

/* returns the value x in arr that maximizes the value
 * of fn(x). e.g. function(arr){return arr_most(arr, id)}
 * is a function that returns the maximum value in an array
 */
Array.add_method('most', function(fn, scores) {
    return this[this.most_idx(fn, scores)];
});

Array.add_method('rotate', function(idx) {
    return this.slice(idx).concat(this.slice(0, idx));
});

function arr_rotate(arr, idx) {
    return arr.slice(idx).concat(arr.slice(0, idx));
}

Array.add_method('rotate_most', function(fn) {
    return this.rotate(this.most_idx(fn));
});

Array.add_method('rotate_until', function(fn) {
    for (var i = 0,len=this.length;i<len;++i) {
        if (fn(this[i])) {
            return this.rotate(this, i);
        }
    }
    return null;

});

Array.add_method('mosts_heap', function(k, fn) {
    fn=fn||id;
    var h = new ConstrainedHeap(k, function(a, b) {
        return fn(a) <= fn(b);
    });
    return this.reduce(function(acc, x) {acc.insert(x);return acc}, h);
});

// returns the k highest elements in arr
Array.add_method('mosts', function(k, fn) {
    return this.mosts_heap(k, fn).to_array();
});

// returns the k highest elements in arr sorted in order from lowest value of fn(x)
Array.add_method('mosts_sorted', function(k, fn) {
    return this.mosts_heap(k, fn).to_sorted_array();
});

// returns the kth fn-est element in this
Array.add_method('kth', function(k, fn) {
    fn=fn||id;
    return this.mosts(k, fn).most(function(x){return -fn(x)});
});

Array.add_method('proxy_filter', function(arr_to_filter_by, filter_fn) {
    var filtered = [];
    for (var i = 0,len=this.length;i<len;++i) {
        if (filter_fn(arr_to_filter_by[i])) {
            filtered.push(this[i]);
        }
    }
    return filtered;
});

// treat an array like a ring buffer
Array.add_method('ring', function(idx, value) {
    var i = (idx % this.length + this.length) % this.length;
    if (value == undefined) {
        return this[i];
    } else {
        this[i] = value;
    }
});

Array.add_method('find', function(fn) {
    for (var i = 0,len=this.length;i<len;++i) {
        if (fn(this[i])) {
            return this[i];
        }
    }
    return null;
});

Array.add_method('get_reverse', function() {
    return this.slice(0).reverse();
});

Array.add_method('most_over_threshold', function(threshold, mostfn) {
    var most = this.most(mostfn);
    if (mostfn(most) >= threshold) {
        return most;
    } else {
        return null;
    }
});

Array.range = function(start, end, step) {
    if (step == undefined) {
        step = 1;
    }
    if (end == undefined) {
        end = start;
        start = 0;
    }
    var ret = [];
    for (var i = start;i<end;i+=step) {
        ret.push(i);
    }
    return ret;
}

Array.add_method('flatten', function() {
    var ret = [];
    for (var i = 0;i<this.length;i++) {
        var sub = this[i];
        for (var j = 0;j<sub.length;j++) {
            ret.push(sub[j]);
        }
    }
    return ret;
});

Array.add_method('shuffle', function() {
    for (var i = 0;i<this.length;i++) {
        var idx = Math.floor(Math.random()*this.length-i);
        var tmp = this[i];
        this[i] = this[i+idx];
        this[i+idx] = tmp;
    }
    return this;
});
