document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-by');
  const productPromos = document.querySelector('.product-promos-container');
  const productGrid = productPromos?.querySelector('.product-grid');
  
  if (!productPromos || !productGrid) {
    return;
  }
  
  // Store all products in memory
  const allProducts = Array.from(productGrid.children).map((product, index) => ({
    element: product,
    title: product.querySelector('.product-title')?.textContent?.toLowerCase() || '',
    price: parseFloat(product.querySelector('.product-price')?.dataset.price || '0'),
    date: new Date(product.dataset.date || '1970-01-01'),
    collections: (product.dataset.collections || '').split(',').filter(c => c),
    originalIndex: index
  }));

  // Get filter elements
  const keywordFilter = document.getElementById('filter-keyword');
  const collectionCheckboxes = document.querySelectorAll('input[name="collection-filter"]');
  const priceCheckboxes = document.querySelectorAll('input[name="price-range"]');
  
  // Get modal elements
  const filterModal = document.getElementById('filter-modal');
  const filterToggle = document.getElementById('filter-toggle');
  const filterClose = document.getElementById('filter-modal-close');

  // Function to apply filters
  function applyFilters(products) {
    return products.filter(product => {
      // Keyword filter
      if (keywordFilter && keywordFilter.value.trim()) {
        const keyword = keywordFilter.value.trim().toLowerCase();
        if (!product.title.includes(keyword)) {
          return false;
        }
      }

      // Collection filter (checkboxes - OR logic: product matches if it's in ANY selected collection)
      if (collectionCheckboxes && collectionCheckboxes.length > 0) {
        const selectedCollections = Array.from(collectionCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        
        if (selectedCollections.length > 0) {
          // Check if product is in any of the selected collections
          const matchesCollection = selectedCollections.some(selectedCollection => 
            product.collections.includes(selectedCollection)
          );
          if (!matchesCollection) {
            return false;
          }
        }
      }

      // Price filter (checkboxes - OR logic: product matches if it's under ANY selected price)
      if (priceCheckboxes && priceCheckboxes.length > 0) {
        const selectedPrices = Array.from(priceCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => parseFloat(cb.value));
        
        if (selectedPrices.length > 0) {
          // Check if product price is under any of the selected price thresholds
          const matchesPrice = selectedPrices.some(priceThreshold => product.price < priceThreshold);
          if (!matchesPrice) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Function to apply sorting
  function applySorting(products, sortBy) {
    if (!sortBy) {
      return products;
    }

    return [...products].sort((a, b) => {
      switch(sortBy) {
        case 'featured':
          return a.originalIndex - b.originalIndex;
        case 'title-ascending':
          return a.title.localeCompare(b.title);
        case 'title-descending':
          return b.title.localeCompare(a.title);
        case 'price-ascending':
          return a.price - b.price;
        case 'price-descending':
          return b.price - a.price;
        case 'created-descending':
          return b.date - a.date;
        case 'created-ascending':
          return a.date - b.date;
        default:
          return 0;
      }
    });
  }

  // Function to update display
  function updateDisplay() {
    const sortBy = sortSelect ? sortSelect.value : 'featured';
    
    // Add loading state
    productPromos.classList.add('loading');
    
    // Apply filters first
    let filteredProducts = applyFilters(allProducts);
    
    // Then apply sorting
    const sortedProducts = applySorting(filteredProducts, sortBy);

    // Clear the grid
    productGrid.innerHTML = '';
    
    // Add filtered and sorted products back to the grid
    sortedProducts.forEach(product => {
      productGrid.appendChild(product.element);
    });

    // Remove loading state
    productPromos.classList.remove('loading');
  }

  // Set up event listeners for sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', updateDisplay);
    // Set initial sort to featured
    sortSelect.value = 'featured';
  }

  // Set up event listeners for filtering
  if (keywordFilter) {
    keywordFilter.addEventListener('input', updateDisplay);
  }
  
  // Set up event listeners for collection checkboxes
  if (collectionCheckboxes && collectionCheckboxes.length > 0) {
    collectionCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateDisplay);
    });
  }
  
  // Set up event listeners for price checkboxes
  if (priceCheckboxes && priceCheckboxes.length > 0) {
    priceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateDisplay);
    });
  }

  // Modal open/close functionality
  function showFilterModal() {
    if (filterModal && typeof gsap !== 'undefined') {
      gsap.to('#filter-modal', {autoAlpha: 1, duration: 0.3});
    } else if (filterModal) {
      filterModal.style.visibility = 'visible';
      filterModal.style.opacity = '1';
    }
  }

  function hideFilterModal() {
    if (filterModal && typeof gsap !== 'undefined') {
      gsap.to('#filter-modal', {autoAlpha: 0, duration: 0.3});
    } else if (filterModal) {
      filterModal.style.visibility = 'hidden';
      filterModal.style.opacity = '0';
    }
  }

  if (filterToggle) {
    filterToggle.addEventListener('click', showFilterModal);
  }

  if (filterClose) {
    filterClose.addEventListener('click', hideFilterModal);
  }

  // Close modal when clicking outside (on backdrop)
  if (filterModal) {
    filterModal.addEventListener('click', function(e) {
      if (e.target === filterModal) {
        hideFilterModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && filterModal && filterModal.style.visibility === 'visible') {
      hideFilterModal();
    }
  });

  // Initial display update
  updateDisplay();
});