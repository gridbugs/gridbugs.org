function PathManager(){}
PathManager.get_paths = function(path, names) {
    
    if (names == undefined) {
        if (path.constructor == Array) {
            names = path;
        } else {
            names = [path];
        }
        path = "";
    }

    if (names.constructor != Array) {
        names = Array.arguments_array(arguments);

        path = "";
    }

    return names.map(function(n){return path + n});
}


