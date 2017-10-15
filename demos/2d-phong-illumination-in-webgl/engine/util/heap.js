/* General heap implementation 
 * le: returns true iff its left argument is less than
 * or equal to its right argument
 * */
function Heap(le) {
    le = le || function(a,b){return a <= b};
    this.h = [];
    this.next_idx = 1; // start at 1 to make parent_idx == idx/2
    this.le = le;
}
var arr_swap = function(a, i, j) {
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
}
Heap.prototype.insert = function(x) {
    this.h[this.next_idx] = x;
    var idx = this.next_idx;
    this.next_idx++;

    /* while the parent is not less than or equal to the child */
    while(idx != 1) {
        var parent_idx = Math.floor(idx/2);
        if (this.le(this.h[parent_idx], this.h[idx])) {
            break;
        } else {
            arr_swap(this.h, idx, parent_idx);
            idx = parent_idx;
        }
    }
}

Heap.prototype.peek = function() {
    return this.h[1];
}

Heap.prototype.count = function() {
    return this.next_idx - 1;
}

Heap.prototype.remove = function() {
    if (this.is_empty()) {
        return null;
    }
    var ret = this.h[1];
    this.next_idx--;
    this.h[1] = this.h[this.next_idx];
    var idx = 1;

    /* while the current node has at least 1 child */
    while(idx*2<this.next_idx) {
        if (true) {
            /* if the current node has 2 children */
            var min_idx = idx*2;
            if (!this.le(this.h[min_idx], this.h[min_idx+1])) {
                min_idx++;
            }
            if (!this.le(this.h[idx], this.h[min_idx])) {
                arr_swap(this.h, idx, min_idx);
                idx = min_idx;
                continue;
            }
        } else if (idx*2+1==this.next_idx && !this.le(this.h[idx], this.h[idx*2])) {
            /* if the current node has a left child only and is bigger than it */
            arr_swap(this.h, idx, idx*2);  
        }
        break;
    }
    return ret;
}

Heap.prototype.is_empty = function() {
    return this.next_idx == 1;
}

Heap.prototype.clone = function() {
    var ret = new Heap(this.le);
    for (var i = 0;i!=this.h.length;++i) {
        ret.h[i] = this.h[i];
    }
    ret.next_idx = this.next_idx;
    return ret;
}

Heap.prototype.to_array = function() {
    return this.h.slice(1);
}

Heap.prototype.to_sorted_array = function() {
    var ret = [];
    while (!this.is_empty()) {
        ret.push(this.remove());
    }
    return ret;
}

/*
 * A heap with a maximum size. When full, elements are only
 * inserted when they are worse than the current best, in
 * which case the current best is first removed.
 * Use this when you want a constant number of the 'worst'
 * elements of some collection (e.g. the 5 lowest numbers in an array).
 */
function ConstrainedHeap(max, le) {
    this.max = max;
    Heap.call(this, le);
}
ConstrainedHeap.prototype = new Heap();
ConstrainedHeap.prototype.constructor = ConstrainedHeap;

ConstrainedHeap.prototype.is_full = function() {
    return this.count() == this.max;
}

ConstrainedHeap.prototype.insert = function(x) {
    if (this.is_full()) {
        /* Check if x belongs in heap.
         * That is, x is 'worse' than the current 'best'.
         */
        if (this.le(this.peek(), x)) {
            this.remove();
            Heap.prototype.insert.call(this, x);
        }
    } else {
        Heap.prototype.insert.call(this, x);
    }
}
