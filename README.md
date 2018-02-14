# BitrateSelector

Bitrate selector .m3u8 and .mp4

## Usage

Add both Clappr and the plugin scripts to your HTML:

```html
<head>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"></script>
  <script type="text/javascript" src="dist/bitrate-selector.min.js"></script>
</head>
```

Then just add `BitrateSelector` into the list of plugins of your player instance, and the options for the plugin go in the `bitrateSelector` property as shown below.

```javascript
var player = new Clappr.Player({
  source: "http://your.video/here.mp4",
  autoPlay: false,
  plugins: [
    BitrateSelector
  ],
  bitrateSelector: {
  }
});
```

## Development

Install dependencies:

```shell
  yarn install
```

Start HTTP dev server `http://0.0.0.0:8080`:

```shell
  yarn run start
```

Upgrade packages to latest version:

```shell
  yarn upgrade --latest
```

## Release

Minified version of plugin will be placed at `dist/bitrate-selector.min.js`

```shell
  yarn run release
```

## Lint

Run linter:

```shell
  yarn run lint
```

Fix lint errors:

```shell
  yarn run fix
```
