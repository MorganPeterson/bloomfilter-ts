import BloomFilter from '../src/index'

const qbf = 'The quick brown fox jumped over the lazy dog'

test('basic', () => {
  const f = new BloomFilter(1000, 4)
  const n1 = "car"
  const n2 = "automobile"
  f.add(n1)
  expect(f.test(n1)).toBeTruthy()
  expect(f.test(n2)).toBeFalsy()
})

test('BloomFilter from Array<number>', () => {
  const k = 3
  const f = new BloomFilter(4096, k)
  for (let i = 256; i--;) f.add(i)
  const array = [].slice.call(f.buckets)
  const b = new BloomFilter(array, k)
  expect(b.buckets).toEqual(f.buckets)
})

test('throw error', () => {
  const f = new BloomFilter(1000, 4)
  expect(f.add).toThrow('add argument must be a number or a string')
  expect(f.test).toThrow('test argument must be a number or a string')
})

test('quick brown fox', () => {
  const f = new BloomFilter(90, 4)
  const n1 = qbf
  const n2 = qbf + '\n'
  f.add(n1)
  expect(f.test(n1)).toBeTruthy()
  expect(f.test(n2)).toBeFalsy()
})

test('basic uint32', () => {
  const f = new BloomFilter(1000, 4)
  const n1 = '\u0100'
  const n2 = '\u0101'
  const n3 = '\u0102'
  f.add(n1)
  expect(f.test(n1)).toBeTruthy()
  expect(f.test(n2)).toBeFalsy()
  expect(f.test(n3)).toBeFalsy()
})

test('a-b-c', () => {
  const f = new BloomFilter(20, 10)
  f.add('abc')
  expect(f.test('xyz')).toBeFalsy()
})

test('integer types', () => {
  const f = new BloomFilter(1000, 4)
  f.add(1)
  expect(f.test(1)).toBeTruthy()
  expect(f.test(2)).toBeFalsy()
})

test('size', () => {
  const f = new BloomFilter(1000, 4)
  for (let i = 0; i < 100; ++i) f.add(i)
  expect(f.size()).toBeGreaterThanOrEqual(94)
  expect(f.size()).toBeLessThanOrEqual(100)
  for (let i = 0; i < 1000; ++i) f.add(i)
  expect(f.size()).toBeGreaterThanOrEqual(900)
  expect(f.size()).toBeLessThanOrEqual(1000)
})

test('rate', () => {
  const f = new BloomFilter(4096, 3)
  const init = 123456
  expect(f.rate()).toEqual(0)
  for (let i = 32; i--;) f.add(init+i)
  expect(f.rate()).toBeCloseTo(0.00002)
  for (let i = 64; i--;) f.add(init+i)
  expect(f.rate()).toBeCloseTo(0.0001)
  for (let i = 128; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.0008)
  for (let i = 256; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.006)
  for (let i = 512; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.032)
  for (let i = 1024; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.15)
  for (let i = 2048; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.47, 1)
  for (let i = 4096; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(0.86)
  for (let i = 4096*2; i--;) f.add(init+i);
  expect(f.rate()).toBeCloseTo(1, 1)
})

test('buffer', () => {
  const k = 3
  const f = new BloomFilter(4096, k)
  for (let i = 256; i--;) f.add(i)
  const b = f.fromBuffer(f.toBuffer(), k)
  expect(b.equal(f)).toBeTruthy()
  b.add(4096)
  expect(b.equal(f)).toBeFalsy()
})
