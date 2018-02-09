var gulp = require('gulp');
var rollup = require('rollup').rollup;
var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');
var babel = require('rollup-plugin-babel');
var es2015Rollup = require('babel-preset-es2015-rollup');
var uglify = require('rollup-plugin-uglify');
var _ = require('lodash');


var rollupBundleOptions = {
    entry: 'src/pieces.js',
    plugins: [
        nodeResolve({jsnext: true}),
        commonjs(),
        babel({
            exclude: 'node_modules/**',
            presets: es2015Rollup
        })
    ]
};

var rollupWriteOptions = {
    format: 'umd',
    moduleName: 'Pieces',
    moduleId: 'Pieces',
    dest: 'dist/pieces.js'
};

var rollupBundleOptionsMin = _.cloneDeep(rollupBundleOptions);
rollupBundleOptionsMin.plugins.push(uglify());

var rollupWriteOptionsMin = _.cloneDeep(rollupWriteOptions);
rollupWriteOptionsMin.dest = 'dist/pieces.min.js';


gulp.task('serve', ['bundle'], function(){
    gulp.watch('src/**', ['bundle']);
});

gulp.task('bundle', function() {
    rollup(rollupBundleOptions).then(function (bundle) {
        return bundle.write(rollupWriteOptions);
    });

    return rollup(rollupBundleOptionsMin).then(function (bundle) {
        return bundle.write(rollupWriteOptionsMin);
    });
});

gulp.task('default', ['serve']);
