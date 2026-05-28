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
    ageRange: product.dataset.ageRange || '',
    isNew: product.dataset.isNew === 'true',
    originalIndex: index
  }));

  // Collect all unique collection handles for debugging
  const allCollectionHandles = new Set();
  allProducts.forEach(product => {
    product.collections.forEach(handle => {
      if (handle) allCollectionHandles.add(handle);
    });
  });
  //console.log('All collection handles:', Array.from(allCollectionHandles).sort().join(', '));

  // Get filter elements (works for both modal and sidebar)
  const collectionCheckboxes = document.querySelectorAll('input[name="collection-filter"]');
  const priceCheckboxes = document.querySelectorAll('input[name="price-range"]');
  const ageRangeCheckboxes = document.querySelectorAll('input[name="age-range"]');
  const newOnlyCheckboxes = document.querySelectorAll('input[name="new-only"]');

  function getCheckedValues(inputs) {
    const values = new Set();
    Array.from(inputs).forEach(input => {
      if (input.checked) {
        values.add(input.value);
      }
    });
    return Array.from(values);
  }

  function getUniqueFilterInputs(inputs) {
    const seen = new Set();
    return Array.from(inputs).filter(input => {
      if (seen.has(input.value)) {
        return false;
      }
      seen.add(input.value);
      return true;
    });
  }

  function isNewOnlyActive() {
    return Array.from(newOnlyCheckboxes).some(checkbox => checkbox.checked);
  }

  function syncNewOnlyCheckboxes(sourceCheckbox) {
    newOnlyCheckboxes.forEach(checkbox => {
      if (checkbox !== sourceCheckbox) {
        checkbox.checked = sourceCheckbox.checked;
      }
    });
  }

  function syncCollectionCheckboxes(sourceCheckbox) {
    collectionCheckboxes.forEach(checkbox => {
      if (checkbox !== sourceCheckbox && checkbox.value === sourceCheckbox.value) {
        checkbox.checked = sourceCheckbox.checked;
      }
    });
  }

  // Get modal and sidebar elements
  const filterModal = document.getElementById('filter-modal');
  const filterSidebar = document.getElementById('filter-sidebar');
  const filterToggle = document.getElementById('filter-toggle');
  const filterClose = document.getElementById('filter-modal-close');
  const filterApply = document.getElementById('filter-modal-apply');
  
  // Check if we're on a large screen
  function isLargeScreen() {
    return window.matchMedia('(min-width: 1080px)').matches;
  }

  const filterClearButtons = document.querySelectorAll('.filter-clear-button');

  function hasActiveFilters() {
    if (getCheckedValues(collectionCheckboxes).length > 0) {
      return true;
    }

    if (Array.from(priceCheckboxes).some(checkbox => checkbox.checked)) {
      return true;
    }

    if (Array.from(ageRangeCheckboxes).some(checkbox => checkbox.checked)) {
      return true;
    }

    if (isNewOnlyActive()) {
      return true;
    }

    return false;
  }

  function clearFilters() {
    collectionCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    priceCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    ageRangeCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    newOnlyCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    updateDisplay();
  }

  function updateClearFiltersVisibility() {
    const active = hasActiveFilters();

    document.querySelectorAll('.filter-clear-group').forEach(container => {
      container.classList.toggle('is-active', active);
    });
  }

  // Function to apply filters
  function applyFilters(products) {
    return products.filter(product => {
      // Collection filter (checkboxes - OR: product matches if it's in any selected collection)
      const selectedCollections = getCheckedValues(collectionCheckboxes);
      if (selectedCollections.length > 0) {
        const matchesCollection = selectedCollections.some(collectionHandle =>
          product.collections.includes(collectionHandle)
        );
        if (!matchesCollection) {
          return false;
        }
      }

      // Price filter (checkboxes - OR logic: product matches if it's under ANY selected price)
      const selectedPrices = getCheckedValues(priceCheckboxes).map(value => parseFloat(value));
      if (selectedPrices.length > 0) {
        
        const matchesPrice = selectedPrices.some(priceThreshold => product.price < priceThreshold);
        if (!matchesPrice) {
          return false;
        }
      }

      // Age range filter (checkboxes - OR logic: product matches if it matches ANY selected age range)
      const selectedAgeRanges = getCheckedValues(ageRangeCheckboxes);
      if (selectedAgeRanges.length > 0) {
        if (!product.ageRange || !selectedAgeRanges.includes(product.ageRange)) {
          return false;
        }
      }

      if (isNewOnlyActive() && !product.isNew) {
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

  // Function to check if a filter combination would result in any products
  function wouldHaveResults(testFilters) {
    const testProducts = allProducts.filter(product => {
      // Collection filter
      if (testFilters.collections && testFilters.collections.length > 0) {
        const matchesCollection = testFilters.collections.some(selectedCollection => 
          product.collections.includes(selectedCollection)
        );
        if (!matchesCollection) {
          return false;
        }
      }

      // Price filter
      if (testFilters.prices && testFilters.prices.length > 0) {
        const matchesPrice = testFilters.prices.some(priceThreshold => product.price < priceThreshold);
        if (!matchesPrice) {
          return false;
        }
      }

      // Age range filter
      if (testFilters.ageRanges && testFilters.ageRanges.length > 0) {
        if (!product.ageRange || !testFilters.ageRanges.includes(product.ageRange)) {
          return false;
        }
      }

      if (testFilters.newOnly && !product.isNew) {
        return false;
      }

      return true;
    });
    
    return testProducts.length > 0;
  }

  // Function to count results for a filter option
  function countResultsForFilter(testFilters) {
    return allProducts.filter(product => {
      // Collection filter
      if (testFilters.collections && testFilters.collections.length > 0) {
        const matchesCollection = testFilters.collections.some(selectedCollection => 
          product.collections.includes(selectedCollection)
        );
        if (!matchesCollection) {
          return false;
        }
      }

      // Price filter
      if (testFilters.prices && testFilters.prices.length > 0) {
        const matchesPrice = testFilters.prices.some(priceThreshold => product.price < priceThreshold);
        if (!matchesPrice) {
          return false;
        }
      }

      // Age range filter
      if (testFilters.ageRanges && testFilters.ageRanges.length > 0) {
        if (!product.ageRange || !testFilters.ageRanges.includes(product.ageRange)) {
          return false;
        }
      }

      if (testFilters.newOnly && !product.isNew) {
        return false;
      }

      return true;
    }).length;
  }

  // Function to update filter counts
  function updateFilterCounts() {
    const currentCollections = getCheckedValues(collectionCheckboxes);
    const currentPrices = getCheckedValues(priceCheckboxes).map(value => parseFloat(value));
    const currentAgeRanges = getCheckedValues(ageRangeCheckboxes);
    const newOnly = isNewOnlyActive();

    getUniqueFilterInputs(collectionCheckboxes).forEach(checkbox => {
      const collectionHandle = checkbox.value;
      const count = countResultsForFilter({
        collections: [collectionHandle],
        prices: currentPrices,
        ageRanges: currentAgeRanges,
        newOnly
      });
      document.querySelectorAll(`.filter-count[data-collection-handle="${collectionHandle}"]`).forEach(el => {
        el.textContent = `(${count})`;
      });
    });

    getUniqueFilterInputs(priceCheckboxes).forEach(checkbox => {
      const priceValue = parseFloat(checkbox.value);
      const testFilters = {
        collections: currentCollections,
        prices: [priceValue],
        ageRanges: currentAgeRanges,
        newOnly
      };
      const count = countResultsForFilter(testFilters);
      document.querySelectorAll(`.filter-count[data-price-value="${priceValue}"]`).forEach(el => {
        el.textContent = `(${count})`;
      });
    });

    getUniqueFilterInputs(ageRangeCheckboxes).forEach(checkbox => {
      const ageRangeValue = checkbox.value;
      const count = countResultsForFilter({
        collections: currentCollections,
        prices: currentPrices,
        ageRanges: [ageRangeValue],
        newOnly
      });
      document.querySelectorAll(`.filter-count[data-age-range="${ageRangeValue}"]`).forEach(el => {
        el.textContent = `(${count})`;
      });
    });

    document.querySelectorAll('.filter-count[data-filter-new]').forEach(el => {
      const count = countResultsForFilter({
        collections: currentCollections,
        prices: currentPrices,
        ageRanges: currentAgeRanges,
        newOnly: true
      });
      el.textContent = `(${count})`;
    });
  }

  // Function to update disabled state of filter options
  function updateFilterAvailability() {
    const currentCollections = getCheckedValues(collectionCheckboxes);
    const currentPrices = getCheckedValues(priceCheckboxes).map(value => parseFloat(value));
    const currentAgeRanges = getCheckedValues(ageRangeCheckboxes);
    const newOnly = isNewOnlyActive();

    getUniqueFilterInputs(collectionCheckboxes).forEach(checkbox => {
      if (!checkbox.checked) {
        const testFilters = {
          collections: [...currentCollections, checkbox.value],
          prices: currentPrices,
          ageRanges: currentAgeRanges,
          newOnly
        };
        checkbox.disabled = !wouldHaveResults(testFilters);
      } else {
        checkbox.disabled = false;
      }
      collectionCheckboxes.forEach(synced => {
        if (synced.value === checkbox.value) {
          synced.disabled = checkbox.disabled;
        }
      });
    });

    getUniqueFilterInputs(priceCheckboxes).forEach(checkbox => {
      if (!checkbox.checked) {
        const testPrice = parseFloat(checkbox.value);
        const testFilters = {
          collections: currentCollections,
          prices: [...currentPrices, testPrice],
          ageRanges: currentAgeRanges,
          newOnly
        };
        checkbox.disabled = !wouldHaveResults(testFilters);
      } else {
        checkbox.disabled = false;
      }
      priceCheckboxes.forEach(synced => {
        if (synced.value === checkbox.value) {
          synced.disabled = checkbox.disabled;
        }
      });
    });

    getUniqueFilterInputs(ageRangeCheckboxes).forEach(checkbox => {
      if (!checkbox.checked) {
        const testFilters = {
          collections: currentCollections,
          prices: currentPrices,
          ageRanges: [...currentAgeRanges, checkbox.value],
          newOnly
        };
        checkbox.disabled = !wouldHaveResults(testFilters);
      } else {
        checkbox.disabled = false;
      }
      ageRangeCheckboxes.forEach(synced => {
        if (synced.value === checkbox.value) {
          synced.disabled = checkbox.disabled;
        }
      });
    });

    newOnlyCheckboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        checkbox.disabled = !wouldHaveResults({
          collections: currentCollections,
          prices: currentPrices,
          ageRanges: currentAgeRanges,
          newOnly: true
        });
      } else {
        checkbox.disabled = false;
      }
    });
  }

  // Function to update display
  function updateDisplay() {
    const sortBy = sortSelect ? sortSelect.value : 'featured';

    updateClearFiltersVisibility();
    
    // Apply filters first
    let filteredProducts = applyFilters(allProducts);
    
    // Update filter availability and counts before displaying
    updateFilterAvailability();
    updateFilterCounts();
    
    // Then apply sorting
    const sortedProducts = applySorting(filteredProducts, sortBy);

    // Create a set of filtered product elements for quick lookup
    const filteredElementSet = new Set(sortedProducts.map(p => p.element));
    
    // Batch all DOM operations in a single frame
    requestAnimationFrame(() => {
      // Step 1: Update visibility of all products
      allProducts.forEach(product => {
        const element = product.element;
        const shouldBeVisible = filteredElementSet.has(element);
        
        if (shouldBeVisible) {
          // Show product
          if (element.style.display === 'none') {
            element.style.display = '';
            // Use requestAnimationFrame for opacity to ensure display is set first
            requestAnimationFrame(() => {
              element.style.opacity = '1';
              element.style.visibility = 'visible';
            });
          } else {
            element.style.opacity = '1';
            element.style.visibility = 'visible';
          }
        } else {
          // Hide product
          element.style.opacity = '0';
          element.style.visibility = 'hidden';
        }
      });
      
      // Step 2: Reorder products efficiently - only if order changed
      const sortedElements = sortedProducts.map(p => p.element);
      const currentVisible = Array.from(productGrid.children).filter(child => 
        filteredElementSet.has(child) && child.style.opacity !== '0'
      );
      
      // Check if reordering is needed by comparing visible products
      const needsReorder = currentVisible.length !== sortedElements.length ||
        currentVisible.some((child, index) => child !== sortedElements[index]);
      
      if (needsReorder) {
        // Use DocumentFragment for efficient batch reordering
        const fragment = document.createDocumentFragment();
        
        // Add sorted visible products to fragment
        sortedElements.forEach(element => {
          if (filteredElementSet.has(element)) {
            fragment.appendChild(element);
          }
        });
        
        // Remove visible products from grid
        currentVisible.forEach(element => {
          if (element.parentNode === productGrid) {
            productGrid.removeChild(element);
          }
        });
        
        // Insert sorted products at the beginning
        const firstChild = productGrid.firstChild;
        if (firstChild) {
          productGrid.insertBefore(fragment, firstChild);
        } else {
          productGrid.appendChild(fragment);
        }
      }

      // Step 3: Hide products that should be hidden (after a delay for smooth transition)
      setTimeout(() => {
        allProducts.forEach(product => {
          if (!filteredElementSet.has(product.element) && 
              product.element.style.opacity === '0') {
            product.element.style.display = 'none';
          }
        });
      }, 200);

    // Remove loading state
    productPromos.classList.remove('loading');
    updateClearFiltersVisibility();
  });
  }

  // Custom dropdown for sorting
  const sortToggle = document.getElementById('sort-toggle');
  const sortDropdown = document.getElementById('sort-dropdown');
  const sortSelected = document.getElementById('sort-selected');
  const sortOptions = document.querySelectorAll('.sort-option');

  // Map sort values to display text
  const sortLabels = {
    'featured': 'Featured',
    'created-descending': 'Newest',
    'price-ascending': 'Price: Low to High',
    'price-descending': 'Price: High to Low',
    'title-ascending': 'Alphabetical: A-Z',
    'title-descending': 'Alphabetical: Z-A'
  };

  // Function to update sort display
  function updateSortDisplay(value) {
    if (sortSelected) {
      sortSelected.textContent = sortLabels[value] || 'Featured';
    }
    if (sortSelect) {
      sortSelect.value = value;
    }
    // Update active state
    sortOptions.forEach(option => {
      if (option.dataset.value === value) {
        option.setAttribute('aria-selected', 'true');
      } else {
        option.setAttribute('aria-selected', 'false');
      }
    });
  }

  // Toggle dropdown
  if (sortToggle && sortDropdown) {
    sortToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = sortDropdown.classList.toggle('open');
      sortToggle.setAttribute('aria-expanded', isOpen);
    });

    // Handle option selection
    sortOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const value = this.dataset.value;
        updateSortDisplay(value);
        sortDropdown.classList.remove('open');
        if (sortToggle) {
          sortToggle.setAttribute('aria-expanded', 'false');
        }
        updateDisplay();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (sortDropdown && !sortDropdown.contains(e.target) && !sortToggle.contains(e.target)) {
        sortDropdown.classList.remove('open');
        sortToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close dropdown on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sortDropdown && sortDropdown.classList.contains('open')) {
        sortDropdown.classList.remove('open');
        sortToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Set up event listeners for sorting (hidden select for compatibility)
  if (sortSelect) {
    sortSelect.addEventListener('change', updateDisplay);
    // Set initial sort to featured
    sortSelect.value = 'featured';
    updateSortDisplay('featured');
  }

  if (collectionCheckboxes.length > 0) {
    collectionCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        syncCollectionCheckboxes(this);
        updateDisplay();
      });
    });
  }

  if (priceCheckboxes.length > 0) {
    priceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateDisplay);
    });
  }

  // Function to extract numeric value from age range (e.g., "3-5" -> 3, "6-8" -> 6, "9+" -> 9)
  function getAgeRangeNumericValue(ageRange) {
    if (!ageRange) return 999; // Put empty/invalid at end
    const match = ageRange.toString().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
  }

  // Function to sort age range checkboxes numerically
  function sortAgeRangeCheckboxes() {
    const ageRangeContainers = document.querySelectorAll('.age-range-checkboxes');
    
    ageRangeContainers.forEach(container => {
      const items = Array.from(container.querySelectorAll('.age-range-checkbox-item'));
      
      // Sort items by extracting the first number from the age range value
      items.sort((a, b) => {
        const checkboxA = a.querySelector('input[name="age-range"]');
        const checkboxB = b.querySelector('input[name="age-range"]');
        if (!checkboxA || !checkboxB) return 0;
        
        const valueA = getAgeRangeNumericValue(checkboxA.value);
        const valueB = getAgeRangeNumericValue(checkboxB.value);
        
        return valueA - valueB;
      });
      
      // Reorder DOM elements
      items.forEach(item => container.appendChild(item));
    });
  }

  // Sort age range checkboxes on page load
  sortAgeRangeCheckboxes();

  // Set up event listeners for age range checkboxes
  if (ageRangeCheckboxes && ageRangeCheckboxes.length > 0) {
    ageRangeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateDisplay);
    });
  }

  if (newOnlyCheckboxes.length > 0) {
    newOnlyCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        syncNewOnlyCheckboxes(this);
        updateDisplay();
      });
    });
  }

  // Modal toggle functionality (mobile only)
  function toggleFilters() {
    if (filterModal) {
      const isVisible = filterModal.classList.contains('is-visible');

      if (isVisible) {
        hideFilterModal();
      } else {
        showFilterModal();
      }
    }
  }

  function hideFilterModal() {
    if (!filterModal) {
      return;
    }
    filterModal.classList.remove('is-visible');
    window.setTimeout(function() {
      if (!filterModal.classList.contains('is-visible')) {
        filterModal.style.display = 'none';
      }
    }, 300);
  }

  function showFilterModal() {
    if (!filterModal || isLargeScreen()) {
      return;
    }
    filterModal.style.display = 'flex';
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        filterModal.classList.add('is-visible');
      });
    });
  }

  if (filterToggle) {
    filterToggle.addEventListener('click', toggleFilters);
  }
  
  // Handle window resize to show/hide sidebar appropriately
  window.addEventListener('resize', function() {
    if (isLargeScreen() && filterSidebar) {
      // On large screens, ensure sidebar is visible
      filterSidebar.style.display = '';
      if (filterModal) {
        filterModal.classList.remove('is-visible');
        filterModal.style.display = 'none';
      }
    } else if (filterSidebar) {
      // On small screens, hide sidebar
      filterSidebar.style.display = 'none';
    }
  });

  if (filterClose) {
    filterClose.addEventListener('click', hideFilterModal);
  }

  if (filterApply) {
    filterApply.addEventListener('click', function() {
      hideFilterModal();
      updateDisplay();
    });
  }

  filterClearButtons.forEach(button => {
    button.addEventListener('click', clearFilters);
  });

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
    if (e.key === 'Escape' && filterModal && filterModal.classList.contains('is-visible')) {
      hideFilterModal();
    }
  });

  // Initial display update
  updateDisplay();
});