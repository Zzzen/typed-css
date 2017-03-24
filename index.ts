import * as webpack from 'webpack';
import * as path from 'path';

import { readFile, writeFile } from './utils';

export function PluginCtor() {
    this.startTime = Date.now();
    this.prevTimeStamps = {};


    this.apply = (compiler: webpack.Compiler) => {
        compiler.plugin('emit', async (compilation: any, callback: () => {}) => {
            const changedFiles: string[] = Object.keys(compilation.fileTimestamps).filter((watchfile: any) => {
                return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
            });

            const changedStyles = changedFiles.filter(file => /\.less|css$/.test(file));

            Promise.all(changedStyles.map((style) => {
                const dirname = path.dirname(style);
                const basename = path.basename(style);

                return readFile(style).then(content => {
                    const newPath = path.join(dirname, basename + '.d.ts');
                    const output = emit(scanner(content));
                    return writeFile(newPath, output)
                }).catch(err => console.error('typed css: ', err));
            })).then(() => {
                this.prevTimestamps = compilation.fileTimestamps;
                callback();
            });
        })
    }
}

const LOCAL = 'local';

export default function scanner(input: string) {
    let pos = 0;
    let localSelectors: string[] = [];

    while (pos < input.length) {
        switch (input[pos]) {
            // skip comments
            case '/':
                const nextChar = input[pos + 1];
                if (nextChar === '/') {
                    // comment starts
                    pos += 2;
                    while (!isLineEnd(input[pos])) {
                        pos++;
                    }
                    pos++;
                } else if (nextChar === '*') {
                    pos += 2;
                    while (!(input[pos] === '*' && input[pos + 1] === '/')) {
                        pos++;
                    }
                    // pos is at next begin char
                    pos += 2;
                }
                pos++;
                continue;
            // skip strings
            case '\'':
            case '"':
                pos = skipString(input[pos], input, pos);
                continue;
            case ':':
                // skip space
                do {
                    pos++;
                } while (input[pos] === ' ');
                // while (input[++pos] === ' ') { }
                if (input.substr(pos, LOCAL.length) === LOCAL) {
                    let leftParenthesisPos = pos + LOCAL.length;
                    while (input[leftParenthesisPos] !== '(') {
                        leftParenthesisPos++;
                    }
                    let rightParenthesisPos = leftParenthesisPos + 1;
                    while (input[rightParenthesisPos] !== ')') {
                        rightParenthesisPos++;
                    }
                    localSelectors.push(input.substring(leftParenthesisPos + 1, rightParenthesisPos).trim());
                    pos++;
                }
                continue;
            default:
                pos++;
                continue;

        }
    }

    return localSelectors;
}

function isLineEnd(char: string) {
    return char === '\n' || char === '\r';
}

function skipString(quote: string, input: string, pos: number): number {
    do {
        pos++;
    } while (input[pos] !== quote && !isLineEnd(input[pos]));
    return ++pos;
}

export function emit(selectors: string[]) {
    const normalized = selectors.map(str => str.substr(1));
    return normalized.filter(className => /[_a-zA-Z]+[_a-zA-Z0-9]*/.test(className))
        .map(selector => `export var ${selector}: string;`).join('\n');
}