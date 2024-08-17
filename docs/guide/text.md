# Text Clip

The current text implementation uses a 2D canvas in the background because it is highly versatile and replicating it with more modern implementations like WebGPU (e.g., [Signed Distance Fields (SDF)](https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf)) would be very time-consuming. However, this approach comes at the cost of increased memory consumption and potentially reduced performance. Displaying too many text clips simultaneously might significantly slow down rendering speeds.

## Styling Text Clips

Here is a basic example of how to style text clips:

```typescript
import { TextClip } from '@diffusionstudio/core';

const font = Font.fromFamily({ family: 'Geologica', weight: '400' });

const text = new TextClip('Hello World').set({
  textAlign: 'left',
  textBaseline: 'top',
  fillStyle: '#FFFFFF',
  fontSize: 16,
  font,
  maxWidth: 900,
  leading: 1.1,
  stroke: {
    color: '#000000',
    width: 4,
    join: 'round',
  },
  shadow: {
    color: '#000000',
    blur: 8,
    alpha: 0.4,
    angle: Math.PI / 4,
    distance: 2,
  },
  position: {
    x: '12%',
    y: '50%',
  },
});
```

We have loaded the web font from a predefined set of popular web fonts. You can also use custom web fonts like this:

```typescript
const roboto = new core.Font({
  source: "https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmSU5fBBc4AMP6lQ.woff2",
  weight: '400',
  family: 'Roboto'
});
```

For more examples, see [examples](/examples/scripts/font.ts).

Setting the `textAlign` and `textBaseline` properties will automatically set the anchor point, similar to the [transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin) in CSS. You can also set the anchor manually, e.g.:

```typescript
text.set({
  anchor: {
    x: 0,
    y: 1
  }
});
```

The anchor values should be between 0 and 1, where `anchor: 0.5` centers the text.

## Complex Text

We have tested various methods to render text with differently styled subsections, such as changing the color of a particular word. While Pixi.js `HTMLText` was a promising solution, the quality of the text did not meet our standards. We ultimately implemented our own solution using foreignObjects. Although visually satisfying, the performance was inadequate for production use. We reverted to a 2D context implementation, resulting in the current state.

```typescript
import { ComplexTextClip } from '@diffusionstudio/core';

const text = new core.ComplexTextClip('Complex Text')
  .set({
    stop: composition.duration,
    textAlign: 'center',
    textBaseline: 'middle',
    font: core.Font.fromFamily({ family: 'Geologica', weight: '800' }),
    textCase: 'upper',
    fontSize: 18,
    anchor: 0.5,
    stroke: {
      width: 3,
      color: '#000000',
    },
    position: {
      y: '85%',
      x: '50%',
    },
    shadow: {
      alpha: 0.7,
      blur: 12,
      distance: 8,
    },
    styles: [{
      fillStyle: '#19fa2c'
    }],
    segments: [{
      start: 8,
      index: 0
    }]
  });
```

The `ComplexTextClip` is derived from the `TextClip`, with the notable addition of `styles` and `segments` properties. The `styles` array allows you to define the styles you want to override for specific sections of the `ComplexTextClip`. Currently available styles include:
* `fillStyle?: string;`
* `fontSize?: number;`
* `stroke?: Stroke;`
* `font?: Font;`

> Note: The font can only be overwritten if it is preloaded. Ensure you call `await new Font(...).load()` beforehand.

You can apply styles to sections of your text using the `segments` property. Each segment requires a `start` index indicating where the section should begin. Optionally, you can specify a `stop` index, with the default being the end of the text. The `index` key points to the `styles` array, referencing which style to apply to that section. If `index` is not defined, the default style is used.

> This models the behavior of editing applications where users select parts of the text and apply new styles to the selected sections.

See it in action [here](/examples/scripts/custom-captions.ts).

<br> 

**Next:** [Models](/docs/guide/models.md)
