import * as fs from 'fs';

export function readFile(path: string) {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

export function writeFile(path: string, data: string) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(path, data, 'utf8', err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function getFilenameWithoutExtension(filename: string) {
    const end = filename.lastIndexOf('.');
    return filename.substring(0, end);
}