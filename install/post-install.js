const fs = require("node:fs");

function updatePrism() {
  const dir = "node_modules/prismjs/themes";
  const content = fs.readFileSync(dir + "/prism.min.css");
  if (content.toString().includes("[class*=lang-]")) {
    console.log("Prism is already updated");
    return;
  }
  fs.readdirSync(dir, {
    withFileTypes: true,
    recursive: false,
    encoding: "utf-8",
  }).forEach((file) => {
    if (!file.isFile() || !file.name.endsWith(".min.css")) {
      return;
    }
    const path = dir + "/" + file.name;
    let data = fs.readFileSync(path).toString();
    data = data.replace(
      /([^\}\{,\[]*)\[class\*=language-\][^,\{]*,/g,
      "$&$1[class*=lang-],",
    );
    data = data.replace(
      /([^\}\{,\[]*)\[class\*=language-\][^,\{]*\{/g,
      "$1[class*=lang-],$&",
    );
    fs.writeFileSync(path, data);
  });
  console.log("Prism updated");
}

function copyIcons() {
  for (const dir of ["table", "text", "check", "wysiwg"]) {
    fs.mkdirSync("src/assets/editor-icons/" + dir, { recursive: true });
  }
  const srcDir = "node_modules/@shopware-ag/meteor-icon-kit/icons/regular/";
  let targetDir = "src/assets/editor-icons/table/";
  for (const file of [
    "align-center",
    "align-center-xs",
    "align-left",
    "align-left-xs",
    "align-right",
    "align-right-xs",
    "delete-column",
    "delete-row",
    "insert-column-after",
    "insert-column-before",
    "insert-row-after",
    "insert-row-before",
    "link",
    "link-xs",
    "trash",
    "trash-s",
  ]) {
    fs.copyFileSync(srcDir + file + ".svg", targetDir + file + ".svg");
  }
  targetDir = "src/assets/editor-icons/text/";
  for (const file of [
    "bold",
    "bold-xs",
    "italic",
    "italic-xs",
    "list-numbered-xs",
    "list-xs",
    "list-unordered-xs",
    "minus",
    "minus-s",
    "minus-xs",
    "minus-xxs",
    "quote",
    "link",
    "link-xs",
    "strikethrough-xs",
    "check-square",
    "check-square-s",
    "code",
    "code-xs",
    "long-arrow-left",
    "long-arrow-right",
    "ellipsis-h",
    "ellipsis-h-s",
    "image",
    "image-s",
    "image-xs",
    "table",
    "table-xs",
    "eye-dropper",
    "style-alt-xs",
    "compress-arrows",
    "expand-arrows",
  ]) {
    fs.copyFileSync(srcDir + file + ".svg", targetDir + file + ".svg");
  }
  targetDir = "src/assets/editor-icons/check/";
  for (const file of ["square", "square-s", "check-square", "check-square-s"]) {
    fs.copyFileSync(srcDir + file + ".svg", targetDir + file + ".svg");
  }
  targetDir = "src/assets/editor-icons/wysiwg/";
  for (const file of ["pencil-s", "chevron-up-s", "chevron-down-s"]) {
    fs.copyFileSync(srcDir + file + ".svg", targetDir + file + ".svg");
  }
  console.log("Icons copied");
}

function fixTuiColorPicker() {
  const path = "node_modules/tui-color-picker/dist/tui-color-picker.css";
  let data = fs.readFileSync(path).toString();
  data = data.replace(/^\s*\*\S.+$/gm, "");
  fs.writeFileSync(path, data);
  console.log("Tui color picker fixed");
}

updatePrism();
copyIcons();
fixTuiColorPicker();
