import { Bits32, HashFuncSeed } from './constants'
import { popcnt, fnv_1a } from './utils'

type LocationsType = Uint8Array | Uint16Array | Uint32Array

/**
 * Creates a new bloom filter.  If *m* is an array-like object, with a length
 * property, then the bloom filter is loaded with data from the array, where
 * each element is a 32-bit integer.  Otherwise, *m* should specify the
 * number of bits.  Note that *m* is rounded up to the nearest multiple of
 * 32.  *k* specifies the number of hashing functions.
 * @returns BloomFilter - new instance of BloomFilter class
 *
 * @param m - size of bucket in bits
 * @param k - number of hashing arrays
 * @returns A new BloomFilter
 *
 * @example Creating a new BloomFilter
 * ```ts
 * const f = new BloomFilter(4096, 3)
 *```
 *
 * @example Creating a new BloomFilter from previous params
 * ```ts
 * const f = new BloomFilter([1, 2, 3], 3)
 * ```
 * @public
 */
export default class BloomFilter {
  m: number // bits
  k: number // number of hashing arrays
  buckets: Int32Array
  _locations: LocationsType

  constructor(m: number|Array<number>, k: number) {
    let a: Array<number>

    if (typeof m !== 'number') {
      if (m.constructor !== Array) {
        throw new Error('m must be a number or Array<number>')
      }
      a = m
      m = a.length * Bits32
    }

    let n = Math.ceil(m / Bits32)
    let i = -1

    this.m = m = n * Bits32
    this.k = k

    const kbytes = 1 << Math.ceil(Math.log(Math.ceil(Math.log(m) / Math.LN2 / 8)) / Math.LN2)
    const array = kbytes === 1 ? Uint8Array : kbytes === 2 ? Uint16Array : Uint32Array
    const kbuffer = new ArrayBuffer(kbytes * k)
    const buckets = this.buckets = new Int32Array(n)

    if (a) while (++i < n) buckets[i] = a[i]
      this._locations = new array(kbuffer)
  }

  /*
   * Produces a *n* number of hash functions in one call.
   * See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
   */
  private locations(v: string): LocationsType {
    const k = this.k
    const m = this.m
    const r = this._locations
    const a = fnv_1a(v)
    const b = fnv_1a(v, HashFuncSeed)
    let x = a % m
    for (let i = k; i--;) {
      r[i] = x < 0 ? (x + m) : x
      x = (x + b) % m
    }
    return r
  }

  private append<Type>(v: Type): void {
    const l = this.locations(`${v}`)
    const k = this.k
    const buckets = this.buckets
    for (let i = k; i--;) buckets[l[i]>>5] |= 1 << (l[i] % Bits32)
  }

  /**
   * Adds a string or a number to the bucket of values.
   *
   * @param v - adds a number or a string to the filter
   *
   * @example
   * ```ts
   * const f = new BloomFilter(4096, 3)
   * f.add('hello')
   * f.add(10)
   * ```
   */
  public add(v: number|string): void {
    switch(typeof(v)) {
      case "number":
        this.append<number>(v)
        break
      case "string":
        this.append<string>(<string>v)
        break
      default: throw new Error('add argument must be a number or a string')
    }
  }

  private tester<Type>(v: Type): boolean {
    const l = this.locations(`${v}`)
    const k = this.k
    const buckets = this.buckets
    for (let i = k; i--;) {
      const b = l[i]
      if ((buckets[b>>5] & (1 << (b % Bits32))) === 0) {
        return false
      }
    }
    return true
  }

  /**
   * Test a string or a number against the bucket of values.
   *
   * @param v - adds a number or a string to the filter
   * @returns True/False if *v* is in the filter
   *
   * @example
   * ```ts
   * const f = new BloomFilter(4096, 3)
   * f.add('hello')
   * f.add(10)
   *
   * const testStr: boolean = f.test('goodbye') // false
   * const testNum: boolean = f.test(10) // true
   *```
   */
  public test(v: number|string): boolean {
    switch(typeof(v)) {
      case "number": return this.tester<number>(v)
      case "string": return this.tester<string>(<string>v)
      default: throw new Error('test argument must be a number or a string')
    }
  }

  /**
   * Get number of bits in filter.
   *
   * @returns Number of bits in filter
   */
  private bits(): number {
    const buckets: Int32Array = this.buckets
    let bits: number = 0
    for (let i = buckets.length; i--;) bits += popcnt(buckets[i])
    return bits
  }

  /**
   * Get the Estimated cardinality of the filter.
   *
   * @returns Size of filter
   *
   * @example
   * ```ts
   * const f = BloomFilter(4096, 3)
   *
   * f.add(10)
   * const x: number = f.size()
   * ```
   */
  public size(): number {
    return -this.m * Math.log(1 - this.bits() / this.m) / this.k
  }

  /**
   * Get estimated false-positive rate.
   *
   * @returns Rate at which a false-positive is detected
   *
   * @example
   * const f = BloomFilter(4096, 3)
   * const x: number = f.rate()
   */
  public rate(): number {
    return Math.pow(this.bits()/this.m, this.k)
  }

  /**
   * Creates a new BloomFilter from a buffer loaded from elsewhere.
   *
   * @param buffer - A nodejs Buffer
   * @param k - number of hash functions
   * @returns A new BloomFilter
   */
  public fromBuffer(buffer: Buffer, k: number): BloomFilter {
    const filter = new BloomFilter(buffer.length * 8, k)
    for (let i = filter.buckets.length; i--;) {
      filter.buckets[i] = buffer.readIntLE(i*4, 4)
    }
    return filter
  }

  /**
   * Exports filter to a Buffer object.
   *
   * @returns A new Buffer
   */
  public toBuffer(): Buffer {
    return Buffer.from(this.buckets.buffer)
  }

  /**
   * Compares BloomFilter objects for equality.
   *
   * @param that - Another BloomFilter object to compare against.
   *
   * @returns True/False
   */
  public equal(that: BloomFilter): boolean {
    return Buffer.compare(this.toBuffer(), that.toBuffer()) === 0
  }
}

