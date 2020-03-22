#!/usr/bin/env node

'use strict';

const _ = require('lodash');
const config = require('../lib/config.js');
const exec = require('../lib/exec.js');
const debug = require('debug');
const fs = require('fs');
const git = require('git-client');
const _glob = require('glob');
const path = require('path');
const Promise = require('bluebird');
const chai = require('chai');

const { expect } = chai;

const glob = Promise.promisify(_glob);

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
        root,
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

async function getBuildNames(configPath)
{
    dlog(`getBuildNames for dir ${configPath}`);
    const globExpr = `${configPath}/*.cmake`;
    dlog(`getBuildNames globExpr:`, globExpr);
    const configs = await glob(globExpr);
    dlog(`getBuildNames configs:`, configs);
    return Promise.resolve()
        .then(() => _.map(configs, configPath => path.basename(configPath, '.cmake')))
        .tap(buildNames => dlog("Existing builds:", buildNames));
}

async function getBuildName(args, buildNames)
{
    const defaultBuildKey = 'thebuilder.defaultbuild';
    let build = args[0];
    if (!_.isEmpty(build) && _.includes(buildNames, build))
    {
        args = args.slice(1);
        return git.config(defaultBuildKey, build)
        .then(() => build);
    }
    else
    {
        try
        {
            build = await git.config(defaultBuildKey);
            build = build.trim();
        }
        catch(err)
        {
            build = null;
        }
        if (_.isEmpty(build))
        {
            return Promise.reject(new Error('Cannot infer build'));
        }
        else if (_.includes(buildNames, build))
        {
            return Promise.resolve(build);
        }
        else
        {
            return Promise.reject(new Error(`Config variable thebuilder.defaultbuild ${build} is invalid`));
        }
    }
}

async function getBuildConfig(buildName, projectPaths)
{
    const build = {
        root: projectPaths.root,
        buildDir: `${projectPaths.builds}/${buildName}`,
        cmake: `${projectPaths.configs}/${buildName}.cmake`
    };
    return Promise.resolve(build);
}

async function maybeConfigure(buildConfig)
{
    const { root, buildDir, cmake } = buildConfig;
    const ninjaBuild = `${buildDir}/build.ninja`;
    if (!fs.existsSync(buildDir) || !(fs.existsSync(ninjaBuild)))
    {
        const cmd = `cmake -H${root} -B${buildDir} -DCMAKE_TOOLCHAIN_FILE=${cmake} -G Ninja`;
        dlog('Configure command:', cmd);
        return exec.execCommand(cmd).then(out => process.stdout.write(out));
    }
    else
    {
        return Promise.resolve();
    }
}

async function execBuild(buildConfig, args)
{
    const targets = _.isEmpty(args) ? 'all' : args.join(' ');
    const cmd = `ninja -C ${buildConfig.buildDir} ${targets}`;
    dlog("Running build command:", cmd);
    return exec.execCommand(cmd).then(out => process.stdout.write(out));
}

async function run()
{
    const [nodepath, scriptpath, ...args] = process.argv;

    const root = await gitRoot();
    dlog({root});

    const projectPaths = await getProjectPaths(root);

    const buildNames = await getBuildNames(projectPaths.configs);
    const buildName = await getBuildName(args, buildNames);
    const buildConfig = await getBuildConfig(buildName, projectPaths);

    await maybeConfigure(buildConfig);
    await execBuild(buildConfig);
}

run();
