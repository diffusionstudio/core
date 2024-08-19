# HTML Guide

In Diffusion Studio, HTML elements are treated as images. Currently, loading HTML with dynamic content is not supported, as HTML is rendered as an SVG inside a [\<foreignObject\>](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject). However, HTML is very useful for rendering responsive layouts and utilizing CSS features.

## Layout

Your HTML must follow this strict layout:

```html
<html>
  <head>
    <style>
      div {
        height: 140px;
        width: 1080px;
        border-radius: 14px;
        background-color: white;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      span {
        font-size: 38px;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div>
      <span>This is HTML rendered inside a Foreign Object</span>
    </div>
  </body>
</html>
```

Ensure that your entire markup is wrapped by a `<body>` tag and all your styles are inside a `<style>` tag.

## Manipulating the HTML

To load the `HtmlSource`, use the following code:

```typescript
import { HtmlSource } from '@diffusionstudio/core';

const source = await HtmlSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/html/sample_html.html');
```

Diffusion Studio will interpret the contents by opening the HTML inside an IFrame, allowing you to manipulate the DOM of the source:

```typescript
source.document!.querySelector('span')!.textContent = 'Manipulated Text Content';
```

## Rendering HTML to Canvas

Construct a `HtmlClip` from your source with the following code:

```typescript
import { HtmlClip } from '@diffusionstudio/core';

const html = new HtmlClip(source, { position: 'center' });

await composition.appendClip(html);
```

By default, the height and width of the clip are defined by your CSS. You can change the dimensions of the clip, but this will only scale your "HTML Image" and will not change the DOM.

> Note: If you change the DOM via `source.document` after the clip has been added to the composition, you need to trigger an update of the clip by running `html.set()`.

> Note: External images and fonts cannot be loaded inside a foreign object. Replace them with base64 encoded strings. For reference, see the [Reddit Stories example](/examples/scripts/reddit-stories.ts).

<br> 

**Next:** [Image Clip](/docs/guide/image.md)
