import Transform from './transform';

// Utils

function stringContains(str, text) {
    return str.indexOf(text) > -1;
}

const is = {
    arr: a => Array.isArray(a),
    obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),
    str: a => typeof a === 'string',
    fnc: a => typeof a === 'function',
    und: a => typeof a === 'undefined',
    num: a => typeof a === 'number'
};

function extendSingle(target, source) {
    for (let key in source)
        target[key] = is.arr(source[key]) ? source[key].slice(0) : source[key];
    return target;
}

function extend(target, source) {
    if (!target) target = {};
    for (let i = 1; i < arguments.length; i++)
        extendSingle(target, arguments[i]);
    return target;
}

function pushArray(arr, arr2) {
    arr.push.apply(arr, arr2);
}

function createCanvas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return {canvas, ctx};
}

function toArray(obj, keys) {
    keys.forEach((key) => {
        if (!is.arr(obj[key]))
            obj[key] = is.und(obj[key]) ? [] : [obj[key]];
    });
}

function setValuesByIndex(obj, index, keys, values) {
    let value;
    keys.forEach(key => {
        value = obj[key][index];
        if (!is.und(value)) {
            values[key] = value;
        }
    });
    return values;
}

function areObjectsEquals(obj1, obj2, keys) {
    return !keys.some(key => obj1[key] !== obj2[key]);
}

function copyValues(to, from, keys) {
    keys.forEach(key => to[key] = from[key]);
}

function normalizeAngle(angle) {
    return angle >= 0 ? angle % 360 : angle % 360 + 360;
}

function intersect(a, b) {
    return a && b
        && a.left <= b.right
        && b.left <= a.right
        && a.top <= b.bottom
        && b.top <= a.bottom;
}

// https://stackoverflow.com/a/7838871/4908989
function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return ctx;
}


// Pieces

function Pieces(options) {
    const animation = extend({}, this.defaults.animation, options.animation);
    this.init(extend({}, this.defaults, options, {animation}));
}

Pieces.prototype = {
    defaults: {
        canvas: null,
        items: [],
        image: [],
        text: [],
        path: [],
        x: 0,
        y: 0,
        w: [0],
        h: [0],
        tx: [0],
        ty: [0],
        itemSeparation: 1,
        piecesWidth: [5],
        piecesSpacing: [5],
        extraSpacing: [{extraX: 0, extraY: 0}],
        angle: [0],
        rotate: [0],
        translate: [{translateX: 0, translateY: 0}],
        padding: [0],
        opacity: [1],
        fontFamily: ["sans-serif"],
        fontSize: [100],
        fontWeight: [900],
        color: ['#000'],
        backgroundColor: false,
        backgroundRadius: 0,
        ghostOpacity: 0,
        checkHover: false,
        animation: {duration: [1000], delay: [0], easing: ['easeInOutCubic']},
        saveShowState: false,
        debug: false,
        ready: null
    },

    init(options) {
        this.initOptions(options);
        this.initCanvas(options);
        this.initEvents(options);
        if (options.items.length) {
            options.items.forEach(item => {
                this.setItemOptions(options, item.options);
                switch (item.type) {
                    case 'image': return this.initImage(item.value);
                    case 'text': return this.initText(item.value);
                    case 'path': return this.initPath(item.value);
                }
            });
        }
        if (options.image.length) {
            options.image.forEach(image => {
                this.setItemOptions(options);
                this.initImage(image);
            });
        }
        if (options.text.length) {
            options.text.forEach(text => {
                this.setItemOptions(options);
                this.initText(text);
            });
        }
        if (options.path.length) {
            options.path.forEach(path => {
                this.setItemOptions(options);
                this.initPath(path);
            });
        }
        if (this.drawList.length) {
            this.initPieces(options);
            this.loop(options);
        }
        if (options.ready) {
            options.ready();
        }
    },

    initOptions(options) {
        const {canvas} = options;
        if (is.str(canvas)) options.canvas = document.querySelector(canvas);
        toArray(options, ['items', 'image', 'text', 'path', 'w', 'h', 'tx', 'ty', 'piecesWidth', 'piecesSpacing', 'extraSpacing', 'angle', 'rotate', 'translate', 'svgWidth', 'svgHeight', 'color', 'backgroundColor', 'backgroundRadius', 'padding', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'ghost', 'ghostOpacity']);
        toArray(options.animation, ['duration', 'delay', 'easing']);
        this.v = {};
        this.o = [];
        this.drawList = [];
    },

    initCanvas(options) {
        if (options.canvas) {
            options.ctx = options.canvas.getContext('2d');
        } else {
            extend(options, createCanvas());
        }
        options.canvas.width = this.width = options.canvas.clientWidth;
        options.canvas.height = this.height = options.canvas.clientHeight;
    },

    initEvents(options) {
        options.canvas.onmousemove = (e) => {
            const rect = options.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const scaleX = rect.width / options.canvas.offsetWidth;
            const scaleY = rect.height / options.canvas.offsetHeight;
            this.mouseX = x * (1 / scaleX);
            this.mouseY = y * (1 / scaleY);
        };

        options.canvas.onmouseout = () => {
            this.mouseX = undefined;
            this.mouseY = undefined;
        };
    },

    setItemOptions(options, itemOptions) {
        const index = this.drawList.length;
        setValuesByIndex(options, index, ['text', 'color', 'backgroundColor', 'backgroundRadius', 'padding', 'fontFamily', 'fontSize', 'fontWeight', 'svgWidth', 'svgHeight', 'piecesWidth', 'piecesSpacing', 'extraSpacing', 'opacity', 'angle', 'rotate', 'translate', 'ghost', 'ghostOpacity', 'w', 'h', 'tx', 'ty'], this.v);
        setValuesByIndex(options.animation, index, ['duration', 'delay', 'easing'], this.v);
        this.o.push(extend({}, this.v, itemOptions || {}));
    },

    initImage(image) {
        const o = this.o[this.o.length - 1];
        let padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(p => parseFloat(p)) : [0, 0, 0, 0];
        const {canvas, ctx} = createCanvas();
        canvas.width = image.width + 2 + padding[1] + padding[3];
        canvas.height = image.height + 2 + padding[0] + padding[2];
        if (o.backgroundColor) {
            ctx.fillStyle = o.backgroundColor;
            if (o.backgroundRadius) {
                roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, o.backgroundRadius);
                ctx.fill();
            } else {
                ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
            }
        }
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 1 + padding[3], 1 + padding[0], image.width, image.height);
        this.drawList.push(canvas);
    },

    initText(text) {
        const o = this.o[this.o.length - 1];
        let padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(p => parseFloat(p)) : [0, 0, 0, 0];
        const fontSize = is.fnc(o.fontSize) ? o.fontSize() : o.fontSize;
        const {canvas, ctx} = createCanvas();
        ctx.textBaseline = 'bottom';
        ctx.font = `${o.fontWeight} ${fontSize}px ${o.fontFamily}`;
        canvas.width = ctx.measureText(text).width + padding[1] + padding[3];
        canvas.height = fontSize + padding[0] + padding[2];
        if (o.backgroundColor) {
            ctx.fillStyle = o.backgroundColor;
            if (o.backgroundRadius) {
                roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, o.backgroundRadius);
                ctx.fill();
            } else {
                ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
            }
        }
        ctx.textBaseline = "bottom";
        ctx.font = `${o.fontWeight} ${fontSize}px ${o.fontFamily}`;
        ctx.fillStyle = o.color;
        ctx.fillText(text, padding[3], fontSize + padding[0]);
        this.drawList.push(canvas);
    },

    initPath(path) {
        const o = this.o[this.o.length - 1];
        let padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(p => parseFloat(p)) : [0, 0, 0, 0];
        const {canvas, ctx} = createCanvas();
        canvas.width = o.svgWidth + padding[1] + padding[3];
        canvas.height = o.svgHeight + padding[0] + padding[2];
        if (o.backgroundColor) {
            ctx.fillStyle = o.backgroundColor;
            if (o.backgroundRadius) {
                roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, o.backgroundRadius);
                ctx.fill();
            } else {
                ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
            }
        }
        ctx.translate(padding[3], padding[0]);
        ctx.fillStyle = o.color;
        ctx.fill(new Path2D(is.str(path) ? path : path.getAttribute('d')));
        this.drawList.push(canvas);
    },

    initPieces(options) {
        const t = new Transform();
        let piecesWidth, piecesHeight, piecesSpacing, item, last, p, x, lx, y, w, h;
        this.pieces = [];
        this.items = [];
        const itemSeparation = options.itemSeparation;
        x = options.x === 'center' ? (this.width / 2 - (this.drawList.reduce((a, b) => a + b.width, 0) + itemSeparation * this.drawList.length) / 2) : options.x;
        y = options.y === 'center' ? (this.height / 2 - this.drawList[0].height / 2) : options.y;
        let o;
        this.drawList.forEach((img, index) => {
            o = this.o[index];

            const {extraX, extraY} = is.obj(o.extraSpacing) ? o.extraSpacing : {extraX: o.extraSpacing, extraY: o.extraSpacing};
            const {translateX, translateY} = is.fnc(o.translate) ? o.translate() : (is.obj(o.translate) ? o.translate : {translateX: o.translate, translateY: o.translate});

            if (options.x === 'centerAll') {
                x = this.width / 2 - img.width / 2;
            }
            if (options.y === 'centerAll') {
                y = this.height / 2 - img.height / 2;
            }

            x += translateX;
            y += translateY;

            last = {angle: null}; // Force first redraw
            item = {last, index, y, extraY, img};
            item.x = lx = x;
            item.width = img.width;
            item.height = img.height;
            item.angle = normalizeAngle(o.angle);
            item.rotate = normalizeAngle(o.rotate);
            item.ghost = o.ghost;
            item.ghostDashArray = [20, 10];
            item.ghostDashOffset = item.ghostDashArray[0] + item.ghostDashArray[1];
            item.ghostOpacity = o.ghostOpacity;
            item.pieces = [];
            item.shown = false;
            item.hidden = true;
            this.items.push(item);

            // Shown img
            const {ctx, canvas} = createCanvas();
            canvas.width = item.width;
            canvas.height = item.height;

            while (lx - (item.width + extraX * 2) < item.x) {
                piecesWidth = is.fnc(o.piecesWidth) ? o.piecesWidth() : o.piecesWidth;
                piecesHeight = item.height + extraY * 2;
                piecesSpacing = is.fnc(o.piecesSpacing) ? o.piecesSpacing() : o.piecesSpacing;
                w = Math.min(is.fnc(o.w) ? o.w() : o.w, piecesWidth);
                h = Math.min(is.fnc(o.h) ? o.h() : o.h, piecesHeight);
                last = {};
                p = {last, item};
                p.h_x = p.x = last.x = lx - extraX + (piecesWidth / 2) - (w / 2);
                p.s_x = lx - extraX;
                p.h_y = p.y = last.y = y + (item.height / 2) - (h / 2);
                p.s_y = y - extraY;
                p.h_w = p.w = last.w = w;
                p.s_w = piecesWidth;
                p.h_h = p.h = last.h = h;
                p.s_h = piecesHeight;
                p.h_tx = p.s_tx = p.tx = last.tx = is.fnc(o.tx) ? o.tx() : o.tx;
                p.h_ty = p.ty = last.ty = extraY + (is.fnc(o.ty) ? o.ty() : o.ty);
                p.s_ty = extraY;
                p.opacity = is.fnc(o.opacity) ? o.opacity() : o.opacity;
                p.duration = is.fnc(o.duration) ? o.duration() : o.duration;
                p.delay = is.fnc(o.delay) ? o.delay() : o.delay;
                p.easing = o.easing;
                item.pieces.push(p);
                this.pieces.push(p);
                lx += piecesWidth + piecesSpacing;

                // Draw p for shown img
                ctx.save();
                t.translate(item.width / 2, item.height / 2);
                t.rotate(item.angle * Math.PI / 180);
                t.translate(-item.width / 2, -item.height / 2);
                t.translate(p.s_tx, p.s_ty - item.extraY);
                t.translate(p.s_x + p.s_w / 2 - item.x, p.s_y + p.s_h / 2 - item.y);
                t.apply(ctx);
                ctx.beginPath();
                ctx.rect(-p.s_w / 2, -p.s_h / 2, p.s_w, p.s_h);
                ctx.clip();
                t.reset(ctx);
                ctx.globalAlpha = p.opacity;

                const ratio = item.img.height / item.img.width;
                ctx.drawImage(item.img, (1 - ratio) / 2, ratio / 2, item.img.width - (1 - ratio), item.img.height - ratio);

                ctx.restore();
            }

            item.imgShown = canvas;
            item.rectShown = {left: item.x, top: item.y, right: item.x + item.width, bottom: item.y + item.height};

            if (options.x !== 'centerAll') {
                x += img.width + itemSeparation;
            }
        });
    },

    renderPieces(o, item) {
        const {ctx} = o;
        const t = new Transform();
        let angle, rotate;

        if (item.redraw) {
            item.redraw = false;
            if (item.shown && o.saveShowState) {
                ctx.drawImage(item.imgShown, 0, 0, item.width, item.height, item.x, item.y, item.width, item.height);
            } else if (!item.hidden) {
                angle = normalizeAngle(item.angle);
                rotate = normalizeAngle(item.rotate);
                item.pieces.forEach((p) => {
                    ctx.save();

                    t.translate(item.x, item.y);
                    t.translate(item.width / 2, item.height / 2);
                    t.rotate((angle + rotate) * Math.PI / 180);
                    t.translate(-item.width / 2, -item.height / 2);
                    t.translate(p.tx, p.ty - item.extraY);
                    t.translate(p.x + p.w / 2 - item.x, p.y + p.h / 2 - item.y);
                    t.apply(ctx);
                    ctx.beginPath();
                    ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);

                    if (o.debug) {
                        ctx.setLineDash([]);
                        ctx.strokeStyle = 'black';
                        ctx.stroke();
                    } else {
                        ctx.clip();
                    }

                    t.translate(-(p.x + p.w / 2 - item.x), -(p.y + p.h / 2 - item.y));
                    t.translate(item.width / 2, item.height / 2);
                    t.rotate(-angle * Math.PI / 180);
                    t.translate(-item.width / 2, -item.height / 2);
                    t.apply(ctx);
                    ctx.globalAlpha = p.opacity;

                    const ratio = item.img.height / item.img.width;
                    ctx.drawImage(item.img, (1 - ratio) / 2, ratio / 2, item.img.width - (1 - ratio), item.img.height - ratio);

                    t.reset();
                    ctx.restore();
                });
            }
        }
    },

    isItemDifferent(item) {
        return !areObjectsEquals(item, item.last, ['angle'])
            || item.pieces.some(p => !areObjectsEquals(p, p.last, ['x', 'y', 'w', 'h', 'tx', 'ty']));
    },

    isItemShown(item) {
        return item.pieces.every(p => p.x === p.s_x && p.y === p.s_y && p.w === p.s_w && p.h === p.s_h && p.tx === p.s_tx && p.ty === p.s_ty);
    },

    isItemHidden(item) {
        return item.pieces.every(p => p.w === 0 && p.h === 0);
    },

    renderGhost(options, item) {
        const o = this.o[item.index];
        const fontSize = is.fnc(o.fontSize) ? o.fontSize() : o.fontSize;
        if (item.ghost && o.text) {
            options.ctx.textBaseline = 'bottom';
            options.ctx.font = `${o.fontWeight} ${fontSize}px ${o.fontFamily}`;
            options.ctx.strokeStyle = o.color;
            options.ctx.setLineDash(item.ghostDashArray);
            options.ctx.lineDashOffset = item.ghostDashOffset;
            options.ctx.globalAlpha = item.ghostOpacity;
            options.ctx.strokeText(o.text, item.x, item.y + item.height);
            options.ctx.globalAlpha = 1;
        }
    },

    clearRect(o) {
        const t = new Transform();
        let newRedraw = false, x, y, w, h, p1, p2, p3, p4, left, top, right, bottom, itemRect, angle, rotate, clear = null;

        // Discover modified items, and initial clear rect
        this.items.forEach((item) => {
            angle = normalizeAngle(item.angle);
            rotate = normalizeAngle(item.rotate);
            if (this.isItemDifferent(item)) {
                newRedraw = true;
                itemRect = null;
                item.redraw = true;
                item.shown = this.isItemShown(item);
                item.hidden = this.isItemHidden(item);
                copyValues(item.last, item, ['angle']);
                item.pieces.forEach((p) => {
                    let {last} = p;
                    t.translate(item.x, item.y);
                    t.translate(item.width / 2, item.height / 2);
                    t.rotate((angle + rotate) * Math.PI / 180);
                    t.translate(-item.width / 2, -item.height / 2);
                    t.translate(last.tx, last.ty - item.extraY);
                    t.translate(last.x + last.w / 2 - item.x, last.y + last.h / 2 - item.y);

                    x = -last.w / 2 - 1;
                    y = -last.h / 2 - 1;
                    w = last.w + 2;
                    h = last.h + 2;

                    p1 = t.transformPoint(x, y);
                    p2 = t.transformPoint(x + w, y);
                    p3 = t.transformPoint(x + w, y + h);
                    p4 = t.transformPoint(x, y + h);

                    left = Math.min(p1[0], p2[0], p3[0], p4[0]);
                    top = Math.min(p1[1], p2[1], p3[1], p4[1]);
                    right = Math.max(p1[0], p2[0], p3[0], p4[0]);
                    bottom = Math.max(p1[1], p2[1], p3[1], p4[1]);

                    itemRect = this.extendRect(itemRect, {left, top, right, bottom});

                    t.reset();
                    copyValues(last, p, ['x', 'y', 'w', 'h', 'tx', 'ty']);
                });
                clear = this.extendRect(clear, itemRect);
                item.rect = item.shown ? item.rectShown : itemRect;
            } else {
                item.redraw = false;
            }

            // Always clear rectShown if hidden and ghost
            if (item.hidden && item.ghost) {
                newRedraw = true;
                clear = this.extendRect(clear, item.rectShown);
            }
        });

        // Discover adjacent redraw regions
        while (newRedraw) {
            newRedraw = false;
            this.items.forEach((item) => {
                if (!item.redraw && intersect(clear, item.rect)) {
                    newRedraw = true;
                    item.redraw = true;
                    clear = this.extendRect(clear, item.rect);
                }
            });
        }

        // Clear redraw regions
        if (clear) {
            o.ctx.clearRect(clear.left, clear.top, clear.right - clear.left, clear.bottom - clear.top);

            if (o.debug) {
                o.ctx.setLineDash([10]);
                o.ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
                o.ctx.strokeRect(clear.left, clear.top, clear.right - clear.left, clear.bottom - clear.top);
            }
        }
    },

    extendRect(rect1, rect2) {
        return rect1 && rect2 ? {
            left: Math.max(0, Math.min(rect1.left, rect2.left)),
            top: Math.max(0, Math.min(rect1.top, rect2.top)),
            right: Math.min(this.width, Math.max(rect1.right, rect2.right)),
            bottom: Math.min(this.height, Math.max(rect1.bottom, rect2.bottom))
        } : rect2;
    },

    checkHover(o, item) {
        const hover = this.mouseX >= item.x && this.mouseX <= item.x + item.width && this.mouseY >= item.y && this.mouseY <= item.y + item.height;
        if (hover && !item.hover) {
            if (is.fnc(o.itemEnter)) {
                o.itemEnter(item);
            }
        } else if (!hover && item.hover) {
            if (is.fnc(o.itemLeave)) {
                o.itemLeave(item);
            }
        }
        item.hover = hover;
        return hover;
    },

    renderDebug(o, item) {
        if (o.debug) {
            if (o.checkHover) {
                o.ctx.fillStyle = item.hover ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
                o.ctx.fillRect(item.x, item.y, item.width, item.height);
            }
            const {rect} = item;
            if (rect) {
                o.ctx.setLineDash([]);
                o.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                o.ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
            }
        }
    },

    loop(o) {
        this.frame = requestAnimationFrame(this.loop.bind(this, o));
        this.clearRect(o);
        this.hoverItem = null;
        this.items.forEach(item => {
            if (o.checkHover && this.checkHover(o, item)) {
                this.hoverItem = item;
            }
            this.renderPieces(o, item);
            this.renderGhost(o, item);
            this.renderDebug(o, item);
        });
    },

    stop() {
        cancelAnimationFrame(this.frame);
        anime.remove(this.items);
        anime.remove(this.pieces);
    },

    getPieces(items) {
        let targetPieces = [];
        if (is.und(items)) {
            targetPieces = this.pieces;
        } else if (is.num(items)) {
            targetPieces = this.items[items].pieces;
        } else if (is.arr(items)) {
            items.forEach(item => is.num(item) ? pushArray(targetPieces, this.items[item].pieces) : pushArray(targetPieces, item.pieces));
        } else {
            targetPieces = items.pieces;
        }
        return targetPieces;
    },

    getItems(items) {
        let targetItems = [];
        if (is.und(items)) {
            targetItems = this.items;
        } else if (is.num(items)) {
            targetItems = this.items[items];
        } else if (is.arr(items)) {
            items.forEach(item => is.num(item) ? targetItems.push(this.items[item]) : targetItems.push(item));
        } else {
            targetItems = items;
        }
        return targetItems;
    },

    animatePieces(options) {
        const o = extend({
            duration: p => p.duration,
            delay: p => p.delay,
            easing: p => p.easing,
            remove: true,
            singly: false
        }, options);
        const targets = this.getPieces(options.items);
        if (o.remove) {
            anime.remove(targets);
        }
        if (o.ignore) {
            o.ignore.forEach(prop => delete o[prop]);
        }
        if (o.singly) {
            targets.forEach(target => anime(extend(o, {targets: target})));
        } else {
            anime(extend(o, {targets}));
        }
    },

    showPieces(options) {
        const o = extend({
            x: p => p.s_x,
            y: p => p.s_y,
            w: p => p.s_w,
            h: p => p.s_h,
            tx: p => p.s_tx,
            ty: p => p.s_ty
        }, options);
        this.animatePieces(o);
    },

    hidePieces(options) {
        const o = extend({
            x: p => p.h_x,
            y: p => p.h_y,
            w: p => p.h_w,
            h: p => p.h_h,
            tx: p => p.h_tx,
            ty: p => p.h_ty
        }, options);
        this.animatePieces(o);
    },

    animateItems(options) {
        const o = extend({
            easing: 'linear',
            remove: true
        }, options, {targets: this.getItems(options.items)});
        if (o.remove) {
            anime.remove(o.targets);
        }
        anime(o);
    }
};

Pieces.version = '1.0.0';
Pieces.random = anime.random;
Pieces.extend = extend;
export default Pieces;
