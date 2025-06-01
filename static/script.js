function searchDeals() {
  const query = document.getElementById("query").value.trim();
  const container = document.getElementById("results");
  if (!query) return alert("Please enter a product name.");

  container.innerHTML = "<p>Loading...</p>";

  fetch("https://ai-voice-deal-finder.onrender.com//search?q=" + encodeURIComponent(query))
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      const min = parseInt(document.getElementById("minPrice").value) || 0;
      const max = parseInt(document.getElementById("maxPrice").value) || Infinity;
      const primeOnly = document.getElementById("primeOnly").checked;

      const filtered = data.filter(deal => {
        const priceNum = parseInt(deal.price.replace(/[^0-9]/g, '')) || 0;
        const matchesPrice = priceNum >= min && priceNum <= max;
        const matchesPrime = !primeOnly || deal.title.toLowerCase().includes("prime");
        return matchesPrice && matchesPrime;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<p>No products match your filters.</p>`;
        return;
      }

      filtered.forEach(deal => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${deal.image}" alt="Product image" />
          <h3>${deal.title}</h3>
          <p><strong>Price:</strong> ${deal.price}</p>
          <p><strong>Rating:</strong> ${deal.rating || "Not rated"}</p>
          <p><strong>Delivery:</strong> ${deal.delivery}</p>
          <a href="${deal.link}" target="_blank">View on Amazon</a>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Fetch error:", err);
      container.innerHTML = "<p>Server error. Please check console.</p>";
    });
}

function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser doesn't support voice recognition.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  document.getElementById("results").innerHTML = "<p>🎤 Listening...</p>";

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("query").value = transcript;
    searchDeals();
  };

  recognition.onerror = function (event) {
    console.error("Voice error:", event.error);
    alert("Voice recognition error: " + event.error);
  };
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

window.onload = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
};
