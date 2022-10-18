// The entry file of your WebAssembly module.

import { AxisAlignedBoundingBox, QuadTree, QuadTreeSpecifiactions } from "./quadtree";

export function add(a: i32, b: i32): i32 {
  const t: QuadTree<u32, u32> = new QuadTree(() => true, new AxisAlignedBoundingBox(0, 0, 100, 100), new QuadTreeSpecifiactions(3))
  return a + b;
}
