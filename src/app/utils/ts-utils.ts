type ArrayLength<A extends Array<unknown>> = A['length'] extends infer T ? T : never;
type StringToArray<S extends string, A extends Array<string> = []> =
  S extends `${infer First}${infer Remaining}` ? StringToArray<Remaining, [...A, First]> : A;
type StringLength<A extends string> = ArrayLength<StringToArray<A>>;

type EnumerationArray<N extends number, A extends Array<number> = []> =
  A['length'] extends infer T ? N extends T ? A : EnumerationArray<N, [A['length'], ...A]> : never;
type Enumerate<N extends number> = EnumerationArray<N> extends (infer E)[] ? E : never;
type NumberRange<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;

type IsNegativeInteger<T extends number> =
  `${T}` extends `-${string}` ? (`${T}` extends `${string}.${string}` ? never : T) : never;

type FixedSizeArrayBuilder<T extends any[], L extends number> =
  T['length'] extends L ? T : (T extends (infer R)[] ? FixedSizeArrayBuilder<[R, ...T], L> : never);
export type FixedSizeArray<T, L extends number> = L extends 0 | IsNegativeInteger<L> ? [] : FixedSizeArrayBuilder<[T], L>;

export type StringOfLength<Min, Max> = string & {
  readonly __TYPE__: unique symbol;
  readonly __MIN__: Min;
  readonly __MAX__: Max;
};

export const assertStringLength = <Min extends number, Max extends number>(str: string, min: Min, max: Max): StringOfLength<Min, Max> => {
  console.assert(str.length >= min && str.length <= max,
    `String "${str}"(${str.length}) is not between ${min} and ${max}`);
  return str as StringOfLength<Min, Max>;
};

export type HasStringLength<MIN extends number, MAX extends number, S extends string> =
  StringLength<S> extends infer Count ? Count extends NumberRange<MIN, MAX> ? true : false : false;

export type MakeUnique<T> = T & { readonly __TYPE__: unique symbol };

export type JSONString = MakeUnique<string>;

export type Immutable<T> = T extends { [key: string | number | symbol]: any } ? {
  +readonly [P in keyof T]: Immutable<T[P]>;
} : T;

export type Mutable<T> = T extends { [key: string | number | symbol]: any } ? {
  -readonly [P in keyof T]: Mutable<T[P]>;
} : T;

export const clone = <T>(elem: T): Mutable<T> => {
  if (Array.isArray(elem)) {
    return elem.map(e => clone(e)) as unknown as Mutable<T>;
  } else if (typeof elem === 'object') {
    return Object.keys(elem).reduce((acc, e) => {
      acc[e] = clone(elem[e]);
      return acc;
    }, {} as any);
  }
  return elem as Mutable<T>;
};

export type TimeoutHelper = Parameters<typeof clearTimeout>[0];