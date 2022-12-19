use std::{cell::RefCell, rc::Rc};

use super::{
    quadtree::{
        calcMinMax, AxisAlignedBoundingBox, Number, QuadTree, QuadTreeQuery, Range, Vector2,
    },
    MergeRangeResult, PositionInfo, TRangeSet, WordCloudElement, WordCloudTopic,
};

struct SimpleCollisionBox<T: Number> {
    midPoint: Vector2<T>,
    moveDir: Vector2<T>,
    addCollDir: Vector2<T>,
    moveSize: T,
    addCollSize: T,
    rotation: T,
    points: Vec<Vector2<T>>,
    completeMoveRange: Range<T>,
    collRange: Range<T>,
    moveRange: Range<T>,
    xRange: Range<T>,
    yRange: Range<T>,
    resultTRange: TRangeSet<T>,
}

impl<T: Number> SimpleCollisionBox<T> {
    pub fn new(
        midPoint: &Vector2<T>,
        moveDir: &Vector2<T>,
        addCollDir: &Vector2<T>,
        moveSize: T,
        addCollSize: T,
        rotation: T,
        moveTSize: T,
    ) -> Self {
        let points = vec![
            moveDir
                .clone()
                .scale(moveSize)
                .add(&addCollDir.clone().scale(addCollSize))
                .add(&midPoint)
                .clone(),
            moveDir
                .clone()
                .scale(moveSize)
                .add(&addCollDir.clone().scale(-addCollSize))
                .add(&midPoint)
                .clone(),
            moveDir
                .clone()
                .scale(-moveSize)
                .add(&addCollDir.clone().scale(addCollSize))
                .add(&midPoint)
                .clone(),
            moveDir
                .clone()
                .scale(-moveSize)
                .add(&addCollDir.clone().scale(-addCollSize))
                .add(&midPoint)
                .clone(),
        ];
        let moveRange = calcMinMax(&moveDir, &points);
        let xRange;
        let yRange;
        {
            let fullyLength = moveSize + moveTSize;
            let edgePoints = [
                moveDir
                    .clone()
                    .scale(fullyLength)
                    .add(&addCollDir.clone().scale(addCollSize))
                    .add(&midPoint)
                    .clone(),
                moveDir
                    .clone()
                    .scale(fullyLength)
                    .add(&addCollDir.clone().scale(-addCollSize))
                    .add(&midPoint)
                    .clone(),
                moveDir
                    .clone()
                    .scale(-fullyLength)
                    .add(&addCollDir.clone().scale(addCollSize))
                    .add(&midPoint)
                    .clone(),
                moveDir
                    .clone()
                    .scale(-fullyLength)
                    .add(&addCollDir.clone().scale(-addCollSize))
                    .add(&midPoint)
                    .clone(),
            ];
            xRange = calcMinMax(&Vector2::dir_x(), &edgePoints);
            yRange = calcMinMax(&Vector2::dir_y(), &edgePoints);
        }
        SimpleCollisionBox {
            midPoint: midPoint.clone(),
            moveDir: moveDir.clone(),
            collRange: calcMinMax(&addCollDir, &points),
            addCollDir: addCollDir.clone(),
            moveSize,
            addCollSize,
            rotation,
            points,
            completeMoveRange: Range::new(
                moveRange.get_start() - moveTSize,
                moveRange.get_end() + moveTSize,
            ),
            moveRange,
            xRange,
            yRange,
            resultTRange: TRangeSet::new(moveTSize),
        }
    }

    /**
     * @param aspectRatio width / height from screen
     */
    pub fn constructPosition(&self, aspectRatio: T) -> Option<PositionInfo<T>> {
        if self.resultTRange.isEmpty() {
            return None;
        }
        /*
        get minimal distance with using perpendicular side
        from equality (distance to center):
         (0 0) + k * (c1 c2) = (m1 m2) + t * (move1 move2)
        */
        let c1 = self.addCollDir.get_x() / aspectRatio;
        let c2 = self.addCollDir.get_y();
        let m1 = self.midPoint.get_x() / aspectRatio;
        let m2 = self.midPoint.get_y();
        let move1 = self.moveDir.get_x() / aspectRatio;
        let move2 = self.moveDir.get_y();
        let optimalT = (c2 * m1 - c1 * m2) / (c1 * move2 - c2 * move1);
        // find possible t
        let t = self.resultTRange.getBestTValue(optimalT);
        // construct position
        let midPoint = self.moveDir.clone().scale(t).add(&self.midPoint).clone();
        Some(PositionInfo::new(
            midPoint.clone(),
            midPoint.length_squared(aspectRatio),
            self.moveDir.clone(),
            self.addCollDir.clone(),
            self.moveSize,
            self.addCollSize,
        ))
    }

    /**
     * @returns
     * true, if the collision checks can continue
     *
     * false, if it has no space, collision checks can be aborted
     */
    fn collideTRange(&mut self, object: &Rc<RefCell<dyn WordCloudElement<T>>>) -> bool {
        let borrow = object.borrow();
        let (points, topicRotation, normal1, normal1Range, normal2, normal2Range) =
            borrow.get_collison_info();

        // self move dir
        let selfDir1 = self.resultTRange.mergeTRange(
            &calcMinMax(&self.moveDir, points),
            &self.moveRange,
            T::One(),
        );
        if selfDir1.never_collides() {
            return true;
        }
        // self additional dir
        let selfDir2 = self.resultTRange.mergeTRange(
            &calcMinMax(&self.addCollDir, points),
            &self.collRange,
            T::Zero(),
        );
        if selfDir2.never_collides() {
            return true;
        }
        let rotation = self.rotation - topicRotation;
        if T::isZero(rotation % T::Ninety()) {
            if let MergeRangeResult::CollisionRange(range) = selfDir1 {
                self.resultTRange
                    .splitByRange(range.get_start(), range.get_end());
            }
            if let MergeRangeResult::CollisionRange(range) = selfDir2 {
                self.resultTRange
                    .splitByRange(range.get_start(), range.get_end());
            }
            return !self.resultTRange.isEmpty();
        }
        // other up
        let otherDir1 = self.resultTRange.mergeTRange(
            normal1Range,
            &calcMinMax(&normal1, &self.points),
            normal1.dot(&self.moveDir),
        );
        if otherDir1.never_collides() {
            return true;
        }
        // other right
        let otherDir2 = self.resultTRange.mergeTRange(
            normal2Range,
            &calcMinMax(&normal2, &self.points),
            normal2.dot(&self.moveDir),
        );
        if otherDir2.never_collides() {
            return true;
        }
        // update possible t ranges
        if let MergeRangeResult::CollisionRange(range) = selfDir1 {
            self.resultTRange
                .splitByRange(range.get_start(), range.get_end());
        }
        if let MergeRangeResult::CollisionRange(range) = selfDir2 {
            self.resultTRange
                .splitByRange(range.get_start(), range.get_end());
        }
        if let MergeRangeResult::CollisionRange(range) = otherDir1 {
            self.resultTRange
                .splitByRange(range.get_start(), range.get_end());
        }
        if let MergeRangeResult::CollisionRange(range) = otherDir2 {
            self.resultTRange
                .splitByRange(range.get_start(), range.get_end());
        }
        return !self.resultTRange.isEmpty();
    }
}

impl<T: Number> QuadTreeQuery<T> for SimpleCollisionBox<T> {
    fn collidesWithTree(&self, aabb: &AxisAlignedBoundingBox<T>) -> bool {
        self.yRange.get_start() < aabb.y + aabb.height
            && self.yRange.get_end() > aabb.y
            && self.xRange.get_start() < aabb.x + aabb.width
            && self.xRange.get_end() > aabb.x
            && self
                .completeMoveRange
                .collides(&calcMinMax(&self.moveDir, &aabb.points))
            && self
                .collRange
                .collides(&calcMinMax(&self.addCollDir, &aabb.points))
    }

    fn shouldContinueColliding(
        &mut self,
        objects: &[Rc<RefCell<dyn WordCloudElement<T>>>],
    ) -> bool {
        for object in objects {
            if !self.collideTRange(object) {
                return false;
            }
        }
        true
    }
}

pub fn tryPlaceOnFourSides<T: Number>(
    topic: &WordCloudTopic<T>,
    newTopic: &WordCloudTopic<T>,
    quadTree: &QuadTree<T>,
    aspectRatio: T,
) -> Option<PositionInfo<T>> {
    let rotation = newTopic.rotation - topic.rotation;
    let rotIndex = rotation.to_rotation_index();
    let mut newSideIndex = (rotIndex + 2) % 4;
    let mut minimal: Option<PositionInfo<T>> = None;
    for i in 0..4 {
        let newSide = &newTopic.buildInfo.sides[newSideIndex];
        newSideIndex = (newSideIndex + 1) % 4;
        let side = &topic.buildInfo.sides[i];
        let currentMid = &topic.place.as_ref().unwrap().mid;
        let newMid = side
            .sideNormal
            .clone()
            .scale(side.distToMid + newSide.distToMid)
            .add(&currentMid)
            .clone();
        let mut collisionBox = SimpleCollisionBox::new(
            &newMid,
            &side.perpendicularNormal,
            &side.sideNormal,
            newSide.otherDirMidDist,
            newSide.distToMid,
            newTopic.rotation,
            side.otherDirMidDist + newSide.otherDirMidDist,
        );
        quadTree.queryObjects(&mut collisionBox);
        let t = collisionBox.constructPosition(aspectRatio);
        if t.is_none() {
            continue;
        }
        if minimal.is_none() {
            minimal = t;
        } else if minimal.as_ref().unwrap().distanceSquared > t.as_ref().unwrap().distanceSquared {
            minimal = t;
        }
    }
    minimal
}
