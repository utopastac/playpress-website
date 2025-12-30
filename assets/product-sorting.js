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
  const collectionFilter = document.getElementById('filter-collection');
  const priceMinFilter = document.getElementById('filter-price-min');
  const priceMaxFilter = document.getElementById('filter-price-max');

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

      // Collection filter
      if (collectionFilter && collectionFilter.value) {
        const selectedCollection = collectionFilter.value;
        if (!product.collections.includes(selectedCollection)) {
          return false;
        }
      }

      // Price filter
      const minPrice = priceMinFilter ? parseFloat(priceMinFilter.value) : null;
      const maxPrice = priceMaxFilter ? parseFloat(priceMaxFilter.value) : null;
      
      if (minPrice !== null && !isNaN(minPrice) && product.price < minPrice) {
        return false;
      }
      if (maxPrice !== null && !isNaN(maxPrice) && product.price > maxPrice) {
        return false;
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
  
  if (collectionFilter) {
    collectionFilter.addEventListener('change', updateDisplay);
  }
  
  if (priceMinFilter) {
    priceMinFilter.addEventListener('input', updateDisplay);
  }
  
  if (priceMaxFilter) {
    priceMaxFilter.addEventListener('input', updateDisplay);
  }

  // Initial display update
  updateDisplay();
});