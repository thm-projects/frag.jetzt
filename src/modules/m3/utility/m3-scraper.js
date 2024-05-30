function m3Scraper(origin) {
  const nameRemap = {
    font_name: "font",
    font_size: "size",
    font_tracking: "tracking",
    font_weight: "weight",
    line_height: "line-height",
  };
  const propertyRemap = {
    font_name: () => `$_font_family`,
    font_size: (e) => e.match(/[\d.-]+/gm)[0],
    font_tracking: (e) => e.match(/[\d.-]+/gm)[0],
    font_weight: (e) => e,
    line_height: (e) => e.match(/[\d.-]+/gm)[0],
  };
  const obj = {};
  const ignoredProperties = [];
  origin
    .querySelectorAll(".grouped-tokens.nested-level-1")
    .forEach((section) => {
      const sectionTitle = section.querySelector(".display-name");
      const sectionTitleParts =
        sectionTitle.getElementsByClassName("display-name-part");
      const [_sectionName, _subSectionName] = Array.from(sectionTitleParts).map(
        (x) => x.textContent.trim(),
      );
      const sectionName = _sectionName.toLowerCase().match(/\w+/gm)[0];
      const subSectionName = _subSectionName.toLowerCase().match(/\w+/gm)[1];
      const tokenListElement = section.querySelector(".token-list");
      const targetSection = obj[sectionName] || (obj[sectionName] = {});
      const targetSubSection = (targetSection[subSectionName] = {});
      Array.from(tokenListElement.getElementsByClassName("token")).forEach(
        (token) => {
          const tokenKey = token.classList
            .toString()
            .replace(/expanded/gm, "")
            .replace("token", "")
            .trim();
          if (tokenKey.startsWith("composite")) return;
          const preview = token.querySelector(".preview");
          if (!preview) return;
          if (nameRemap[tokenKey]) {
            targetSubSection[nameRemap[tokenKey]] = propertyRemap[tokenKey](
              preview.children.item(0).textContent,
            );
          } else {
            ignoredProperties.push([
              sectionName,
              subSectionName,
              tokenKey,
              preview.children.item(0).textContent,
            ]);
          }
        },
      );
    });
  console.log("ignored-properties", ignoredProperties);
  console.log(obj);
  const out = {
    _lines: [],
    _getIndent() {
      return ``.padStart(this._indent * 4, " ");
    },
    append(text) {
      this._lines.push(text);
    },
    toString() {
      return this._lines.join("\n");
    },
  };
  out.append(`$_typescale:(`);
  for (let [sectionName, sectionEntries] of Object.entries(obj)) {
    out.append(`${sectionName}:(`);
    for (let [subSectionName, subSectionEntries] of Object.entries(
      sectionEntries,
    )) {
      out.append(`${subSectionName}:(`);
      const _subSectionEntries = Object.entries(subSectionEntries);
      for (let i = 0; i < _subSectionEntries.length; i++) {
        let [key, value] = _subSectionEntries[i];
        out.append(
          `${key}: ${value} ${i !== _subSectionEntries.length - 1 ? "," : ""}`,
        );
      }
      out.append(`),`);
    }
    out.append(`),`);
  }
  out.append(`);`);
  console.log(out.toString());
}
// m3Scraper(temp2) // query: .stage
