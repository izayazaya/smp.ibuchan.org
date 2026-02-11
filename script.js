document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("player-grid");
    const countLabel = document.getElementById("player-count");
    const searchInput = document.getElementById("search-input");

    fetch("data/players.json")
        .then((res) => res.json())
        .then((data) => {
            const sorted = data.sort((a, b) =>
                a.username.localeCompare(b.username, undefined, {
                    sensitivity: "base",
                }),
            );
            if (countLabel) countLabel.textContent = sorted.length;
            grid.innerHTML = sorted
                .map(
                    (player) => `
                <div class="card">
                    <img class="skin-render" 
                         src="renders/${player.username}.png" 
                         onerror="this.src='https://crafatar.com/renders/body/8667ba71-b85a-4004-af54-457a9734eed7?scale=10'">
                    <span>${player.username}</span>
                </div>
            `,
                )
                .join("");
        });

    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll(".card").forEach((card) => {
            const name = card.querySelector("span").textContent.toLowerCase();
            card.style.display = name.includes(term) ? "flex" : "none";
        });
    });
});
