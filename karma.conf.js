module.exports = function(config) {
    config.set({
        basePath: '.',
        frameworks: ["jasmine"],
        browsers: ["Electron"],
        files: [
            { pattern: "./karma.shim.js", watched: true, included: true, served: true},
            { pattern: "./src/test/*.js", watched: true, included: true, served: true },
            { pattern: "./src/openMarket/**/*.js", watched: true, included: false, served: true },
        ],
        preprocessors: {
            "./src/openMarket/**/*.js": ["babel"],
            "./src/test/*.js": ["babel"]
        },
        babelPreprocessor: {
            options: {
                presets: ['es2015'],
                sourceMap: 'inline'
            }
        },
        plugins: [
            'karma-jasmine',
            'karma-electron-launcher',
            'karma-babel-preprocessor'
        ]
    });
};