document.addEventListener("DOMContentLoaded", () => {
    console.log("Script loaded, fetching players...");

    const grid = document.getElementById("player-grid"); // Make sure your HTML grid ID matches this
    const countLabel = document.getElementById("player-count");
    const searchInput = document.getElementById("search-input");

    // Default Fallback Skin
    const FALLBACK_SKIN = "https://assets.mojang.com/SkinTemplates/steve.png";

    fetch("data/players.json")
        .then((response) => {
            if (!response.ok) throw new Error("JSON file not found!");
            return response.json();
        })
        .then((data) => {
            console.log("Players loaded:", data.length);

            // Sort A-Z
            const sorted = data.sort((a, b) =>
                a.username.localeCompare(b.username, undefined, {
                    sensitivity: "base",
                }),
            );

            if (countLabel) countLabel.textContent = sorted.length;
            renderPlayers(sorted);
        })
        .catch((error) => {
            console.error("Error loading players:", error);
            if (grid)
                grid.innerHTML = `<p style="color:red">Error loading data/players.json</p>`;
        });

    function getSkinUrl(player) {
        if (player.custom_texture && player.custom_texture.length > 5) {
            let url = player.custom_texture;
            if (url.startsWith("http://")) url = url.replace("http://", "https://");
            return url;
        }
        return `https://minotar.net/skin/${player.username}`;
    }

    function renderPlayers(players) {
        if (!grid) return;
        grid.innerHTML = "";

        players.forEach((player) => {
            const card = document.createElement("div");
            card.className = "card";

            const skinUrl = getSkinUrl(player);

            // 1. Scene
            const scene = document.createElement("div");
            scene.className = "scene";

            // 2. Cube
            const cube = document.createElement("div");
            cube.className = "cube";

            // 3. Faces
            const faces = ["front", "back", "right", "left", "top", "bottom"];

            faces.forEach((faceName) => {
                const face = document.createElement("div");
                face.className = `face face-${faceName}`;
                face.style.backgroundImage = `url('${skinUrl}')`;

                // Background fail-safe
                const imgTest = new Image();
                imgTest.src = skinUrl;
                imgTest.onerror = () => {
                    console.warn(`Skin failed for ${player.username}, using fallback.`);
                    face.style.backgroundImage = `url('${FALLBACK_SKIN}')`;
                };

                cube.appendChild(face);
            });

            scene.appendChild(cube);
            card.appendChild(scene);

            // 4. Name
            const name = document.createElement("span");
            name.textContent = player.username;
            card.appendChild(name);

            grid.appendChild(card);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            // Re-fetch logic or filter logic here if needed
            // For now, simpler to just hide elements or re-render
            const term = e.target.value.toLowerCase();
            const cards = grid.querySelectorAll(".card");
            cards.forEach((card) => {
                const name = card.querySelector("span").textContent.toLowerCase();
                card.style.display = name.includes(term) ? "block" : "none";
            });
        });
    }
});
