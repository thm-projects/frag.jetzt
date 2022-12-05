use std::{
    fmt,
    ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Rem, RemAssign, Sub, SubAssign},
};

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
    + fmt::Debug
    + Copy
{
    fn One() -> Self;
    fn Zero() -> Self;
    fn Sqrt(t: Self) -> Self;
    fn Convert(value: usize) -> Self;
}

struct Vector2<T: Number> {
    x: T,
    y: T,
}

impl<T: Number> Vector2<T> {
    const X: Vector2<T> = Vector2::new(T::One(), T::Zero());
    const Y: Vector2<T> = Vector2::new(T::Zero(), T::One());

    pub fn new(x: T, y: T) -> Self {
        Vector2 { x, y }
    }

    pub fn dot(&self, other: &Vector2<T>) -> T {
        self.x * other.x + self.y + other.y
    }

    pub fn lengthSquared(&self, aspectRatio: T) -> T {
        let first = self.x / aspectRatio;
        first * first + self.y * self.y
    }

    pub fn length(&self) -> T {
        T::Sqrt(self.x * self.x + self.y * self.y)
    }

    pub fn clone(&self) -> Self {
        Vector2 { ..*self }
    }

    pub fn add(&mut self, vec: &Self) -> &Self {
        self.x += vec.x;
        self.y += vec.y;
        self
    }

    pub fn subtract(&mut self, vec: &Self) -> &Self {
        self.x -= vec.x;
        self.y -= vec.y;
        self
    }

    pub fn scale(&mut self, scalar: T) -> &Self {
        self.x *= scalar;
        self.y *= scalar;
        self
    }
}

impl Number for f32 {
    fn One() -> Self {
        1f32
    }

    fn Zero() -> Self {
        0f32
    }

    fn Sqrt(t: Self) -> Self {
        f32::sqrt(t)
    }

    fn Convert(value: usize) -> Self {
        value as f32
    }
}

pub struct AxisAlignedBoundingBox<T: Number> {
    pub x: T,
    y: T,
    width: T,
    height: T,
    points: [Vector2<T>; 4],
}

impl<T: Number> AxisAlignedBoundingBox<T> {
    pub fn new(x: T, y: T, width: T, height: T) -> AxisAlignedBoundingBox<T> {
        AxisAlignedBoundingBox {
            x,
            y,
            width,
            height,
            points: [
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

pub struct QuadTree<T: Number, K> {
    container: AxisAlignedBoundingBox<T>,
    configuration: QuadTreeSpecifications,
    depth: usize,
    objects: Vec<K>,
    children: Option<Vec<QuadTree<T, K>>>,
}

pub trait QuadTreeElement<T: Number>: Clone {
    fn collidesWithTree(&self, container: AxisAlignedBoundingBox<T>) -> bool;
}

pub trait QuadTreeQuery<T: Number, K: QuadTreeElement<T>> {
    fn collidesWithTree(&self, container: AxisAlignedBoundingBox<T>) -> bool;
    fn shouldContinueColliding(&self, objects: Vec<K>) -> bool;
}

impl<T: Number, K: QuadTreeElement<T>> QuadTree<T, K> {
    pub fn new(
        container: AxisAlignedBoundingBox<T>,
        configuration: QuadTreeSpecifications,
        depth: usize,
    ) -> QuadTree<T, K> {
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

    pub fn queryObjects<J: QuadTreeQuery<T, K>>(&self, collisionObject: J) -> bool {
        if !collisionObject.shouldContinueColliding(self.objects) {
            return false;
        }
        if self.children.is_none() {
            return true;
        }
        for child in self.children.unwrap() {
            if collisionObject.collidesWithTree(child.container)
                && !child.queryObjects(collisionObject)
            {
                return false;
            }
        }
        return true;
    }

    pub fn collides(&self, object: K) -> bool {
        object.collidesWithTree(self.container)
    }

    pub fn addElement(&self, object: K) {
        if self.children.is_some() {
            let mut collideIndex: usize = usize::MAX;
            let childs = self.children.unwrap();
            for i in 0..childs.len() {
                if childs[i].collides(object) {
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

    fn divide(&self) {
        if self.children.is_some() {
            return;
        }
        let size = self.configuration.divisionFactor;
        let aabb = self.container;
        let newDepth: usize = self.depth + 1;
        let mut currentY = aabb.y;
        let mut newChilds: Vec<QuadTree<T, K>> = vec![];
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
                    self.configuration,
                    newDepth,
                ));
                currentX = nextX;
            }
            currentY = nextY;
        }
        self.children = Some(newChilds);
        let cloned = self.objects.clone();
        self.objects.clear();
        for i in cloned {
            self.addElement(i);
        }
    }
}
