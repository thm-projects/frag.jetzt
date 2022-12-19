use std::{cell::RefCell, rc::Rc};

use crate::wordCloudPlacing::placingFourSides::tryPlaceOnFourSides;

use self::quadtree::{
    calcMinMax, AxisAlignedBoundingBox, Number, QuadTree, QuadTreeElement, Range, Vector2,
};

mod placingFourSides;
pub mod quadtree;

// Orderd increasing
pub struct TRangeSet<T: Number> {
    tRanges: Vec<Range<T>>,
}

pub enum MergeRangeResult<T: Number> {
    AlwaysCollides,
    NoCollision,
    CollisionRange(Range<T>),
}

impl<T: Number> MergeRangeResult<T> {
    fn never_collides(&self) -> bool {
        matches!(*self, MergeRangeResult::NoCollision)
    }
}

impl<T: Number> TRangeSet<T> {
    pub fn new(tRangeSize: T) -> Self {
        TRangeSet {
            tRanges: vec![Range::new(-tRangeSize, tRangeSize)],
        }
    }

    pub fn isEmpty(&self) -> bool {
        self.tRanges.len() < 1
    }

    pub fn getBestTValue(&self, optimalT: T) -> T {
        let mut distance = T::MaxValue();
        let mut t = optimalT;
        for range in self.tRanges.iter() {
            if optimalT > range.get_end() {
                let dist = optimalT - range.get_end();
                if dist < distance {
                    distance = dist;
                    t = range.get_end();
                }
            } else if optimalT < range.get_start() {
                let dist = range.get_start() - optimalT;
                if dist < distance {
                    t = range.get_start();
                }
                // Ordered increasing
                return t;
            } else {
                return optimalT;
            }
        }
        return t;
    }

    pub fn mergeTRange(
        &self,
        staticRange: &Range<T>,
        tRange: &Range<T>,
        tProjectedOnRange: T,
    ) -> MergeRangeResult<T> {
        if self.isEmpty() {
            return MergeRangeResult::AlwaysCollides;
        }
        if T::isZero(tProjectedOnRange) {
            return if staticRange.collides(tRange) {
                MergeRangeResult::AlwaysCollides
            } else {
                MergeRangeResult::NoCollision
            };
        }
        let mut tmin = (tRange.get_start() - staticRange.get_end()) / -tProjectedOnRange;
        let mut tmax = (staticRange.get_start() - tRange.get_end()) / tProjectedOnRange;
        if tmax < tmin {
            let temp = tmax;
            tmax = tmin;
            tmin = temp;
        }
        if tmax <= self.tRanges[0].get_start()
            || tmin >= self.tRanges[self.tRanges.len() - 1].get_end()
        {
            return MergeRangeResult::NoCollision;
        }
        MergeRangeResult::CollisionRange(Range::new(tmin, tmax))
    }

    pub fn splitByRange(&mut self, start: T, end: T) {
        let ranges = &mut self.tRanges;
        for i in (0..ranges.len()).rev() {
            let range = &mut ranges[i];
            if start <= range.get_start() {
                if end >= range.get_end() {
                    ranges.remove(i);
                } else if end > range.get_start() {
                    range.set_start(end);
                }
                continue;
            }
            // From here: No more collisions possible, always break
            if start >= range.get_end() {
                break;
            }
            let range_end = range.get_end();
            range.set_end(start);
            if end < range_end {
                ranges.insert(i + 1, Range::new(end, range_end));
            }
            break;
        }
    }
}

struct SideAccessInformation<T: Number> {
    sideNormal: Vector2<T>,
    perpendicularNormal: Vector2<T>,
    sideOffset: Vector2<T>,
    distToMid: T,
    otherDirMidDist: T,
}

impl<T: Number> SideAccessInformation<T> {
    pub fn new(
        sideNormal: Vector2<T>,
        perpendicularNormal: Vector2<T>,
        sideOffset: Vector2<T>,
        distToMid: T,
        otherDirMidDist: T,
    ) -> Self {
        SideAccessInformation {
            sideNormal,
            perpendicularNormal,
            sideOffset,
            distToMid,
            otherDirMidDist,
        }
    }
}

struct PreparedBuildInformation<T: Number> {
    sides: Vec<SideAccessInformation<T>>,
    normal1: Vector2<T>,
    normal2: Vector2<T>,
}

impl<T: Number> PreparedBuildInformation<T> {
    pub fn new(width: T, height: T, rotation: T) -> Self {
        let width = width / T::Two();
        let height = height / T::Two();
        let (sin, cos) = T::SinCos(rotation);
        let normalUp = Vector2::new(-sin, cos);
        let normalRight = Vector2::new(cos, sin);
        PreparedBuildInformation {
            sides: vec![
                SideAccessInformation::new(
                    normalUp.clone(),
                    normalRight.clone().scale(-T::One()),
                    normalUp
                        .clone()
                        .scale(height)
                        .add(&normalRight.clone().scale(-width)),
                    height,
                    width,
                ),
                SideAccessInformation::new(
                    normalRight.clone(),
                    normalUp.clone(),
                    normalRight
                        .clone()
                        .scale(width)
                        .add(&normalUp.clone().scale(height)),
                    width,
                    height,
                ),
                SideAccessInformation::new(
                    normalUp.clone().scale(-T::One()),
                    normalRight.clone(),
                    normalUp
                        .clone()
                        .scale(-height)
                        .add(&normalRight.clone().scale(width)),
                    height,
                    width,
                ),
                SideAccessInformation::new(
                    normalRight.clone().scale(-T::One()),
                    normalUp.clone().scale(-T::One()),
                    normalRight
                        .clone()
                        .scale(-width)
                        .add(&normalUp.clone().scale(-height)),
                    width,
                    height,
                ),
            ],
            normal1: normalUp,
            normal2: normalRight,
        }
    }
}

pub struct PlacedTopic<T: Number> {
    pub mid: Vector2<T>,
    normal1: Vector2<T>,
    normal2: Vector2<T>,
    points: Vec<Vector2<T>>,
    normal1Range: Range<T>,
    normal2Range: Range<T>,
    xRange: Range<T>,
    yRange: Range<T>,
}

impl<T: Number> PlacedTopic<T> {
    pub fn new(
        mid: Vector2<T>,
        normal1: Vector2<T>,
        normal2: Vector2<T>,
        normal1Size: T,
        normal2Size: T,
        distance: T,
    ) -> Self {
        let points = vec![
            normal1
                .clone()
                .scale(normal1Size)
                .add(&normal2.clone().scale(-normal2Size))
                .add(&mid)
                .clone(),
            normal1
                .clone()
                .scale(normal1Size)
                .add(&normal2.clone().scale(normal2Size))
                .add(&mid)
                .clone(),
            normal1
                .clone()
                .scale(-normal1Size)
                .add(&normal2.clone().scale(normal2Size))
                .add(&mid)
                .clone(),
            normal1
                .clone()
                .scale(-normal1Size)
                .add(&normal2.clone().scale(-normal2Size))
                .add(&mid)
                .clone(),
        ];
        let n1Dot = mid.dot(&normal1);
        let n2Dot = mid.dot(&normal2);
        PlacedTopic {
            mid,
            normal1,
            normal2,
            normal1Range: Range::new(n1Dot - normal1Size, n1Dot + normal1Size),
            normal2Range: Range::new(n2Dot - normal2Size, n2Dot + normal2Size),
            xRange: calcMinMax(&Vector2::dir_x(), &points),
            yRange: calcMinMax(&Vector2::dir_y(), &points),
            points,
        }
    }
}

pub struct PositionInfo<T: Number> {
    position: Vector2<T>,
    distanceSquared: T,
    normal1: Vector2<T>,
    normal2: Vector2<T>,
    normal1Size: T,
    normal2Size: T,
}

impl<T: Number> PositionInfo<T> {
    pub fn new(
        position: Vector2<T>,
        distanceSquared: T,
        normal1: Vector2<T>,
        normal2: Vector2<T>,
        normal1Size: T,
        normal2Size: T,
    ) -> Self {
        PositionInfo {
            position,
            distanceSquared,
            normal1,
            normal2,
            normal1Size,
            normal2Size,
        }
    }

    pub fn toPlacedPos(&self) -> PlacedTopic<T> {
        PlacedTopic::new(
            self.position.clone(),
            self.normal1.clone(),
            self.normal2.clone(),
            self.normal1Size,
            self.normal2Size,
            T::Sqrt(self.distanceSquared),
        )
    }
}

pub trait WordCloudElement<T: Number>: QuadTreeElement<T> {
    fn get_collison_info(
        &self,
    ) -> (
        &[Vector2<T>],
        T,
        Vector2<T>,
        &Range<T>,
        Vector2<T>,
        &Range<T>,
    );
}

pub struct WordCloudObstacle<T: Number> {
    aabb: AxisAlignedBoundingBox<T>,
    xRange: Range<T>,
    yRange: Range<T>,
}

impl<T: Number> WordCloudObstacle<T> {
    pub fn new(x: T, y: T, width: T, height: T) -> Self {
        WordCloudObstacle {
            aabb: AxisAlignedBoundingBox::new(x, y, width, height),
            xRange: Range::new(x, x + width),
            yRange: Range::new(y, y + height),
        }
    }
}

impl<T: Number> QuadTreeElement<T> for WordCloudObstacle<T> {
    fn collidesWithTree(&self, aabb: &AxisAlignedBoundingBox<T>) -> bool {
        self.yRange.get_start() < aabb.y + aabb.height
            && self.yRange.get_end() > aabb.y
            && self.xRange.get_start() < aabb.x + aabb.width
            && self.xRange.get_end() > aabb.x
    }
}

impl<T: Number> WordCloudElement<T> for WordCloudObstacle<T> {
    fn get_collison_info(
        &self,
    ) -> (
        &[Vector2<T>],
        T,
        Vector2<T>,
        &Range<T>,
        Vector2<T>,
        &Range<T>,
    ) {
        (
            &self.aabb.points,
            T::Zero(),
            Vector2::dir_y(),
            &self.yRange,
            Vector2::dir_x(),
            &self.xRange,
        )
    }
}

pub struct WordCloudTopic<T: Number> {
    width: T,
    height: T,
    rotation: T,
    buildInfo: PreparedBuildInformation<T>,
    pub place: Option<PlacedTopic<T>>,
}

impl<T: Number> WordCloudTopic<T> {
    pub fn new(width: T, height: T, rotation: T) -> Self {
        WordCloudTopic {
            width,
            height,
            rotation,
            buildInfo: PreparedBuildInformation::new(width, height, rotation),
            place: None,
        }
    }

    pub fn tryPlace(
        &self,
        quadTree: &QuadTree<T>,
        otherTopic: &Self,
        aspectRatio: T,
    ) -> Option<PositionInfo<T>> {
        if self.place.is_none() {
            panic!("Current topic must have a position!");
        }
        let diffAngle = (self.rotation - otherTopic.rotation) % T::Ninety();
        if T::isZero(diffAngle) || T::isZero(diffAngle - T::Ninety()) {
            // perpendicular or colinear
            return tryPlaceOnFourSides(self, otherTopic, quadTree, aspectRatio);
        }
        panic!("For testing purpose, should not happen.");
    }
}

impl<T: Number> QuadTreeElement<T> for WordCloudTopic<T> {
    fn collidesWithTree(&self, aabb: &AxisAlignedBoundingBox<T>) -> bool {
        let pos = self.place.as_ref().unwrap();
        pos.yRange.get_start() < aabb.y + aabb.height
            && pos.yRange.get_end() > aabb.y
            && pos.xRange.get_start() < aabb.x + aabb.width
            && pos.xRange.get_end() > aabb.x
            && pos
                .normal1Range
                .collides(&calcMinMax(&pos.normal1, &aabb.points))
            && pos
                .normal2Range
                .collides(&calcMinMax(&pos.normal2, &aabb.points))
    }
}

impl<T: Number> WordCloudElement<T> for WordCloudTopic<T> {
    fn get_collison_info(
        &self,
    ) -> (
        &[Vector2<T>],
        T,
        Vector2<T>,
        &Range<T>,
        Vector2<T>,
        &Range<T>,
    ) {
        let pos = self.place.as_ref().unwrap();
        (
            &pos.points,
            self.rotation,
            pos.normal1.clone(),
            &pos.normal1Range,
            pos.normal2.clone(),
            &pos.normal2Range,
        )
    }
}

pub fn findBestPlace<T: Number + 'static>(
    new_topic: Rc<RefCell<WordCloudTopic<T>>>,
    elements: &Vec<Rc<RefCell<WordCloudTopic<T>>>>,
    tree: &mut QuadTree<T>,
    aspectRatio: T,
) {
    let newTopic = Rc::clone(&new_topic);
    let mut topic = new_topic.borrow_mut();
    if elements.len() == 0 {
        let side = &topic.buildInfo.sides[0];
        topic.place = Some(PlacedTopic::new(
            Vector2::new(T::Zero(), T::Zero()),
            side.sideNormal.clone(),
            side.perpendicularNormal.clone(),
            side.distToMid,
            side.otherDirMidDist,
            T::Zero(),
        ));
        tree.addElement(newTopic);
        return;
    }
    let mut posInfo: Option<PositionInfo<T>> = None;
    for i in 0..elements.len() {
        let nearestPos = elements[i].borrow().tryPlace(tree, &topic, aspectRatio);
        if let Some(ref pos1) = nearestPos {
            if let Some(ref pos2) = posInfo {
                if pos2.distanceSquared > pos1.distanceSquared {
                    posInfo = nearestPos;
                }
            }else{
                posInfo = nearestPos;
            }
        }
    }
    if posInfo.is_some() {
        topic.place = Some(posInfo.unwrap().toPlacedPos());
        tree.addElement(newTopic);
    }
    return;
}
