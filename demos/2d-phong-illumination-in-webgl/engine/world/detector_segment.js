function DetectorSegment(seg, left_callback, right_callback) {
    this.seg = seg;
    this.left_callback = left_callback;
    this.right_callback = right_callback;
}

/*
 * If the path intersects the segment (inclusive on both ends of the path)
 * then call one of the callbacks. If you stand at this.seg[0], looking towards
 * this.seg[1], if path points to the left, the left callback is called.
 * Otherwise, the right callback is called.
 */
DetectorSegment.prototype.detect = function(path) {

    // if the path starts and ends on the segment, don't detect
    if (this.seg.seg_aligned(path[0]) && this.seg.seg_aligned(path[1])) {
        return;
    }
    
    // if the path crosses the segment
    if (this.seg.seg_intersects(path)) {
        var dot = this.seg.seg_direction().v2_norm().v2_dot(path.seg_direction());
        var left = dot > 0;

        // if neither the start or end lying on the segment
        if (this.seg.seg_aligned(path[0])) {
            // path starts on segment
 
            // only call the callback if the direction is generally the same
            if (this.stored_left == left) {
                this.call_callback(left, arguments);
            }

        } else if (this.seg.seg_aligned(path[1])) {
            // path ends on segment
 
            /* the next time this is invoked, provided that the movement is
             * in generally the same direction, call the appropriate callback
             */

            this.stored_left = left;

        } else {

            // path croses segment
            this.call_callback(left, arguments);
        }
    }
}

DetectorSegment.prototype.call_callback = function(left, args) {
    if (left) {
        this.left_callback.apply(window, args);
    } else {
        this.right_callback.apply(window, args);
    }
}

DetectorSegment.prototype.draw = function(drawer) {
    drawer.draw_line_segment(this.seg, tc('lightgrey'), 2);
}
