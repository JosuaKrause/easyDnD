easyDnD
=======

Easy to use drag and drop functionality for d3.
You can specify source and target objects for
drag and drop. The functionality is built on top
of `d3.behavior.drag()`, uses "dragstart", "drag",
and "dragend" events on sources and "mouseover" and
"mouseout" events on targets.

    var dnd = initDnD();

Creates the drag & drop environment.

    var ghostItem = dnd.createGhostItem(selection, show, move, hide);

Creates a ghost item that is shown during the drag operation. The
first argument needs to be a selection containing the item. The next
three arguments are callbacks that are called during the drag & drop
operation. The arguments to these callbacks are an ghost object that
can be used to store information about the state of the ghost item
and has a field `elem` which contains the ghost item selection.
`move` has the x and y difference as next arguments. The last two arguments
of all three callbacks are the single source selection and the
associated source data item.

    var srcType = dnd.createSourceType(ghostItem, dragstart, dragend, drag);

Creates a source type. The first argument is a previously created ghost item.
The next arguments are callbacks for the drag & drop operation. The callbacks
are called with the single source selection and the associated source data item.

    srcType.register(selection);

Registers all elements in the given selection as dragging source of the given
type. Every element can only be of one source type and needs an associated
data item.

    var tgtType = dnd.createTarget(source, drop, hover, leave);

Creates a target type. The first argument is the associated source type.
Every target type can only be associated with one source type. Elements, however,
can be associated with multiple target types. The `drop` callback is called when
the user drops the dragged element while hovering over the target element.
The arguments are the ghost item state object, the source single selection,
the associated source data, the target single selection, and optionally the
associated target data. Target elements need not necessarily be associated with
any data. The `hover` and `leave` callbacks are called when entering and leaving
the target element respectively. The arguments of the callbacks are
the source single selection, the associated source data, the target single
selection, and optionally the associated target data.

    tgtType.register(selection);

Registers all elements in the given selection as dragging targets of the given
type. Every element can be associated with multiple targets and need not have
an associated data item. An element should be registered by a given target
type only once. If you have to call `register` again at one point you can
clear the listeners on this element before that with `dnd.clearListeners(selection)`.
Note that if you want to add normal "mouseover" and "mouseout" events on element
groups as well you need to use the following pattern when you update the elements:

    // clear old listeners
    dnd.clearListeners(selection);
    // add own special listeners
    selection.on("mouseover", [...]).on("mouseout", [...]);
    // register all target types
    tgtType0.register(selection);
    tgtType1.register(selection);
    [...]

See (`index.html`)[index.html] for a small usage example.
