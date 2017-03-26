import { test } from 'ava';
import { scanner, emit } from './utils';

test('should return an empty array when there is no local selector', t => {
    const input = '.red{ color: red; }';
    t.deepEqual(scanner(input), []);
})

test('should skip comments', t => {
    const input = `
/**
 * :local(.wrong) {}
 */

:local( .a ) {
    color: red;  // balabala :local(.b)
}`;
    t.deepEqual(scanner(input), ['.a']);
})

test('should skip strings', t => {
    const input = `
.foo:before{
    content: ':local(.bar)';
}
`
    t.deepEqual(scanner(input), []);
})

test('should generate multiple selectors', t => {
    const input = `
:local(.foo) {
    // ...
}
:local(.bar) {
    // ...
}
/**
 * :local(.baz) {
 *      // ...
 * }
 */
`;
    t.deepEqual(scanner(input), ['.foo', '.bar']);
})

test('should emit definition file', t => {
    const input = `:local(.bar) {} :local(.baz) { color: blue; }`;
    t.deepEqual(emit(scanner(input)), 'export var bar: string;\nexport var baz: string;');
})