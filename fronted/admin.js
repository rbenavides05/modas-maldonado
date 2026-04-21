const BACKEND_URL = "";

const form = document.getElementById("admin-product-form");
const message = document.getElementById("admin-message");
const adminProductsBody = document.getElementById("admin-products-body");
const submitButton = document.querySelector(".admin-submit-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");

const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const saleTypeInput = document.getElementById("sale_type");
const priceInput = document.getElementById("price");
const promoTextInput = document.getElementById("promo_text");
const descriptionInput = document.getElementById("description");
const stockInput = document.getElementById("stock");
const imageInput = document.getElementById("image");

const imagePreviewBox = document.getElementById("image-preview-box");
const imagePreview = document.getElementById("image-preview");
const imagePreviewText = document.getElementById("image-preview-text");

let editingProductId = null;
let editingImageUrl = null;

const setMessage = (text, type = "info") => {
  message.textContent = text;
  message.className = `admin-message ${type}`;
};

const clearMessage = () => {
  message.textContent = "";
  message.className = "admin-message";
};

const updateSubmitButton = () => {
  const isEditing = Boolean(editingProductId);

  submitButton.textContent = isEditing ? "Actualizar producto" : "Guardar producto";

  if (cancelEditButton) {
    cancelEditButton.hidden = !isEditing;
  }
};

const updateSaleTypeUI = () => {
  const saleType = saleTypeInput.value;

  if (saleType === "normal") {
    priceInput.disabled = false;
    promoTextInput.disabled = true;
    promoTextInput.value = "";
    promoTextInput.placeholder = "No aplica para producto normal";
  } else {
    priceInput.disabled = false;
    promoTextInput.disabled = false;
    promoTextInput.placeholder = "Ej: 1x$20 - 2x$35 - 3x$45";
  }
};

const resetImagePreview = () => {
  imagePreview.src = "";
  imagePreview.style.display = "none";
  imagePreviewBox.classList.remove("has-image");
  imagePreviewText.textContent = "Vista previa de la imagen";
};

const showExistingImagePreview = (url) => {
  if (!url) {
    resetImagePreview();
    return;
  }

  imagePreview.src = url;
  imagePreview.style.display = "block";
  imagePreviewBox.classList.add("has-image");
  imagePreviewText.textContent = "Imagen actual del producto";
};

const previewSelectedImage = () => {
  const file = imageInput.files[0];

  if (!file) {
    if (editingImageUrl) {
      showExistingImagePreview(editingImageUrl);
    } else {
      resetImagePreview();
    }
    return;
  }

  if (!file.type.startsWith("image/")) {
    setMessage("El archivo seleccionado no es una imagen válida.", "error");
    imageInput.value = "";
    if (editingImageUrl) {
      showExistingImagePreview(editingImageUrl);
    } else {
      resetImagePreview();
    }
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
    imagePreviewBox.classList.add("has-image");
    imagePreviewText.textContent = file.name;
  };

  reader.readAsDataURL(file);
};

const validateForm = () => {
  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const saleType = saleTypeInput.value;
  const price = priceInput.value.trim();
  const promoText = promoTextInput.value.trim();
  const description = descriptionInput.value.trim();
  const stock = stockInput.value;
  const imageFile = imageInput.files[0];

  if (!name) {
    setMessage("Debes ingresar el nombre del producto.", "error");
    return false;
  }

  if (!category) {
    setMessage("Debes seleccionar una categoría.", "error");
    return false;
  }

  if (!saleType) {
    setMessage("Debes seleccionar el tipo de venta.", "error");
    return false;
  }

  if (!description) {
    setMessage("Debes escribir una descripción.", "error");
    return false;
  }

  if (!stock) {
    setMessage("Debes seleccionar el estado del producto.", "error");
    return false;
  }

  const hasExistingImage = Boolean(editingImageUrl);
  const hasNewImage = Boolean(imageFile);

  if (!hasExistingImage && !hasNewImage) {
    setMessage("Debes seleccionar una imagen.", "error");
    return false;
  }

  if (saleType === "normal" && !price) {
    setMessage("Para un producto normal, debes ingresar un precio base.", "error");
    return false;
  }

  if ((saleType === "combo" || saleType === "promo") && !price && !promoText) {
    setMessage("Para combos o promociones, debes ingresar precio base o texto promocional.", "error");
    return false;
  }

  if (price && Number(price) < 0) {
    setMessage("El precio no puede ser negativo.", "error");
    return false;
  }

  return true;
};

const safeJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no válida del servidor: ${text.slice(0, 120)}`);
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `$${Number(value).toFixed(2)}`;
};

const getPriceOrPromo = (product) => {
  if (product.promo_text && product.price) {
    return `${formatPrice(product.price)} | ${product.promo_text}`;
  }

  if (product.promo_text) {
    return product.promo_text;
  }

  return formatPrice(product.price);
};

const resetFormState = () => {
  editingProductId = null;
  editingImageUrl = null;
  form.reset();
  updateSaleTypeUI();
  updateSubmitButton();
  resetImagePreview();
  clearMessage();
};

const fillFormForEditing = (product) => {
  editingProductId = product.id;
  editingImageUrl = product.image_url;

  nameInput.value = product.name || "";
  categoryInput.value = product.category || "";
  saleTypeInput.value = product.sale_type || "";
  priceInput.value = product.price ?? "";
  promoTextInput.value = product.promo_text || "";
  descriptionInput.value = product.description || "";
  stockInput.value = product.stock || "disponible";
  imageInput.value = "";

  updateSaleTypeUI();
  updateSubmitButton();
  showExistingImagePreview(editingImageUrl);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setMessage("Estás editando un producto. Si no cambias la imagen, se conservará la actual ✨", "info");
};

const attachAdminActionEvents = (products) => {
  const deleteButtons = document.querySelectorAll(".admin-delete-btn");
  const editButtons = document.querySelectorAll(".admin-edit-btn");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.id;
      const confirmed = window.confirm("¿Seguro que deseas eliminar este producto?");

      if (!confirmed) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
          method: "DELETE",
          credentials: "include"
        });

        const data = await safeJson(response);

        if (!response.ok) {
          setMessage(data.error || "No se pudo eliminar el producto.", "error");
          return;
        }

        if (editingProductId && String(editingProductId) === String(productId)) {
          resetFormState();
        }

        setMessage("Producto eliminado correctamente ✅", "success");
        loadAdminProducts();
      } catch (error) {
        console.error("Error eliminando producto:", error);
        setMessage(`Error real: ${error.message}`, "error");
      }
    });
  });

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.id;
      const selectedProduct = products.find(
        (product) => String(product.id) === String(productId)
      );

      if (!selectedProduct) {
        setMessage("No se encontró el producto para editar.", "error");
        return;
      }

      fillFormForEditing(selectedProduct);
    });
  });
};

const renderProductsTable = (products) => {
  if (!products.length) {
    adminProductsBody.innerHTML = `
      <tr>
        <td colspan="7" class="admin-empty-row">Aún no hay productos registrados.</td>
      </tr>
    `;
    return;
  }

  adminProductsBody.innerHTML = products.map((product) => {
    return `
      <tr>
        <td>
          <img src="${product.image_url}" alt="${product.name}" class="admin-product-thumb">
        </td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.sale_type}</td>
        <td>${getPriceOrPromo(product)}</td>
        <td>
          <span class="admin-stock-badge ${product.stock}">
            ${product.stock}
          </span>
        </td>
        <td>
          <div class="admin-actions-cell">
            <button class="admin-edit-btn" data-id="${product.id}" type="button">
              Editar
            </button>
            <button class="admin-delete-btn" data-id="${product.id}" type="button">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attachAdminActionEvents(products);
};

const loadAdminProducts = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products`, {
      credentials: "include"
    });

    const products = await safeJson(response);

    if (!response.ok) {
      setMessage("No se pudieron cargar los productos registrados.", "error");
      return;
    }

    renderProductsTable(products);
  } catch (error) {
    console.error("Error cargando productos admin:", error);
    setMessage(`Error real: ${error.message}`, "error");
  }
};

saleTypeInput.addEventListener("change", updateSaleTypeUI);
imageInput.addEventListener("change", previewSelectedImage);

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    resetFormState();
    setMessage("Edición cancelada. Puedes registrar un nuevo producto ✨", "info");
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  if (!validateForm()) return;

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const saleType = saleTypeInput.value;
  const price = priceInput.value.trim();
  const promoText = promoTextInput.value.trim();
  const description = descriptionInput.value.trim();
  const stock = stockInput.value;
  const imageFile = imageInput.files[0];

  try {
    setMessage(
      editingProductId
        ? "Actualizando producto..."
        : "Subiendo imagen y guardando producto...",
      "info"
    );

    let finalImageUrl = editingImageUrl;

    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        body: imageFormData
      });

      const uploadData = await safeJson(uploadResponse);

      if (!uploadResponse.ok) {
        setMessage(uploadData.error || "Error al subir la imagen.", "error");
        return;
      }

      finalImageUrl = `${BACKEND_URL}${uploadData.imageUrl}`;
    }

    const productPayload = {
      name,
      category,
      description,
      sale_type: saleType,
      price: price ? Number(price) : null,
      promo_text: promoText || null,
      image_url: finalImageUrl,
      stock
    };

    const endpoint = editingProductId
      ? `${BACKEND_URL}/api/products/${editingProductId}`
      : `${BACKEND_URL}/api/products`;

    const method = editingProductId ? "PUT" : "POST";

    const productResponse = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(productPayload)
    });

    const productData = await safeJson(productResponse);

    if (!productResponse.ok) {
      setMessage(productData.error || "Error al guardar el producto.", "error");
      return;
    }

    const wasEditing = Boolean(editingProductId);

    resetFormState();
    loadAdminProducts();

    setMessage(
      wasEditing
        ? "Producto actualizado correctamente ✅"
        : "Producto guardado correctamente ✅",
      "success"
    );
  } catch (error) {
    console.error("Error real:", error);
    setMessage(`Error real: ${error.message}`, "error");
  }
});

const logoutBtn = document.getElementById("admin-logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      const data = await response.json();
      console.log(data);

      window.location.href = "/admin";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });
}

updateSaleTypeUI();
updateSubmitButton();
loadAdminProducts();