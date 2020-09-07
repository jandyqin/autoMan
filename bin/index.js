#!/usr/bin/env node
require('shelljs/global');
const
    args = require('yargs')
        .usage('Usage: $0 [command]')
        .option('p', {
            alias: 'path',
            demand: false,
            default: '',
            describe: "默认当前路径",
            type: 'string'
        })
        .command('start', '启动服务', {}, function (argv) {
            const service = require('../serice');
            var path = process.cwd();
            var port = 8860;
            if (argv.p) {
                path = argv.p;
            }
            if (argv.port) {
                port = argv.port;
            }
            service(path, port);
        })
        .command('forever', '启动常驻服务', {}, function (argv) {
            exec(`forever start -l ${require('path').join(__dirname, '../forever.log')} -a ${require('path').join(__dirname, '../bin/index.js')} start `);
        })
        .example("aotuman start ")
        .help('help')
        .alias('h', 'help')
        .epilog('A command-line tool for Mingyuanyun mobile test')
        .argv;