document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-by');
  
  if (!sortSelect) {
    return;
  }

  const productPromos = document.querySelector('.product-promos-container');
  const productGrid = productPromos.querySelector('.product-grid');
  
  if (!productPromos || !productGrid) {
    return;
  }
  
  // Store all products in memory
  const products = Array.from(productGrid.children).map((product, index) => ({
    element: product,
    title: product.querySelector('.product-title')?.textContent?.toLowerCase() || '',
    price: parseFloat(product.querySelector('.product-price')?.dataset.price || '0'),
    date: new Date(product.dataset.date || '1970-01-01'),
    originalIndex: index
  }));

  // Handle sort change
  sortSelect.addEventListener('change', function() {
    const sortBy = this.value;
    
    // Add loading state
    productPromos.classList.add('loading');
    
    // Sort products based on selection
    const sortedProducts = [...products].sort((a, b) => {
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

    // Clear the grid
    productGrid.innerHTML = '';
    
    // Add sorted products back to the grid
    sortedProducts.forEach(product => {
      productGrid.appendChild(product.element);
    });

    // Remove loading state
    productPromos.classList.remove('loading');
  });

  // Set initial sort to newest and trigger the change event
  sortSelect.value = 'featured';
  sortSelect.dispatchEvent(new Event('change'));
});