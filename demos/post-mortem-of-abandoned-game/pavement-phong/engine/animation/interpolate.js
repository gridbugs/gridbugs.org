function ScalarWrapper(v) {
    this.v = v;
}
function VectorWrapper(v) {
    this.v = v;
}
function AngleWrapper(v) {
    this.v = v;
}
function ImageWrapper(v) {
    this.v = v;
}
VectorWrapper.prototype.toString = function() {
    return "#"+this.v.toString();
}
ScalarWrapper.prototype.toString = function() {
    return "_"+this.v;
}
ScalarWrapper.from_arr = function(arr) {
    return arr.map(function(x){return new ScalarWrapper(x)});
}
ScalarWrapper.from_seq = function(seq) {
    return seq.map(function(x){return [x[0], new ScalarWrapper(x[1])]});
}
ScalarWrapper.prototype.add = function(o) {
    return new ScalarWrapper(o.v+this.v);
}
ScalarWrapper.prototype.sub = function(o) {
    return new ScalarWrapper(this.v-o.v);
}
ScalarWrapper.prototype.smult = function(v) {
    return new ScalarWrapper(v*this.v);
}
ScalarWrapper.prototype.flip_x = function() {
    return new ScalarWrapper(-this.v);
}
AngleWrapper.prototype.toString = function() {
    return "~"+this.v;
}
AngleWrapper.from_arr = function(arr) {
    return arr.map(function(x){return new AngleWrapper(x)});
}
AngleWrapper.from_seq = function(seq) {
    return seq.map(function(x){return [x[0], new AngleWrapper(x[1])]});
}
AngleWrapper.prototype.add = function(o) {
    return new AngleWrapper(angle_normalize(this.v + o.v));
}
AngleWrapper.prototype.sub = function(o) {
    var v = this.v - o.v;
    if (Math.abs(v) <= Math.PI) {
        return new AngleWrapper(v);
    } else if (v >= 0) {
        return new AngleWrapper(v - Math.PI*2);
    } else {
        return new AngleWrapper(v + Math.PI*2);
    }
}
AngleWrapper.prototype.smult = function(s) {
    return new AngleWrapper(this.v*s);
}
AngleWrapper.prototype.val = function() {
    return this.v;
}
AngleWrapper.prototype.flip_x = function() {
    return new AngleWrapper(-this.v);
}

VectorWrapper.from_arr = function(arr) {
    return arr.map(function(x){return new VectorWrapper(x)});
}
VectorWrapper.from_seq = function(seq) {
    return seq.map(function(x){return [x[0], new VectorWrapper(x[1])]});
}
VectorWrapper.prototype.add = function(o) {
    return new VectorWrapper(this.v.v2_add(o.v));
}
VectorWrapper.prototype.sub = function(o) {
    return new VectorWrapper(this.v.v2_sub(o.v));
}
VectorWrapper.prototype.smult = function(v) {

    return new VectorWrapper(this.v.v2_smult(v));
}
VectorWrapper.prototype.val = function() {
    return this.v;
}
VectorWrapper.prototype.flip_x = function() {
    return new VectorWrapper([-this.v[0], this.v[1]]);
}

ImageWrapper.from_seq = function(seq) {
    return seq.map(function(x){return [x[0], new ImageWrapper(x[1])]});
}
ImageWrapper.prototype.flip_x = function() {
    return new ImageWrapper(this.v.clone().scale([-1, 1]));
}
ImageWrapper.prototype.val = function() {
    return this.v;
}

ScalarWrapper.prototype.val = function() {
    return this.v;
}

/*
 * A ConstantValue exposes the same interface as an Interpolator,
 * though its value never changes. It contains a wrapped value.
 */
function ConstantValue(v) {
    this.v = v;
}
ConstantValue.prototype.interpolate = function() {
    return this.v;
}
ConstantValue.prototype.get_value = function() {
    return this.v.val();
}
ConstantValue.prototype.flip_x = function() {
    return new this.constructor(this.v.flip_x());
}
ConstantValue.prototype.clone_with_offset = function() {
    return new this.constructor(this.v);
}

function ContinuousValue(v) {
    ConstantValue.call(this, v);
}
ContinuousValue.inherits_from(ConstantValue);

/*
 * Returns a wrapper of the interpolated value.
 * If the number 'num_start' is associated with the wrapped value 'start', 
 * and the number 'num_end' is associated with the wrapped value 'end',
 * then this function returns the wrapped value that would be associated with
 * 'num_current' by linearly interpolating.
 */
ContinuousValue.simple_interpolate = function(num_start, num_end, num_current, start, end) {
    return end.sub(start).smult((num_current - num_start)/(num_end - num_start)).add(start);
}
ContinuousValue.prototype.simple_interpolate = ContinuousValue.simple_interpolate;

function DiscreteValue(v) {
    ConstantValue.call(this, v);
}
DiscreteValue.inherits_from(ConstantValue);
DiscreteValue.prototype.simple_interpolate = function(num_start, num_end, num_current, start, end) {
    return start;
}

function Interpolator(seq) {
    if (seq == undefined) {
        return;
    }
    // seq is of the form [[t0, x0], [t1, x1], ..., [tn, x0]]
    this.seq = seq;
    this.length = seq.length;
    this.max_t = this.seq[this.length-1][0];
}

Interpolator.prototype.flip_x = function() {
    var seq = this.seq.map(function(x){return [x[0], x[1].flip_x()]});
    return new this.constructor(seq);
}

Interpolator.binary_search = function(t, seq) {
    return Interpolator.binary_search_rec(t, seq, 0, seq.length-1);
}

// returns the index in seq of the highest value <= t
Interpolator.binary_search_rec = function(t, seq, lo, hi) {
    if (lo == hi) {
        return lo;
    } else if (hi - lo == 1) {
        if (t < seq[hi][0]) {
            return lo;
        } else {
            return hi;
        }
    } else {
        var i = Math.floor((hi+lo)/2);
        var val = seq[i][0];
        if (val == t) {
            return i;
        } else if (t < val) {
            return Interpolator.binary_search_rec(t, seq, lo, i-1);
        } else {
            return Interpolator.binary_search_rec(t, seq, i, hi);
        }
    }
}

Interpolator.prototype.interpolate = function(t) {
    t = rem(t, this.max_t);
    var s = this.find_surrounding(t);
    return this.simple_interpolate(s[0][0], s[1][0], t, s[0][1], s[1][1]);
}

Interpolator.prototype.binary_search = function(t) {
    return Interpolator.binary_search(t, this.seq);
}

Interpolator.find_surrounding = function(t, seq) {
    var i = Interpolator.binary_search(t, seq);
    return [seq[i], seq[i+1]];
}

Interpolator.prototype.find_surrounding = function(t) {
    return Interpolator.find_surrounding(t, this.seq);   
}

function ContinuousInterpolator(seq) {
    Interpolator.call(this, seq);
}
ContinuousInterpolator.inherits_from(Interpolator);

ContinuousInterpolator.prototype.clone_with_offset = function(offset) {
    var seq = this.seq.map(function(x){return [x[0]+offset, x[1]]});
    // the index of the last element of the new sequence
    var end_i = Interpolator.binary_search(this.max_t, seq);
    var last = seq[end_i];

    var new_tail = seq.slice(0, end_i+1);
    var new_head = seq.slice(end_i+1, seq.length-1).map(function(x){
        return [x[0]-this.max_t, x[1]]
    }.bind(this));

    if (last[0] != this.max_t) {
        var new_end = this.interpolate(this.max_t - offset);
        new_tail.push([this.max_t, new_end]);
    }
    
    new_head.unshift([0, new_tail[new_tail.length-1][1]]);

    return new ContinuousInterpolator(new_head.concat(new_tail));
}

ContinuousInterpolator.prototype.simple_interpolate = ContinuousValue.simple_interpolate;

function DiscreteInterpolator(seq) {
    Interpolator.call(this, seq);
}
DiscreteInterpolator.inherits_from(Interpolator);

DiscreteInterpolator.prototype.clone_with_offset = function(offset) {
    var seq = this.seq.map(function(x){return [x[0]+offset, x[1]]});
    // the index of the last element of the new sequence
    var end_i = Interpolator.binary_search(this.max_t, seq);
    var last = seq[end_i];

    var new_tail = seq.slice(0, end_i+1);
    var new_head = seq.slice(end_i+1, seq.length-1).map(function(x){
        return [x[0]-this.max_t, x[1]]
    }.bind(this));

    if (last[0] != this.max_t) {
        var new_end = new_tail[new_tail.length-1][1];
        new_tail.push([this.max_t, new_end]);
    }


    new_head.unshift([0, new_tail[new_tail.length-1][1]]);

    return new DiscreteInterpolator(new_head.concat(new_tail));
}

DiscreteInterpolator.prototype.simple_interpolate = 
function(num_start, num_end, num_current, start, end) {
    return start;
}


function SequenceInterpolator(interpolator) {
    this.current = interpolator;
    this.time = 0;
}


SequenceInterpolator.prototype.set_interpolator = function(i) {
    this.current = i;
}

SequenceInterpolator.prototype.switch_to = function(interpolator, duration, offset) {
    this.next = interpolator;

    this.switch_duration = d(duration, 1);
    this.switch_progress = 0;
    this.switch_offset = d(offset, 0);
}

SequenceInterpolator.prototype.tick = function(time_delta) {
    if (this.next) {
        this.switch_progress += time_delta;
        if (this.switch_progress >= this.switch_duration) {
            this.current = this.next;
            this.next = null;

            this.time = this.switch_progress + this.switch_offset;
        }
    } else {
        this.time += time_delta;
    }

    return this;
}

SequenceInterpolator.prototype.get = function() {
    var current_value = this.current.interpolate(this.time);
    if (this.next) {
        var next_value = this.next.interpolate(this.switch_progress + this.switch_offset);
        return this.current.simple_interpolate(
            0, this.switch_duration, this.switch_progress, current_value, next_value
        );
    } else {
        return current_value;
    }
}

SequenceInterpolator.prototype.get_value = function() {
    return this.get().val();
}

SequenceInterpolator.prototype.connect = function(image) {
    return new BodyPart(
            image,
            new ContinuousValue(new VectorWrapper([0, 0])),
            new RotateReference(this),
            new ScaleReference(this, image.get_value().size[1])
    );
}

/*
 * A device for managing a collection of sequences.
 * It consists of a hash mapping sequence interpolator names
 * to sequence interpolators.
 * It facilitates the switching of multiple interplotars
 * at once.
 */
function SequenceManager(model) {
    this.seqs = {};
    for (var name in model) {
        if (model[name]) {
            this.seqs[name] = new SequenceInterpolator(model[name]);
        }
    }
}

// returns the sequence interpolator associated with a given name
SequenceManager.prototype.g = function(name) {
    return this.seqs[name];
}

/* updates all the sequence interpolators using a model, represented
 * by a js object with keys the same as the keys of the sequence manager
 * and values interpolators to switch the associated sequence interpolaor to.
 */
SequenceManager.prototype.update = function(model, duration, offset) {
    for (var name in this.seqs) {
        this.seqs[name].switch_to(model[name], duration, offset);
    }
}

// calls the tick method of all the sequence interpolators
SequenceManager.prototype.tick = function(time_delta) {
    for (var name in this.seqs) {
        this.seqs[name].tick(time_delta);
    }
}

/*
 * A reference to a sequence interpolator of vectors.
 * This class implements the interpolator interface.
 * It has an associated length.
 * Its value is a vector with 1 as the x component,
 * and a y component that will scale something of
 * the associated length to end at current vector
 * of the associated sequence interpolator.
 */
function ScaleReference(si, length) {
    this.si = si;
    this.length = length;
}

ScaleReference.prototype.get_value = function() {
    var v = this.si.get_value();
    return [1, v.v2_len()/this.length];
}

/*
 * A reference to a sequence interpolator of vectors.
 * This class implements the interpolator interface.
 * Its value is an angle in radians that will rotate
 * something to face the vector which is the current
 * value of the associated sequence interpolator.
 */
function RotateReference(si) {
    this.si = si;
}
RotateReference.prototype.get_value = function() {
    var v = this.si.get_value();
    return Math.PI/2-[v[0], -v[1]].v2_angle();
}
