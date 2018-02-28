#!/usr/bin/env node

const commander = require("commander");
const fs = require('fs');
const zlib = require('zlib')
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const adm_zip = require('adm-zip');
var h2m = require('h2m');

const imageSuffix = ['jpeg','jpg','png','gif','webp','tiff','bmp','tif'];

function convert(filepath, filetitle, createTime, outdir) {
    var path = require('path');
    var filename;
    if (filetitle.indexOf('.md') > 0) {
        filename = createTime.split(" ")[0] + "-" + filetitle;
    } else {
        filename = createTime.split(" ")[0] + "-" + filetitle + ".md";
    }
    var destPath = path.join(outdir, filename);
    
    var tmpName = '{' + path.basename(filepath) + '}'
    var realPath = path.join(path.dirname(filepath), tmpName);

    if (fs.existsSync(realPath) && fs.statSync(realPath).isFile()) {
       var unzip = new adm_zip(realPath);
       // 创建index_files资源图片存放目录
       var indexFilesPath = path.join(outdir, 'index_files');
       if (!fs.existsSync(indexFilesPath) || !fs.statSync(indexFilesPath).isDirectory()) {
           fs.mkdirSync(indexFilesPath);
       }
       var entries = unzip.getEntries();
       entries.forEach(function(entry) {
           // 将index.html转换成markdown格式，将index_files目录文件拷贝到输出目录中的images中
           if (entry.entryName == 'index.html') {
               var dochtml = entry.getData();
               let indexOfBody = dochtml.indexOf('<body');
               let lastIndexOfBody = dochtml.lastIndexOf('</body');
               var html = dochtml.slice((indexOfBody + 5), lastIndexOfBody);
               // 这么做是查找body标签的'>'符号保证body完全去除
               var tmpIndex = html.indexOf('>');
               html = html.slice(tmpIndex + 1);
               var md = h2m(html);
               fs.writeFile(destPath, md);
           } else if (entry.entryName.startsWith('index_files')) {
               var entryFileRealName = entry.name;
               var suffix = entryFileRealName.split('.')[1];
               // 判断后缀名为图片的则转存
               var index = imageSuffix.indexOf(suffix);
               if (index >= 0) {
                    var zipfilename = entry.name;
                    fs.writeFile(path.join(indexFilesPath, zipfilename), entry.getData());
               }
           }
       });
    }
}

function main() {
    // 解析命令行参数
    commander
        .version('0.0.1')
        .usage('<-f string> <-w string -u string -o string>')
        .option('-f, --file [path]', '指定配置文件')
        .option('-w, --wizhome [path]', '为知笔记数据目录')
        .option('-u, --username [ value]', '为知笔记登录账户名')
        .option('-o, --outdir [path]', '转换后的markdown文档输出目录')
        .parse(process.argv);
    
    var wizhome;
    var wizusername;
    var outdir;
    if (commander.file != undefined) {
        
        if (fs.existsSync(commander.file) && fs.statSync(commander.file).isFile()) {
            var config = require(commander.file);
            wizhome = config.wizhome;
            wizusername = config.username;
            outdir = config.outdir;
        } else {
            console.log('config file path not found.');
            return;
        }
    } else {
        if (commander.wizhome == undefined
            || commander.username == undefined
            || commander.outdir == undefined) {
                commander.help();
                return;
        } else {
            wizhome = commander.wizhome;
            wizusername = commander.username;
            outdir = commander.outdir;
        }
    }
    if (wizhome == undefined || wizusername == undefined || outdir == undefined) {
        commander.help();
        return;
    }

    let userDataDir = path.join(wizhome, wizusername, 'data');
    if (!fs.existsSync(userDataDir) || !fs.statSync(userDataDir).isDirectory()) {
        console.log('wiznote user data dir not found! userDataDir:%s', userDataDir);
        throw new Error('wiznote user data dir not found!');
    }
    let indexDbPath = path.join(userDataDir, 'index.db');
    if (!fs.existsSync(indexDbPath) || !fs.statSync(indexDbPath).isFile()) {
        console.log("wiznote user data dir index.db not found! Can't convert html to markdown. indexDbPath:" + indexDbPath);
        throw new Error("wiznote user data dir index.db not found! Can't convert html to markdown.");
    }
    let notesPath = path.join(userDataDir, 'notes');
    if (!fs.existsSync(notesPath) || !fs.statSync(notesPath).isDirectory()) {
        console.log("wiznote user data notes dir not found! notesPath:" + notesPath);
        throw new Error("wiznote user data notes dir not found!");
    }
    //  || !fs.statSync(outdir).isDirectory()
    if (!fs.existsSync(outdir) || !fs.statSync(outdir).isDirectory()) {
        fs.mkdirSync(outdir);
    }

    // 读取index.db中的数据
    var db = new sqlite3.Database(indexDbPath, sqlite3.OPEN_READONLY);
    var sql = "SELECT `DOCUMENT_GUID`, `DOCUMENT_TITLE`, `DT_CREATED` FROM `WIZ_DOCUMENT`";
    db.all(sql, function(err, rows) {
        if (err != null) {
            db.close();
            throw err;
        }
        rows.forEach(function (row) {
            let filename = row.DOCUMENT_GUID;
            let filepath = path.join(notesPath, filename);
            let filetitle = row.DOCUMENT_TITLE;
            let createTime = row.DT_CREATED;
            convert(filepath, filetitle, createTime, outdir);
        });
    });
    db.close();
}

main();