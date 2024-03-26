// extra-webpack.config.js
module.exports = {
    resolve: {
      fallback: { 
        "path": require.resolve("path-browserify") 
      }  // Tells Webpack to use an empty module for 'path'
    }
  };
  