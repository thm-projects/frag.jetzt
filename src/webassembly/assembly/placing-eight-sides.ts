import { Vector2, WordCloudTopic } from './word-cloud-placing';

// sexagon
class CollideBox {
private readonly minUp: f32;
private readonly maxUp: f32;
private readonly minRight: f32;
private readonly maxRight: f32;
  constructor(
    private readonly midPoint: 
  ) {}
}

const placeOnSide = () => {

};

export const tryPlaceOnEightSides = (
  topic: WordCloudTopic,
  newTopic: WordCloudTopic
) => {
  let rot = topic.rotation + newTopic.rotation;
  if (rot > 360) rot -= 360;
  const rotIndex: usize = rot / 4;
  const offY = newTopic.normalUp.clone().scale(newTopic.height / 2);
  const offX = newTopic.normalRight.clone().scale(newTopic.width / 2);
  /*
    0----1
    |    |
    3----2
    */
  const arr = new StaticArray<Vector2>(8);
  arr[0] = offY.clone().scale(-1).subtract(offX); // 3 - rotIndex=0 => top offset
  arr[1] = newTopic.normalUp.clone().scale(-1); // - rotIndex=0 => top left offset
  arr[2] = offY.clone().subtract(offX); // 0 - rotIndex=0 => right offset
  arr[3] = newTopic.normalRight.clone().scale(-1); // - rotIndex=0 => top right offset
  arr[4] = offY.clone().add(offX); // 1 - rotIndex=0 => bottom offset
  arr[5] = newTopic.normalUp.clone(); // - rotIndex=0 => bottom right offset
  arr[6] = offY.clone().scale(-1).add(offX); // 2 - rotIndex=0 => left offset
  arr[7] = newTopic.normalRight.clone(); // - rotIndex=0 => bottom left offset
  const dirInfo = new StaticArray<Vector2>(4);
  const sizeInfo = new StaticArray<Vector2>(4);

  let index = rotIndex * 2;
  // top
  {
    const newMidPoint = topic.normalUp
      .clone()
      .scale(topic.height / 2)
      .add(topic.position.mid)
      .subtract(arr[index]);
  }
  index = (index + 1) % 8;
  // top left
  {
    const newMidPoint = topic.normalUp
      .clone()
      .scale(topic.height / 2)
      .add(topic.normalRight.clone().scale(-topic.width / 2))
      .add(topic.position.mid)
      .subtract(arr[index]);
    const tRange = topic.width / 2;
  }
  index = (index + 1) % 8;
  // right
  {
    const newMidPoint = topic.normalRight
      .clone()
      .scale(topic.width / 2)
      .add(topic.position.mid)
      .subtract(arr[index]);
    const tRange = topic.width / 2;
  }
  index = (index + 1) % 8;
  // top right
  {
    const newMidPoint = topic.normalRight
      .clone()
      .scale(topic.width / 2)
      .add(topic.normalUp.clone().scale(topic.height / 2))
      .add(topic.position.mid)
      .subtract(arr[index]);

  }
  index = (index + 1) % 8;
  // bottom
  {
    const newMidPoint = topic.normalUp
      .clone()
      .scale(-topic.height / 2)
      .add(topic.position.mid)
      .subtract(arr[index]);

  }
  index = (index + 1) % 8;
  // bottom right
  {
    const newMidPoint = topic.normalUp
      .clone()
      .scale(-topic.height / 2)
      .add(topic.normalRight.clone().scale(topic.width / 2))
      .add(topic.position.mid)
      .subtract(arr[index]);

  }
  index = (index + 1) % 8;
  // left
  {
    const newMidPoint = topic.normalRight
      .clone()
      .scale(-topic.width / 2)
      .add(topic.position.mid)
      .subtract(arr[index]);

  }
  index = (index + 1) % 8;
  // bottom left
  {
    const newMidPoint = topic.normalRight
      .clone()
      .scale(-topic.width / 2)
      .add(topic.normalUp.clone().scale(-topic.height / 2))
      .add(topic.position.mid)
      .subtract(arr[index]);

  }
};
