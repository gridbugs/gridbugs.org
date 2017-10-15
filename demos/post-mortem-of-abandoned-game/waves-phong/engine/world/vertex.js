function Vertex(pos) {
    this.pos = pos;
    this.neighbours = [];
    this.segs = [];
}
Vertex.prototype.has_neighbour = function(v) {
    var nei = this.neighbours;
    for (var i = 0,len=nei.length;i<len;i++) {
        if (nei[i].v2_equals(v)) {
            return true;
        }
    }
    return false;
}
Vertex.prototype.between_any_neighbour = function(v, tolerance) {
    var nei = this.neighbours;
    var pos_to_v = v.v2_sub(this.pos);
    for (var i = 0,len=nei.length;i<len;i++) {
        var rel = nei[i].v2_sub(this.pos);
        if (rel.v2_nearly_aligned(pos_to_v, tolerance) && Math.between_inclusive(0, rel.v2_aligned_ratio(pos_to_v), 1)) {
            return true;
        }
    }
    return false;
}

Vertex.vertices_from_segs2 = function(segs) {
    var ret = [];

    for (var i = 0;i<segs.length;i++) {
        var seg = segs[i];

        var seg_vertices = [null, null];
        
        // check if either ends of this segment are already a vertex
        for (var j = 0;j<ret.length;j++) {
            var vertex = ret[j];

            if (seg[0].v2_equals(vertex.pos)) {
                seg_vertices[0] = vertex;
            } else if (seg[1].v2_equals(vertex.pos)) {
                seg_vertices[1] = vertex;
            }
        }

        if (seg_vertices[0] == null) {
            seg_vertices[0] = new Vertex(segs[0]);
        }

        if (seg_vertices[1] == null) {
            seg_vertices[1] = new Vertex(segs[1]);
        }
    }
}


Vertex.vertices_from_segs = function(segs) {

    var ret = [];

    for (var i = 0;i<segs.length;i++) {
        var seg = segs[i];

        var exists = [false, false];
        for (var j = 0;j<ret.length;j++) {
            var vertex = ret[j];

            if (seg[0].v2_equals(vertex.pos)) {
                vertex.neighbours.push(seg[1]);
                vertex.segs.push(seg);
                exists[0] = true;
            } else if (seg[1].v2_equals(vertex.pos)) {
                vertex.neighbours.push(seg[0]);
                vertex.segs.push(seg);
                exists[1] = true;
            }
        }

        for (var j = 0;j<2;j++) {
            if (!exists[j]) {
                var vertex = new Vertex(seg[j]);
                ret.push(vertex);
                vertex.neighbours.push(seg[1-j]);
                vertex.segs.push(seg);
            }
        }
    }

    return ret;
}
