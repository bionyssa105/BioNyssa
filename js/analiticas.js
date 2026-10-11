(() => {
  const ID = 'G-ZQGQ8DJREX';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const noRastrear = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (local || noRastrear || /\/admin\.html$/.test(location.pathname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  function cargar() {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(cargar, 300);
  else addEventListener('load', () => setTimeout(cargar, 300));
})();
