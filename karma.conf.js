// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    webpack: { node: { fs: 'empty', } },
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/sideWays'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true,
    files: [
      { pattern: 'src/test.ts', watched: false, type: 'module' },
      { pattern: './node_modules/@angular/material/prebuilt-themes/indigo-pink.css', included: true },
      { pattern: './node_modules/@angular/material/prebuilt-themes/pink-bluegrey.css', included: true },
      { pattern: 'src/app/**/*.spec.ts', included: true, type: 'js' }, // Adjusted pattern
      // Removed redundant pattern
      { pattern: 'src/app/**/*.ts', included: false, watched: true },
      { pattern: 'src/app/**/*.html', included: false, watched: true },
      { pattern: 'src/assets/**/*', included: false, watched: false },
      { pattern: 'src/environments/environment*.ts', included: false, watched: true },
      // No need to add additional entries unless specifically required
    ],
    
  });
};
