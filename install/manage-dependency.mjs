import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { totalmem, freemem } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

process.on("uncaughtException", (e) => {
  console.error(e);
  process.exit(1);
});

// language
const lang = {
  de: {
    runRoot:
      "Dieses Skript sollte als User ausgeführt werden, da eventuell sonst nicht auf die Dependencies zugegriffen werden kann. Wenn du standardmäßig alles als Root-User/Administrator machst, fahre fort.\n\nMöchtest du fortfahren? (Bestätige mit Enter): ",
    installDocker:
      "\nDocker ist nicht installiert. Docker gibt es in zwei Varianten: als Server-Version (in der Shell) und als Desktop-Version (mit grafischer Oberfläche). Wenn du lieber eine grafische Oberfläche magst, wird die Desktop-Version empfohlen. Windows-User (über WSL 2) müssen die Desktop Version installieren.\n\n  Desktop-Version:\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Server-Version: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker Compose ist nicht installiert, bitte aktualisiere Deine Docker-Umgebung.\n\n  Siehe: https://docs.docker.com/engine/install/\n  Unter deiner installierten Umgebung",
    installDependency:
      "\nDas Skript wird zunächst die Abhängigkeit frag.jetzt-docker-orchestration installieren.\n\nSoll das Skript forfahren?",
    options:
      "\n\n  Abhängigkeiten verwalten:\n  1. Aktualisieren und Neustarten\n  2. Starten\n  3. Stoppen\n  4. Frontend-Logs anzeigen\n  5. Stoppen und Daten entfernen\n\nWähle eine Option: ",
    sureDelete: "Bist du sicher, dass du alle Daten löschen möchtest?",
    installingNpmDeps: "Pakete werden installiert...",
    howStart: "Wie möchtest du die App starten?",
    startStaging:
      "Führen Sie das Frontend lokal aus und nutzen Sie die Staging-Dienste (Backend, KI, ...) für die benötigten Dienste",
    startProd:
      "Führen Sie das Frontend lokal aus und verwenden Sie die Produktionsdienste (Backend, ai, ...) für die benötigten Dienste. In diesem Modus können nur Gastkonten erstellt werden",
    startDocker:
      "Führen Sie die gesamte Infrastruktur auf dem Rechner mit Docker aus.",
    dockerNotAvailable: "(min. 8GiB RAM, kein Windows)",
    dockerIsRunning: "(Docker läuft bereits)",
    frontendImageMissing: "(Sie müssen zuerst aktualisieren)",
    optionsHeader: "Was möchtest du tun?",
    optionUpdate: "Aktualisieren & Neustarten",
    optionUpdateDesc:
      "Aktualisiere git und Docker-Images und starten Sie dann neu",
    optionStart: "Starten",
    optionStartDesc: "Starten der Docker-Container",
    optionStop: "Stoppen",
    optionStopDesc: "Stoppen der Docker-Container",
    optionLogs: "Logs zeigen",
    optionLogsDesc: "Anzeigen der Docker-Logs des Frontend-Containers",
    optionDelete: "Alles löschen",
    optionDeleteDesc:
      "Lösche die Docker-Container und lösche alle Daten (Volumes)",
  },
  en: {
    runRoot:
      "This script should be executed as a user, otherwise it may not be possible to access the dependencies. If you do everything as root user/administrator by default, continue.\n\nDo you want to continue? (Confirm with Enter): ",
    installDocker:
      "\nDocker is not installed. Docker comes in two versions: as a server version (in the shell) and as a desktop version (with a graphical interface). If you prefer a graphical interface, the desktop version is recommended. Windows users (via WSL 2) must install the desktop version.\n\n  Desktop version:\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Server version: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker compose is not installed, please update your Docker environment.\n\n  See: https://docs.docker.com/engine/install/\n  Under your installed environment",
    installDependency:
      "\nThe script will first install the dependency frag.jetzt-docker-orchestration.\n\nShould the script proceed?",
    options:
      "\n\n  Manage dependencies:\n  1. Update And Restart\n  2. Start\n  3. Stop\n  4. Show logs of frontend\n  5. Stop and remove data\n\nChoose an option: ",
    sureDelete: "Are you sure you want to delete all data?",
    installingNpmDeps: "Packages are being installed...",
    howStart: "How would you like to start the app?",
    startStaging:
      "Run the frontend local and use the staging services (backend, ai, ...) for the needed services",
    startProd:
      "Run the frontend local and use the production services (backend, ai, ...) for the needed services. Only guest accounts can be created in this mode",
    startDocker: "Run the complete infrastructure on the machine with docker.",
    dockerNotAvailable: "(min. 8GiB RAM, no Windows)",
    dockerIsRunning: "(Docker is already running)",
    frontendImageMissing: "(You need to update first)",
    optionsHeader: "What would you like to do?",
    optionUpdate: "Update & Restart",
    optionUpdateDesc: "Update git and Docker images and then restart",
    optionStart: "Start",
    optionStartDesc: "Start the Docker containers",
    optionStop: "Stop",
    optionStopDesc: "Stop the Docker containers",
    optionLogs: "Show logs",
    optionLogsDesc: "Show the Docker logs of the frontend container",
    optionDelete: "Delete all",
    optionDeleteDesc:
      "Delete the Docker containers and delete all data (volumes)",
  },
  fr: {
    runRoot:
      "Ce script doit être exécuté en tant qu'utilisateur, sinon il est possible que les dépendances ne soient pas accessibles. Si vous faites tout par défaut en tant qu'utilisateur root/administrateur, continuez.\n\nSouhaitez-vous continuer ? (Confirme avec Entrée) : ",
    installDocker:
      "\nDocker n'est pas installé. Il existe deux versions de Docker : la version serveur (dans le shell) et la version desktop (avec une interface graphique). Si tu préfères une interface graphique, la version desktop est recommandée. Les utilisateurs de Windows (via WSL 2) doivent installer la version desktop.\n\n  Version desktop :\n    - Linux: https://docs.docker.com/desktop/install/linux-install/\n    - Mac: https://docs.docker.com/desktop/install/mac-install/\n    - Windows: https://docs.docker.com/desktop/install/windows-install/\n\n  Version serveur: https://docs.docker.com/engine/install/",
    installDockerCompose:
      "\nDocker Compose n'est pas installé, tu pourrais mettre à jour ton environnement Docker, s'il te plaît?\n\n  Regarde ici: https://docs.docker.com/engine/install/\n  Sous ton environnement installé",
    installDependency:
      "\nLe script va d'abord installer la dépendance frag.jetzt-docker-orchestration.\n\nLe script doit-il continuer?",
    options:
      "\n\n  Gérer les dépendances:\n  1. Mettre à jour et redémarrer\n  2. Démarrer\n  3. Arrêter\n  4. Afficher les logs frontaux\n  5. Arrêter et supprimer les données\n\nChoisissez une option: ",
    sureDelete: "Es-tu sûr de vouloir supprimer toutes les données?",
    installingNpmDeps: "Les paquets sont installés...",
    howStart: "Comment veux-tu lancer l'application ?",
    startStaging:
      "Exécuter le frontend en local et utiliser les services staging (backend, ai, ...) pour les services nécessaires.",
    startProd:
      "Exécutez le frontend en local et utilisez les services de production (backend, ai, ...) pour les services nécessaires. Seuls les comptes invités peuvent être créés dans ce mode",
    startDocker:
      "Exécuter l'infrastructure complète sur la machine avec docker.",
    dockerNotAvailable: "(min. 8GiB RAM, pas de Windows)",
    dockerIsRunning: "(Docker fonctionne déjà)",
    frontendImageMissing: "(Tu dois d'abord actualiser)",
    optionsHeader: "Qu'est-ce que tu veux faire ?",
    optionUpdate: "Actualiser & redémarrer",
    optionUpdateDesc: "Mettre à jour git et les images Docker, puis redémarrer",
    optionStart: "Démarrer",
    optionStartDesc: "Démarrage des conteneurs Docker",
    optionStop: "Arrêter",
    optionStopDesc: "Arrêter les conteneurs Docker",
    optionLogs: "Afficher les logs",
    optionLogsDesc: "Afficher les logs Docker du conteneur frontal",
    optionDelete: "Tout effacer",
    optionDeleteDesc:
      "Supprime les conteneurs Docker et efface toutes les données (volumes)",
  },
};

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

function printWelcome() {
  const icon = `
            NAAA                 AAAA
            AANA                 ANAA
               WE               EW
             AWidRAEAAAAAAAAAEAR0iWA
         dAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6
        AWWA                         AWWA
        Nd0                           r0Rv
        06       AA           AA       Wdm
    AAI1mW     AAENAA       AAIEAA     Rm6IAA
   A0rrrrW     AR  6A       A1  RA     Rrrrr0A
   ArrrrrW      AAAAv        AAAA      RrrrrrA
   AmrrrrW                             RrrrrmA
   WAWdmrR                             RrrdWAI
      AAAA  AAAAAAAAENNNNNNNEAAAAAAAA  Ri6I
                   iAAIR1WIAAW         Wd
                        m              6Ri
                                     mRWA
                      AAAAAAAAAAAAAAAAAA
                      AAAAAAAAAAAAAAA  `;
  const name = `
   __                    _      _       _
  / _|_ __ __ _  __ _   (_) ___| |_ ___| |_
 | |_| '__/ _\` |/ _\` |  | |/ _ \\ __|_  / __|
 |  _| | | (_| | (_| |_ | |  __/ |_ / /| |_
 |_| |_|  \\__,_|\\__, (_)/ |\\___|\\__/___|\\__|
                 |___/ |__/
                 `;
  console.log(icon);
  console.log(name);
}

function waitForInput(message) {
  return new Promise((resolve) => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question(message, (ans) => {
      readline.close();
      resolve(ans);
    });
  });
}

async function isRoot() {
  try {
    const output = await run("id", ["-u"]);
    return output.toString().trim() === "0";
  } catch (ignore) {}
  const output = await run("whoami", ["/groups"]);
  return output.toString().trim().includes('S-1-16-12288');
}

async function getLanguage(langObj) {
  let langKey;
  try {
    langKey = readFileSync(__dirname + "/lang.txt", "utf-8")
      .toString()
      .trim();
  } catch (ignore) {}
  const keys = Object.keys(langObj).join("/");
  while (!langObj[langKey]) {
    langKey = await waitForInput(
      "Which language do you want to use? (" + keys + "): ",
    );
  }
  writeFileSync(__dirname + "/lang.txt", langKey);
  return langKey;
}

async function hasRunningContainers() {
  if (!existsSync(rootDir + "/dependencies/frag.jetzt-docker-orchestration")) {
    return false;
  }
  if (!(await checkCmd("docker"))) {
    return false;
  }
  const output = await run("sudo", [
    "docker",
    "ps",
    "-q",
    "--no-trunc",
    "--filter",
    "label=com.docker.compose.project=fragjetzt-orchestration",
  ]);
  return output.toString().trim().length > 0;
}

async function hasFrontendImage() {
  const output = await run("sudo", [
    "docker",
    "images",
    "-q",
    "--no-trunc",
    "--filter",
    "reference=local-fragjetzt-dev",
  ]);
  return output.toString().trim().length > 0;
}

printWelcome();

const language = await getLanguage(lang);
const langObj = lang[language];

// check not root user
const hasRoot = await isRoot();
if (hasRoot) {
  await waitForInput(langObj.runRoot);
}

// check node modules
process.chdir(rootDir);
console.log(langObj.installingNpmDeps);
let installer = "npm";
if (await checkProgram("bun")) {
  installer = "bun";
  await run("bun", ["install"]);
} else if (!(await checkCmd("npm", ["ls"]))) {
  await run("npm", ["config", "set", "fund=false"]);
  await run("npm", ["config", "set", "legacy-peer-deps=true"]);
  await run("npm", ["ci", "--no-audit", "--loglevel=error"], {
    stdio: "inherit",
  });
  await run("npm", ["config", "delete", "fund"]);
}

const { select, confirm } = await import("@inquirer/prompts");

const isDockerRunning = await hasRunningContainers();
const canHaveDocker =
  totalmem() >= 7 * 1024 * 1024 * 1024 && process.platform !== "win32";
const answer = await select({
  message: langObj.howStart,
  choices: [
    {
      name: "Staging",
      value: "staging",
      description: langObj.startStaging,
      disabled: isDockerRunning && langObj.dockerIsRunning,
    },
    {
      name: "Production",
      value: "prod",
      description: langObj.startProd,
      disabled: isDockerRunning && langObj.dockerIsRunning,
    },
    {
      name: "Docker",
      value: "docker",
      description: langObj.startDocker,
      disabled:
        !isDockerRunning && !canHaveDocker && langObj.dockerNotAvailable,
    },
  ],
});

// Run with staging
if (answer === "staging") {
  await run(installer, ["run", "start"], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      WS_GATEWAY_WS_ADDRESS: "wss://staging.frag.jetzt/gateway/ws/websocket",
      WS_GATEWAY_WS_REWRITE: "^/gateway/ws/websocket",
      WS_GATEWAY_WS_ORIGIN: "https://staging.frag.jetzt",
      WS_GATEWAY_HTTP_ADDRESS: "https://staging.frag.jetzt/gateway-api",
      WS_GATEWAY_HTTP_REWRITE: "^/gateway-api",
      BACKEND_ADDRESS: "https://staging.frag.jetzt/api",
      BACKEND_SECURE: "true",
      BACKEND_CHANGE_ORIGIN: "true",
      AI_ADDRESS: "https://staging.frag.jetzt/ai",
      AI_SECURE: "true",
      AI_CHANGE_ORIGIN: "true",
    },
  });
  process.exit(0);
}

// Run with production
if (answer === "prod") {
  await run(installer, ["run", "start"], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      WS_GATEWAY_WS_ADDRESS: "wss://frag.jetzt/gateway/ws/websocket",
      WS_GATEWAY_WS_REWRITE: "^/gateway/ws/websocket",
      WS_GATEWAY_WS_ORIGIN: "https://frag.jetzt",
      WS_GATEWAY_HTTP_ADDRESS: "https://frag.jetzt/gateway-api",
      WS_GATEWAY_HTTP_REWRITE: "^/gateway-api",
      BACKEND_ADDRESS: "https://frag.jetzt/api",
      BACKEND_SECURE: "true",
      BACKEND_CHANGE_ORIGIN: "true",
      AI_ADDRESS: "https://frag.jetzt/ai",
      AI_SECURE: "true",
      AI_CHANGE_ORIGIN: "true",
    },
  });
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
const newDir = rootDir + "/dependencies";
if (!existsSync(newDir + "/frag.jetzt-docker-orchestration")) {
  if (!(await confirm({ message: langObj.installDependency }))) {
    process.exit(0);
  }
  if (!existsSync(newDir)) {
    mkdirSync(newDir);
  }
  process.chdir(newDir);
  await run("git", [
    "clone",
    "git@git.thm.de:arsnova/frag.jetzt-docker-orchestration.git",
  ]);
  process.chdir("frag.jetzt-docker-orchestration");
  await run("chmod", ["u+x", "setup.sh"]);
}

// show manage options
async function loop() {
  const hasImage = await hasFrontendImage();
  const runAnswer = await select({
    message: langObj.optionsHeader,
    choices: [
      {
        name: langObj.optionUpdate,
        value: "update",
        description: langObj.optionUpdateDesc,
      },
      {
        name: langObj.optionStart,
        value: "start",
        description: langObj.optionStartDesc,
        disabled: !hasImage && langObj.frontendImageMissing,
      },
      {
        name: langObj.optionStop,
        value: "stop",
        description: langObj.optionStopDesc,
      },
      {
        name: langObj.optionLogs,
        value: "logs",
        description: langObj.optionLogsDesc,
      },
      {
        name: langObj.optionDelete,
        value: "delete",
        description: langObj.optionDeleteDesc,
      },
    ],
  });
  if (runAnswer === "update") {
    // update & restart
    await run("git", ["pull"], execOptions);
    await run(
      "bash",
      [
        "./setup.sh",
        "--recreate-env",
        "--recreate-config",
        "--no-frontend",
        "--sample-data",
        ...additional,
      ],
      execOptions,
    );
    await run("sudo", [...dockerCompose, "pull"], execOptions);
    await run("sudo", [...dockerCompose, "up", "-d", "--build"], execOptions);
    process.chdir(rootDir);
    await run("bash", ["./.docker/setup.sh"], execOptions);
    await run("sudo", [...dockerCompose, "up", "-d", "--build"], execOptions);
    process.exit(0);
  }

  if (runAnswer === "start") {
    // start
    await run(
      "bash",
      [
        "./setup.sh",
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
    await run("bash", ["./.docker/setup.sh"], execOptions);
    await run("sudo", [...dockerCompose, "up", "-d"], execOptions);
    process.exit(0);
  }

  if (runAnswer === "stop") {
    // stop
    process.chdir(rootDir);
    await run("sudo", [...dockerCompose, "down"], execOptions);
    process.chdir(newDir + "/frag.jetzt-docker-orchestration");
    await run("sudo", [...dockerCompose, "down"], execOptions);
    process.exit(0);
  }

  if (runAnswer === "logs") {
    process.chdir(rootDir);
    await run("sudo", [...dockerCompose, "logs", "-f"], execOptions);
    process.exit(0);
  }

  if (runAnswer === "delete") {
    // delete
    if (!(await confirm({ message: langObj.sureDelete }))) {
      return;
    }
    process.chdir(rootDir);
    await run("sudo", [...dockerCompose, "down", "-v"], execOptions);
    process.chdir(newDir + "/frag.jetzt-docker-orchestration");
    await run("sudo", [...dockerCompose, "down", "-v"], execOptions);
    process.exit(0);
  }
}

process.chdir(newDir + "/frag.jetzt-docker-orchestration");
const execOptions = { stdio: "inherit" };
const noBackend = process.argv.includes("--no-backend");
if (noBackend) {
  console.log("No backend will be started.");
}
const additional = noBackend ? ["--no-backend"] : [];
while (true) {
  await loop();
}
