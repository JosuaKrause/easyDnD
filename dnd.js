
function initDnD() {
    var targetCount = 0;
    var dragObj = null;
    var dragListener = d3.behavior.drag().on("dragstart", function(d) {
        dragObj = d;
        var src = getSource(dragObj);
        src.getGhost().show(dragObj, src);
        src.dragstart(dragObj);
        d3.event.sourceEvent.stopPropagation();
    }).on("drag", function() {
        var src = getSource(dragObj);
        src.getGhost().move(d3.event.dx, d3.event.dy, dragObj, src);
        src.drag(dragObj, src);
    }).on("dragend", function() {
        var d = dragObj;
        var t = curTarget;
        dragObj = null;
        curTarget = null;
        var src = getSource(d);
        var g = src.getGhost();
        g.hide(d, src);
        src.dragend(d, src);
        if(t !== null) {
            t.callDrop(g.gi, d, src);
        }
    });

    function getSource(d) {
        return d.__drag_source;
    }

    function createSource(ghostItem, dragstart, drag, dragend) {
        var gi = ghostItem;
        var targets = {};
        var that = {
            dragstart: dragstart,
            drag: drag,
            dragend: dragend,
            getGhost: function() { return gi; },
            equals: function(other) {
                return that === other;
            },
            register: function(selection) {
                selection.each(function(d) {
                    if(d.__drag_source) {
                        console.warn(d, "element cannot be associated with multiple sources");
                    }
                    d.__drag_source = that;
                });
                selection.call(dragListener);
            },
            addTarget: function(target) {
                targets[target.id()] = that;
            },
            isTarget: function(target) {
                return target.id() in targets;
            }
        };
        return that;
    }

    var curTarget = null;
    var curTargetObj = null;
    function createTarget(source) {
        var id = targetCount++;
        var that = {
            id: function() { return id; },
            register: function(selection, hover, leave, drop) {
                selection.on("mouseover", function() {
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    hover(this, dragObj, src);
                    curTarget = that;
                    curTargetObj = this;
                    if(curTargetObj.__drop_target === undefined) {
                        curTargetObj.__drop_target = {};
                    }
                    curTargetObj.__drop_target[id] = function(g, dragObj, src) {
                        drop(g, dragObj, src, curTargetObj, that);
                        leave(curTargetObj, dragObj, src);
                    };
                }).on("mouseout", function() {
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    if(curTarget !== that) return;
                    if(curTargetObj !== this) return;
                    leave(this, dragObj, src);
                    curTarget = null;
                    curTargetObj = null;
                });
            },
            callDrop: function(g, dragObj, src) {
                curTargetObj.__drop_target[id](g, dragObj, src);
                curTargetObj = null;
            }
        };
        source.addTarget(that);
        return that;
    }

    function createGhostItem(selection, show, move, hide) {
        var gi = {
            elem: selection
        };
        return {
            show: function(obj, src) {
                show(gi, obj, src);
            },
            move: function(dx, dy, obj, src) {
                move(gi, dx, dy, obj, src);
            },
            hide: function(obj, src) {
                hide(gi, obj, src);
            },
            gi: gi
        };
    }

    return {
        createGhostItem: createGhostItem,
        createSourceType: createSource,
        createTargetType: createTarget
    };
}
