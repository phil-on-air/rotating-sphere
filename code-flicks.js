// Fetch the code from script.js and show random graphic code flashes
(async function() {
    const container = document.getElementById('codeFlicks');
    if (!container) return;

    // Fetch the code
    let code = '';
    try {
        const res = await fetch('script.js');
        code = await res.text();
    } catch (e) {
        code = '// Could not load code';
    }
    const codeLines = code.split('\n');

    // Helper to get a random code fragment
    function getRandomFragment() {
        const len = Math.floor(8 + Math.random() * 10); // 8–18 lines
        const start = Math.floor(Math.random() * (codeLines.length - len));
        return codeLines.slice(start, start + len).join('\n');
    }

    // Helper to create a code flash element with continuously cycled scrolling code
    function createFlash() {
        const el = document.createElement('div');
        el.className = 'code-flash';
        el.style.position = 'absolute';
        el.style.left = `${Math.random() * 92}vw`;
        el.style.top = `${Math.random() * 92}vh`;
        el.style.width = 'max-content';
        el.style.maxWidth = '40vw';
        el.style.height = 'auto';
        el.style.maxHeight = '18em';
        el.style.overflow = 'hidden';
        el.style.fontSize = '13px';
        el.style.fontWeight = '300';
        el.style.opacity = '0';
        el.style.filter = 'none';
        el.style.transition = 'opacity 0.13s cubic-bezier(.7,0,.7,1)';
        el.style.pointerEvents = 'none';
        el.style.userSelect = 'none';
        el.style.fontFamily = 'Orbitron, Share Tech Mono, Consolas, Menlo, monospace';
        el.style.letterSpacing = '0.04em';
        el.style.color = '#fff';

        // Inner code element for scrolling
        const codeInner = document.createElement('pre');
        codeInner.textContent = getRandomFragment();
        codeInner.style.margin = '0';
        codeInner.style.padding = '0';
        codeInner.style.willChange = 'transform';
        el.appendChild(codeInner);
        container.appendChild(el);

        // Animate in
        setTimeout(() => {
            el.style.opacity = '0.5';
            // Animate continuous cycled scroll
            const lines = codeInner.textContent.split('\n').length;
            const lineHeight = 1.5 * 13; // line-height * font-size (px)
            const scrollDist = Math.max(0, lines * lineHeight - 18 * 13); // scroll if content is taller than block
            if (scrollDist > 0) {
                const duration = flickDuration;
                const cycleTime = 180; // ms for one scroll cycle
                const start = performance.now();
                function scrollFrame(now) {
                    const elapsed = now - start;
                    const t = (elapsed % cycleTime) / cycleTime;
                    codeInner.style.transform = `translateY(-${t * scrollDist}px)`;
                    if (elapsed < duration) requestAnimationFrame(scrollFrame);
                }
                requestAnimationFrame(scrollFrame);
            }
        }, 10);
        // Animate out and remove
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => container.removeChild(el), 120);
        }, flickDuration);
    }

    // Glitch effect for code flashes
    function glitchCodeFlashes() {
        // Spawn 2-4 new code flicks immediately
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; ++i) createFlash();
        // Apply shake to all visible code flicks
        const flashes = document.querySelectorAll('.code-flash');
        flashes.forEach(el => {
            el.style.transition += ', transform 0.08s cubic-bezier(.7,0,.7,1)';
            el.style.transform = `translate(${(Math.random()-0.5)*12}px, ${(Math.random()-0.5)*12}px) skew(${(Math.random()-0.5)*8}deg)`;
            setTimeout(() => {
                el.style.transform = '';
            }, 80);
        });
    }

    // Listen for the sphere-glitch event
    window.addEventListener('sphere-glitch', glitchCodeFlashes);

    // Flick duration (ms)
    const flickDuration = 400 + Math.random() * 200; // 400–600ms

    // Animation loop: spawn random flashes
    function animateFlashes() {
        if (Math.random() > 0.3) createFlash();
        setTimeout(animateFlashes, 600 + Math.random() * 1200);
    }

    animateFlashes();
})(); 