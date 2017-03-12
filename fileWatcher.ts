import * as fs from 'fs';
import * as pathModule from 'path';

const watchedFiles = {} as {
    [path: string]: fs.FSWatcher;
}

function isDirectory(path: string) {
    return new Promise<boolean>((resolve, reject) => {
        fs.stat(path, (err, stat) => {
            if (err) {
                reject(err);
            } else {
                resolve(stat.isDirectory());
            }
        });
    })
}

function readDir(path: string) {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        })
    })
}

async function fileExist(path: string) {
    return fs.existsSync(path);
}

export async function watchRecursively(path: string) {
    if (!watchedFiles[path]) {
        watchedFiles[path] = fs.watch(path, ev => onFileChange(ev, path)).on('error', function (code, signal) { this.close(); });
    }

    if (await isDirectory(path)) {
        const files = await readDir(path);
        files.forEach(async filename => {
            const childPath = pathModule.join(path, filename);
            watchRecursively(childPath);
        })
    }
}

async function onFileChange(ev: string, path: string) {
    if (!fileExist(path)) {
        watchedFiles[path].close();
        delete watchedFiles[path];
        console.log(`${path} is removed`);
    } else {
        watchRecursively(path);
    }
    console.log(`${path} --> ${ev}`);
}