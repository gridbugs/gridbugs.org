/* Algebra objects are not represented by javascript classes, but
 * as javascript arrays using the following convention:
 * - a "vector" is an array of 2 numeric elements defining its cartesian coordinates
 * - a "line segment" is an array of 2 vectors defining its end points
 * - a "line" is infinitely long and is an array of 2 vectors where the
 *      first vector is a point anywhere on the line, and the second vector
 *      describes the line's direction
 * - a "circle" is an array where the first element is a vector representing
 *      the centre, and the second element is a number representing the radius
 * - a "polygon" is an array of 3 or more vectors which when connected in
 *      the order in which they appear in the array, forms the shape of the polyon
 */

// namespace for some algebra utils
function Algebra(){}

Algebra.TOLERANCE = 0.0000001;

Number.prototype.is_zero = function() {
    return Math.between_exclusive(-Algebra.TOLERANCE, this, Algebra.TOLERANCE);
}

Array.add_method('toString', function() {
    return ["[", this.map(function(x){return x.toString()}).join(", "), "]"].join('');
});

Array.add_method('v2_floor', function() {
    return [Math.floor(this[0]), Math.floor(this[1])];
});

// algebraic sum of 2 vectors
Array.add_method('v2_add', function(v){return [this[0]+v[0], this[1]+v[1]]});

// algebraic sum of this and -v
Array.add_method('v2_sub', function(v){return [this[0]-v[0], this[1]-v[1]]});

// length of this squared
Array.add_method('v2_len_squared', function() {return this[0]*this[0]+this[1]*this[1]});

// length of this
Array.add_method('v2_len', function(){return Math.sqrt(this.v2_len_squared())});

// true iff this is identical to v
Array.add_method('v2_equals', function(v){return this[0]==v[0] && this[1]==v[1]});

Array.add_method('v2_close', function(v, tol){return this.v2_dist(v) <= tol});

Array.add_method('v2_nearly_aligned', function(v, tolerance) {
    return Math.between_inclusive(-tolerance, this[0]*v[1] - this[1]*v[0], tolerance);
});

Array.add_method('v2_aligned', function(v) {
    return this[0]*v[1] == this[1]*v[0];
});

Array.add_method('v2_aligned_ratio', function(v) {
    if (!this[0].is_zero()) {
        return v[0]/this[0];
    } else {
        return v[1]/this[1];
    }
});

Array.add_method('seg_nearly_contains', function(v, tolerance) {
    return this.seg_nearly_aligned(v, tolerance) && Math.between_inclusive(0, this.seg_aligned_ratio(v), 1);
});
Array.add_method('seg_contains', function(v) {
    return this.seg_aligned(v) && Math.between_inclusive(0, this.seg_aligned_ratio(v), 1);
});
Array.add_method('seg_nearly_aligned', function(v, tolerance) {
    return this[1].v2_sub(this[0]).v2_nearly_aligned(v.v2_sub(this[0]), tolerance);
});
Array.add_method('seg_aligned', function(v) {
    return this[1].v2_sub(this[0]).v2_aligned(v.v2_sub(this[0]));
});
Array.add_method('seg_aligned_ratio', function(v) {
    return this[1].v2_sub(this[0]).v2_aligned_ratio(v.v2_sub(this[0]));
});

// returns this rotated 90 degrees anticlockwise
Array.add_method('v2_norm', function() {return [-this[1], this[0]]});

Array.add_method('v2_rotate', function(rads) {
    return angle_to_unit_vector(angle_normalize(this.v2_angle() + rads)).v2_smult(this.v2_len());
});

Array.add_method('v2_invert', function() {
    return [-this[0], -this[1]];
});

Array.add_method('v2_unit', function() {
    return this.v2_smult(1/this.v2_len());
});

Array.add_method('v2_to_length', function(s) {
    return this.v2_unit().v2_smult(s);
});

Array.add_method('v2_clone', function() {
    return [this[0], this[1]];
});

Array.add_method('seg_clone', function() {
    return [this[0].v2_clone(), this[1].v2_clone()];
});

Array.add_method('seg_direction', function() {
    return this[1].v2_sub(this[0]);
});

Array.add_method('seg_unit_up', function() {
    return this[1].v2_sub(this[0]).v2_norm().v2_unit();
});
Array.add_method('seg_unit_down', function() {
    return this[0].v2_sub(this[1]).v2_norm().v2_unit();
});

Array.add_method('seg_shift_by', function(v) {
    return [this[0].v2_add(v), this[1].v2_add(v)];
});

Array.add_method('seg_move_perpendicular', function(s) {
    return this.seg_shift_by(this.seg_unit_up().v2_smult(s));
});

// distance between this and v
Array.add_method('v2_dist', function(v) {return this.v2_sub(v).v2_len()});

// dot product of this and v
Array.add_method('v2_dot', function(v) {return this[0]*v[0] + this[1]*v[1]});

Array.add_method('v2_mult', function(v) {return [this[0]*v[0], this[1]*v[1]]});

// scalar multiple of this and s
Array.add_method('v2_smult', function(s) {return [this[0]*s, this[1]*s]});

// projection of v on this
Array.add_method('v2_project', function(v) {
    return this.v2_smult(this.v2_dot(v)/this.v2_len_squared());
});

/* shortest distance from this to v 
 * (length of line segment from v at right angles to this to some point on this) */
Array.add_method('v2_shortest_dist_to', function(v) {
    return v.v2_dist(this.v2_project(v));
});

Array.add_method('v2_angle', function() {
    return Math.atan2(this[1], this[0]);
});

Array.add_method('v2_angle_between', function(v) {
    var ret = Math.atan2(this[1], this[0]) - Math.atan2(v[1], v[0]);
    if (ret < 0) {
        ret += Math.PI*2;
    }
    return ret;
});

/* return multiplier for the distance from v to a point on this
 * such that positive distances are 'to the left'
 */
Array.add_method('v2_relative_sign', function(v) {
    if (this.v2_norm().v2_dot(v) > 0) {
        return 1;
    } else {
        return -1;
    }
});

Array.add_method('v2_signed_shortest_dist_to', function(v) {
    return this.v2_shortest_dist_to(v) * this.v2_relative_sign(v);
});

// add segment methods to Array
Array.add_method('seg_equals', function(s) {
    return this[0].v2_equals(s[0]) && this[1].v2_equals(s[1]);
});

Array.add_method('seg_unsigned_equals', function(s) {
    return this.seg_equals(s) || this.seg_flip().seg_equals(s);
});

Array.add_method('seg_to_dir_v2', function() {
    return this[1].v2_sub(this[0]);
});

Array.add_method('seg_signed_shortest_dist_to', function(v) {
    return this.seg_to_dir_v2().v2_signed_shortest_dist_to(v.v2_sub(this[0]));
});

Array.add_method('seg_shortest_dist_to', function(v) {
    return Math.abs(this.seg_signed_shortest_dist_to(v));
});

Array.add_method('seg_shortest_dist_to_just', function(v) {
    var proj = this[1].v2_sub(this[0]).v2_project(v.v2_sub(this[0])).v2_add(this[0]);
    if (this.seg_contains_v2_on_line(proj)) {
        return this.seg_shortest_dist_to(v);
    } else {
        return Math.min(this[0].v2_dist(v), this[1].v2_dist(v));
    }
});

Array.add_method('seg_flip', function() {return [this[1], this[0]]});

Array.add_method('seg_filter_above', function(vs) {
    var _this = this;
    return vs.filter(function(v) {
        return _this.seg_signed_shortest_dist_to(v) > 0;
    });
});

Array.add_method('seg_filter_below', function(vs) {
    return this.seg_flip().seg_filter_above(vs);
});

Array.add_method('seg_other_v', function(v) {
    if (this[0].v2_equals(v)) {
        return this[1];
    } else if (this[1].v2_equals(v)) {
        return this[0];
    } else {
        return null;
    }
});

Array.add_method('seg_mid', function() {
    return [(this[0][0] + this[1][0])/2, (this[0][1] + this[1][1])/2];
});

Array.add_method('seg_norm_v', function() {
    return this.seg_to_dir_v2().v2_norm();
});

Array.add_method('seg_perpendicular_bisector_line', function() {
    return [this.seg_mid(), this.seg_norm_v()];
});

// add line methods to Array
// a line is a pair of vectors [p, v]
// such that p is a point on the line and v is its direction
// (ie. line = p + av for all real numbers 'a'

Array.add_method('line_intersection', function(l) {

    // if the lines are parallel there's no intersection
    if (this[1].v2_aligned(l[1])) {
        return null;
    }

    var r = this[0].v2_sub(l[0]);
    var matrix = [
        -this[1][0], -this[1][1],
        l[1][0], l[1][1]
    ];
    mat2.invert(matrix, matrix); // invert the matrix in place
    mat2.multiply(r, matrix, r); // reuse r as the output
    return this[0].v2_add(this[1].v2_smult(r[0]));
});

Array.add_method('seg_length', function() {
    return this[1].v2_sub(this[0]).v2_len();
});

Array.add_method('seg_to_line', function() {
    return [this[0], this.seg_to_dir_v2()];
});

Array.add_method('seg_extend', function(length) {
    return [this[0], this[0].v2_add(this.seg_direction().v2_to_length(length))];
});

Array.add_method('seg_contains_v2_on_line_exclusive', function(v) {
    return Math.between_exclusive(0, this.seg_aligned_ratio(v), 1);
});
Array.add_method('seg_contains_v2_on_line', function(v) {
    return Math.between_inclusive(0, this.seg_aligned_ratio(v), 1);
});

Array.add_method('seg_intersects_exclusive', function(s) {
    return this.seg_intersection_exclusive(s) != null;
});

Array.add_method('seg_intersects', function(s) {
    return this.seg_intersection(s) != null;
});

Array.add_method('seg_intersection', function(s) {
    if (this.seg_length() == 0 || s.seg_length() == 0) {
        return null;
    }
    // find the interesction of the two lines
    var intersection = this.seg_to_line().line_intersection(
                            s.seg_to_line());

    // case where segments are parallel
    if (intersection == null) {
        return null;
    }

    // check if it's on both segments
    if (this.seg_contains_v2_on_line(intersection) &&
        s.seg_contains_v2_on_line(intersection)) {

        return intersection;
    }

    return null;
});

Array.add_method('seg_intersection_exclusive', function(s) {
    if (this.seg_length() == 0 || s.seg_length() == 0) {
        return null;
    }
    // find the interesction of the two lines
    var intersection = this.seg_to_line().line_intersection(
                            s.seg_to_line());

    // case where segments are parallel
    if (intersection == null) {
        return null;
    }

    // check if it's on both segments
    if (this.seg_contains_v2_on_line_exclusive(intersection) &&
        s.seg_contains_v2_on_line_exclusive(intersection)) {

        return intersection;
    }

    return null;

});

Array.add_method('circ_contains', function(v) {
    return this[0].v2_dist(v) <= this[1];
});

// returns the circle which passes through the three specified
// points in the form [centre, radius]
var circle_through = function(a, b, c) {
    var l0 = [a, b].seg_perpendicular_bisector_line();
    var l1 = [b, c].seg_perpendicular_bisector_line();



    var centre = l0.line_intersection(l1);

    var radius = centre.v2_dist(a);
    return [centre, radius];
}

var radians_to_degrees = function(r) {
    return r * 180 / Math.PI;
}

var degrees_to_radians = function(d) {
    return d * Math.PI / 180;
}
var dtor = degrees_to_radians;

/*
 * Returns the anticlockwise angle between a->b->c
 */
var angle_through = function(a, b, c) {
    var a_shift = a.v2_sub(b);
    var c_shift = c.v2_sub(b);
    return a_shift.v2_angle_between(c_shift);
}

/* called on an array of segments and returns
 * an array of the points they are composed of
 */
Array.add_method('segs_to_vectors', function() {
    return this.reduce(function(a, b){return a.concat(b)}, []);
});

Array.add_method('polygons_to_vectors', Array.prototype.segs_to_vectors);

Array.add_method('v2_line_in_dir', function(v) {
    return [this, v];
});

Array.add_method('v2_line_through', function(v) {
    return [this, v.v2_sub(this)];
});

Array.add_method('polygon_each_side', function(f) {
    for (var i = 1,len=this.length;i<len;++i) {
        f(this[i-1], this[i]);
    }
    f(this[this.length-1], this[0]);
});

Array.add_method('polygon_to_segments', function() {
    var segments = [];
    this.polygon_each_side(function(a, b) {
        segments.push([a, b]);
    });
    return segments;
});

Array.add_method('polygon_count_intersections', function(seg) {
    var count = 0;
    this.polygon_each_side(function(a, b) {
        if (seg.seg_intersection([a, b]) != null) {
            ++count;
        }
    });
    return count;
});

Array.add_method('polygon_contains', function(v) {
    var high = v.v2_add([0, 100000]);
    return this.polygon_count_intersections([v, high]) % 2 == 1;
});

Array.add_method('algebra_type', function() {
    if (this.length > 2) {
        return 'polygon';
    }

    switch(typeof(this[0])) {
        case 'number': return 'vector';
        case 'object':
        switch(this[0].algebra_type()) {
            case 'vector': return 'segment'
        }
    }
});

Array.add_method('v2_arr_closest_to', function(v) {
    return this.most(function(w) {
        return -v.v2_dist(w)
    });
});

Array.add_method('seg_arr_closest_to', function(v) {
    return this.most(function(s) {
        return -s.shortest_dist_to(v);
    });
});

Array.add_method('v2_move_by', function(v) {
    this[0] += v[0];
    this[1] += v[1];
});

Array.add_method('seg_move_by', function(v) {
    this.map(function(w) {w.v2_move_by(v)});
});

Array.add_method('polygon_move_by', Array.prototype.seg_move_by);

Array.add_method('move_by', function(v) {
    if (this.is_v2()) {
        this.v2_move_by(v);
    } else {
        this.seg_move_by(v);
    }
});

Array.add_method('is_v2', function() {
    return typeof(this[0]) == 'number';
});

Array.add_method('deep_clone', function() {
    if (this.is_v2()) {
        return this.slice();
    }

    return this.map(function(x) {return x.deep_clone()});
});

Array.add_method('v2_interpolate', function(v, amount) {
    return this.v2_add(v.v2_sub(this).v2_smult(amount));
});

Array.add_method('polygon_average', function() {
    return this.reduce(function(v, acc){return acc.v2_add(v)}).v2_smult(1/this.length);
});

Array.add_method('seg_closest_pt_to_v', function(v) {
    return this.seg_to_line().line_closest_pt_to_v(v);
});

Array.add_method('line_closest_pt_to_v', function(v) {
    return this[1].v2_project(v.v2_sub(this[0])).v2_add(this[0]);
});

Array.add_method('circ_closest_pt_to_line', function(l) {
    return l.line_closest_pt_to_v(this[0]).v2_sub(this[0]).v2_to_length(this[1]).v2_add(this[0]);
});

Array.add_method('circ_closest_pt_to_seg', function(seg) {
    return this.circ_closest_pt_to_line(seg.seg_to_line());
});

Array.add_method('circ_add', function(v) {
    return [this[0].v2_add(v), this[1]];
});
Array.add_method('circ_sub', function(v) {
    return [this[0].v2_sub(v), this[1]];
});

Array.add_method('v2_circle_intersections', function(circle) {
    var mid = circle[0];
    var rad = circle[1];

    var a = this[0]*this[0] + this[1]*this[1];
    var b = -2*(this[0]*mid[0] + this[1]*mid[1]);
    var c = mid[0]*mid[0] + mid[1]*mid[1] - rad*rad;

    var xs = solve_quadratic(a, b, c);
    
    return xs.map(function(x) {return this.v2_smult(x)}.bind(this));
});

/*
 * If there was only one solution to the quadratic, then the circle
 * was just touching the line. In this case, act as though no intersection
 * occured. Otherwise, behave as normal.
 */
Array.add_method('v2_circle_intersections_exclusive', function(circle) {
    var ret = this.v2_circle_intersections(circle);
    if (ret.length == 1) {
        return [];
    } else {
        return ret;
    }
});

Array.add_method('line_circle_intersections', function(circle) {
    return this[1].v2_circle_intersections(circle.circ_sub(this[0]))
        .map(function(x){return x.v2_add(this[0])}.bind(this));
});

Array.add_method('line_circle_intersections_exclusive', function(circle) {
    return this[1].v2_circle_intersections_exclusive(circle.circ_sub(this[0]))
        .map(function(x){return x.v2_add(this[0])}.bind(this));
});

Array.add_method('seg_circle_intersections', function(circle) {
    var line_intersections = this.seg_to_line().line_circle_intersections(circle);
    return line_intersections.filter(function(v) {
        return this.seg_contains_v2_on_line(v);
    }.bind(this));
});

Array.add_method('seg_circle_intersections_exclusive', function(circle) {
    var line_intersections = this.seg_to_line().line_circle_intersections_exclusive(circle);
    var ret = line_intersections.filter(function(v) {
        return this.seg_contains_v2_on_line_exclusive(v);
    }.bind(this));

    return ret;
});

function solve_quadratic(a, b, c) {
    var to_root = approx_non_negative(b*b-4*a*c);
    var roots;
    if (to_root < 0) {
        return [];
    } else if (to_root == 0) {
        roots = [0];
    } else {
        var root = Math.sqrt(to_root);
        roots = [root, -root];
    }

    return roots.map(function(root) {
        return (-b + root)/(2*a);
    });
}

function angle_to_unit_vector(angle) {
    return [
        Math.cos(angle),
        Math.sin(angle)
    ];
}

Array.add_method('v2_to_ints', function() {
    return [parseInt(this[0]), parseInt(this[1])];
});

function angle_normalize(angle) {
    if (angle > -Math.PI && angle <= Math.PI) {
        return angle;
    }
    if (angle <= -Math.PI) {
        return angle_normalize(angle + Math.PI*2);
    }
    if (angle > Math.PI) {
        return angle_normalize(angle - Math.PI*2);
    }
}
function rem(a, b) {
    var div = a/b;
    return (div - Math.floor(div)) * b;
}

/*
 * Given an equation with 2 unknown scalars of the form
 * ax + by = c
 * where a, b and c are vectors in r2,
 * returns [x, y]
 */
Algebra.equation_solve_2 = function(a, b, c) {
    var m = [a[0], a[1], 
             b[0], b[1]];

    mat2.invert(m, m);
    mat2.multiply(m, m, c);

    return [m[0], m[1]];
}

Algebra.nearest_rotation_multiplier = function(current, target) {
    var diff = target - current;
    if (diff < -Math.PI || (diff >= 0 && diff < Math.PI)) {
        return 1;
    } else {
        return -1;
    }
}
