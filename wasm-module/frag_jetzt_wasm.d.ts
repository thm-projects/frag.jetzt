/* tslint:disable */
/* eslint-disable */
/**
* Calculates positions based on input data.
*
* ```no_run
* Input data: [
*   width: f32, height: f32,
*   obstacle_count: f32,
*   {obstacle_center_x: f32, obstacle_center_y: f32, obstacle_width: f32, obstacle_height: f32}[obstacle_count],
*   {element_width: f32, element_height: f32, rotation: f32}...
* ]
*
* Output data: [
*   ... skipped data (info, obstacles),
*   {r: f32, phi: f32, rotation: f32}...
* ]
* ```
* rotation will not be changed
* @param {Float32Array} data
*/
export function calc_word_cloud(data: Float32Array): void;
