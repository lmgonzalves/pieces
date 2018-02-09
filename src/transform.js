// Adapted version of transform.js by Simon Sarris from here:
// https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js

function Transform(ctx) {
    this.reset(ctx);
}

Transform.prototype = {
    reset(ctx) {
        this.m = [1, 0, 0, 1, 0, 0];
        if (ctx) this.apply(ctx);
    },

    rotate(rad) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m11 = this.m[0] * c + this.m[2] * s;
        const m12 = this.m[1] * c + this.m[3] * s;
        const m21 = this.m[0] * -s + this.m[2] * c;
        const m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    },

    translate(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    },

    transformPoint(px, py) {
        const x = px * this.m[0] + py * this.m[2] + this.m[4];
        const y = px * this.m[1] + py * this.m[3] + this.m[5];
        return [x, y];
    },

    apply(ctx) {
        ctx.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
    }
};

export default Transform;
