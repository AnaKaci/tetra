const header = document.querySelector<HTMLElement>('[data-header]');
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const nav = document.querySelector<HTMLElement>('#main-nav');
const dropdown = document.querySelector<HTMLDetailsElement>('.nav-dropdown');
const mobileViewport = window.matchMedia('(max-width: 900px)');

function setMenu(open: boolean, returnFocus = false) {
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Mbyll menunë' : 'Hap menunë');
  header?.classList.toggle('menu-open', open);
  if (!open && dropdown) dropdown.open = false;
  if (returnFocus) menuToggle?.focus();
}

menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (menuToggle?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    else if (dropdown?.open) { dropdown.open = false; dropdown.querySelector('summary')?.focus(); }
  }
});
document.addEventListener('click', event => {
  if (event.target instanceof Node && !header?.contains(event.target)) {
    setMenu(false, mobileViewport.matches && !!nav?.contains(document.activeElement));
  }
});
header?.addEventListener('focusout', event => {
  // The menu is a disclosure, not a modal: Tab may continue into the page.
  if (event.relatedTarget instanceof Node && !header.contains(event.relatedTarget)) setMenu(false);
});
mobileViewport.addEventListener('change', event => {
  const focusedElement = document.activeElement;
  setMenu(false, event.matches && !!nav?.contains(focusedElement));
  // Resizing must not leave keyboard focus in the now-hidden toggle or nav.
  if (!event.matches && focusedElement === menuToggle) nav?.querySelector<HTMLAnchorElement>('a')?.focus();
});
function updateHeader() { header?.classList.toggle('is-scrolled', window.scrollY > 24); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window) {
  // Header active states are rendered from Astro.url.pathname, on every page.
  // Scrolling changes presentation only; it never overrides route navigation.
  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
      element.classList.add('will-reveal');
      revealObserver.observe(element);
    });
  }
}
