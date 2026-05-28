document.addEventListener('DOMContentLoaded', function() {
  const searchRoot = document.querySelector('[data-header-search]');
  if (!searchRoot) {
    return;
  }

  const trigger = searchRoot.querySelector('.header-search-trigger');
  const palette = searchRoot.querySelector('.header-search-palette');
  const form = searchRoot.querySelector('.header-search-form');
  const input = searchRoot.querySelector('.header-search-input');
  const defaultsEl = searchRoot.querySelector('#header-search-defaults');
  const resultsEl = searchRoot.querySelector('#header-search-results');
  const footerEl = searchRoot.querySelector('#header-search-footer');
  const closeTargets = searchRoot.querySelectorAll('[data-search-close]');

  if (!trigger || !palette || !form || !input || !defaultsEl || !resultsEl || !footerEl) {
    return;
  }

  const debounceMs = 280;
  let debounceTimer = null;
  let activeRequest = null;

  const labels = {
    products: searchRoot.dataset.labelProducts || 'Products',
    pages: searchRoot.dataset.labelPages || 'Pages',
    articles: searchRoot.dataset.labelArticles || 'Articles',
    viewAll: searchRoot.dataset.labelViewAll || 'View all results',
    empty: searchRoot.dataset.labelEmpty || 'No results found'
  };

  function getSuggestUrl(query) {
    const params = new URLSearchParams({
      q: query,
      'resources[type]': 'product,page,article',
      'resources[limit]': '6',
      'resources[options][unavailable_products]': 'hide'
    });
    return `/search/suggest.json?${params.toString()}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function priceToCents(price) {
    const priceStr = String(price).trim();
    if (priceStr === '') {
      return NaN;
    }
    if (priceStr.includes('.')) {
      return Math.round(parseFloat(priceStr) * 100);
    }
    return Math.round(parseFloat(priceStr));
  }

  function formatPrice(price) {
    if (price == null || price === '') {
      return '';
    }
    const cents = priceToCents(price);
    if (Number.isNaN(cents)) {
      return '';
    }
    const moneyFormat = document.querySelector('main')?.dataset?.moneyFormat;

    if (window.formatMoney && moneyFormat) {
      return window.formatMoney(cents, moneyFormat);
    }

    return `£${(cents / 100).toFixed(2)}`;
  }

  function renderResults(data, query) {
    const resources = data?.resources?.results;
    if (!resources) {
      return '';
    }

    const products = resources.products || [];
    const pages = resources.pages || [];
    const articles = resources.articles || [];
    let html = '';

    if (products.length > 0) {
      html += `<div class="header-search-results-group"><h3>${escapeHtml(labels.products)}</h3>`;
      products.forEach(product => {
        const image = product.featured_image?.url
          ? `<img src="${escapeHtml(product.featured_image.url)}" alt="" width="48" height="48" loading="lazy">`
          : '';
        const price = formatPrice(product.price);
        html += `<a class="header-search-result" role="option" href="${escapeHtml(product.url)}">
          ${image}
          <span class="header-search-result-body">
            <span class="header-search-result-title">${escapeHtml(product.title)}</span>
            ${price ? `<span class="header-search-result-meta">${escapeHtml(price)}</span>` : ''}
          </span>
        </a>`;
      });
      html += '</div>';
    }

    if (pages.length > 0) {
      html += `<div class="header-search-results-group"><h3>${escapeHtml(labels.pages)}</h3>`;
      pages.forEach(page => {
        html += `<a class="header-search-result" role="option" href="${escapeHtml(page.url)}">
          <span class="header-search-result-body">
            <span class="header-search-result-title">${escapeHtml(page.title)}</span>
          </span>
        </a>`;
      });
      html += '</div>';
    }

    if (articles.length > 0) {
      html += `<div class="header-search-results-group"><h3>${escapeHtml(labels.articles)}</h3>`;
      articles.forEach(article => {
        html += `<a class="header-search-result" role="option" href="${escapeHtml(article.url)}">
          <span class="header-search-result-body">
            <span class="header-search-result-title">${escapeHtml(article.title)}</span>
          </span>
        </a>`;
      });
      html += '</div>';
    }

    const hasRows = html.length > 0;

    if (!hasRows) {
      html = `<p class="header-search-empty">${escapeHtml(labels.empty)} &ldquo;${escapeHtml(query)}&rdquo;</p>`;
    }

    return { html, hasFooter: hasRows };
  }

  function hideFooter() {
    footerEl.hidden = true;
    footerEl.innerHTML = '';
  }

  function updateViewAllFooter(query) {
    const searchUrl = `${form.action}?q=${encodeURIComponent(query)}`;
    footerEl.innerHTML = `<a class="header-search-view-all" href="${escapeHtml(searchUrl)}">${escapeHtml(labels.viewAll)}</a>`;
    footerEl.hidden = false;
  }

  function showDefaults() {
    defaultsEl.hidden = false;
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
    hideFooter();
    input.setAttribute('aria-expanded', 'false');
  }

  function showResults() {
    defaultsEl.hidden = true;
    resultsEl.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function hideResults() {
    resultsEl.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    resultsEl.innerHTML = '';
    hideFooter();
  }

  function openPalette() {
    palette.hidden = false;
    palette.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    showDefaults();
    window.requestAnimationFrame(() => input.focus());
  }

  function closePalette() {
    palette.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hideResults();
    hideFooter();
    defaultsEl.hidden = true;
    input.value = '';

    window.setTimeout(() => {
      if (!palette.classList.contains('is-open')) {
        palette.hidden = true;
      }
    }, 300);

    trigger.focus();
  }

  function isOpen() {
    return palette.classList.contains('is-open');
  }

  function fetchSuggestions(query) {
    if (activeRequest) {
      activeRequest.abort();
    }

    activeRequest = new AbortController();

    fetch(getSuggestUrl(query), { signal: activeRequest.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Search suggest failed');
        }
        return response.json();
      })
      .then(data => {
        const { html, hasFooter } = renderResults(data, query);
        resultsEl.innerHTML = html;
        if (hasFooter) {
          updateViewAllFooter(query);
        } else {
          hideFooter();
        }
        showResults();
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          hideResults();
          showDefaults();
        }
      })
      .finally(() => {
        activeRequest = null;
      });
  }

  function onInput() {
    const query = input.value.trim();

    if (query.length < 2) {
      hideResults();
      showDefaults();
      return;
    }

    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => fetchSuggestions(query), debounceMs);
  }

  trigger.addEventListener('click', openPalette);

  closeTargets.forEach(el => {
    el.addEventListener('click', closePalette);
  });

  input.addEventListener('input', onInput);

  form.addEventListener('submit', function(e) {
    if (input.value.trim() === '') {
      e.preventDefault();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closePalette();
      return;
    }

    const isModKey = e.metaKey || e.ctrlKey;
    if (isModKey && e.key === 'k') {
      e.preventDefault();
      if (isOpen()) {
        closePalette();
      } else {
        openPalette();
      }
    }
  });
});
