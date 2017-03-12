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
                }while(input[pos] === ' ');
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
    return normalized.filter(selector => /[_a-zA-Z]+[_a-zA-Z0-9]*/.test(selector.substr(1)))
        .map(selector => `export var ${selector}: string;`).join('\n');
}