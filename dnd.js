
function initDnD() {
    var targetCount = 0;
    var dragObj = null;
    var dragSel = null;
    var dragListener = d3.behavior.drag().on("dragstart", function(d) {
        dragObj = d;
        dragSel = d3.select(this);
        var src = getSource(dragObj);
        src.getGhost().show(dragSel, dragObj);
        src.dragstart(dragSel, dragObj);
        d3.event.sourceEvent.stopPropagation();
    }).on("drag", function() {
        var src = getSource(dragObj);
        src.getGhost().move(d3.event.dx, d3.event.dy, dragSel, dragObj);
        src.drag(dragSel, dragObj);
    }).on("dragend", function() {
        var d = dragObj;
        var t = curTarget;
        var s = dragSel;
        dragObj = null;
        curTarget = null;
        var src = getSource(d);
        var g = src.getGhost();
        g.hide(s, d);
        src.dragend(s, d);
        if(t !== null) {
            t.callDrop(g.gi, s, d);
        }
    });

    function getSource(d) {
        return d.__drag_source;
    }

    function createSource(ghostItem, dragstart, dragend, drag) {
        var gi = ghostItem;
        var targets = {};
        var that = {
            dragstart: function(dragSel, dragObj) {
                dragstart && dragstart(dragSel, dragObj);
            },
            drag: function(dragSel, dragObj) {
                drag && drag(dragSel, dragObj);
            },
            dragend: function(dragSel, dragObj) {
                dragend && dragend(dragSel, dragObj);
            },
            getGhost: function() { return gi; },
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
    function createTarget(source, drop, hover, leave) {
        var id = targetCount++;
        var that = {
            id: function() { return id; },
            register: function(selection) {
                var mor = selection.on("mouseover");
                var mot = selection.on("mouseout");
                selection.on("mouseover", function(d, i) {
                    if(mor !== undefined) {
                        mor.bind(this)(d, i);
                    }
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    curTarget = that;
                    curTargetSel = d3.select(this);
                    curTargetObj = this;
                    hover && hover(dragSel, dragObj, curTargetSel, d);
                    if(curTargetObj.__drop_target === undefined) {
                        curTargetObj.__drop_target = {};
                    }
                    curTargetObj.__drop_target[id] = function(g, dragSel, dragObj) {
                        drop(g, dragSel, dragObj, curTargetSel, d);
                        leave && leave(dragSel, dragObj, curTargetSel, d);
                    };
                }, true).on("mouseout", function(d, i) {
                    if(mot !== undefined) {
                        mot.bind(this)(d, i);
                    }
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    leave && leave(dragSel, dragObj, d3.select(this), d);
                    if(this !== curTargetObj) return;
                    curTarget = null;
                    curTargetObj = null;
                    curTargetSel = null;
                }, true);
            },
            callDrop: function(g, dragSel, dragObj) {
                curTargetObj.__drop_target[id](g, dragSel, dragObj);
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
            show: function(sel, obj) {
                show(gi, sel, obj);
            },
            move: function(dx, dy, sel, obj) {
                move(gi, dx, dy, sel, obj);
            },
            hide: function(sel, obj) {
                hide(gi, sel, obj);
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
