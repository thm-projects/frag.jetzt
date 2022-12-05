use quadtree::{Number, QuadTreeElement, QuadTree, AxisAlignedBoundingBox, QuadTreeSpecifications};
use wasm_bindgen::prelude::*;

mod quadtree;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}


pub struct temp<T: Number>(T);

impl<T: Number> Clone for temp<T> {
    fn clone(&self) -> Self {
        temp(self.0)
    }
}

impl<T: Number> QuadTreeElement<T> for temp<T> {
    fn collidesWithTree(&self, container: AxisAlignedBoundingBox<T>) -> bool {
        self.0 == container.x
    }
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
    let tree: QuadTree<f32, temp<f32>> = QuadTree::new(
        AxisAlignedBoundingBox::new(-960f32, -540f32, 1920f32, 1080f32),
        QuadTreeSpecifications::new(5, 3, 4),
        0
    );
}