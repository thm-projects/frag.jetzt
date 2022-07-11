const fs = require('fs');

class LanguageDirectory {
  constructor (directory, languages) {
    this.directory = directory;
    this.languages = languages;
  }

  addNew (language) {
    if (this.languages.includes(language)) {
      return;
    }
    const removeEntries = (elem) => {
      for (const key of Object.keys(elem)) {
        if (typeof elem[key] === 'object' && !Array.isArray(elem[key])) {
          removeEntries(elem[key]);
        } else if (typeof elem[key] === 'string') {
          elem[key] = '--TODO-- | ' + elem[key];
        }
      }
      return elem;
    };
    const obj = JSON.parse(fs.readFileSync(this.directory + this.languages[0] + '.json', {
      encoding: 'utf8'
    }));
    fs.writeFileSync(
      this.directory + language + '.json',
      JSON.stringify(removeEntries(obj), undefined, 2),
      {
        encoding: 'utf8'
      });
    this.languages.push(language);
  }

  sort () {
    this.languages.forEach(lang => {
      const sortElement = (elem) => {
        if (typeof elem !== 'object' || Array.isArray(elem)) {
          return elem;
        }
        return Object.keys(elem).sort().reduce((acc, key) => {
          acc[key] = sortElement(elem[key]);
          return acc;
        }, {});
      };
      const obj = JSON.parse(fs.readFileSync(this.directory + lang + '.json', {
        encoding: 'utf8'
      }));
      fs.writeFileSync(
        this.directory + lang + '.json',
        JSON.stringify(sortElement(obj), undefined, 2),
        {
          encoding: 'utf8'
        });
    });
  }

  findMissing () {
    const keyReference = {};
    const addKeys = (elem, previous, lang) => {
      for (const key of Object.keys(elem)) {
        const newKey = previous ? previous + '.' + key : key;
        if (typeof elem[key] === 'object' && !Array.isArray(elem[key])) {
          addKeys(elem[key], newKey, lang);
        } else {
          if (!keyReference[newKey]) {
            keyReference[newKey] = [];
          }
          keyReference[newKey].push(lang);
        }
      }
    };
    this.languages.forEach(lang => {
      const obj = JSON.parse(fs.readFileSync(this.directory + lang + '.json', {
        encoding: 'utf8'
      }));
      addKeys(obj, '', lang);
    });
    let str = '';
    Object.keys(keyReference).forEach(key => {
      const arr = keyReference[key];
      if (arr.length < this.languages.length) {
        str += `${key}: Missing ${this.languages.filter(e => !arr.includes(e)).join(', ')}\n`;
      }
    });
    return str;
  }
}

const RED = '\033[0;31m';
const NO_COLOR = '\033[0m';

const printHelp = () => {
  console.log(`
${RED}sort${NO_COLOR} - sort all files alphabetically
${RED}add-language <lang-name>${NO_COLOR} - add language file
${RED}missing${NO_COLOR} - find missing keys, based on other language files
${RED}project-unused${NO_COLOR} - (TODO) find unused labels from the project
`);
  process.exit(1);
}

const findFiles = () => {
  const arr = [];
  const findInFolder = (folderName) => {
    const languages = [];
    fs.readdirSync(folderName, {
      encoding: 'utf8',
      withFileTypes: true,
    }).forEach(c => {
      if (c.isDirectory()) {
        findInFolder(folderName + c.name + '/');
      } else if (c.isFile() && c.name.toLowerCase().endsWith('.json')) {
        languages.push(c.name.substring(0, c.name.length - 5));
      }
    });
    if (languages.length) {
      arr.push(new LanguageDirectory(folderName, languages));
    }
  };
  findInFolder(__dirname + '/src/assets/i18n/');
  return arr;
};

const sort = () => {
  findFiles().forEach(elem => elem.sort());
};

const addNew = (language) => {
  findFiles().forEach(elem => elem.addNew(language));
};

const findMissing = () => {
  findFiles().forEach(elem => {
    const str = elem.findMissing();
    if (str) {
      console.log('\n\n-------------------------\n' + elem.directory + '\n' + str);
    }
  });
};


const args = process.argv.slice(2);

if (args.length < 1) {
  printHelp();
}

switch (args[0].toLowerCase()) {
  case 'sort':
    sort();
    break;
  case 'add-language':
    if (args.length < 2) {
      printHelp();
    }
    addNew(args[1]);
    break;
  case 'missing':
    findMissing();
    break;
  default:
    printHelp();
    break;
}
