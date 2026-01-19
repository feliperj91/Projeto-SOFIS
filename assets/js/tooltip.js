// Modern Tooltip System
(function () {
    'use strict';

    const tooltipMap = new WeakMap();

    function createTooltip(element, text, variant = 'default', position = 'top') {
        // Remove any existing tooltip for this element
        removeTooltip(element);

        const tooltip = document.createElement('div');
        tooltip.className = `modern-tooltip ${variant} ${position}`;
        tooltip.textContent = text;

        // Check if text is long enough for multiline
        if (text.length > 50) {
            tooltip.classList.add('multiline');
        }

        // Ensure element has relative positioning
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(tooltip);

        // Trigger animation
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });

        tooltipMap.set(element, tooltip);
        return tooltip;
    }

    function removeTooltip(element) {
        const tooltip = tooltipMap.get(element);
        if (tooltip && tooltip.parentNode) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                tooltipMap.delete(element);
            }, 200);
        }
    }

    // Auto-initialize tooltips on elements with data-tooltip attribute
    function initTooltips() {
        document.querySelectorAll('[data-tooltip]:not([data-tooltip-initialized])').forEach(element => {
            element.setAttribute('data-tooltip-initialized', 'true');

            const text = element.getAttribute('data-tooltip');
            const variant = element.getAttribute('data-tooltip-variant') || 'default';
            const position = element.getAttribute('data-tooltip-position') || 'top';

            element.addEventListener('mouseenter', function () {
                createTooltip(this, text, variant, position);
            });

            element.addEventListener('mouseleave', function () {
                removeTooltip(this);
            });

            // Remove tooltip on click
            element.addEventListener('click', function () {
                removeTooltip(this);
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltips);
    } else {
        initTooltips();
    }

    // Export functions globally
    window.ModernTooltip = {
        create: createTooltip,
        remove: removeTooltip,
        init: initTooltips
    };
})();
