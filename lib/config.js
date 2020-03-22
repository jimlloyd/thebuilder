// config.js

const _ = require('lodash');
const debug = require('debug');
const { expect } = require('chai');
const { execCommandMultiLineOutput } = require('./exec');

const dlog = debug('thebuilder:config');

function getConfig(section)
{
    if (!_.isString(section) || section=='')
        return P.reject(new Error('getConfig with invalid section'));

    var config = {};

    const cmd = `git config --get-regexp ^${section}`;
    const re = new RegExp(`^${section}\\.(\\w+)\\s+(.+)`)
    return execCommandMultiLineOutput(cmd)
        .then(lines => {
            _.forEach(lines, line => {
                dlog(line);
                const parts = line.match(re);
                expect(parts).to.exist;
                expect(parts).to.have.length(3);
                const key = parts[1];
                const value = parts[2];
                config[key] = value;
            });
        })
        .catch(err => {
            console.warn("Warning, getConfig failed with:", err.toString().trim());
            console.warn("Using empty config");
        })
        .then(() => config);
}

module.exports = {
    getConfig,
};
