function Debug(){}
Debug.once = function(f) {
    if (this.once_flag == undefined) {
        this.once_flag = true;
        f();
    }
}
Debug.print_once = function (x) {
    Debug.once(function(){console.debug(x)});
}


