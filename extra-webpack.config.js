// extra-webpack.config.js
module.exports = {
    resolve: {
      fallback: { path: false }  // Tells Webpack to use an empty module for 'path'
    }
  };
  