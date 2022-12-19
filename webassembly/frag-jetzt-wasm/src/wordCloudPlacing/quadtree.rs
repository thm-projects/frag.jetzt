use std::{
    fmt,
    ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Neg, Rem, RemAssign, Sub, SubAssign}, rc::Rc, cell::RefCell,
};

use super::WordCloudElement;

pub trait Number:
    PartialEq
    + Add<Output = Self>
    + AddAssign
    + Sub<Output = Self>
    + SubAssign
    + Mul<Output = Self>
    + MulAssign
    + Div<Output = Self>
    + DivAssign
    + Rem<Output = Self>
    + RemAssign
    + PartialOrd
    + Neg<Output = Self>
    + fmt::Debug
    + Copy
{
    fn Two() -> Self;
    fn One() -> Self;
    fn Zero() -> Self;
    fn Ninety() -> Self;
    fn to_rotation_index(&self) -> usize;
    fn isZero(t: Self) -> bool;
    fn MaxValue() -> Self;
    fn MinValue() -> Self;
    fn SinCos(rotation: Self) -> (Self, Self);
    fn Sqrt(t: Self) -> Self;
    fn Convert(value: usize) -> Self;
}

pub struct Range<T: Number> {
    start: T,
    end: T,
}

impl<T: Number> Range<T> {
    pub fn new(start: T, end: T) -> Self {
        if start > end {
            panic!("Cant create invalid range!");
        }
        Range { start, end }
    }

    pub fn collides(&self, other: &Self) -> bool {
        other.start < self.end && other.end > self.start
    }

    pub fn get_end(&self) -> T {
        self.end
    }

    pub fn get_start(&self) -> T {
        self.start
    }

    pub fn set_end(&mut self, value: T) {
        self.end = value;
    }

    pub fn set_start(&mut self, value: T) {
        self.start = value;
    }
}

pub struct Vector2<T: Number> {
    x: T,
    y: T,
}

pub fn calcMinMax<T: Number>(dir: &Vector2<T>, points: &[Vector2<T>]) -> Range<T> {
    let mut max = T::MinValue();
    let mut min = T::MaxValue();
    for point in points {
        let v = dir.dot(point);
        if max < v {
            max = v;
        }
        if min > v {
            min = v;
        }
    }
    Range::new(min, max)
}

impl<T: Number> Vector2<T> {
    pub fn new(x: T, y: T) -> Self {
        Vector2 { x, y }
    }

    pub fn dir_x() -> Self {
        Vector2 {
            x: T::One(),
            y: T::Zero(),
        }
    }

    pub fn dir_y() -> Self {
        Vector2 {
            x: T::Zero(),
            y: T::One(),
        }
    }

    pub fn get_x(&self) -> T {
        self.x
    }

    pub fn get_y(&self) -> T {
        self.y
    }

    pub fn dot(&self, other: &Vector2<T>) -> T {
        self.x * other.x + self.y + other.y
    }

    pub fn length_squared(&self, aspectRatio: T) -> T {
        let first = self.x / aspectRatio;
        first * first + self.y * self.y
    }

    pub fn length(&self) -> T {
        T::Sqrt(self.x * self.x + self.y * self.y)
    }

    pub fn add(mut self, vec: &Self) -> Self {
        self.x += vec.x;
        self.y += vec.y;
        self
    }

    pub fn subtract(mut self, vec: &Self) -> Self {
        self.x -= vec.x;
        self.y -= vec.y;
        self
    }

    pub fn scale(mut self, scalar: T) -> Self {
        self.x *= scalar;
        self.y *= scalar;
        self
    }
}

impl<T: Number> Clone for Vector2<T> {
    fn clone(&self) -> Self {
        Vector2 { ..*self }
    }
}

impl Number for f32 {
    fn Two() -> Self {
        2f32
    }

    fn One() -> Self {
        1f32
    }

    fn Zero() -> Self {
        0f32
    }

    fn Ninety() -> Self {
        90f32
    }

    fn to_rotation_index(&self) -> usize {
        let mut temp = *self;
        temp = if temp < 0f32 {
            temp + 405f32
        } else {
            temp + 45f32
        };
        temp /= 90f32;
        return temp as usize % 4;
    }

    fn isZero(t: Self) -> bool {
        t <= f32::EPSILON
    }

    fn Sqrt(t: Self) -> Self {
        f32::sqrt(t)
    }

    fn SinCos(rotation: Self) -> (Self, Self) {
        f32::sin_cos(f32::to_radians(rotation))
    }

    fn Convert(value: usize) -> Self {
        value as f32
    }

    fn MaxValue() -> Self {
        f32::MAX
    }

    fn MinValue() -> Self {
        f32::MIN
    }
}

pub struct AxisAlignedBoundingBox<T: Number> {
    pub x: T,
    pub y: T,
    pub width: T,
    pub height: T,
    pub points: Vec<Vector2<T>>,
}

impl<T: Number> AxisAlignedBoundingBox<T> {
    pub fn new(x: T, y: T, width: T, height: T) -> AxisAlignedBoundingBox<T> {
        AxisAlignedBoundingBox {
            x,
            y,
            width,
            height,
            points: vec![
                Vector2::new(x, y + height),
                Vector2::new(x + width, y + height),
                Vector2::new(x + width, y),
                Vector2::new(x, y),
            ],
        }
    }
}

pub struct QuadTreeSpecifications {
    maxDepth: usize,
    divisionFactor: usize,
    objectCapacity: usize,
    divisionSize: usize,
}

impl QuadTreeSpecifications {
    pub fn new(
        maxDepth: usize,
        divisionFactor: usize,
        objectCapacity: usize,
    ) -> QuadTreeSpecifications {
        if divisionFactor < 2 || divisionFactor > 5 {
            panic!("Division factor must be between 2 and 5!");
        }
        QuadTreeSpecifications {
            maxDepth,
            divisionFactor,
            objectCapacity,
            divisionSize: divisionFactor * divisionFactor,
        }
    }
}

pub trait QuadTreeElement<T: Number> {
    fn collidesWithTree(&self, container: &AxisAlignedBoundingBox<T>) -> bool;
}

pub struct QuadTree<T: Number> {
    container: AxisAlignedBoundingBox<T>,
    configuration: Rc<QuadTreeSpecifications>,
    depth: usize,
    objects: Vec<Rc<RefCell<dyn WordCloudElement<T>>>>,
    children: Option<Vec<QuadTree<T>>>,
}

pub trait QuadTreeQuery<T: Number> {
    fn collidesWithTree(&self, container: &AxisAlignedBoundingBox<T>) -> bool;
    fn shouldContinueColliding(&mut self, objects: &[Rc<RefCell<dyn WordCloudElement<T>>>]) -> bool;
}

impl<T: Number> QuadTree<T> {
    pub fn new(
        container: AxisAlignedBoundingBox<T>,
        configuration: Rc<QuadTreeSpecifications>,
        depth: usize,
    ) -> QuadTree<T> {
        QuadTree {
            container,
            configuration,
            depth,
            objects: Vec::new(),
            children: None,
        }
    }

    pub fn isEmpty(&self) -> bool {
        self.children.is_none() && self.objects.len() < 1
    }

    pub fn queryObjects<J: QuadTreeQuery<T>>(&self, collisionObject: &mut J) -> bool {
        if !collisionObject.shouldContinueColliding(&self.objects) {
            return false;
        }
        if self.children.is_none() {
            return true;
        }
        for child in self.children.as_ref().unwrap() {
            if collisionObject.collidesWithTree(&child.container)
                && !child.queryObjects(collisionObject)
            {
                return false;
            }
        }
        return true;
    }

    pub fn collides(&self, object: Rc<RefCell<dyn WordCloudElement<T>>>) -> bool {
        object.borrow().collidesWithTree(&self.container)
    }

    pub fn addElement(&mut self, object: Rc<RefCell<dyn WordCloudElement<T>>>) {
        if self.children.is_some() {
            let mut collideIndex: usize = usize::MAX;
            let childs = self.children.as_mut().unwrap();
            for i in 0..childs.len() {
                if childs[i].collides(Rc::clone(&object)) {
                    if collideIndex != usize::MAX {
                        self.objects.push(object);
                        return;
                    }
                    collideIndex = i;
                }
            }
            // touching does not count as colliding: -1 is possible
            if collideIndex == usize::MAX {
                self.objects.push(object);
            } else {
                childs[collideIndex].addElement(object);
            }
            return;
        }
        if self.objects.len() == self.configuration.objectCapacity
            && self.depth < self.configuration.maxDepth
        {
            self.objects.push(object);
            self.divide();
        } else {
            self.objects.push(object);
        }
    }

    fn divide(&mut self) {
        if self.children.is_some() {
            return;
        }
        let size = self.configuration.divisionFactor;
        let aabb = &self.container;
        let newDepth: usize = self.depth + 1;
        let mut currentY = aabb.y;
        let mut newChilds: Vec<QuadTree<T>> = vec![];
        let mut y = 0;
        while y < size {
            let mut currentX: T = aabb.x;
            y += 1;
            let nextY: T = aabb.y + (aabb.height * T::Convert(y)) / T::Convert(size);
            let height: T = nextY - currentY;
            let mut x = 0;
            while x < size {
                x += 1;
                let nextX = aabb.x + (aabb.width * T::Convert(x)) / T::Convert(size);
                newChilds.push(QuadTree::new(
                    AxisAlignedBoundingBox::new(currentX, currentY, nextX - currentX, height),
                    Rc::clone(&self.configuration),
                    newDepth,
                ));
                currentX = nextX;
            }
            currentY = nextY;
        }
        self.children = Some(newChilds);
        let old_elements: Vec<Rc<RefCell<dyn WordCloudElement<T>>>> = self.objects.drain(..).collect();
        for elem in old_elements {
            self.addElement(elem);
        }
    }
}
