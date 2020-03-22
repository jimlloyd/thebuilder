// exec.js

const _ = require('lodash');
const child_process = require('child_process');
const Promise = require('bluebird');
const {expect} = require('chai');

function execCommand(cmd, options={})
{
    return new Promise(function (resolve, reject) {
        return child_process.exec(cmd, options, function (err, stdout, stderr) {
            stdout = _.trimEnd(stdout);
            stderr = _.trimEnd(stderr);
            if (!_.isEmpty(stderr)) {
                reject(new Error(stderr));
            } else if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

function execCommandMultiLineOutput(cmd, options={})
{
    return execCommand(cmd, options).then(stdout => _.compact(stdout.split('\n')));
}

function execCommandOneLineOutput(cmd, options={})
{
    return execCommandMultiLineOutput(cmd, options)
        .then(lines => {
            expect(lines).to.have.length(1);
            return lines[0];
        });
}

module.exports = {
    execCommand,
    execCommandMultiLineOutput,
    execCommandOneLineOutput
};
