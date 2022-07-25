/*
 * Multiply our fnv hash to help prevent collisions.
 * a * 16777619 mod 2**32
 */
const fnv_multiply = (a: number): number => {
  return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24)
}

/*
 * Modified FNV hash function
 * See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
 */
const fnv_mix = (a: number): number => {
  a += a << 13
  a ^= a >>> 7
  a += a << 3
  a ^= a >>> 17
  a += a << 5
  return a & 0xffffffff
}

/*
 * Fowler/Noll/Vo hashing.
 * Nonstandard variation: this function optionally takes a seed value that is incorporated
 * into the offset basis. According to http://www.isthe.com/chongo/tech/comp/fnv/index.html
 * "almost any offset_basis will serve so long as it is non-zero".
 */
const fnv_1a = (v: string, seed: number = 0): number => {
  let a: number = 2166136261 ^ seed
  for (let i = v.length; i--;) {
    const c = v.charCodeAt(i)
    const d = c & 0xff00

    if (d) a = fnv_multiply(a ^ d >> 8)

    a = fnv_multiply(a ^ c & 0xff)
  }
  return fnv_mix(a)
}

/**
 * Count bits in the set.
 * http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
 */
const popcnt = (v: number): number => {
  v -= (v >> 1) & 0x55555555
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333)
  return ((v + (v >> 4) & 0xf0f0f0f) * 0x1010101) >> 24
}

export { popcnt, fnv_1a }
