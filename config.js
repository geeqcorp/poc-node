'use strict';

/**
 * Module dependencies.
 */
let _ = require('lodash'),
    glob = require('glob');

/**
 * The config
 */
module.exports = {
    app: {
        title: 'geeq-poc-node',
        description: 'A Proof of Concept to demonstrate the GEEQ Proof of Honesty',
        keywords: 'Express, Node.js, blockchain'
    },
    port: process.env.PORT || 2626,
    ip: process.env.IP || '127.0.0.1',
    miner: process.env.MINER || '44454641554c544d494e4552'
};

/**
 * Get files by glob patterns. Used to load routes and env config files, if present. Called in express.js mostly
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
    // For context switching
    let _this = this;

    // URL paths regex
    let urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

    // The output array
    let output = [];

    // If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob
    if (_.isArray(globPatterns)) {
        globPatterns.forEach(function(globPattern) {
            output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
        });
    } else if (_.isString(globPatterns)) {
        if (urlRegex.test(globPatterns)) {
            output.push(globPatterns);
        } else {
            let files = glob(globPatterns, { sync: true });
            if (removeRoot) {
                files = files.map(function(file) {
                    return file.replace(removeRoot, '');
                });
            }
            output = _.union(output, files);
        }
    }

    return output;
};