#!/usr/bin/env node

'use strict';

const _ = require('lodash');
const config = require('../lib/config.js');
const exec = require('../lib/exec.js');
const debug = require('debug');
const fs = require('fs');
const git = require('git-client');
const path = require('path');
const Promise = require('bluebird');
const chai = require('chai');

const { expect } = chai;

const dlog = debug('thebuilder');

async function gitRoot()
{
    const root = await git.revParse({'show-toplevel': true});
    dlog({root});
    return root;
}

async function getProjectPaths(root)
{
    // TODO make these defaults overridable
    const defaults =
    {
        builds: `${root}/builds`,
        configs: `${root}/cmake/configs`
    };

    _.forOwn(defaults, (dirPath, key) => {
        if (!fs.existsSync(dirPath))
        {
            console.error(`The path ${dirPath} must exist`);
            process.exit(1);
        }
        const stats = fs.statSync(dirPath);
        if (!stats.isDirectory())
        {
            console.error(`The path ${dirPath} must be an existing directory`);
            process.exit(1);
        }
        dlog(`The ${key} root at ${dirPath} looks good`);
    });

    return Promise.resolve().then(() => defaults);
}

async function run()
{
    const root = await gitRoot();
    dlog({root});

    const projectPaths = await getProjectPaths(root);
}

run();
