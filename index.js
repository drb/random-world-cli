/*jslint node: true, loopfunc: true */

/**
 * CLI interface for bulk generating files using the random-world library
 *
 * https://www.npmjs.com/package/random-world
 *
 *  node index.js network.url, places.city, names.fullname, network.ip, money.ccnumber -r 6500 --output myOutput.csv -f csv --headers "Domain Name, City, Name, IP, Creditcard Number"
 *  node index.js names.fullname, places.street, places.city, places.country, money.ccnumber, money.cctype, money.expiry, money.ccstart, money.cv2 -r 6500 --output myOutput.csv -f csv --headers "Full Name, Address Line 1, City, Country, Credit Card Number, Type, Expires, Starts, CVV"
 */

var // internal packages
    pkg     = require('./package.json'),
    path    = require('path'),
    fs      = require('fs'),

    // external libs
    random      = require('random-world'),
    program     = require('commander'),
    ProgressBar = require('progress'),
    Promise     = require('bluebird'),

    // not used... bin off at some point.
    utils = {

        parseArgs: function (argsString) {

            var args = (argsString || '').split(','),
                argsObj = {};

            if (!argsString) {
                return argsObj;
            }

            args = args.map(function(a) {
                return a.trim().split(':');
            });
            args.forEach(function(arg) {
                argsObj[arg[0]] = arg[1];
            });

            return argsObj;
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
          .option('-f, --format [format]',  'Output format [stdout|csv|text]. Defaults to stdout.', /^(stdout|csv|text)$/i, 'stdout')
          .option('-s, --size [size]',      'Target output size.')
          .option('-o, --output [output]',  'Target file.')
          .option('-h, --headers [headers]',  'Optional headers for CSV output.')
          .option('-r, --rows [rows]',      'Number of rows to generate.', parseInt);

        program.on('--help', function() {
          console.log('  Examples:');
          console.log('');
          console.log('    $ random-world-cli --help');
          console.log('    $ random-world-cli -h');
          console.log('');
        });

        program.parse(process.argv);
    })

    // parse args
    .then(function () {

        return new Promise(function (resolve, reject) {

            var str         = program.args.join(''),
                matches     = str.match(/([a-z\.]+)(\[([a-zA-Z0-9\.\:\, ]+)\])?/ig),
                methods     = [],
                methodArgs  = [],
                headers     = [];

            matches.forEach(function(match) {

                var method = match,
                    options,
                    args = [];

                options = method.match(/\[.*\]/);

                if (options) {
                    str = str.replace(options[0], '');
                    methodArgs.push(options[0].replace('[', '').replace(']', ''));
                } else {
                    methodArgs.push(false);
                }
            });

            // any headers set? these will be written to the top of the CSV
            if (program.headers) {

                program.headers.toString().split(',').forEach(function (header, i) {
                    headers[i] = header.trim();
                });
            }

            resolve({
                matches:    matches,
                args:       methodArgs,
                headers:    headers,
                str:        str
            });
        });
    })

    //
    .then(function (matches) {

        var stream,
            bar     = false,
            calls   = matches.str.split(',');

        switch (program.format) {

            case 'stdout':
                stream = process.stdout;
                break;

            case 'csv':
            case 'text':
                stream  = fs.createWriteStream(path.resolve(__dirname, program.output));
                bar     = new ProgressBar('Writing output [:bar] :percent :etas', { total: +program.rows });

                if (matches.headers.length) {
                    stream.write([matches.headers.join(", "), "\n"].join(''));
                }

                break;
        }

        for (var k = 0; k < +program.rows; k++) {

            calls.forEach(function(command, i) {

                var args        = matches.args,
                    parts       = command.split('.'),
                    namespace   = parts[0],
                    method      = parts[1],
                    escaped     = false,
                    value;

                try {

                    value = random[namespace][method](args);

                    if (value.indexOf(",") > -1) {
                        escaped = true;
                    }

                    stream.write([
                        // (escaped ? '"' : ''),
                        value,                                                  // call the method
                        // (escaped ? '"' : ''),
                        (calls.length > 1 && (i != calls.length-1) ? ', ': '')  // add comma on the end?
                    ].join(''));

                } catch (e) {
                    // console.error(e);
                }
            });

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

        console.error(e.message);
    });
