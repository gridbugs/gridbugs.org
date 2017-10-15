function Content(){}
Content.characters = {};

Content.load = function() {
    Content.to_load = [];
    for (var name in Content.characters) {
        var c_class = Content.characters[name];
        c_class.inherits_from(Character);
        var c = new c_class();
        Content.to_load.push(c);
        Content.characters[name] = c;
    }

    for (var name in Content.maps) {
        var m_class = Content.maps[name];
        m_class.inherits_from(Map);
        var m = new m_class();
        Content.to_load.push(m);
        Content.maps[name] = m;
    }
}

Content.set_drawer = function(drawer) {
    Content.to_load.map(function(c){c.set_drawer(drawer)});
}

Content.run = function(then) {
    new AsyncGroup(Content.to_load).run(then);
}
