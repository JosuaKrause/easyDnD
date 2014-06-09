/**
 * Created by krause on 2014-06-07.
 */

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
        t && t.callDrop(g.gi, s, d);
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
            register: function(template) {
                template.source && console.warn(template, "template cannot be associated with multiple sources");
                template.source = that;
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
            register: function(template) {
                var mor = template.mouseover;
                var mot = template.mouseout;
                template.mouseover = function(d, i) {
                    mor && mor.bind(this)(d, i);
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
                };
                template.mouseout = function(d, i) {
                    mot && mot.bind(this)(d, i);
                    if(dragObj === null) return;
                    var src = getSource(dragObj);
                    if(!src.isTarget(that)) return;
                    leave && leave(dragSel, dragObj, d3.select(this), d);
                    if(this !== curTargetObj) return;
                    curTarget = null;
                    curTargetObj = null;
                    curTargetSel = null;
                };
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

    function createGhostItem(selection, create, show, move, hide) {
        var gi = {};
        gi.elem = create(selection, gi);
        gi.elem.datum(gi);
        return {
            show: function(sel, obj) {
                selection.sort(function(a, b) {
                    var ga = a === gi;
                    var gb = b === gi;
                    if(ga) {
                        return gb ? 0 : 1;
                    }
                    return gb ? -1 : 0;
                });
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
        createTargetType: createTarget,
        initTemplate: function() {
            return {};
        },
        applyTemplate: function(template, selection, mouseover, mouseout) {
            if(template.source) {
                selection.each(function(d) {
                    d.__drag_source = template.source;
                });
                selection.call(dragListener);
            }
            var mor = template.mouseover ? function(d, i) {
                mouseover && mouseover.bind(this)(d, i);
                template.mouseover.bind(this)(d, i);
            } : mouseover ? mouseover : null;
            var mot = template.mouseout ? function(d, i) {
                mouseout && mouseout.bind(this)(d, i);
                template.mouseout.bind(this)(d, i);
            } : mouseout ? mouseout : null;
            selection.on("mouseover", mor, true).on("mouseout", mot, true);
        }
    };
}
