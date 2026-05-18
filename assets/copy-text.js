window.addEventListener('load', () => {
  document.querySelectorAll('.copy-text').forEach(item => {
    item.addEventListener('click', async function () {
      const target = this.parentNode?.querySelector('.text-to-copy');
      if (!target) { return; }

      const text = target.textContent.trim();

      try {
        if (!navigator.clipboard) { throw new Error('Clipboard API unavailable'); }
        await navigator.clipboard.writeText(text);
        const original = this.textContent;
        this.classList.add('copied');
        this.textContent = 'Copied';
        setTimeout(() => {
          this.classList.remove('copied');
          this.textContent = original;
        }, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  });
});
