import { assert } from 'chai';
import { bigIntReplacer } from '../src/bigIntReplacer';

describe('bigIntReplacer', () => {
  it('should convert BigInt to string with "n" suffix', () => {
    // Test with small BigInt value
    const smallBigInt = BigInt(123);
    assert.equal(bigIntReplacer('test', smallBigInt), '123n', 'Should convert small BigInt to string with "n" suffix');

    // Test with large BigInt value
    const largeBigInt = BigInt('9007199254740991');
    assert.equal(
      bigIntReplacer('test', largeBigInt),
      '9007199254740991n',
      'Should convert large BigInt to string with "n" suffix'
    );

    // Test with negative BigInt
    const negativeBigInt = BigInt(-42);
    assert.equal(
      bigIntReplacer('test', negativeBigInt),
      '-42n',
      'Should convert negative BigInt to string with "n" suffix'
    );
  });

  it('should return non-BigInt values unchanged', () => {
    // Test with string
    assert.equal(bigIntReplacer('test', 'hello'), 'hello', 'Should return strings unchanged');

    // Test with number
    assert.equal(bigIntReplacer('test', 42), 42, 'Should return numbers unchanged');

    // Test with null
    assert.equal(bigIntReplacer('test', null), null, 'Should return null unchanged');

    // Test with object
    const obj = { foo: 'bar' };
    assert.deepEqual(bigIntReplacer('test', obj), obj, 'Should return objects unchanged');

    // Test with array
    const arr = [1, 2, 3];
    assert.deepEqual(bigIntReplacer('test', arr), arr, 'Should return arrays unchanged');
  });

  it('should correctly handle BigInt in nested objects when used with JSON.stringify', () => {
    const testObj = {
      regular: 42,
      big: BigInt(9007199254740991),
      nested: {
        big: BigInt(123),
      },
    };

    const serialized = JSON.stringify(testObj, bigIntReplacer);
    const expected = '{"regular":42,"big":"9007199254740991n","nested":{"big":"123n"}}';

    assert.equal(serialized, expected, 'Should correctly replace BigInt in nested objects');
  });
});
