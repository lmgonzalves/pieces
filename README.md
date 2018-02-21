# Pieces

Javascript library to draw and animate images, texts or SVG paths as multiple rectangular pieces.

[**DEMO**](https://tympanus.net/Tutorials/PiecesSlider/)

[**TUTORIAL**](https://tympanus.net/codrops/2018/02/21/animated-fragment-slideshow/)

Visit [**lmgonzalves.com**](https://lmgonzalves.com/) to see it in action!

## Basic usage

The `Pieces` library depends on [anime.js](http://animejs.com/) to perform animations, so you need to include it before `Pieces`. Then you only need a `canvas` element in HTML to start animating things with a piece of code like this:

```html
<!-- Canvas to draw the pieces -->
<canvas class="my-canvas"></canvas>

<script src="anime.min.js"></script>
<script src="dist/pieces.min.js"></script>
<script>
    // Options for customization, see full list below
    var options = {
        canvas: '.my-canvas',
        text: 'Some Text'
    };

    // Initialize a new instance, by default the pieces will be 'hidden'
    var myPieces = new Pieces(options);

    // Show pieces using default options. See the full list of available operations below.
    myPieces.showPieces();
</script>
```

## Operations

These are all the possible operations that can be performed with a `Pieces` instance. To specify the item you want to animate, you can use the corresponding `index` or an `Array` of indexes, like:

```javascript
var options1 = {items: 0};      // Animate the first item
var options2 = {items: [0, 2]}; // Animate the first and the third items
```

### Operations to animate item values

- `animateItems(options)`: Animate the items properties passed in `options`. So far, you will only need this to animate the `angle` property for items.

### To animate pieces values

- `animatePieces(options)`: Animate the pieces properties passed in `options`.
- `showPieces(options)`: Show pieces (animate to the "show" values).
- `hidePieces(options)`: Hide pieces (animate to the "hide" values).

## Options

For customization, you can pass `options` (in object notation) to `Pieces` constructor. These `options` overrides default values, and will be used for any future operation. You can also override the `options` for an specific operation. Here is the complete list, for reference.

### Options for `Pieces` constructor

| Name                    | Type                    | Default         | Description |
|-------------------------|-------------------------|-----------------|-------------|
|`canvas`                 | `String` or `Element`   | `null`          | A `canvas` element (or CSS selector) to draw the items. |
|`items`                  | `Array` or `Object`     | `[]`            | Item objects to draw and animate. Each item should be in the format: `{type, value, options}`, where `type` could be `image`, `text` or `path`. |
|`image`                  | `Array` or `Image`      | `[]`            | `Image` elements to draw and animate. |
|`text`                   | `Array` or `String`     | `[]`            | `String` elements (text) to draw and animate. |
|`path`                   | `Array` or `String`     | `[]`            | `String` values corresponding to `d` attributes of SVG `path` elements. |
|`x`                      | `Integer` or `String`   | `0`             | Start position for the `x` axis, or one of the possible `String` values: `'center'` (center the items, positioned sequentially) or `'centerAll'` (center all items individually). |
|`y`                      | `Integer` or `String`   | `0`             | Start position for the `y` axis, or one of the possible `String` values: `'center'` (center the items, positioned sequentially) or `'centerAll'` (center all items individually). |
|`itemSeparation`         | `Integer`               | `1`             | Separation among items. |
|`animation`              | `Object`                | `{duration: 1000, delay: 0, easing: 'easeInOutCubic'}` | Default values to perform animations using [anime.js](http://animejs.com/). The `duration` and `delay` properties could be functions. |
|`debug`                  | `Boolean`               | `false`         | If `true`, enable a debug mode, where you can see how the pieces and items are being drawn in the `canvas`. |

The following options can be passed as an `Array` too, each value for the corresponding item. In case there are more items than `Array` elements, the last value will be used.

| Name                    | Type                    | Default         | Description |
|-------------------------|-------------------------|-----------------|-------------|
|`piecesWidth`            | `Integer` or `Function` | `5`             | Pieces `width`. |
|`piecesSpacing`          | `Integer` or `Function` | `5`             | Separation among pieces. |
|`extraSpacing`           | `Integer` or `Object`   | `0`             | Extra space that should be covered by the pieces. You can set a different value for each axis using an `Object` like: `{extraX: 0, extraY: 0}`. This is useful if `angle != 0`. |
|`angle`                  | `Integer`               | `0`             | Rotation `angle` for pieces. All pieces in the same item will have the same rotation `angle`. |
|`rotate`                 | `Integer`               | `0`             | Rotation `angle` for items. This will rotate the entire item, including pieces. |
|`translate`              | `Integer` or `Object`   | `0`             | Translation for items. You can set a different value for each axis using an `Object` like: `{translateX: 0, translateY: 0}`. |
|`padding`                | `String`                | `0`             | Padding for items. It must be set like a CSS shortcut format: `'top right bottom left'`. |
|`opacity`                | `Integer` or `Function` | `1`             | Opacity for items. |
|`fontFamily`             | `String`                | `"sans-serif"`  | Font family for text items. |
|`fontSize`               | `Integer`               | `100`           | Font size for text items. |
|`fontWeight`             | `Integer`               | `900`           | Font weight for text items. |
|`color`                  | `String`                | `'#000'`        | Color to draw text and path items. |
|`backgroundColor`        | `String` or `Boolean`   | `false`         | Background color for items, if it's not `false`. |
|`backgroundRadius`       | `Integer`               | `0`             | Useful to draw rounded corners for the item background. |

### Options to use in operations for updating pieces

After the pieces are built (new `Pieces` instance created), they can be animated through operations, and you can use all of these possible properties to do it. Just provide the properties that you want to update inside the `options` argument.

| Name                    | Type                    | Description |
|-------------------------|-------------------------|-------------|
|`x`                      | `Integer`               | Pieces `x` position. |
|`y`                      | `Integer`               | Pieces `y` position. |
|`w`                      | `Integer`               | Pieces width. |
|`h`                      | `Integer`               | Pieces height. |
|`tx`                     | `Integer`               | Pieces translation in `x` axis. |
|`ty`                     | `Integer`               | Pieces translation in `y` axis. |

As the animations are handled by [anime.js](http://animejs.com/), each property could be a `function` instead a static value (read more [here](http://animejs.com/documentation/#functionBasedDuration)). And every `piece` object also has `s_property` (`property` value when the piece is shown) and `h_property` (`property` value when the piece is hidden) values, so you could do something like this (ES6 code):

```javascript
// Animate everything to the "show" (`s_property`) values
const options = {
    x: p => p.s_x,
    y: p => p.s_y,
    w: p => p.s_w,
    h: p => p.s_h,
    tx: p => p.s_tx,
    ty: p => p.s_ty
};
myPiecesInstance.animatePieces(options);

// It's the same to call `myPiecesInstance.showPieces()` instead, just posting that here as an example
```

## Useful functions

The `Pieces` library also offers some useful functions that you can use:

- `Pieces.random(min, max)`: Return a random number between `min` and `max` values.
- `Pieces.extend(target, source)`: Extend a `target` object with properties from one or multiple `source` objects.
