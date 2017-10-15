var test;
function VisibilityContext(vertices, segs) {
    this.vertices = vertices;
    this.segs = segs;
}

VisibilityContext.from_regions = function(regions, extra) {
    var segs = [];
    for (var i = 0;i<regions.length;i++) {
        segs = segs.concat(regions[i].segs);
    }
    return VisibilityContext.from_segs(segs, extra);
}

VisibilityContext.from_segs = function(segs, extra) {
    var all_segs = segs.concat(extra);
    var vertices = Vertex.vertices_from_segs(all_segs);
    return new VisibilityContext(vertices, all_segs);
}

VisibilityContext.LARGE_NUMBER = 10000;
VisibilityContext.TOLERANCE = 0.01;
VisibilityContext.LOW_TOLERANCE = 0.0001;

VisibilityContext.prototype.vertex_by_position = function(pos) {
    for (var i = 0;i<this.vertices.length;i++) {
        if (this.vertices[i].pos.v2_close(pos, VisibilityContext.TOLERANCE)) {
            return this.vertices[i];
        }
    }
    return null;
}

VisibilityContext.prototype.non_intersecting_vertices = function(eye) {
    var vertices = this.vertices;
    var segs = this.segs;
    var ret = [];
    for (var i = 0,len=vertices.length;i<len;++i) {
        var vertex = vertices[i];
        var ray = [eye, vertex.pos];

        var hits_seg = false;
        for (var j = 0,slen = segs.length;j<slen;j++) {
            var seg = segs[j];
            var intersection = ray.seg_to_line().line_intersection(seg.seg_to_line());

            if (intersection == null) {
                continue;
            }

           
            var seg_ratio = seg.seg_aligned_ratio(intersection);
            if (seg_ratio < 0 || seg_ratio > 1) {
                continue;
            }
 
            // if the interesction was anywhere on the ray except right at the end
            var ray_ratio = ray.seg_aligned_ratio(intersection);

            if (ray_ratio > 0 && ray_ratio < (1 - VisibilityContext.TOLERANCE)) {
                hits_seg = true;
                break
            }
            
        }
        if (!hits_seg) {
            ret.push(vertex);
        }
    }
    return ret;
}

VisibilityContext.prototype.closest_ray_intersection = function(ray, side_mask) {
    var min_distance = ray.seg_length();
    var closest = ray[0].v2_add(ray.seg_direction().v2_to_length(VisibilityContext.LARGE_NUMBER));
    var segs = this.segs;
    var hint = null;
    
    for (var i = 0,slen = segs.length;i<slen;i++) {
        var seg = segs[i];
        var intersection = ray.seg_to_line().line_intersection(seg.seg_to_line());


        // lines were parallel so no intersection
        if (intersection == null) {
            continue;
        }
 
        // intersection did not occur within the line segment      
        var seg_ratio = seg.seg_aligned_ratio(intersection);

        if (seg_ratio > 1 || seg_ratio < 0) {
            continue;
        }
        
        var vertex = this.vertex_by_position(intersection);
        
        var intersection_occured = false;
        if (vertex == null) {
            intersection_occured = true;
        } else {
            var connected_sides = this.connected_sides(ray, vertex);
            intersection_occured = (connected_sides[0]||side_mask[0])&&(connected_sides[1]||side_mask[1]);
            
       }

        if (intersection_occured) {
            var ray_ratio = ray.seg_aligned_ratio(intersection);
            if (ray_ratio > 0) {
                var dist = ray[0].v2_dist(intersection);
                if (dist < ray[0].v2_dist(closest)) {
                    closest = intersection;
                    if (vertex == null) {
                        hint = seg;
                    } else {
                        hint = vertex;
                    }
                }
            }
        }

        
    }
    return [closest, hint];
}

VisibilityContext.prototype.connected_sides = function(ray, vertex) {
    /* check if all the connected points to this vertex are all on one side
     * of the ray
     */
    var radial_vector = ray.seg_direction();
    var ray_norm = radial_vector.v2_norm();
    var neighbours = vertex.neighbours;
    var left = false;
    var right = false;
    for (var i = 0,nlen = neighbours.length;i<nlen;i++) {
        var v_to_nei = neighbours[i].v2_sub(vertex.pos);
        var dot = ray_norm.v2_dot(v_to_nei);
        if (dot < -VisibilityContext.LOW_TOLERANCE) {
            left = true;
        } else if (dot > VisibilityContext.LOW_TOLERANCE) {
            right = true;
        }
        // if dot == 0 it's not on either side
    }

    return [left, right];
}

VisibilityContext.prototype.connected_points_on_both_sides = function(ray, vertex) {
    var sides = this.connected_sides(ray, vertex);
    return sides[0] && sides[1];
}

VisibilityContext.prototype.visible_polygon = function(eye) {

    var vertices = this.non_intersecting_vertices(eye);

    var indices = Array.range(0, vertices.length);

    var radial_vectors = vertices.map(function(v) {
        return v.pos.v2_sub(eye);
    });
    
    var angles = radial_vectors.map(function(v) {
        return v.v2_angle();
    });

    indices.sort(function(i, j) {
        return angles[i] - angles[j];
    });

    var points = [];

    var segs = this.segs;

    var last_hint = null;

    // used to determine if there are multiple consecutive aligned vertices
    var last_radial_vector = null; 


    // rotate indices so indices[0] refers to a vertex connecetd on both sides
    for (var i = 0,len=indices.length;i<len;++i) {
        var idx = indices[i];
        var vertex = vertices[idx];
        var ray = [eye, vertex.pos];

        if (this.connected_points_on_both_sides(ray, vertex)) {
            indices = indices.rotate(i);
            break;
        }
    }
    
    //console.debug(indices.map(function(i){return [eye, vertices[i].pos]}));

    for (var i = 0,len=indices.length;i<len;++i) {
        var idx = indices[i];
        var vertex = vertices[idx];
        var ray = [eye, vertex.pos];

        var radial_vector = radial_vectors[i];

        var connected_sides = this.connected_sides(ray, vertex);
        if (connected_sides[0] && connected_sides[1]) {
            points.push([ray[1][0], ray[1][1], 0]);
 //           drawer.draw_line_segment(ray);
            //drawer.draw_point(ray[1], tc('green'), 8);
            last_hint = vertex;
        } else {

            /* the ray hit the side of a corner, so we continue it until
             * it hits something more substantial (either a segment edge
             * or the front of a corner
             */
            var closest_intersection = this.closest_ray_intersection(ray, connected_sides);
            var intersection_point = closest_intersection[0];
            
            /* the hint is used by the next vertex when determining the order
             * to insert points into the points array in the case where
             * the ray hits the side of a corner (ie. this case)
             */
            var hint = closest_intersection[1];

            /* Use the last hint to determine the order to insert points.
             * The choice is between the "near" point, which is the vertex
             * whose side was glanced by the ray, and the "far" point,
             * which is the point where the extended ray hits something.
             *
             * If the last hint is a segment, the last ray also glanced a vertex,
             * and was extended to collide with that segment. The first point
             * to insert is a point on that segment.
             *
             * If the last hint is a vertex, either the last ray hit that
             * vertex directly, or it glanced a different vertex and eventually
             * hit this vertex. In either case, the first point should be a
             * point between the hint vertex and one of its neighbours.
             */
            var near_first = true;
            if (last_hint && last_hint.constructor == Vertex) {
                if (last_hint.between_any_neighbour(ray[1], VisibilityContext.TOLERANCE)) {
                    near_first = true;
                } else if (last_hint.between_any_neighbour(intersection_point, VisibilityContext.TOLERANCE)) {
                    near_first = false;
                } else {
                    
                    drawer.draw_point(last_hint.pos, tc('green'), 8);
                    drawer.draw_point(ray[1], tc('red'), 8);
                    drawer.draw_point(intersection_point, tc('blue'), 8);
                    console.debug(last_hint);
                    console.debug(ray[1]);
                    console.debug(intersection_point);
                    console.debug('error vertex');
                    console.debug(agent.pos);
                    
                }
            } else if (last_hint) {
               if (last_hint.seg_nearly_contains(ray[1], VisibilityContext.TOLERANCE)) {
                    near_first = true;
               } else if (last_hint.seg_nearly_contains(intersection_point, VisibilityContext.TOLERANCE)) {
                    near_first = false;
               } else {
                    drawer.draw_line_segment(last_hint, tc('blue'), 4);
                    drawer.draw_point(intersection_point, tc('blue'), 8);
                    drawer.draw_point(ray[1], tc('red'), 8);
                    console.debug(last_hint);
                    console.debug(ray[1]);
                    console.debug(intersection_point);
                    console.debug('error segment');
                    console.debug('pos', agent.pos);
               }
            }

            if (near_first) {
                points.push([ray[1][0], ray[1][1], 1]);
                points.push([intersection_point[0], intersection_point[1], 1]);
                last_hint = hint;
            } else {
                points.push([intersection_point[0], intersection_point[1], 1]);
                points.push([ray[1][0], ray[1][1], 1]);
                last_hint = vertex;
            }
         
            //drawer.draw_point(ray[1], tc('grey'), 12);
            //drawer.draw_point(intersection_point, tc('black'), 8);
            
        }
        
    }

    return points;
}
