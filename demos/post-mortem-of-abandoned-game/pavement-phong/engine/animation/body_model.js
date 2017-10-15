function BodyPart(image, translate, rotate, scale, 
                  private_translate, private_rotate, private_scale) {

    this.image = image;
    this.translate = translate || new ContinuousValue(new VectorWrapper([0, 0]));
    this.rotate = rotate || new ContinuousValue(new AngleWrapper(0));
    this.scale = scale || new ContinuousValue(new VectorWrapper([1, 1]));
    this.private_translate = private_translate || new ContinuousValue(new VectorWrapper([0, 0]));
    this.private_rotate = private_rotate || new ContinuousValue(new AngleWrapper(0));
    this.private_scale = private_scale || new ContinuousValue(new VectorWrapper([1, 1]));
}

BodyPart.prototype.i = function() {return this.image}
BodyPart.prototype.t = function() {return this.translate}
BodyPart.prototype.r = function() {return this.rotate}
BodyPart.prototype.s = function() {return this.scale}
BodyPart.prototype.pt = function() {return this.private_translate}
BodyPart.prototype.pr = function() {return this.private_rotate}
BodyPart.prototype.ps = function() {return this.private_scale}

BodyPart.prototype.flip_x = function() {
    return new BodyPart(
        this.image == undefined ? undefined : this.image.flip_x(),
        this.translate.flip_x(),
        this.rotate.flip_x(),
        this.scale,//.flip_x()
        this.private_translate.flip_x(),
        this.private_rotate.flip_x(),
        this.private_scale//.flip_x()
    );
}

BodyPart.prototype.clone_with_offset = function(offset) {
    return new BodyPart(
        this.image == undefined ? undefined : this.image.clone_with_offset(offset),
        this.translate.clone_with_offset(offset),
        this.rotate.clone_with_offset(offset),
        this.scale.clone_with_offset(offset),
        this.private_translate.clone_with_offset(offset),
        this.private_rotate.clone_with_offset(offset),
        this.private_scale.clone_with_offset(offset)
    );
}

BodyPart.prototype.to_seq = function(name) {
    var o = {};
    o[name+'_i'] = this.i();
    o[name+'_t'] = this.t();
    o[name+'_r'] = this.r();
    o[name+'_s'] = this.s();
    o[name+'_pt'] = this.pt();
    o[name+'_pr'] = this.pr();
    o[name+'_ps'] = this.ps();
    return o;
}

function HumanoidModel() {
    this.args = [
        'body',
        'left_foot',
        'right_foot', 
        'head', 
        'left_knee', 
        'right_knee', 
        'left_hip', 
        'right_hip', 
        'left_shoulder',
        'right_shoulder',
        'left_elbow',
        'right_elbow',
        'left_hand',
        'right_hand',
        'left_upper_arm',
        'right_upper_arm'
    ];

    for (var i = 0;i<this.args.length;i++) {
        this[this.args[i]] = arguments[i];
    }
}

HumanoidModel.prototype.part_seq = function(name) {
    return this[name].to_seq(name);
}
HumanoidModel.prototype.part_seqs = function() {
    var objs = [];
    for (var i = 0;i<arguments.length;i++) {
        if (this[arguments[i]]) {
            objs.push(this.part_seq(arguments[i]));
        }
    }
    return objs_merge.apply(window, objs);
}

HumanoidModel.prototype.to_seq = function() {
    return HumanoidModel.prototype.part_seqs.apply(this, this.args);
}
