# typed-css
## a webpack plugin that automatically generates definition files from css (or less) files when using [css-modules](https://github.com/css-modules/css-modules). Currently, only `:local` is supportive.

## Screenshot
[![Screenshot.png](https://s8.postimg.org/8j703536t/1490534341_1.png)](https://s8.postimg.org/8j703536t/1490534341_1.png)

## Getting started
1. install
``` bash
npm i -D typed-css
// or if you prefer yarn
yarn add -D typed-css
```

2. add it to plugins in webpack configuration
```javascript
const typedCss = require('typed-css');

module.exports = {
    entry: ''
    // balabala
    plugins: [
        /**
        * set it to false if you omit extensions when importing css. i.e. you use `require('myStyle')` instead of `require('myStyle.css')` 
        */
        new typedCss( { reserveExtension: true } ),
    ]
}

```

3. enjoy!