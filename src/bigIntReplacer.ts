// Stringify BigInt using the replacer
// const jsonBigInteger = JSON.stringify(bigInteger, bigIntReplacer);
// Parse from JSON
// const fromJsonBigInteger = JSON.parse(jsonBigInteger, bigIntReviver);

export function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }
  return value;
}
