const tree = {
  title: "Flash Poll",
  create: {
    title: "Create Flash Poll",
    "select-template": {
      label: "Select a template…",
    },
  },
  "peer-instruction": {
    "second-round": "2nd Poll Round",
    name: "Peer Instruction",
    "result-statistics": {
      title: "Result",
      "result-1": "First Poll",
      "result-2": "Second Poll",
      "start-next": "Start 2nd Poll Round",
      end: "End Peer Instruction",
    },
  },
  edit: {
    "view-as-participant": "Preview from Participant's Perspective:",
    reset: "Reset",
    pause: "Pause",
    delete: "Delete",
    continue: "Resume",
    close: "Close",
    new: "New Poll",
    cancel: "Cancel",
    start: "Start Poll",
  },
  settings: {
    name: "Flash options…",
    option: {
      "result-visibility": {
        text: "Poll results live visible",
        tooltip: "Show poll results in real-time for everyone in the room",
      },
      "user-count-visibility": {
        text: "Participation live visible",
        tooltip: "Show participation in real-time for everyone in the room",
      },
      question: {
        label: "Your Question...",
      },
      editor: "Editor",
      save: "Send Changes to All",
    },
  },
  statistics: {
    "active-user-count": {
      tooltip: "Active Live Poll Participants",
    },
    "room-user-count": {
      tooltip: "Participants in Room",
    },
    "vote-count": {
      text: "Votes:",
    },
  },
  "confirmation-dialog": {
    common: {
      yes: "Yes",
      cancel: "Cancel",
      accept: "Yes",
      continue: "Continue",
      no: "No",
    },
    entries: {
      new: {
        title: "New Poll",
        description:
          "Do you really want to end the current poll and start a new one?",
      },
      delete: {
        title: "End Poll",
        description:
          "Do you really want to end the poll? The voting results will still be displayed, but will be deleted upon leaving the poll.",
      },
      reset: {
        title: "Reset Poll",
        description: "Do you really want to reset the poll?",
      },
      "change-peer-instruction-stage": {
        title: "Start 2nd Poll Round",
        description:
          "Are you sure you want to end the current poll and start the 2nd poll round?",
      },
      "create-peer-instruction": {
        title: "2nd Poll Round",
        description:
          "With the start of the second poll round, you can now observe the development of group opinion. This round allows for the comparison of collective responses of the participants with those from the first round. It helps understand how discussions and exchanges can influence the overall group perspectives.",
      },
      "change-peer-instruction-stage-2": {
        title: "2nd Poll Round",
        description:
          "You can end the live poll. The comparison of the polls will be displayed in a dialog.",
      },
    },
  },
  "snack-bar": {
    vote: {
      make: "Your vote has been counted.",
      delete: "Your vote has been reset.",
    },
  },
  misc: {
    live: "LIVE",
  },
};
const old = {
  live: "LIVE",
  "create-dialog-title": "Create Flash Poll",
  "dialog-title": "Flash Poll",
  "option-select-title": "Your Question...",
  "dialog-preview-title": "Preview from Participant's Perspective:",
  create: "Start Poll",
  participants: "Participants in Room",
  user: "Active Live Poll Participants",
  close: "Close",
  cancel: "Cancel",
  save: "Send Changes to All",
  new: "New Poll",
  "vote-make": "Your vote has been counted.",
  "vote-delete": "Your vote has been reset.",
  "peerInstruction-end": "End Poll",
  "peerInstruction-start-phase-2": "Start 2nd Poll Round",
  "peerInstruction-comparison-results-1": "First Poll",
  "peerInstruction-comparison-results-2": "Second Poll",
  "peerInstruction-comparison-title": "Result",
  "peerInstruction-button": "",
  "peerInstruction-phase-2-marker": "",
  "peerInstruction-title-1": "2nd Poll Round",
  "peerInstruction-title-2": "2nd Poll Round",
  "peerInstruction-description-phase-1":
    "With the start of the second poll round, you can now observe the development of group opinion. This round allows for the comparison of collective responses of the participants with those from the first round. It helps understand how discussions and exchanges can influence the overall group perspectives.",
  "peerInstruction-description-phase-2":
    "You can end the live poll. The comparison of the polls will be displayed in a dialog.",
  "dialog-confirm-peerInstruction-show1stStageResults-description":
    "Are you sure you want to end the current poll and start the 2nd poll round?",
  "dialog-confirm-peerInstruction-show1stStageResults-title":
    "Start 2nd Poll Round",
  "dialog-confirm-create-new-description":
    "Do you really want to end the current poll and start a new one?",
  "dialog-confirm-create-new-title": "New Poll",
  "dialog-confirm-delete-description":
    "Do you really want to end the poll? The voting results will still be displayed, but will be deleted upon leaving the poll.",
  "dialog-confirm-delete-title": "End Poll",
  "dialog-confirm-resetResults-description":
    "Do you really want to reset the poll?",
  "dialog-confirm-resetResults-title": "Reset Poll",
  votes: "Votes:",
  "confirm-yes": "Yes",
  "confirm-cancel": "Cancel",
  "confirm-accept": "Accept",
  "confirm-continue": "Continue",
  "confirm-no": "No",
  "creator-settings": "Flash options…",
  "creator-settings-icon": "flash_on",
  "creator-settings-delete": "Delete",
  "creator-settings-pause": "Pause",
  "creator-settings-continue": "Resume",
  "creator-settings-open-editor": "Editor",
  "settings-resetResults": "Reset",
  "option-select-result-visibility": "Poll results live visible",
  "tooltip-option-select-result-visibility":
    "Show poll results in real-time for everyone in the room",
  "option-select-views-visibility": "Participation live visible",
  "tooltip-option-select-views-visibility":
    "Show participation in real-time for everyone in the room",
  "option-select-template": "Select a template…",
};

const util = require("util");
const map = new Map();
for (let [key, value] of Object.entries(old)) {
  if (!map.has(value)) {
    map.set(value, [key]);
  } else {
    map.get(value).push(key);
  }
}
console.log(map);
const treeMap = applyTreeNode(tree);
const translations = ["de", "fr"];
const fs = require("fs");
for (let translation of translations) {
  const source = JSON.parse(
    fs.readFileSync(`livepoll/${translation}.json`).toString("utf8"),
  ).common;
  const result = applyTreeMap(source);
  fs.writeFileSync(`livepoll/_${translation}.json`, JSON.stringify(result));
}

function applyTreeMap(data) {
  const newMap = new Map();
  for (let [key, value] of Object.entries(data)) {
    newMap.set(key, value);
  }
  return applyNode(treeMap);

  function applyNode(node) {
    const obj = {};
    for (let [key, value] of Object.entries(node)) {
      if (typeof value === "object") {
        obj[key] = applyNode(value);
      } else {
        obj[key] = newMap.get(value) || "$undefined";
      }
    }
    return obj;
  }
}

function applyTreeNode(node) {
  const obj = {};
  for (let [key, value] of Object.entries(node)) {
    if (typeof value === "object") {
      obj[key] = applyTreeNode(value);
    } else {
      if (!map.has(value)) {
        obj[key] = "$undefined";
      } else {
        obj[key] = map.get(value)[0];
      }
    }
  }
  return obj;
}
