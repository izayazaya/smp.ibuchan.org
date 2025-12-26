document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("player-grid");
    const countLabel = document.getElementById("player-count");
    const searchInput = document.getElementById("search-input");

    // A reliable static fallback image (Official Mojang Steve)
    // This is safer than calling an API that might be rate-limiting us.
    const FALLBACK_IMAGE = "https://assets.mojang.com/SkinTemplates/steve.png";

    let allPlayers = [];

    // 1. Fetch the JSON data
    fetch("data/players.json")
        .then((response) => response.json())
        .then((data) => {
            // Sort players alphabetically
            allPlayers = data.sort((a, b) => a.username.localeCompare(b.username));
            countLabel.textContent = allPlayers.length;
            renderPlayers(allPlayers);
        })
        .catch((error) => console.error("Error loading players:", error));

    // 2. Determine the correct Image URL
    function getImageUrl(player) {
        if (!player.texture_url) return FALLBACK_IMAGE;

        // Premium Player (Visage)
        if (player.texture_url.includes("visage.surgeplay.com")) {
            return player.texture_url.replace("/skin/", "/bust/");
        }

        // Custom/Cracked Skin (Mineatar)
        return `https://api.mineatar.io/bust/custom?url=${player.texture_url}`;
    }

    // 3. Render the Grid
    function renderPlayers(players) {
        grid.innerHTML = "";

        players.forEach((player) => {
            const card = document.createElement("div");
            card.className = "card";

            const imageUrl = getImageUrl(player);

            // THE FIX:
            // 1. 'this.onerror=null' prevents infinite looping if the fallback fails.
            // 2. We set the src to a static Steve PNG (FALLBACK_IMAGE) on error,
            //    which is much lighter than calling the API again.
            card.innerHTML = `
                <img 
                    src="${imageUrl}" 
                    alt="${player.username}" 
                    loading="lazy" 
                    onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';"
                >
                <span>${player.username}</span>
            `;

            grid.appendChild(card);
        });
    }

    // 4. Search Functionality
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allPlayers.filter((p) =>
            p.username.toLowerCase().includes(term),
        );
        renderPlayers(filtered);
    });
});
