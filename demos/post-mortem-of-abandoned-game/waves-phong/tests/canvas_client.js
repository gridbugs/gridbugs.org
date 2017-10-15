$(function() {
    
    new ImageLoader('ml.png').run(function(img) {

        var drawer = new CanvasDrawer(document.getElementById("canvas"));
        var image = drawer.image(img).translate([100, -50]).rotate(Math.PI/2).scale([0.5, 0.5]);

        drawer.save();
        drawer.translate([400, 100]);
        drawer.rotate_degrees(60);
        image.draw();
        drawer.restore();
       
        drawer.save();
        drawer.translate([600, 400])
        image.draw();
        drawer.restore();

        var rect = drawer.rect([20, 10], [20, 30], tinycolor("red").toGL());
        rect.draw();

        var line = drawer.line_segment([100, 100], [200, 300]);
        line.draw();

        var p1 = drawer.point([100, 100]);
        var p2 = drawer.point([100, 400]);
        var p3 = drawer.point([400, 100]);
        p1.draw();
        p2.draw();
        p3.draw();

        drawer.save();
        drawer.translate([500, 500]);
        drawer.rotate_degrees(45);
        var c = drawer.circle([0, 0], 100, tinycolor("blue").toGL()).scale([1, 0.5]);
        c.draw();
        drawer.restore();
        var seq = drawer.sequence([[100, 200], [100, 250], [150, 250], [150, 200], [100, 200]]);
        seq.draw();

    }.arr_args());
})
