function Agent(pos, facing) {
    this.facing = facing;
    this.last_pos = pos;
    this.pos = pos;
    this.move_speed = 10;
    this.turn_speed = Math.PI/8;
    this.colour = "black";
    this.rad = 30;
}

Agent.prototype.enter_region = function(region) {
    this.region = region;
}
Agent.prototype.enter_level = function(level) {
    this.level = level;
}

Agent.prototype.border_detect = function() {
    this.region.border_detect(this);
}
Agent.prototype.level_detect = function() {
    this.region.level_detect(this);
}

Agent.set_controlled_agent = function(agent) {
    Agent.controlled_agent = agent;
    Input.register_mousemove_callback("turn_agent", function(mouse_pos) {
        agent.turn_to_face(mouse_pos);
    });
}
Agent.prototype.turn_to_face = function(pt) {
    var start = this.pos;
    var end = Input.get_mouse_pos();
    var between = end.v2_sub(start);
    this.facing = Math.atan2(between[1], between[0]);
}

Agent.prototype.control_tick = function(time_delta) {
    this.turn_to_face(Input.get_mouse_pos());
    var angle;

    if (Input.is_down("w,")) {
        angle = this.facing;
    } else if (Input.is_down("so")) {
        angle = this.facing + Math.PI;
    } else if (Input.is_down("a")) {
        angle = this.facing - Math.PI/2;
    } else if (Input.is_down("de")) {
        angle = this.facing + Math.PI/2;
    } else {
        return false;
    }
    
    var dest = this.pos.v2_add(angle_to_unit_vector(angle).v2_smult(this.move_speed));
    this.last_pos = this.pos;
    this.pos = this.region.collision_processor.process(this.pos, dest, this.rad);

    return true;
}


Agent.prototype.absolute_control_tick = function(time_delta) {
    var vec = [0, 0];
    
    if (Input.is_down("w,")) {
        vec = vec.v2_add([0, -1]);
    } 
    if (Input.is_down("so")) {
        vec = vec.v2_add([0, 1]);
    }
    if (Input.is_down("a")) {
        vec = vec.v2_add([-1, 0]);
    }
    if (Input.is_down("de")) {
        vec = vec.v2_add([1, 0]);
    } 
    if (vec.v2_len() == 0) {
        return false;
    }
    vec = vec.v2_unit();
    
    var final_facing = vec.v2_angle();
    agent.turn_towards_angle(final_facing);

    var dest = this.pos.v2_add(vec.v2_smult(this.move_speed*time_delta/1000));
    this.last_pos = this.pos;
    this.pos = this.region.collision_processor.process(this.pos, dest, this.rad);
    
    return true;
}

Agent.prototype.stop = function() {
    this.last_pos = this.pos;
}

Agent.prototype.last_move_seg = function() {
    return [this.last_pos, this.pos];
}

Agent.prototype.turn_towards_point = function(pt) {
    return this.turn_towards_angle(this.pos.v2_angle_between(pt));
}

Agent.prototype.turn_towards_angle = function(angle) {
    var target_angle = angle;
    var angle_diff = radians_between(this.facing, target_angle);
    if (angle_diff <= this.turn_speed) {
        this.facing = target_angle;
    } else {
        this.facing = 
            angle_normalize(this.facing + this.turn_speed * Algebra.nearest_rotation_multiplier(this.facing, target_angle));
    }
}
