# preact-es2020-template
A skeleton for un-bundled preact projects.

## Install
_this command will do an `npm install` for you_
```bash
npm run vendor
```

## Build
```bash
npm run build
```

## Watch
```bash
# Removed/broken until https://github.com/cevek/ttypescript/issues/121 is fixed
# npx --no-install ttsc --watch
```

## Serve
```bash
npm run serve
```

No bundler, pure ES2020 modules loaded directly into the browser.  It uses es-module-shims for import map polyfill in browsers without native support but otherwise doesn't use any special loaders, bundlers, file servers, etc.  Hosting is done via a static file server, you could use any static file server you wanted but I chose http-server because it is small and simple.

The one caveat with this project is the vendoring of dependencies.  To add a runtime dependency:
1. open `build/vendor.ts`
1. create an entry in the array at the top
1. specify the dependency package name (the thing you would put in the TS import statement)
1. specify the path within the package that should be copied (the whole folder will be vendored recursively, usually this is a dist or out folder)
1. the path (relative to the copied folder from previous step) to the index file for the package (usually `index.js` or `package-name.js` or `package-name.min.js`)
1. from the root directory of this project run `npm run vendor`

This will generate the runtime import map and embed it into your `index.html` file so the browser can turn `import { ... } from 'my-package'` into a fetch of `./vendor/my-package/dist/index-file.js`.
