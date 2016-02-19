/*jslint node: true, loopfunc: true */

/**
 * CLI interface for bulk generating files using the random-world library
 *
 * https://www.npmjs.com/package/random-world
 *
 *  node index.js network.url, places.city, names.fullname, network.ip, money.ccnumber -r 6500 --output myOutput.csv -f csv --headers "Domain Name, City, Name, IP, Creditcard Number"
 *  node index.js names.fullname, places.street, places.city, places.country, money.ccnumber, money.cctype, money.expiry, money.ccstart, money.cv2 -r 6500 --output myOutput.csv -f csv --headers "Full Name, Address Line 1, City, Country, Credit Card Number, Type, Expires, Starts, CVV"
 *  args 'network.ip[foo:fgop, arse:1]', network.domain -r 2
 */

var // internal packages
    pkg     = require('./package.json'),
    path    = require('path'),
    util    = require('util'),
    fs      = require('fs'),

    now     = new Date().getTime(),

    // external libs
    random      = require('random-world'),
    program     = require('commander'),
    ProgressBar = require('progress'),
    Promise     = require('bluebird'),

    // various utilities
    utils = {

        /**
         * [parseArgs description]
         *
         * converts the arguments to a method on the CLI into an options object
         *
         * @param  {[type]} argsString [description]
         * @return {[type]}            [description]
         */
        parseArgs: function (argsString) {

            var args = (argsString || '').split(','),
                argsObj = {};

            if (!argsString) {
                return argsObj;
            }

            args = args.map(function(a) {
                return a.trim().split(':');
            });

            // write the parsed value to the args object - we try and do some
            // arbitrary type conversion too
            args.forEach(function(arg) {

                var val = arg[1].trim();

                if (val.match(/true|false/ig)) {
                    val = (val === 'true' ? true : false);
                }

                if ((val !== true && val !== false) && val.match(/\d/)) {
                    val = parseInt(val);
                }

                argsObj[arg[0]] = val;
            });

            return argsObj;
        },

        /**
         * [fileStream description]
         *
         * returns a writable file stream
         *
         * @param  {[type]} file [description]
         * @return {[type]}      [description]
         */
        fileStream: function (file) {

            return fs.createWriteStream(path.resolve(__dirname, file));
        }
    };


/**
 * Series of chained events
 *
 */
return Promise

    // resolve...
    .resolve()

    // parse the options
    .then(function () {

        program
          .version(pkg.version)
          .option('-f, --format [format]',      'Output format [stdout|csv|text]. Defaults to stdout.', /^(stdout|csv|text|sql)$/i, 'stdout')
          .option('-s, --size [size]',          'Target output size.')
          .option('-o, --output [output]',      'Target file.')
          .option('-h, --headers [headers]',    'Optional headers for CSV output.')
          .option('-c, --columns [columns]',    'Required column names for SQL bulk insert scripts')
          .option('-r, --rows [rows]',          'Number of rows to generate.', parseInt);

        program.on('--help', function() {
          console.log('  Examples:');
          console.log('');
          console.log('    $ random-world-cli --help');
          console.log('');
        });

        program.parse(process.argv);
    })

    // validation
    .then(function() {

        return new Promise(function (resolve, reject) {

            // ensure an output file was set
            switch (program.format) {

                case 'csv':
                case 'text':
                case 'sql':

                    if (!program.output) {
                        return reject(util.format('Output file must be provided when using %s on --format flag', program.format));
                    }

                    break;
            }

            resolve();
        });
    })

    // parse args
    .then(function () {

        return new Promise(function (resolve, reject) {

            var str         = program.args.join(''),
                matches     = str.match(/([a-z\.]+)(\[([a-zA-Z0-9\.\:\,\= ]+)\])?/ig),
                methods     = [],
                methodArgs  = [],
                calls       = [],
                headers     = [];

            matches.forEach(function(match) {

                var method = match,
                    options,
                    args = [];

                options = method.match(/\[.*\]/);

                if (options) {
                    str = str.replace(options[0], '');
                    methodArgs.push(utils.parseArgs(options[0].replace('[', '').replace(']', '')));
                } else {
                    methodArgs.push({});
                }
            });

            // build calls
            str.split(',').forEach(function(method, i) {

                var parts = (method || '').split('.');

                calls.push({
                    namespace:  parts[0],
                    method:     parts[1],
                    options:    methodArgs[i]
                });
            });

            // any headers|columns set? these will be used to write to the top of the CSV or as the SQL inserts args
            if (program.headers) {

                program.headers.toString().split(',').forEach(function (header, i) {
                    headers[i] = header.trim();
                });
            }

            if (program.columns) {

                program.columns.toString().split(',').forEach(function (column, i) {
                    headers[i] = column.trim();
                });
            }

            return resolve({
                calls:      calls,
                headers:    headers
            });
        });
    })

    //
    .then(function (payload) {

        var stream,
            bar = false;

        //
        switch (program.format) {

            case 'stdout':

                // stdout is a stream in this instance
                stream = process.stdout;
                break;

            case 'csv':
            case 'text':

                // stream is a write stream
                stream  = utils.fileStream(program.output);
                bar     = new ProgressBar(util.format('Writing %s output [:bar] :percent :etas', program.format), { total: +program.rows });

                if (payload.headers.length) {
                    stream.write([payload.headers.join(", "), "\n"].join(''));
                }

                break;

            case 'sql':

                // stream is a write stream
                stream  = utils.fileStream(program.output);
                bar = new ProgressBar(util.format('Writing %s output [:bar] :percent :etas', program.format), { total: +program.rows });

                break;
        }
        //
        for (var k = 0; k < +program.rows; k++) {

            var values = [];

            payload.calls.forEach(function(call, i) {

                var args        = call.options,
                    namespace   = call.namespace,
                    method      = call.method,
                    escaped     = false,
                    value;

                try {

                    value = random[namespace][method](args || {});

                    // if (value.indexOf(",") > -1) {
                    //     escaped = true;
                    // }

                    switch (program.format) {

                        case 'stdout':
                        case 'csv':
                        case 'text':

                            stream.write([
                                // (escaped ? '"' : ''),
                                value,                                                  // call the method
                                // (escaped ? '"' : ''),
                                (payload.calls.length > 1 && (i != payload.calls.length-1) ? ', ': '')  // add comma on the end?
                            ].join(''));

                            break;

                        case 'sql':

                            // cache for later
                            values.push(value);

                            break;
                    }
                } catch (e) {
                    throw e;
                }
            });

            // sql format is a list of insert statements
            if (program.format === 'sql') {
                //
                stream.write([
                    util.format.apply(undefined, ["INSERT INTO tbl (%s, %s, %s) VALUES (%s, %s, %s)"].concat(payload.headers.concat(values))),
                    ';'
                ].join(''));
            }

            // terminate the row with linebreak
            if (k != (+program.rows - 1)) {
                stream.write("\n");
            }

            // show progress if not in stdout mode
            if (bar) {
                bar.tick();
            }
        }

        // close stream
        if (program.format !== 'stdout') {
            stream.end();
        }
    })

    // catch any errors
    .catch (function (e) {
        console.error('[argument_parse_error] %s', e);
    })

    .lastly(function(){

        var finished = new Date().getTime();

        console.log(finished - now);
    });
