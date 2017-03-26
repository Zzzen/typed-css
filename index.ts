import * as webpack from 'webpack';
import * as path from 'path';

import { readFile, writeFile, getFilenameWithoutExtension, scanner, emit } from './utils';

const noop = (...args: any[]) => {};

export = function PluginCtor(options?: { reserveExtension: boolean }) {
    this.startTime = Date.now();
    this.prevTimeStamps = {};
    this.isFirstTime = true;

    this.apply = (compiler: webpack.Compiler) => {
        const extensions = compiler.options.resolve.extensions;
        let reserveExtension = true;
        // try to determine from webpack configuration
        if (extensions.includes('.css') || extensions.includes('.less')) {
            reserveExtension = false;
        }
        // users are always right
        if (typeof options === 'object' && typeof options.reserveExtension === 'boolean') {
            reserveExtension = options.reserveExtension;
        }

        compiler.plugin('compilation', (compilation: any, callback: () => void) => {
            const changedFiles: string[] = Object.keys(compilation.fileTimestamps).filter((watchfile: string) => {
                return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
            });

            const changedStyles = changedFiles.filter(file => /\.less|\.css$/.test(file));

            Promise.all(changedStyles.map((style) => {
                return generateDefinitionFile(style, reserveExtension);
            })).catch(noop).then(() => {
                this.prevTimestamps = compilation.fileTimestamps;
                callback();
            });
        })

        compiler.plugin('emit', (compilation: any, callback: () => void) => {
            if (!this.isFirstTime) {
                callback();
                return;
            }
            this.isFirstTime = false;
            const promises = (compilation.chunks as Array<{ modules: Array< {fileDependencies: string[]} >} >)
                .map(chunk => chunk.modules).reduce((prev, curr) => prev.concat(curr), [])
                .map(module => module.fileDependencies).reduce((prev, curr) => prev.concat(curr), [])
                .filter(file => /\.less|\.css$/.test(file))
                .map(file => generateDefinitionFile(file, reserveExtension));

            Promise.all(promises).catch(noop).then(() => {
                callback();
                // trigger another compilation
                (compiler as any).compile(noop);
            });
        })
    }
}

function generateDefinitionFile(filepath: string, reserveExtension: boolean) {
    const dirname = path.dirname(filepath);
    const basename = path.basename(filepath);
    const filename =  getFilenameWithoutExtension(basename) + ( reserveExtension ? `${path.extname(filepath)}` : '' );

    return readFile(filepath).then(content => {
        const newPath = path.join(dirname, filename + '.d.ts');
        const output = emit(scanner(content));
        return writeFile(newPath, output);
    }).catch(err => console.error('typed css error: ', err));
}