// The entry file of your WebAssembly module.

import {
  AxisAlignedBoundingBox,
  QuadTree,
  QuadTreeSpecifications,
} from './quadtree';
import { findBestPlace, WordCloudTopic } from './word-cloud-placing';

export function calculateWordCloudPlacing(
  boundsArray: Float32Array
): Float32Array {
  const width = boundsArray[0];
  const height = boundsArray[1];
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const aspectRatio = width / height;
  const tree = new QuadTree<f32, WordCloudTopic>(
    (box, topic) => topic.collideSAT(box),
    new AxisAlignedBoundingBox(-halfWidth, -halfHeight, width, height),
    new QuadTreeSpecifications(3)
  );
  const length = (boundsArray.length - 2) / 3;
  const placed = new StaticArray<WordCloudTopic>(length);
  for (let i = 0, placeIndex = 0; i < length; i++) {
    const k = i * 3 + 2;
    const newTopic = new WordCloudTopic(
      boundsArray[k],
      boundsArray[k + 1],
      boundsArray[k + 2]
    );
    findBestPlace(placeIndex, newTopic, placed, tree, aspectRatio);
    const pos = newTopic.position;
    if (pos === null) {
      boundsArray[k] = 0;
      boundsArray[k + 1] = 0;
      continue;
    }
    placed[placeIndex++] = newTopic;
    const mid = pos.mid;
    boundsArray[k] = mid.getDirectionX() + halfWidth;
    boundsArray[k + 1] = -mid.getDirectionY() + halfHeight;
  }
  return boundsArray;
}

export const Float32Array_ID = idof<Float32Array>();
