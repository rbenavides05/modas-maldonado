document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "";

  const cartCount = document.querySelector(".cart-count");
  const openCartButton = document.getElementById("open-cart");
  const closeCartButton = document.getElementById("close-cart");
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  const cartItemsContainer = document.getElementById("cart-items");
  const totalPrice = document.getElementById("cart-total-price");
  const sendBtn = document.getElementById("send-cart-whatsapp");
  const productsGrid = document.getElementById("products-grid");
  const categoriesGrid = document.getElementById("categories-grid");
  const productsSection = document.getElementById("productos");

  const searchToggle = document.getElementById("search-toggle");
  const searchBox = document.getElementById("search-box");
  const productSearch = document.getElementById("product-search");

  let cart = JSON.parse(localStorage.getItem("modasCart")) || [];
  let allProducts = [];
  let selectedCategory = "todos";
  let currentSearchText = "";

  const saveCart = () => {
    localStorage.setItem("modasCart", JSON.stringify(cart));
  };

  const openCart = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  };

  const closeCart = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  };

  const showMessage = (text) => {
    const existingMessage = document.querySelector(".custom-message");
    if (existingMessage) existingMessage.remove();

    const message = document.createElement("div");
    message.className = "custom-message";
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add("show");
    }, 10);

    setTimeout(() => {
      message.classList.remove("show");
      setTimeout(() => message.remove(), 300);
    }, 2200);
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return `$${Number(value).toFixed(2)}`;
  };

  const createProductCard = (product) => {
    const isOutOfStock = product.stock === "agotado";
    const statusClass = isOutOfStock ? "out-stock" : "in-stock";
    const statusText = isOutOfStock ? "Agotado" : "Disponible";

    let saleInfoHtml = "";

    if (product.sale_type === "promo" && product.promo_text) {
      saleInfoHtml = `<p class="product-promo-text">${product.promo_text}</p>`;
    } else if (product.sale_type === "combo" && product.promo_text) {
      saleInfoHtml = `
        <p class="product-combo-label">Combo especial</p>
        <p class="product-promo-text">${product.promo_text}</p>
      `;
    }

    const basePriceHtml = product.price
      ? `<p class="product-price">${formatPrice(product.price)}</p>`
      : "";

    return `
      <article class="product-card" data-category="${product.category}">
        <div class="product-image-wrapper">
          <button class="product-like" aria-label="Agregar a favoritos" type="button">
            <i class="ri-heart-line"></i>
          </button>
          <img src="${product.image_url}" alt="${product.name}">
          <span class="product-status ${statusClass}">${statusText}</span>
        </div>

        <div class="product-content">
          <p class="product-category">${product.category}</p>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          ${saleInfoHtml}
          ${basePriceHtml}

          <button
            class="add-cart-btn ${isOutOfStock ? "disabled-btn" : ""}"
            data-id="${product.id}"
            data-name="${product.name}"
            data-price="${product.price || 0}"
            data-image="${product.image_url}"
            data-stock="${product.stock}"
            type="button"
          >
            ${isOutOfStock ? "Agotado" : "Agregar al carrito"}
          </button>
        </div>
      </article>
    `;
  };

  const attachCartEventsToButtons = () => {
    const buttons = document.querySelectorAll(".add-cart-btn");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const stock = btn.dataset.stock;

        if (stock === "agotado") {
          showMessage("Producto no disponible");
          return;
        }

        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price);
        const image = btn.dataset.image;

        const existing = cart.find((item) => item.id === id);

        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ id, name, price, image, qty: 1 });
        }

        saveCart();
        updateCart();
        showMessage("Producto agregado al carrito");
      });
    });
  };

  const renderCategories = () => {
    if (!allProducts.length) {
      categoriesGrid.innerHTML = `<button class="category-card active" data-category="todos" type="button">Todos</button>`;
      return;
    }

    const uniqueCategories = [...new Set(allProducts.map(product => product.category).filter(Boolean))];

    categoriesGrid.innerHTML = `
      <button class="category-card ${selectedCategory === "todos" ? "active" : ""}" data-category="todos" type="button">
        Todos
      </button>
      ${uniqueCategories.map(category => `
        <button class="category-card ${selectedCategory === category ? "active" : ""}" data-category="${category}" type="button">
          ${category}
        </button>
      `).join("")}
    `;

    const categoryButtons = categoriesGrid.querySelectorAll(".category-card");

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;
        renderCategories();
        renderProducts();
        productsSection.scrollIntoView({ behavior: "smooth" });
      });
    });
  };

  const getFilteredProducts = () => {
    let filtered = [...allProducts];

    if (selectedCategory !== "todos") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (currentSearchText.trim() !== "") {
      const search = currentSearchText.toLowerCase();

      filtered = filtered.filter(product =>
        (product.name || "").toLowerCase().includes(search) ||
        (product.category || "").toLowerCase().includes(search) ||
        (product.description || "").toLowerCase().includes(search) ||
        (product.promo_text || "").toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const renderProducts = () => {
    if (!allProducts.length) {
      productsGrid.innerHTML = `<p class="loading-products">Aún no hay productos registrados.</p>`;
      return;
    }

    const filteredProducts = getFilteredProducts();

    if (!filteredProducts.length) {
      productsGrid.innerHTML = `<p class="loading-products">No se encontraron productos con esa búsqueda.</p>`;
      return;
    }

    productsGrid.innerHTML = filteredProducts.map(createProductCard).join("");
    attachCartEventsToButtons();
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const products = await response.json();

      if (!response.ok) {
        productsGrid.innerHTML = `<p class="loading-products">No se pudieron cargar los productos.</p>`;
        return;
      }

      allProducts = products;
      renderCategories();
      renderProducts();
    } catch (error) {
      console.error("Error cargando productos:", error);
      productsGrid.innerHTML = `<p class="loading-products">Error al conectar con el catálogo.</p>`;
    }
  };

  function updateCart() {
    cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<p class="empty-cart-message">Tu carrito está vacío.</p>`;
      totalPrice.textContent = "$0.00";
      saveCart();
      return;
    }

    let total = 0;

    cartItemsContainer.innerHTML = cart.map((item, i) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;

      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-top">
              <h4 class="cart-item-name">${item.name}</h4>
              <div class="cart-item-line-price">$${lineTotal.toFixed(2)}</div>
            </div>

            <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>

            <div class="cart-item-bottom">
              <div class="cart-controls">
                <button class="qty-btn" data-action="decrease" data-index="${i}">-</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" data-action="increase" data-index="${i}">+</button>
              </div>

              <button class="remove-cart-item" data-action="remove" data-index="${i}" aria-label="Eliminar producto">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    totalPrice.textContent = `$${total.toFixed(2)}`;
    saveCart();

    const actionButtons = cartItemsContainer.querySelectorAll("[data-action]");
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "increase") cart[index].qty += 1;

        if (action === "decrease") {
          cart[index].qty -= 1;
          if (cart[index].qty <= 0) cart.splice(index, 1);
        }

        if (action === "remove") cart.splice(index, 1);

        updateCart();
      });
    });
  }

  if (searchToggle && searchBox && productSearch) {
    searchToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      searchBox.classList.toggle("active");

      if (searchBox.classList.contains("active")) {
        setTimeout(() => {
          productSearch.focus();
        }, 80);
      }
    });

    searchBox.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    productSearch.addEventListener("input", (e) => {
      currentSearchText = e.target.value;

      if (currentSearchText.trim() !== "") {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }

      renderProducts();
    });

    productSearch.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchBox.classList.remove("active");
        productSearch.blur();
      }
    });

    document.addEventListener("click", () => {
      searchBox.classList.remove("active");
    });
  }

  openCartButton.addEventListener("click", openCart);
  closeCartButton.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  sendBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showMessage("Tu carrito está vacío");
      return;
    }

    let total = 0;
    let msg = "Hola, quiero estos productos:%0A%0A";

    cart.forEach((item, i) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      msg += `${i + 1}. ${item.name} x${item.qty} - $${lineTotal.toFixed(2)}%0A`;
    });

    msg += `%0ATotal estimado: $${total.toFixed(2)}%0A%0AQuisiera más información, por favor.`;

    window.open(`https://wa.me/593989455281?text=${msg}`, "_blank");
  });

  updateCart();
  loadProducts();
});