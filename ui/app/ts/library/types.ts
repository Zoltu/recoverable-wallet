export type HexAddress = `0x${string}`
export type HexData = `0x${string}`

export type ObjectTupleToValueArray<T extends readonly [...readonly {}[]], K extends keyof T[number]> = { readonly [Key in keyof T]: T[Key][K] }
export type ObjectUnionToKeyedObjectUnion<T extends {}, K extends keyof T> = T extends {} ? T[K] extends PropertyKey ? { [_ in T[K]]: T } : never : never
export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never
