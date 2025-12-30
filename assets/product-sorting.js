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

  // Get filter elements (works for both modal and sidebar)
  // Use class selector since there are two inputs (one in modal, one in sidebar)
  const keywordFilters = document.querySelectorAll('.filter-keyword-input');
  const collectionRadios = document.querySelectorAll('input[name="collection-filter"]');
  const priceCheckboxes = document.querySelectorAll('input[name="price-range"]');
  
  // Sync keyword inputs between modal and sidebar
  function syncKeywordInputs(sourceInput) {
    keywordFilters.forEach(input => {
      if (input !== sourceInput) {
        input.value = sourceInput.value;
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

  // Function to apply filters
  function applyFilters(products) {
    return products.filter(product => {
      // Keyword filter (check first visible input)
      const visibleKeywordInput = Array.from(keywordFilters).find(input => {
        const style = window.getComputedStyle(input);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }) || keywordFilters[0];
      
      if (visibleKeywordInput && visibleKeywordInput.value.trim()) {
        const keyword = visibleKeywordInput.value.trim().toLowerCase();
        if (!product.title.includes(keyword)) {
          return false;
        }
      }

      // Collection filter (radio buttons - single selection: product matches if it's in the selected collection)
      if (collectionRadios && collectionRadios.length > 0) {
        const selectedCollection = Array.from(collectionRadios)
          .find(radio => radio.checked)?.value;
        
        if (selectedCollection) {
          // Check if product is in the selected collection
          if (!product.collections.includes(selectedCollection)) {
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

  // Function to check if a filter combination would result in any products
  function wouldHaveResults(testFilters) {
    const testProducts = allProducts.filter(product => {
      // Keyword filter
      if (testFilters.keyword && testFilters.keyword.trim()) {
        const keyword = testFilters.keyword.trim().toLowerCase();
        if (!product.title.includes(keyword)) {
          return false;
        }
      }

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

      return true;
    });
    
    return testProducts.length > 0;
  }

  // Function to sync radio buttons between modal and sidebar
  function syncCollectionRadios(sourceRadio) {
    if (!sourceRadio || !sourceRadio.checked) return;
    
    collectionRadios.forEach(radio => {
      if (radio !== sourceRadio && radio.value === sourceRadio.value) {
        radio.checked = true;
        radio.setAttribute('checked', 'checked');
      } else if (radio !== sourceRadio && radio.value !== sourceRadio.value) {
        radio.checked = false;
        radio.removeAttribute('checked');
      }
    });
    
    // Also ensure the source radio has the attribute
    if (sourceRadio.checked) {
      sourceRadio.setAttribute('checked', 'checked');
    }
  }

  // Function to count results for a filter option
  function countResultsForFilter(testFilters) {
    return allProducts.filter(product => {
      // Keyword filter
      if (testFilters.keyword && testFilters.keyword.trim()) {
        const keyword = testFilters.keyword.trim().toLowerCase();
        if (!product.title.includes(keyword)) {
          return false;
        }
      }

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

      return true;
    }).length;
  }

  // Function to update filter counts
  function updateFilterCounts() {
    // Get current filter state
    const visibleKeywordInput = Array.from(keywordFilters).find(input => {
      const style = window.getComputedStyle(input);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }) || keywordFilters[0];
    
    const currentKeyword = visibleKeywordInput ? visibleKeywordInput.value.trim() : '';
    const selectedCollection = Array.from(collectionRadios)
      .find(radio => radio.checked)?.value;
    const currentPrices = Array.from(priceCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseFloat(cb.value));

    // Update counts for collection radio buttons
    collectionRadios.forEach(radio => {
      const collectionHandle = radio.value;
      const testFilters = {
        keyword: currentKeyword,
        collections: [collectionHandle],
        prices: currentPrices
      };
      const count = countResultsForFilter(testFilters);
      const countElements = document.querySelectorAll(`.filter-count[data-collection-handle="${collectionHandle}"]`);
      countElements.forEach(el => {
        el.textContent = `(${count})`;
      });
    });

    // Update counts for price checkboxes
    priceCheckboxes.forEach(checkbox => {
      const priceValue = parseFloat(checkbox.value);
      // For price counts, show what the count would be if this checkbox was toggled
      // If checked, show count with it; if unchecked, show count if it were added
      const testPrices = checkbox.checked ? currentPrices : [...currentPrices, priceValue];
      const testFilters = {
        keyword: currentKeyword,
        collections: selectedCollection ? [selectedCollection] : [],
        prices: testPrices
      };
      const count = countResultsForFilter(testFilters);
      const countElements = document.querySelectorAll(`.filter-count[data-price-value="${priceValue}"]`);
      countElements.forEach(el => {
        el.textContent = `(${count})`;
      });
    });
  }

  // Function to update disabled state of filter options
  function updateFilterAvailability() {
    // Get current filter state
    const visibleKeywordInput = Array.from(keywordFilters).find(input => {
      const style = window.getComputedStyle(input);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }) || keywordFilters[0];
    
    const currentKeyword = visibleKeywordInput ? visibleKeywordInput.value.trim() : '';
    const selectedCollection = Array.from(collectionRadios)
      .find(radio => radio.checked)?.value;
    const currentPrices = Array.from(priceCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseFloat(cb.value));

    // Test each unselected collection radio button
    collectionRadios.forEach(radio => {
      if (!radio.checked) {
        const testFilters = {
          keyword: currentKeyword,
          collections: [radio.value],
          prices: currentPrices
        };
        radio.disabled = !wouldHaveResults(testFilters);
      } else {
        radio.disabled = false;
      }
    });

    // Test each unchecked price checkbox
    priceCheckboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        const testPrice = parseFloat(checkbox.value);
        const testPrices = [...currentPrices, testPrice];
        const selectedCollection = Array.from(collectionRadios)
          .find(radio => radio.checked)?.value;
        const testFilters = {
          keyword: currentKeyword,
          collections: selectedCollection ? [selectedCollection] : [],
          prices: testPrices
        };
        checkbox.disabled = !wouldHaveResults(testFilters);
      } else {
        checkbox.disabled = false;
      }
    });
  }

  // Function to update display
  function updateDisplay() {
    const sortBy = sortSelect ? sortSelect.value : 'featured';
    
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
  });
  }

  // Set up event listeners for sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', updateDisplay);
    // Set initial sort to featured
  sortSelect.value = 'featured';
  }

  // Set up event listeners for filtering
  keywordFilters.forEach(input => {
    input.addEventListener('input', function() {
      syncKeywordInputs(this);
      updateDisplay();
    });
  });
  
  // Set up event listeners for collection radio buttons
  if (collectionRadios && collectionRadios.length > 0) {
    collectionRadios.forEach(radio => {
      // Ensure all radios have the same name for proper grouping
      radio.name = 'collection-filter';
      
      radio.addEventListener('change', function() {
        // Ensure this radio has the checked attribute
        if (this.checked) {
          this.setAttribute('checked', 'checked');
        } else {
          this.removeAttribute('checked');
        }
        
        // Sync all radios with the same value
        syncCollectionRadios(this);
        
        // Ensure only one radio is selected across all radios (in case sync didn't work)
        if (this.checked) {
          collectionRadios.forEach(r => {
            if (r !== this && r.value !== this.value && r.checked) {
              r.checked = false;
              r.removeAttribute('checked');
            }
          });
        }
        updateDisplay();
      });
      
      // Handle click on label as well (since clicking label triggers radio)
      const label = document.querySelector(`label[for="${radio.id}"]`);
      if (label) {
        label.addEventListener('click', function(e) {
          // Small delay to let native radio behavior happen first
          setTimeout(() => {
            if (radio.checked) {
              radio.setAttribute('checked', 'checked');
              syncCollectionRadios(radio);
              updateDisplay();
            }
          }, 0);
        });
      }
      
      // Also handle direct click on radio button
      radio.addEventListener('click', function(e) {
        // Ensure checked attribute is set
        if (this.checked) {
          this.setAttribute('checked', 'checked');
        }
      });
    });
  }
  
  // Set up event listeners for price checkboxes
  if (priceCheckboxes && priceCheckboxes.length > 0) {
    priceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateDisplay);
    });
  }

  // Modal toggle functionality (mobile only)
  function toggleFilters() {
    if (filterModal) {
      // Toggle modal
      const isVisible = filterModal.style.visibility === 'visible' || 
                       (filterModal.style.opacity === '1' && filterModal.style.visibility !== 'hidden');
      
      if (isVisible) {
        hideFilterModal();
      } else {
        showFilterModal();
      }
    }
  }

  function hideFilterModal() {
    if (filterModal && typeof gsap !== 'undefined') {
      gsap.to('#filter-modal', {autoAlpha: 0, duration: 0.3, onComplete: function() {
        filterModal.style.display = 'none';
      }});
    } else if (filterModal) {
      filterModal.style.visibility = 'hidden';
      filterModal.style.opacity = '0';
      filterModal.style.display = 'none';
    }
  }
  
  function showFilterModal() {
    if (filterModal && !isLargeScreen()) {
      filterModal.style.display = 'flex';
      if (typeof gsap !== 'undefined') {
        gsap.to('#filter-modal', {autoAlpha: 1, duration: 0.3});
      } else {
        filterModal.style.visibility = 'visible';
        filterModal.style.opacity = '1';
      }
    }
  }

  if (filterToggle) {
    filterToggle.addEventListener('click', toggleFilters);
  }
  
  // Handle window resize to show/hide sidebar appropriately
  window.addEventListener('resize', function() {
    if (isLargeScreen() && filterSidebar) {
      // On large screens, ensure sidebar is visible
      filterSidebar.style.display = '';
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