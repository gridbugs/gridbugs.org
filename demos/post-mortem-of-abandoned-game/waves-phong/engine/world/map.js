function Map() {}

Map.prototype.regions = function(o) {
    this.region_hash = {};
    this.region_arr = [];
    for (var name in o) {
        var r = new Region(o[name], this.drawer, this);
        this.region_hash[name] = r;
        this.region_arr.push(r);
    }

}

Map.prototype.connect = function() {
    var lines = Array.arguments_array(arguments);
    for (var i = 0;i<lines.length;i++) {
        var line = lines[i];
        var left = line[0];
        var right = line[1];
        var seg = line[2];
        this.region_hash[left].connect(this.region_hash[right], seg);
    }
}

Map.prototype.create_collision_processors = function() {
    this.region_arr.map(function(r){r.create_collision_processor()});
    return this;
}

Map.prototype.create_visibility_contexts = function() {
    this.region_arr.map(function(r){r.create_visibility_context()});
    return this;
}

Map.prototype.visible = function(o) {
    this.visible_obj = o;
}

Map.prototype.images = function(base, o) {
    if (o == undefined) {
        o = base;
        base = '';
    }
    this.image_description = o;
    this.image_url_base = base;

    this.image_data = {};
    var image_loaders = [];
    for (var name in o) {
        var desc = o[name];
        var loader = new SingleImageLoader(base + desc[0]);
        image_loaders.push(loader);
        this.image_data[name] = {
            image: loader.image,
            translate: desc[1],
            size: desc[2],
            clip_start: desc[3],
            clip_size: desc[4]
        };
    }

    this.image_loader = new AsyncGroup(image_loaders);
}

Map.prototype.process_images = function() {
    this.image_closures = {};
    for (var name in this.image_data) {
        var data = this.image_data[name];
        this.image_closures[name] = this.drawer.image(
            data.image,
            data.translate,
            data.size,
            data.clip_start,
            data.clip_size
        );
    }
}


Map.prototype.load_visible = function() {
    var o = this.visible_obj;
    this.group_hash = {};
    this.group_arr = [];
    var drawer = this.drawer;
    for (var name in o) {
        var group = drawer.group(this.region_hash[name].segs.map(function(s) {
            return drawer.line_segment(s[0], s[1], 1)
        }));
        this.group_hash[name] = group;
        this.group_arr.push(group);

        if (!o[name]) {
            group.hide();
        }

        this.region_hash[name].group = group;
    }
}

Map.prototype.levels = function(o) {
    this.levels_obj = o;
}

Map.prototype.load_levels = function() {
    var o = this.levels_obj;
    this.level_arr = [];
    this.level_hash = {};
    for (var name in o) {
        var region_names = o[name][0];
        var extras = o[name][1];
        var floor_name = o[name][2];
        var regions = region_names.map(function(n){return this.region_hash[n]}.bind(this));
        var level = new Level(this.drawer, regions, extras, this.image_closures[floor_name]);
        
        this.level_arr.push(level);
        this.level_hash[name] = level;
    }
}

Map.prototype.lights = function(o) {
    this.lights_obj = o;
}

Map.prototype.load_lights = function() {
    var o = this.lights_obj;
    for (var light_name in o) {
        var data = o[light_name];
        var level_name = data[0];
        var position = data[1];
        var radius = data[2];
        var colour = data[3];
        var level = this.level_hash[level_name];
        level.add_light(position, radius, colour);
    }
}

Map.prototype.level_detectors = function(o) {
    this.level_detectors_obj = o;
}

Map.prototype.load_level_detectors = function() {
    var o = this.level_detectors_obj;
    for (var region_name in o) {
        var left_name = o[region_name][0];
        var right_name = o[region_name][1];
        var segment = o[region_name][2];
        var left = this.level_hash[left_name];
        var right = this.level_hash[right_name];
        var region = this.region_hash[region_name];
        region.add_level_detector(left, right, segment);
    }
}

Map.prototype.initial = function(level_name) {
    this.initial_level_name = level_name;
}
Map.prototype.load_initial = function() {
    var drawer = this.drawer;
    var level = this.level_hash[this.initial_level_name];
    this.group_hash = {};
    this.group_arr = [];
    
    for (var name in this.region_hash) {
        var region = this.region_hash[name];
        var group = drawer.group(region.segs.map(function(s) {
            return drawer.line_segment(s[0], s[1], 1)
        }));
        this.group_hash[name] = group;
        this.group_arr.push(group);
        group.hide();

        region.group = group;
    }

    for (var i = 0;i<level.regions.length;i++) {
        var region = level.regions[i];
        region.group.show();
    }
}

Map.prototype.visible_regions = function() {
    var ret = [];
    for (var i = 0;i<this.group_arr.length;i++) {
        if (this.group_arr[i].visible) {
            ret.push(this.region_arr[i]);
        }
    }
    return ret;
}

Map.prototype.display_detectors = function() {
    this.display_detectors_arr = Array.arguments_array(arguments);
}
Map.prototype.load_display_detectors = function() {
    var lines = this.display_detectors_arr;
    for (var i = 0;i<lines.length;i++) {
        var line = lines[i];
        
        var region = this.region_hash[line[0]];
        var left_names = line[1].constructor == Array ? line[1] : [line[1]];
        var right_names = line[2].constructor == Array ? line[2] : [line[2]];
        var seg = line[3];

        var left = left_names.map(function(n){return this.region_hash[n]}.bind(this));
        var right = right_names.map(function(n){return this.region_hash[n]}.bind(this));

        region.add_display_detector(left, right, seg);
    }
}

Map.prototype.draw = function() {
    this.group_arr.map(function(g) {g.draw()}); 
}

Map.prototype.run = function(then) {
    this.image_loader.run(function() {

        this.process_images();

        this.load_visible();
        this.create_vertices();
        this.load_levels();
        this.load_level_detectors();
        this.load_initial();
        this.load_lights();
        this.create_collision_processors();
    
        then();
    }.bind(this));
}

Map.prototype.set_drawer = function(drawer) {
    this.drawer = drawer;
}

Map.prototype.insert_seg_vertices = function(seg, region) {
    var exists = [false, false];
    for (var i = 0;i<this.vertices.length;i++) {
        var vertex = this.vertices[i];
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
    for (var i = 0;i<2;i++) {
        if (!exists[i]) {
            var vertex = new Vertex(seg[i]);
            this.vertices.push(vertex);
            vertex.neighbours.push(seg[1-i]);
            vertex.segs.push(seg);
            region.vertices.push(vertex);
        }
    }
}

Map.prototype.create_vertices = function() {
    this.vertices = [];

    for (var i = 0;i<this.region_arr.length;i++) {
        var region = this.region_arr[i];
        for (var j = 0;j<region.segs.length;j++) {
            var seg = region.segs[j];
            this.insert_seg_vertices(seg, region);
        }
    }

}

Map.prototype.update_lights = function() {
    this.level_arr.map(function(l){l.update_lights()});
}
