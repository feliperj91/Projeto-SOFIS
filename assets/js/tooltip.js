// Modern Tooltip System
(function () {
    'use strict';

    let activeTooltip = null;

    function createTooltip(element, text, variant = 'default', position = 'top') {
        // Remove any existing tooltip
        removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = `modern-tooltip ${variant} ${position}`;
        tooltip.textContent = text;

        // Check if text is long enough for multiline
        if (text.length > 50) {
            tooltip.classList.add('multiline');
        }

        element.style.position = 'relative';
        element.appendChild(tooltip);

        // Trigger animation
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });

        activeTooltip = tooltip;
        return tooltip;
    }

    function removeTooltip() {
        if (activeTooltip) {
            activeTooltip.classList.remove('show');
            setTimeout(() => {
                if (activeTooltip && activeTooltip.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                }
                activeTooltip = null;
            }, 200);
        }
    }

    // Auto-initialize tooltips on elements with data-tooltip attribute
    function initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            const text = element.getAttribute('data-tooltip');
            const variant = element.getAttribute('data-tooltip-variant') || 'default';
            const position = element.getAttribute('data-tooltip-position') || 'top';

            element.addEventListener('mouseenter', () => {
                createTooltip(element, text, variant, position);
            });

            element.addEventListener('mouseleave', () => {
                removeTooltip();
            });

            // Remove tooltip on click
            element.addEventListener('click', () => {
                removeTooltip();
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltips);
    } else {
        initTooltips();
    }

    // Re-initialize when new content is added
    const observer = new MutationObserver(() => {
        initTooltips();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Export functions globally
    window.ModernTooltip = {
        create: createTooltip,
        remove: removeTooltip,
        init: initTooltips
    };
})();
