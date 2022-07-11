import { ActiveWord, WordMeta } from './word-cloud.component';

export class WordCloudDrawFunctions {

  static calculateGridStructure<T extends WordMeta>(elements: ActiveWord<T>[], parentWidth: number, parentHeight: number) {
    const fullwidth = parentWidth * 2;
    let lines = 1;
    let counter = 0;
    const drawIndices = [];
    let heightAcc = 0;
    let maxHeight = 0;
    for (let i = 0, lastIndex = 0; i < elements.length; i++) {
      const word = elements[i];
      const { width, height } = word.buildInformation.position;
      maxHeight = Math.max(maxHeight, height);
      if (i > lastIndex && counter + width > fullwidth) {
        lastIndex = i;
        ++lines;
        heightAcc += maxHeight;
        drawIndices.push([i, counter, maxHeight]);
        maxHeight = 0;
        counter = width;
      } else {
        counter += width;
      }
    }
    drawIndices.push([elements.length, counter, maxHeight]);
    const fullheight = parentHeight * 2;
    const ySpace = (fullheight - heightAcc) / (lines + 1);
    let lastElemIndex = drawIndices[0][0];
    let xSpace = (fullwidth - drawIndices[0][1]) / (lastElemIndex + 1);
    let xOffset = xSpace;
    for (let i = 0, yOffset = ySpace; i < elements.length; i++, xOffset += xSpace) {
      if (i === lastElemIndex) {
        drawIndices.shift();
        xSpace = (fullwidth - drawIndices[0][1]) / (drawIndices[0][0] - lastElemIndex + 1);
        xOffset = xSpace;
        lastElemIndex = drawIndices[0][0];
        yOffset += ySpace;
      }
      const info = elements[i].buildInformation;
      const { width, height } = info.position;
      info.origin = [
        -parentWidth + xOffset,
        -parentHeight + yOffset + height / 2
      ];
      xOffset += width;
    }
  }
}
