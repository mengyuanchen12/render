let async = require('async');
let ejs = require('ejs');
let fs = require('fs');
let path = require('path');

const CURRENT_DIR = 'C:\\code\\current\\template';
const BASE_DIR = path.join(__dirname, '..', 'ejs');
const MANIFEST_DIR = path.join(__dirname, '..', 'manifest');

exports.renderHtml = (args, callback) => {
    let ts = Date.now();
    let filepath = path.join(MANIFEST_DIR, args.content ? 'manifest' + ts + '.json' : 'manifest.json');

    async.waterfall([
        fn => remove(BASE_DIR, fn),
        fn => remove(MANIFEST_DIR, fn),
        fn => {
            if (!args.content)
                return fn();

            fs.writeFile(filepath, args.content, 'utf-8', fn);
        },
        fn => fs.readFile(filepath, 'utf-8', fn),
        (manifest, fn) => {
            let data = JSON.parse(manifest);
            copyFile(data.site.templateCode, err => {
                if (err)
                    return fn('生成文件失败');

                fn(null, data);
            });
        },
        (data, fn) => {
            async.eachSeries(data.sequence, (row, eachFn) => {
                let sourceFile = path.join(CURRENT_DIR, data.site.templateCode, row.template);
                if (!row.dataSource) {
                    let targetFile = path.join(BASE_DIR, row.template.replace('.ejs', '.html'));;
                    render(sourceFile, targetFile, data, eachFn);
                } else {
                    async.eachSeries(data[row.dataSource], (item, nextFn) => {
                        let targetFile = path.join(BASE_DIR, item.link);
                        item.site = data.site;
                        render(sourceFile, targetFile, item, nextFn);
                    }, eachFn);
                }
            }, fn);
        }
    ], callback);
};


function render(sourceFile, targetFile, data, callback) {
    async.waterfall([
        fn => {
            ejs.renderFile(sourceFile, {
                data: data
            }, fn);
        },
        (str, fn) => fs.writeFile(targetFile, str, 'utf-8', fn)
    ], err => callback(err));
}

function remove(folderpath, callback) {
    async.waterfall([
        fn => fs.readdir(folderpath, fn),
        (filename, fn) => {
            async.eachSeries(filename, (file, eachFn) => {
                if (file == 'manifest.json')
                    return eachFn();

                let filepath = path.join(folderpath, file);
                fs.stat(filepath, (err, stats) => {
                    if (err)
                        return eachFn('删除文件失败');

                    if (stats.isDirectory()) {
                        remove(filepath, eachFn);
                    } else {
                        fs.unlink(filepath, eachFn);
                    }
                });
            }, fn);
        }
    ], callback);
}

function copyFile(template, callback) {
    let folders = ['css', 'iconfont', 'images', 'js'];
    async.eachSeries(folders, (folder, eachFn) => {
        let cpFolderpath = path.join(CURRENT_DIR, template, folder);
        let cpFilepath = path.join(BASE_DIR, folder);
        async.waterfall([
            fn => fs.readdir(cpFolderpath, fn),
            (files, fn) => {
                async.eachSeries(files, (file, nextFn) => {
                    let sfile = path.join(cpFolderpath, file);
                    let tfile = path.join(cpFilepath, file);
                    fs.copyFile(sfile, tfile, nextFn);
                }, fn);
            }
        ], eachFn);
    }, callback);
}