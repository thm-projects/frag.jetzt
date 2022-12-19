use std::{rc::Rc, cell::RefCell};

use wasm_bindgen::prelude::*;
use wordCloudPlacing::{
    findBestPlace,
    quadtree::{AxisAlignedBoundingBox, QuadTree, QuadTreeSpecifications, Vector2},
    WordCloudObstacle, WordCloudTopic,
};

mod wordCloudPlacing;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    pub fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

#[wasm_bindgen]
pub fn calc_word_cloud(data: &mut [f32]) {
    console_error_panic_hook::set_once();
    let width = data[0];
    let height = data[1];
    let halfWidth = width / 2f32;
    let halfHeight = height / 2f32;
    let aspect_ratio = width / height;
    let mut tree = QuadTree::new(
        AxisAlignedBoundingBox::new(-halfWidth, -halfHeight, width, height),
        Rc::new(QuadTreeSpecifications::new(5, 3, 4)),
        0,
    );
    let collObjectsSize = data[2] as usize;
    for i in 0..collObjectsSize {
        tree.addElement(Rc::new(RefCell::new(WordCloudObstacle::<f32>::new(
            data[i * 4 + 3],
            data[i * 4 + 4],
            data[i * 4 + 5],
            data[i * 4 + 6],
        ))));
    }
    let offset = 3 + collObjectsSize * 4;
    let length = (data.len() - offset) / 3;
    let mut placed: Vec<Rc<RefCell<WordCloudTopic<f32>>>> = vec![];
    log(&format!("Length: {}", length));
    for i in 0..length {
        log(&i.to_string());
        let k = i * 3 + offset;
        let topic = Rc::new(RefCell::new(WordCloudTopic::new(data[k], data[k + 1], data[k + 2])));
        findBestPlace(
            Rc::clone(&topic),
            &placed,
            &mut tree,
            aspect_ratio,
        );
        let borrowed_topic = topic.borrow();
        if borrowed_topic.place.is_none() {
            data[k] = -1f32;
            continue;
        }
        placed.push(Rc::clone(&topic));
        let mid = borrowed_topic.place.as_ref().unwrap().mid.clone();
        data[k] = mid.length();
        data[k + 1] = getAngle(mid);
    }
}

pub fn getAngle(vec2: Vector2<f32>) -> f32 {
    f32::atan2(-vec2.get_x(), vec2.get_y())
}
