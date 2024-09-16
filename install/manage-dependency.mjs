import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});
readline.pause();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const yesKey = "yYjJoO";
const noKey = "nN";

// language
const lang = {
  de: {
    runRoot:
      "Dieses Skript sollte als User ausgeführt werden, da eventuell sonst nicht auf die Dependencies zugegriffen werden kann. Wenn du standardmäßig alles als Root-User machst, fahre fort.\n\nMöchtest du fortfahren? (Ja [y/j/o] / Nein [n]): ",
    installDocker:
      "\nDocker ist nicht installiert. Docker gibt es in zwei Varianten: als Server-Version (in der Shell) und als Desktop-Version (mit grafischer Oberfläche). Wenn du lieber eine grafische Oberfläche magst, wird die Desktop-Version empfohlen. Windows-User (über WSL 2) müssen die Desktop Version installieren.\n\n  Desktop-Version:\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Server-Version: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker Compose ist nicht installiert, bitte aktualisiere Deine Docker-Umgebung.\n\n  Siehe: https://docs.docker.com/engine/install/\n  Unter deiner installierten Umgebung",
    installDependency:
      "\nDas Skript wird zunächst die Abhängigkeit frag.jetzt-docker-orchestration installieren.\n\nSoll das Skript forfahren? (Ja [y/j/o] / Nein [n]): ",
    options:
      "\n\n  Abhängigkeiten verwalten:\n  1. Aktualisieren und Neustarten\n  2. Starten\n  3. Stoppen\n  4. Frontend-Logs anzeigen\n  5. Stoppen und Daten entfernen\n\nWähle eine Option: ",
    sureDelete:
      "Bist du sicher, dass du alle Daten löschen möchtest? (Ja [y/j/o] / Nein [n]): ",
  },
  en: {
    runRoot:
      "This script should be run as a user, as otherwise access to the dependencies may not be possible. If you do everything as a root user by default, continue.\n\nDo you want to continue? (Yes [y/j/o] / No [n]): ",
    installDocker:
      "\nDocker is not installed. Docker comes in two versions: as a server version (in the shell) and as a desktop version (with a graphical interface). If you prefer a graphical interface, the desktop version is recommended. Windows users (via WSL 2) must install the desktop version.\n\n  Desktop version:\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Server version: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker compose is not installed, please update your Docker environment.\n\n  See: https://docs.docker.com/engine/install/\n  Under your installed environment",
    installDependency:
      "\nThe script will first install the dependency frag.jetzt-docker-orchestration.\n\nShould the script proceed? (Yes [y/j/o] / No [n]): ",
    options:
      "\n\n  Manage dependencies:\n  1. Update And Restart\n  2. Start\n  3. Stop\n  4. Show logs of frontend\n  5. Stop and remove data\n\nChoose an option: ",
    sureDelete:
      "Are you sure you want to delete all data? (Yes [y/j/o] / No [n]): ",
  },
  fr: {
    runRoot:
      "Ce script doit être exécuté en tant qu'utilisateur, sinon l'accès aux dépendances peut ne pas être possible. Si vous faites tout en tant qu'utilisateur root par défaut, continuez.\n\nVoulez-vous continuer? (Oui [y/j/o] / Non [n]): ",
    installDocker:
      "\nDocker n'est pas installé. Il existe deux versions de Docker : la version serveur (dans le shell) et la version desktop (avec une interface graphique). Si tu préfères une interface graphique, la version desktop est recommandée. Les utilisateurs de Windows (via WSL 2) doivent installer la version desktop.\n\n  Version desktop :\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Version serveur: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker Compose n'est pas installé, tu pourrais mettre à jour ton environnement Docker, s'il te plaît?\n\n  Regarde ici: https://docs.docker.com/engine/install/\n  Sous ton environnement installé",
    installDependency:
      "\nLe script va d'abord installer la dépendance frag.jetzt-docker-orchestration.\n\nLe script doit-il continuer? (Oui [y/j/o] / Non [n]): ",
    options:
      "\n\n  Gérer les dépendances:\n  1. Mettre à jour et redémarrer\n  2. Démarrer\n  3. Arrêter\n  4. Afficher les logs frontaux\n  5. Arrêter et supprimer les données\n\nChoisissez une option: ",
    sureDelete:
      "Es-tu sûr de vouloir supprimer toutes les données? (Oui [o] / Non [n]): ",
  },
};

function prompt(message) {
  return new Promise((resolve) => {
    readline.question(message, (answer) => {
      readline.pause();
      resolve(answer);
    });
  });
}

async function tryAwait(promise) {
  try {
    return await promise;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function confirm(message) {
  let key;
  while (!key || (!yesKey.includes(key) && !noKey.includes(key))) {
    key = await prompt(message);
  }
  return !noKey.includes(key);
}

function run(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true, ...options });
    let output = "";
    if (child.stdout) {
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (data) => {
        output += data.toString();
      });
    }
    let error = "";
    if (child.stderr) {
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (data) => {
        error += data.toString();
      });
    }
    child.on("error", (e) => {
      reject(e);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject({ code, error });
      }
    });
  });
}

async function checkCmd(cmd, ...args) {
  try {
    await run(cmd, args);
  } catch {
    return false;
  }
  return true;
}

async function checkProgram(program) {
  // unix || windows
  return (
    (await checkCmd("which", program)) || (await checkCmd("where", program))
  );
}

async function getLanguage(langObj) {
  let langKey;
  try {
    langKey = readFileSync(__dirname + "/lang.txt", "utf-8")
      .toString()
      .trim();
  } catch (e) {
    while (!langObj[langKey]) {
      langKey = await prompt("Which language do you want to use? (de/en/fr): ");
    }
  }
  langKey = langObj[langKey] ? langKey : "en";
  writeFileSync(__dirname + "/lang.txt", langKey);
  return langKey;
}

const language = await getLanguage(lang);
const langObj = lang[language];

// check not root user
const isRoot = (await run("id", ["-u"])).toString().trim() === "0";
if (isRoot && !(await confirm(langObj.runRoot))) {
  process.exit(0);
}

// Docker installed
if (!(await checkProgram("docker"))) {
  console.log(langObj.installDocker);
  process.exit(1);
}

let dockerCompose;
if (await checkCmd("docker", "compose", "version")) {
  dockerCompose = ["docker", "compose"];
} else if (await checkCmd("docker-compose", "version")) {
  dockerCompose = ["docker-compose"];
} else {
  console.log(langObj.installDockerCompose);
  process.exit(1);
}

// check not installed
const rootDir = __dirname + "/..";
const newDir = rootDir + "/dependencies";
if (!existsSync(newDir + "/frag.jetzt-docker-orchestration")) {
  if (!(await confirm(langObj.installDependency))) {
    process.exit(0);
  }
  if (!existsSync(newDir)) {
    mkdirSync(newDir);
  }
  process.chdir(newDir);
  await tryAwait(
    run("git", [
      "clone",
      "git@git.thm.de:arsnova/frag.jetzt-docker-orchestration.git",
    ]),
  );
  process.chdir("frag.jetzt-docker-orchestration");
  await tryAwait(run("chmod", ["u+x", "setup.sh"]));
}

// show manage options
process.chdir(newDir + "/frag.jetzt-docker-orchestration");
process.on("uncaughtException", (e) => {
  console.error(e);
  process.exit(0);
});
const execOptions = { stdio: "inherit" };
while (true) {
  const noBackend = process.argv.includes("--no-backend");
  if (noBackend) {
    console.log("No backend will be started.");
  }
  const additional = noBackend ? ["--no-backend"] : [];
  const option = await prompt(langObj.options);
  if (option === "1") {
    // update & restart
    await run("git", ["pull"], execOptions);
    await run(
      "./setup.sh",
      [
        "--recreate-env",
        "--recreate-config",
        "--no-frontend",
        "--sample-data",
        ...additional,
      ],
      execOptions,
    );
    await run("sudo", [...dockerCompose, "pull"], execOptions);
    await run("sudo", [...dockerCompose, "build"], execOptions);
    await run("sudo", [...dockerCompose, "up", "-d"], execOptions);
    process.chdir(rootDir);
    await run("./.docker/setup.sh", execOptions);
    await run("sudo", [...dockerCompose, "build"], execOptions);
    await run("sudo", [...dockerCompose, "up", "-d"], execOptions);
    process.exit(0);
  } else if (option === "2") {
    // start
    await run(
      "./setup.sh",
      [
        "--recreate-env",
        "--recreate-config",
        "--no-frontend",
        "--sample-data",
        ...additional,
      ],
      execOptions,
    );
    await run("sudo", [...dockerCompose, "up", "-d"], execOptions);
    process.chdir(rootDir);
    await run("./.docker/setup.sh", execOptions);
    await run("sudo", [...dockerCompose, "up", "-d"], execOptions);
    process.exit(0);
  } else if (option === "3") {
    // stop
    process.chdir(rootDir);
    await run("sudo", [...dockerCompose, "down"], execOptions);
    process.chdir(newDir + "/frag.jetzt-docker-orchestration");
    await run("sudo", [...dockerCompose, "down"], execOptions);
    process.exit(0);
  } else if (option === "4") {
    process.chdir(rootDir);
    readline.close();
    await run("sudo", [...dockerCompose, "logs", "-f"], execOptions);
    process.exit(0);
  } else if (option === "5") {
    // delete
    if (!(await confirm(langObj.sureDelete))) {
      continue;
    }
    process.chdir(rootDir);
    await run("sudo", [...dockerCompose, "down", "-v"], execOptions);
    process.chdir(newDir + "/frag.jetzt-docker-orchestration");
    await run("sudo", [...dockerCompose, "down", "-v"], execOptions);
    process.exit(0);
  }
}
