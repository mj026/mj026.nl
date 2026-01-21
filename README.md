# mj026.nl
![](https://github.com/mj026/mj026.nl/actions/workflows/ci.yaml/badge.svg)

My professional website built with [tailwindcss](https://tailwindcss.com/), 
              [vite](https://vite.dev/), [nunjucks](https://mozilla.github.io/nunjucks/), [biome](https://biomejs.dev/) and [sublime text](https://www.sublimetext.com/).deployed on [https://www.mj026.nl](https://www.mj026.nl)

## Development requirements

A recent LTS version of `NodeJS` (tested with v24).

## Development server

Setting up a development server is as simple as:
```bash
    npm install
    npm run dev
```

Then browse to [http://localhost:5173/](http://localhost:5173/)

## Linting

The ts, templates and css are linted with [biome](https://biomejs.dev/):
```bash
    npm run lint
```

And formatted too:
```bash
    npm run format
```

## Bundle size
See how much javascript / assets are bundled:
```bash
    npm run visualize
```

## Github actions

Linting and publishing are run automatically using [Github Actions](https://github.com/mj026/mj026.nl/actions)
