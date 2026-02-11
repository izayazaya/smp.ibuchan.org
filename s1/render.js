const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto"); // Built-in for comparing file versions

const RENDERS_DIR = "./renders";
const HISTORY_DIR = "./renders/history";
const PLAYERS_JSON = "./data/players.json";

// Helper to get a quick hash of a file to see if the skin actually changed
function getFileHash(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return crypto
        .createHash("md5")
        .update(fs.readFileSync(filePath))
        .digest("hex");
}

async function run() {
    if (!fs.existsSync(RENDERS_DIR))
        fs.mkdirSync(RENDERS_DIR, { recursive: true });
    if (!fs.existsSync(HISTORY_DIR))
        fs.mkdirSync(HISTORY_DIR, { recursive: true });

    const players = JSON.parse(fs.readFileSync(PLAYERS_JSON, "utf8"));
    const libPath = path.resolve(
        __dirname,
        "node_modules/skinview3d/bundles/skinview3d.bundle.js",
    );
    const libSource = fs.readFileSync(libPath, "utf8");

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(`<canvas id="skin_container"></canvas>`);
    await page.addScriptTag({ content: libSource });

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const filePath = path.join(RENDERS_DIR, `${player.username}.png`);

        // --- SKIN RESOLUTION LOGIC ---
        let skinUrl =
            player.custom_texture || `https://minotar.net/skin/${player.username}`;

        try {
            const response = await axios.get(skinUrl, {
                responseType: "arraybuffer",
            });
            const base64Skin = `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`;

            // Generate the new render in a temporary buffer first to compare
            const newRenderBuffer = await page.evaluate(async (dataUrl) => {
                const canvas = document.getElementById("skin_container");
                const viewer = new skinview3d.SkinViewer({
                    canvas,
                    width: 300,
                    height: 400,
                    alpha: true,
                });
                viewer.camera.position.set(15, 8, 35);
                viewer.camera.lookAt(0, 12, 0);

                await viewer.loadSkin(dataUrl);
                viewer.render();
                return canvas.toDataURL("image/png").split(",")[1];
            }, base64Skin);

            const newRenderHash = crypto
                .createHash("md5")
                .update(newRenderBuffer, "base64")
                .digest("hex");
            const oldRenderHash = getFileHash(filePath);

            if (oldRenderHash && oldRenderHash !== newRenderHash) {
                // SKIN CHANGED! Move old one to history
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const historyPath = path.join(
                    HISTORY_DIR,
                    `${player.username}_${timestamp}.png`,
                );
                fs.renameSync(filePath, historyPath);
                console.log(`   📦 Archived old skin for ${player.username}`);
            }

            if (oldRenderHash !== newRenderHash) {
                fs.writeFileSync(filePath, Buffer.from(newRenderBuffer, "base64"));
                console.log(`   ✅ Success (${oldRenderHash ? "Updated" : "New"})`);
            } else {
                console.log(`   ⏩ No change for ${player.username}`);
            }
        } catch (err) {
            console.error(`   ❌ Failed ${player.username}: ${err.message}`);
        }
    }
    await browser.close();
}
run();
