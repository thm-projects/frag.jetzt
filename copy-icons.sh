#!/bin/bash
mkdir -p src/assets/editor-icons/{table,text,check,wysiwg}
cp node_modules/@shopware-ag/meteor-icon-kit/icons/regular/{align-center,align-center-xs,align-left,align-left-xs,align-right,align-right-xs,delete-column,delete-row,insert-column-after,insert-column-before,insert-row-after,insert-row-before,link,link-xs,trash,trash-s}.svg src/assets/editor-icons/table
cp node_modules/@shopware-ag/meteor-icon-kit/icons/regular/{bold,bold-xs,italic,italic-xs,list-numbered-xs,list-xs,list-unordered-xs,minus,minus-s,minus-xs,minus-xxs,quote,link,link-xs,strikethrough-xs,check-square,check-square-s,code,code-xs,long-arrow-left,long-arrow-right,ellipsis-h,ellipsis-h-s,image,image-s,image-xs,table,table-xs,eye-dropper,style-alt-xs,compress-arrows,expand-arrows}.svg src/assets/editor-icons/text
cp node_modules/@shopware-ag/meteor-icon-kit/icons/regular/{square,square-s,check-square,check-square-s}.svg src/assets/editor-icons/check
cp node_modules/@shopware-ag/meteor-icon-kit/icons/regular/{pencil-s,chevron-up-s,chevron-down-s}.svg src/assets/editor-icons/wysiwg
