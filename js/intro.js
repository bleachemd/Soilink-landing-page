// Hide the hero until GSAP has set its intro start state (no flash of the
// final layout). Failsafe: if the libraries never load, show it anyway.
// Loaded synchronously in <head>; kept external so the CSP can forbid inline scripts.
document.documentElement.classList.add('js-intro');
setTimeout(function () { document.documentElement.classList.remove('js-intro'); }, 2500);
