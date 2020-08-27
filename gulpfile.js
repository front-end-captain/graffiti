const path = require("path");
const gulp = require("gulp");

const DIR = {
  less: path.resolve(__dirname, "./src/style/*.less"),
  lib: path.resolve(__dirname, "./lib/style"),
  es: path.resolve(__dirname, "./es/style"),
};

gulp.task("copyLess", () => {
  return gulp
    .src(DIR.less)
    .pipe(gulp.dest(DIR.lib))
    .pipe(gulp.dest(DIR.es))
});

gulp.task("default", ["copyLess"]);
