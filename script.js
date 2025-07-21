const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("userInput"); // ✅ Fixed ID
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];
let conversationHistory = [];

function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function displaySelectedProducts() {
  selectedProductsList.innerHTML = selectedProducts
    .map((p, i) => `
      <div class="selected-product">
        <img src="${p.image}" alt="${p.name}" title="${p.description}" />
        <button onclick="removeSelectedProduct(${i})">Remove</button>
      </div>
    `).join("");
}

function removeSelectedProduct(index) {
  selectedProducts.splice(index, 1);
  saveSelectedProducts();
  displaySelectedProducts();
  highlightSelectedCards();
}

function highlightSelectedCards() {
  document.querySelectorAll(".product-card").forEach(card => {
    const id = parseInt(card.dataset.id);
    if (selectedProducts.some(p => p.id === id)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  allProducts = data.products;
  return data.products;
}

function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(product => `
      <div class="product-card" data-id="${product.id}" title="${product.description}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `).join("");

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      const product = allProducts.find(p => p.id === id);
      const index = selectedProducts.findIndex(p => p.id === id);

      if (index === -1) {
        selectedProducts.push(product);
      } else {
        selectedProducts.splice(index, 1);
      }

      saveSelectedProducts();
      displaySelectedProducts();
      highlightSelectedCards();
    });
  });

  highlightSelectedCards();
}

categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filtered = products.filter(p => p.category === selectedCategory);
  displayProducts(filtered);
});

generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) return;

  const prompt = `Here are the user's selected L'Oréal products:\n${selectedProducts.map(p => `- ${p.name} (${p.brand}): ${p.description}`).join("\n")}\n\nCreate a personalized skincare/beauty routine using these products.`;

  // ✅ Initialize conversation history
  conversationHistory = [
    {
      role: "system",
      content: "You are a helpful skincare and beauty advisor. You only answer questions about routines, skincare, haircare, makeup, fragrance, or the selected products."
    },
    { role: "user", content: prompt }
  ];

  chatWindow.innerHTML += `<div class="chat-message user">Generating your routine...</div>`;

  const res = await fetch("https://billowing-resonance-abf5.dkotthak.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversationHistory })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";

  conversationHistory.push({ role: "assistant", content: reply });

  chatWindow.innerHTML += `<div class="chat-message ai">${formatAsList(reply)}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMsg = chatInput.value.trim();
  if (!userMsg) return;

  chatWindow.innerHTML += `<div class="chat-message user">${userMsg}</div>`;
  chatInput.value = "";

  conversationHistory.push({ role: "user", content: userMsg });

  const res = await fetch("https://billowing-resonance-abf5.dkotthak.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversationHistory })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";

  conversationHistory.push({ role: "assistant", content: reply });

  chatWindow.innerHTML += `<div class="chat-message ai">${formatAsList(reply)}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

window.addEventListener("load", () => {
  displaySelectedProducts();
});

// Helper function to turn plain text into a numbered list
function formatAsList(text) {
  const lines = text
    .replace(/\*\*/g, '') // remove bold
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

  const formattedLines = lines.map(line => {
    const stepMatch = line.match(/^(\d+)\.\s*(.*)/);
    if (stepMatch) {
      const [, number, content] = stepMatch;
      return `<div class="routine-step"><span class="step-number">${number}.</span> <span class="step-title">${content}</span></div>`;
    }

    if (line.startsWith('- ')) {
      return `<div class="sub-point">${line.slice(2)}</div>`;
    }

    return `<div class="routine-step">${line}</div>`;
  });

  return formattedLines.join('');
}





