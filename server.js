'use strict';

/**
 * Module dependencies
 */

let config = require('./config'),
    loki = require('lokijs'),
    request = require('request');

/**
 * Main application. Order of loading is important
 */

// Init the express app
let app = require('./express')();

let port = config.port;

// Look for CLI args for port
if (Number.isInteger(process.argv[2]) && process.argv[2] > 1024 && process.argv[2] < 65535) {
    port = parseInt(process.argv[2]);
}

/**
 * Initialize the app arrays & vars
 */

// This is the ID of the miner. This is who gets the coin
app.set('miner', process.env.MINER);

// As a hub receives transactions, they go in here and they don't persist
app.set('transactions', []);

// BOOTSTRAP!
let gc = new loki('data/geeqchain.json', {
    autoload: true,
    autoloadCallback: initChain,
    autosave: true,
    autosaveInterval: 10000
});

/**
 * Block JSON
 * {
 *   index: 1,
 *   timestamp: ts,
 *   transactions: [],
 *   anl: [],
 *   proof: p,
 *   previous_hash: hash
 * }
 */

function initChain() {
    let blocks = gc.getCollection('blocks');
    let anl    = gc.getCollection('anl');

    // Create the blocks collection if it doesn't exist
    if (blocks === null) {
        blocks = gc.addCollection('blocks', {
            unique: ['index']
        });
    }

    // Create the anl collection if it doesn't exist
    if (anl === null) {
        anl = gc.addCollection('anl');
    }

    // Update the ANL
    if (blocks.count() > 0) {
        // get the last block to update the ANL
        let lastblock = blocks.chain().find({}).simplesort('index').limit(1);
        console.log(lastblock);
    } else {
        // update the anl from anl.geeq.io
        console.log('No data in local chain, getting ANL from anl.geeq.io...');

        request('http://anl.geeq.io:12626/', function (error, response, body) {
            if (error !== null) {
                console.log('Cannot get an ANL, we have to shutdown...');
                gc.close();
                process.exit(0);
            }

            let hosts = JSON.parse(body);

            hosts.forEach(function(host) {
                anl.insert(host);
            });
        });
    }

    console.log('We have an ANL!');

}

process.on('SIGINT', function() {
    console.log('Flushing DB');
    gc.close();
    process.exit(0);
});

// Start the GEEQ node
app.listen(port, config.ip);

// Export the app
var exports = module.exports = app;

console.log('GEEQ Node started on port ' + port + ' with IP ' + config.ip);
