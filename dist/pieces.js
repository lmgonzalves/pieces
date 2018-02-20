(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define('Pieces', factory) :
    (global.Pieces = factory());
}(this, (function () { 'use strict';

// Adapted version of transform.js by Simon Sarris from here:
// https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js

function Transform(ctx) {
    this.reset(ctx);
}

Transform.prototype = {
    reset: function reset(ctx) {
        this.m = [1, 0, 0, 1, 0, 0];
        if (ctx) this.apply(ctx);
    },
    rotate: function rotate(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] * c + this.m[2] * s;
        var m12 = this.m[1] * c + this.m[3] * s;
        var m21 = this.m[0] * -s + this.m[2] * c;
        var m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    },
    translate: function translate(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    },
    transformPoint: function transformPoint(px, py) {
        var x = px * this.m[0] + py * this.m[2] + this.m[4];
        var y = px * this.m[1] + py * this.m[3] + this.m[5];
        return [x, y];
    },
    apply: function apply(ctx) {
        ctx.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
    }
};

// Utils

function stringContains(str, text) {
    return str.indexOf(text) > -1;
}

var is = {
    arr: function arr(a) {
        return Array.isArray(a);
    },
    obj: function obj(a) {
        return stringContains(Object.prototype.toString.call(a), 'Object');
    },
    str: function str(a) {
        return typeof a === 'string';
    },
    fnc: function fnc(a) {
        return typeof a === 'function';
    },
    und: function und(a) {
        return typeof a === 'undefined';
    },
    num: function num(a) {
        return typeof a === 'number';
    }
};

function extendSingle(target, source) {
    for (var key in source) {
        target[key] = is.arr(source[key]) ? source[key].slice(0) : source[key];
    }return target;
}

function extend(target, source) {
    if (!target) target = {};
    for (var i = 1; i < arguments.length; i++) {
        extendSingle(target, arguments[i]);
    }return target;
}

function pushArray(arr, arr2) {
    arr.push.apply(arr, arr2);
}

function createCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx };
}

function toArray(obj, keys) {
    keys.forEach(function (key) {
        if (!is.arr(obj[key])) obj[key] = is.und(obj[key]) ? [] : [obj[key]];
    });
}

function setValuesByIndex(obj, index, keys, values) {
    var value = void 0;
    keys.forEach(function (key) {
        value = obj[key][index];
        if (!is.und(value)) {
            values[key] = value;
        }
    });
    return values;
}

function areObjectsEquals(obj1, obj2, keys) {
    return !keys.some(function (key) {
        return obj1[key] !== obj2[key];
    });
}

function copyValues(to, from, keys) {
    keys.forEach(function (key) {
        return to[key] = from[key];
    });
}

function normalizeAngle(angle) {
    return angle >= 0 ? angle % 360 : angle % 360 + 360;
}

function intersect(a, b) {
    return a && b && a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
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
    var animation = extend({}, this.defaults.animation, options.animation);
    this.init(extend({}, this.defaults, options, { animation: animation }));
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
        extraSpacing: [{ extraX: 0, extraY: 0 }],
        angle: [0],
        rotate: [0],
        translate: [{ translateX: 0, translateY: 0 }],
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
        animation: { duration: [1000], delay: [0], easing: ['easeInOutCubic'] },
        saveShowState: false,
        debug: false,
        ready: null
    },

    init: function init(options) {
        var _this = this;

        this.initOptions(options);
        this.initCanvas(options);
        this.initEvents(options);
        if (options.items.length) {
            options.items.forEach(function (item) {
                _this.setItemOptions(options, item.options);
                switch (item.type) {
                    case 'image':
                        return _this.initImage(item.value);
                    case 'text':
                        return _this.initText(item.value);
                    case 'path':
                        return _this.initPath(item.value);
                }
            });
        }
        if (options.image.length) {
            options.image.forEach(function (image) {
                _this.setItemOptions(options);
                _this.initImage(image);
            });
        }
        if (options.text.length) {
            options.text.forEach(function (text) {
                _this.setItemOptions(options);
                _this.initText(text);
            });
        }
        if (options.path.length) {
            options.path.forEach(function (path) {
                _this.setItemOptions(options);
                _this.initPath(path);
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
    initOptions: function initOptions(options) {
        var canvas = options.canvas;

        if (is.str(canvas)) options.canvas = document.querySelector(canvas);
        toArray(options, ['items', 'image', 'text', 'path', 'w', 'h', 'tx', 'ty', 'piecesWidth', 'piecesSpacing', 'extraSpacing', 'angle', 'rotate', 'translate', 'svgWidth', 'svgHeight', 'color', 'backgroundColor', 'backgroundRadius', 'padding', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'ghost', 'ghostOpacity']);
        toArray(options.animation, ['duration', 'delay', 'easing']);
        this.v = {};
        this.o = [];
        this.drawList = [];
    },
    initCanvas: function initCanvas(options) {
        if (options.canvas) {
            options.ctx = options.canvas.getContext('2d');
        } else {
            extend(options, createCanvas());
        }
        options.canvas.width = this.width = options.canvas.clientWidth;
        options.canvas.height = this.height = options.canvas.clientHeight;
    },
    initEvents: function initEvents(options) {
        var _this2 = this;

        options.canvas.onmousemove = function (e) {
            var rect = options.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var scaleX = rect.width / options.canvas.offsetWidth;
            var scaleY = rect.height / options.canvas.offsetHeight;
            _this2.mouseX = x * (1 / scaleX);
            _this2.mouseY = y * (1 / scaleY);
        };

        options.canvas.onmouseout = function () {
            _this2.mouseX = undefined;
            _this2.mouseY = undefined;
        };
    },
    setItemOptions: function setItemOptions(options, itemOptions) {
        var index = this.drawList.length;
        setValuesByIndex(options, index, ['text', 'color', 'backgroundColor', 'backgroundRadius', 'padding', 'fontFamily', 'fontSize', 'fontWeight', 'svgWidth', 'svgHeight', 'piecesWidth', 'piecesSpacing', 'extraSpacing', 'opacity', 'angle', 'rotate', 'translate', 'ghost', 'ghostOpacity', 'w', 'h', 'tx', 'ty'], this.v);
        setValuesByIndex(options.animation, index, ['duration', 'delay', 'easing'], this.v);
        this.o.push(extend({}, this.v, itemOptions || {}));
    },
    initImage: function initImage(image) {
        var o = this.o[this.o.length - 1];
        var padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(function (p) {
            return parseFloat(p);
        }) : [0, 0, 0, 0];

        var _createCanvas = createCanvas();

        var canvas = _createCanvas.canvas;
        var ctx = _createCanvas.ctx;

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
    initText: function initText(text) {
        var o = this.o[this.o.length - 1];
        var padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(function (p) {
            return parseFloat(p);
        }) : [0, 0, 0, 0];
        var fontSize = is.fnc(o.fontSize) ? o.fontSize() : o.fontSize;

        var _createCanvas2 = createCanvas();

        var canvas = _createCanvas2.canvas;
        var ctx = _createCanvas2.ctx;

        ctx.textBaseline = 'bottom';
        ctx.font = o.fontWeight + ' ' + fontSize + 'px ' + o.fontFamily;
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
        ctx.font = o.fontWeight + ' ' + fontSize + 'px ' + o.fontFamily;
        ctx.fillStyle = o.color;
        ctx.fillText(text, padding[3], fontSize + padding[0]);
        this.drawList.push(canvas);
    },
    initPath: function initPath(path) {
        var o = this.o[this.o.length - 1];
        var padding = is.fnc(o.padding) ? o.padding() : o.padding;
        padding = padding ? padding.split(' ').map(function (p) {
            return parseFloat(p);
        }) : [0, 0, 0, 0];

        var _createCanvas3 = createCanvas();

        var canvas = _createCanvas3.canvas;
        var ctx = _createCanvas3.ctx;

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
    initPieces: function initPieces(options) {
        var _this3 = this;

        var t = new Transform();
        var piecesWidth = void 0,
            piecesHeight = void 0,
            piecesSpacing = void 0,
            item = void 0,
            last = void 0,
            p = void 0,
            x = void 0,
            lx = void 0,
            y = void 0,
            w = void 0,
            h = void 0;
        this.pieces = [];
        this.items = [];
        var itemSeparation = options.itemSeparation;
        x = options.x === 'center' ? this.width / 2 - (this.drawList.reduce(function (a, b) {
            return a + b.width;
        }, 0) + itemSeparation * this.drawList.length) / 2 : options.x;
        y = options.y === 'center' ? this.height / 2 - this.drawList[0].height / 2 : options.y;
        var o = void 0;
        this.drawList.forEach(function (img, index) {
            o = _this3.o[index];

            var _ref = is.obj(o.extraSpacing) ? o.extraSpacing : { extraX: o.extraSpacing, extraY: o.extraSpacing };

            var extraX = _ref.extraX;
            var extraY = _ref.extraY;

            var _ref2 = is.fnc(o.translate) ? o.translate() : is.obj(o.translate) ? o.translate : { translateX: o.translate, translateY: o.translate };

            var translateX = _ref2.translateX;
            var translateY = _ref2.translateY;


            if (options.x === 'centerAll') {
                x = _this3.width / 2 - img.width / 2;
            }
            if (options.y === 'centerAll') {
                y = _this3.height / 2 - img.height / 2;
            }

            x += translateX;
            y += translateY;

            last = { angle: null }; // Force first redraw
            item = { last: last, index: index, y: y, extraY: extraY, img: img };
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
            _this3.items.push(item);

            // Shown img

            var _createCanvas4 = createCanvas();

            var ctx = _createCanvas4.ctx;
            var canvas = _createCanvas4.canvas;

            canvas.width = item.width;
            canvas.height = item.height;

            while (lx - (item.width + extraX * 2) < item.x) {
                piecesWidth = is.fnc(o.piecesWidth) ? o.piecesWidth() : o.piecesWidth;
                piecesHeight = item.height + extraY * 2;
                piecesSpacing = is.fnc(o.piecesSpacing) ? o.piecesSpacing() : o.piecesSpacing;
                w = Math.min(is.fnc(o.w) ? o.w() : o.w, piecesWidth);
                h = Math.min(is.fnc(o.h) ? o.h() : o.h, piecesHeight);
                last = {};
                p = { last: last, item: item };
                p.h_x = p.x = last.x = lx - extraX + piecesWidth / 2 - w / 2;
                p.s_x = lx - extraX;
                p.h_y = p.y = last.y = y + item.height / 2 - h / 2;
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
                _this3.pieces.push(p);
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

                var ratio = item.img.height / item.img.width;
                ctx.drawImage(item.img, (1 - ratio) / 2, ratio / 2, item.img.width - (1 - ratio), item.img.height - ratio);

                ctx.restore();
            }

            item.imgShown = canvas;
            item.rectShown = { left: item.x, top: item.y, right: item.x + item.width, bottom: item.y + item.height };

            if (options.x !== 'centerAll') {
                x += img.width + itemSeparation;
            }
        });
    },
    renderPieces: function renderPieces(o, item) {
        var ctx = o.ctx;

        var t = new Transform();
        var angle = void 0,
            rotate = void 0;

        if (item.redraw) {
            item.redraw = false;
            if (item.shown && o.saveShowState) {
                ctx.drawImage(item.imgShown, 0, 0, item.width, item.height, item.x, item.y, item.width, item.height);
            } else if (!item.hidden) {
                angle = normalizeAngle(item.angle);
                rotate = normalizeAngle(item.rotate);
                item.pieces.forEach(function (p) {
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

                    var ratio = item.img.height / item.img.width;
                    ctx.drawImage(item.img, (1 - ratio) / 2, ratio / 2, item.img.width - (1 - ratio), item.img.height - ratio);

                    t.reset();
                    ctx.restore();
                });
            }
        }
    },
    isItemDifferent: function isItemDifferent(item) {
        return !areObjectsEquals(item, item.last, ['angle']) || item.pieces.some(function (p) {
            return !areObjectsEquals(p, p.last, ['x', 'y', 'w', 'h', 'tx', 'ty']);
        });
    },
    isItemShown: function isItemShown(item) {
        return item.pieces.every(function (p) {
            return p.x === p.s_x && p.y === p.s_y && p.w === p.s_w && p.h === p.s_h && p.tx === p.s_tx && p.ty === p.s_ty;
        });
    },
    isItemHidden: function isItemHidden(item) {
        return item.pieces.every(function (p) {
            return p.w === 0 && p.h === 0;
        });
    },
    renderGhost: function renderGhost(options, item) {
        var o = this.o[item.index];
        var fontSize = is.fnc(o.fontSize) ? o.fontSize() : o.fontSize;
        if (item.ghost && o.text) {
            options.ctx.textBaseline = 'bottom';
            options.ctx.font = o.fontWeight + ' ' + fontSize + 'px ' + o.fontFamily;
            options.ctx.strokeStyle = o.color;
            options.ctx.setLineDash(item.ghostDashArray);
            options.ctx.lineDashOffset = item.ghostDashOffset;
            options.ctx.globalAlpha = item.ghostOpacity;
            options.ctx.strokeText(o.text, item.x, item.y + item.height);
            options.ctx.globalAlpha = 1;
        }
    },
    clearRect: function clearRect(o) {
        var _this4 = this;

        var t = new Transform();
        var newRedraw = false,
            x = void 0,
            y = void 0,
            w = void 0,
            h = void 0,
            p1 = void 0,
            p2 = void 0,
            p3 = void 0,
            p4 = void 0,
            left = void 0,
            top = void 0,
            right = void 0,
            bottom = void 0,
            itemRect = void 0,
            angle = void 0,
            rotate = void 0,
            clear = null;

        // Discover modified items, and initial clear rect
        this.items.forEach(function (item) {
            angle = normalizeAngle(item.angle);
            rotate = normalizeAngle(item.rotate);
            if (_this4.isItemDifferent(item)) {
                newRedraw = true;
                itemRect = null;
                item.redraw = true;
                item.shown = _this4.isItemShown(item);
                item.hidden = _this4.isItemHidden(item);
                copyValues(item.last, item, ['angle']);
                item.pieces.forEach(function (p) {
                    var last = p.last;

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

                    itemRect = _this4.extendRect(itemRect, { left: left, top: top, right: right, bottom: bottom });

                    t.reset();
                    copyValues(last, p, ['x', 'y', 'w', 'h', 'tx', 'ty']);
                });
                clear = _this4.extendRect(clear, itemRect);
                item.rect = item.shown ? item.rectShown : itemRect;
            } else {
                item.redraw = false;
            }

            // Always clear rectShown if hidden and ghost
            if (item.hidden && item.ghost) {
                newRedraw = true;
                clear = _this4.extendRect(clear, item.rectShown);
            }
        });

        // Discover adjacent redraw regions
        while (newRedraw) {
            newRedraw = false;
            this.items.forEach(function (item) {
                if (!item.redraw && intersect(clear, item.rect)) {
                    newRedraw = true;
                    item.redraw = true;
                    clear = _this4.extendRect(clear, item.rect);
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
    extendRect: function extendRect(rect1, rect2) {
        return rect1 && rect2 ? {
            left: Math.max(0, Math.min(rect1.left, rect2.left)),
            top: Math.max(0, Math.min(rect1.top, rect2.top)),
            right: Math.min(this.width, Math.max(rect1.right, rect2.right)),
            bottom: Math.min(this.height, Math.max(rect1.bottom, rect2.bottom))
        } : rect2;
    },
    checkHover: function checkHover(o, item) {
        var hover = this.mouseX >= item.x && this.mouseX <= item.x + item.width && this.mouseY >= item.y && this.mouseY <= item.y + item.height;
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
    renderDebug: function renderDebug(o, item) {
        if (o.debug) {
            if (o.checkHover) {
                o.ctx.fillStyle = item.hover ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
                o.ctx.fillRect(item.x, item.y, item.width, item.height);
            }
            var rect = item.rect;

            if (rect) {
                o.ctx.setLineDash([]);
                o.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                o.ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
            }
        }
    },
    loop: function loop(o) {
        var _this5 = this;

        this.frame = requestAnimationFrame(this.loop.bind(this, o));
        this.clearRect(o);
        this.hoverItem = null;
        this.items.forEach(function (item) {
            if (o.checkHover && _this5.checkHover(o, item)) {
                _this5.hoverItem = item;
            }
            _this5.renderPieces(o, item);
            _this5.renderGhost(o, item);
            _this5.renderDebug(o, item);
        });
    },
    stop: function stop() {
        cancelAnimationFrame(this.frame);
        anime.remove(this.items);
        anime.remove(this.pieces);
    },
    getPieces: function getPieces(items) {
        var _this6 = this;

        var targetPieces = [];
        if (is.und(items)) {
            targetPieces = this.pieces;
        } else if (is.num(items)) {
            targetPieces = this.items[items].pieces;
        } else if (is.arr(items)) {
            items.forEach(function (item) {
                return is.num(item) ? pushArray(targetPieces, _this6.items[item].pieces) : pushArray(targetPieces, item.pieces);
            });
        } else {
            targetPieces = items.pieces;
        }
        return targetPieces;
    },
    getItems: function getItems(items) {
        var _this7 = this;

        var targetItems = [];
        if (is.und(items)) {
            targetItems = this.items;
        } else if (is.num(items)) {
            targetItems = this.items[items];
        } else if (is.arr(items)) {
            items.forEach(function (item) {
                return is.num(item) ? targetItems.push(_this7.items[item]) : targetItems.push(item);
            });
        } else {
            targetItems = items;
        }
        return targetItems;
    },
    animatePieces: function animatePieces(options) {
        var o = extend({
            duration: function duration(p) {
                return p.duration;
            },
            delay: function delay(p) {
                return p.delay;
            },
            easing: function easing(p) {
                return p.easing;
            },
            remove: true,
            singly: false
        }, options);
        var targets = this.getPieces(options.items);
        if (o.remove) {
            anime.remove(targets);
        }
        if (o.ignore) {
            o.ignore.forEach(function (prop) {
                return delete o[prop];
            });
        }
        if (o.singly) {
            targets.forEach(function (target) {
                return anime(extend(o, { targets: target }));
            });
        } else {
            anime(extend(o, { targets: targets }));
        }
    },
    showPieces: function showPieces(options) {
        var o = extend({
            x: function x(p) {
                return p.s_x;
            },
            y: function y(p) {
                return p.s_y;
            },
            w: function w(p) {
                return p.s_w;
            },
            h: function h(p) {
                return p.s_h;
            },
            tx: function tx(p) {
                return p.s_tx;
            },
            ty: function ty(p) {
                return p.s_ty;
            }
        }, options);
        this.animatePieces(o);
    },
    hidePieces: function hidePieces(options) {
        var o = extend({
            x: function x(p) {
                return p.h_x;
            },
            y: function y(p) {
                return p.h_y;
            },
            w: function w(p) {
                return p.h_w;
            },
            h: function h(p) {
                return p.h_h;
            },
            tx: function tx(p) {
                return p.h_tx;
            },
            ty: function ty(p) {
                return p.h_ty;
            }
        }, options);
        this.animatePieces(o);
    },
    animateItems: function animateItems(options) {
        var o = extend({
            easing: 'linear',
            remove: true
        }, options, { targets: this.getItems(options.items) });
        if (o.remove) {
            anime.remove(o.targets);
        }
        anime(o);
    }
};

Pieces.version = '1.0.0';
Pieces.random = anime.random;
Pieces.extend = extend;

return Pieces;

})));
