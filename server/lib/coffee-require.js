/*jshint -W117 */
/* global
 */

// coffeeRequire
var fs = Npm.require('fs'),
    path = Npm.require('path'),
    PWD = process.env.PWD,
    coffee = Npm.require('coffee-script')

var merge = function () {
  var args = Array.prototype.slice.call(arguments, 0)
  args.unshift({})
  return _.merge.apply({}, args)
}

/**
 * A coffee processor that can add source maps to compiled files
 *
 * This is a modified version of https://github.com/karma-runner/karma-coffee-preprocessor
 *
 * @method coffeePreprocessor
 * @param {Object} options to pass directly to the coffee-script compiler. See here
 */
var coffeePreprocessor = function (options, content, file, done) {
  var result = null
  var map
  var dataUri

  // Clone the options because coffee.compile mutates them
  var opts = _.clone(options)

  try {
    result = coffee.compile(content, opts)
  } catch (e) {
    console.log('%s\n  at %s:%d', e.message, file.originalPath, e.location.first_line)
    return done(e, null)
  }

  if (result.v3SourceMap) {
    map = JSON.parse(result.v3SourceMap)
    map.sources[0] = path.basename(file.originalPath)
    map.sourcesContent = [content]
    map.file = path.basename(file.originalPath.replace(/\.coffee$/, '.js'))
    file.sourceMap = map
    dataUri = 'data:application/json;charset=utf-8;base64,' + new Buffer(JSON.stringify(map)).toString('base64')
    done(null, result.js + '\n//@ sourceMappingURL=' + dataUri + '\n')
  } else {
    done(null, result.js || result)
  }
}

/**
 * Load and execute a coffeescript file.
 *
 * @method coffeeRequire
 * @param {String} target Path to coffeescript file to load.
 * @param {Object} context the context to run the CoffeeScript code within.
 */
coffeeRequire = function (target, context) {
  var file = {originalPath: target},
      code = fs.readFileSync(target).toString()

  coffeePreprocessor({
    bare: true,
    sourceMap: false
  }, code, file, function (err, code) {
    if (!err) {
      runCodeInContext(code, context, target)
    } else {
      logError(err)
    }
  })
}
