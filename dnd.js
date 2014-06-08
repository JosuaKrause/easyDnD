
function initDnD() {
    var targetCount = 0;
    var dragObj = null;
    var dragSel = null;
    var dragListener = d3.behavior.drag().on("dragstart", function(d) {
        dragObj = d;
        dragSel = d3.select(this);
        var src = getSource(dragObj);
        src.getGhost().show(dragObj, src);
        src.dragstart(dragSel, dragObj);
        d3.event.sourceEvent.stopPropagation();
    }).on("drag", function() {
        var src = getSource(dragObj);
        src.getGhost().move(d3.event.dx, d3.event.dy, dragSel, dragObj, src);
        src.drag(dragObj, src);
    }).on("dragend", function() {
        var d = dragObj;
        var t = curTarget;
        var s = dragSel;
        dragObj = null;
        curTarget = null;
        var src = getSource(d);
        var g = src.getGhost();
        g.hide(d, src);
        src.dragend(s, d, src);
        if(t !== null) {
            t.callDrop(g.gi, s, d, src);
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
    var curTargetSel = null;
    function createTarget(source) {
        var id = targetCount++;
        var that = {
            id: function() { return id; },
            register: function(selection, hover, leave, drop) {
                var mor = selection.on("mouseover");
                var mot = selection.on("mouseout");
                selection.on("mouseover", function(d, i) {
                    if(mor !== undefined) {
                        mor.bind(this)(d, i);
                    }
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    curTargetSel = d3.select(this);
                    hover(curTargetSel, dragObj, src);
                    curTarget = that;
                    curTargetObj = this;
                    if(curTargetObj.__drop_target === undefined) {
                        curTargetObj.__drop_target = {};
                    }
                    curTargetObj.__drop_target[id] = function(g, dragSel, dragObj, src) {
                        drop(g, dragSel, dragObj, src, curTargetSel, curTargetObj, that);
                        leave(curTargetSel, curTargetObj, dragObj, src);
                    };
                }).on("mouseout", function(d, i) {
                    if(mot !== undefined) {
                        mot.bind(this)(d, i);
                    }
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    if(curTarget !== that) return;
                    if(curTargetObj !== this) return;
                    leave(curTargetSel, curTargetObj, dragObj, src);
                    curTarget = null;
                    curTargetObj = null;
                    curTargetSel = null;
                });
            },
            callDrop: function(g, dragSel, dragObj, src) {
                curTargetObj.__drop_target[id](g, dragSel, dragObj, src);
                curTargetObj = null;
                curTargetSel = null;
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
