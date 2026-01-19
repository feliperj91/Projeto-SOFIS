// Modern Tooltip System - Simplified
(function () {
    'use strict';

    const tooltipMap = new WeakMap();
    const initializedElements = new WeakSet();

    function createTooltip(element, text, variant = 'default', position = 'bottom') {
        removeTooltip(element);

        if (!text || text.trim() === '') return;

        const tooltip = document.createElement('div');
        tooltip.className = `modern-tooltip ${variant} ${position}`;
        tooltip.textContent = text;

        if (text.length > 40) {
            tooltip.classList.add('multiline');
        }

        document.body.appendChild(tooltip);

        const elementRect = element.getBoundingClientRect();

        // Position tooltip
        if (position === 'bottom') {
            tooltip.style.top = `${elementRect.bottom + 8}px`;
            tooltip.style.left = `${elementRect.left + (elementRect.width / 2)}px`;
            tooltip.style.transform = 'translateX(-50%)';
        } else {
            tooltip.style.bottom = `${window.innerHeight - elementRect.top + 8}px`;
            tooltip.style.left = `${elementRect.left + (elementRect.width / 2)}px`;
            tooltip.style.transform = 'translateX(-50%)';
        }

        requestAnimationFrame(() => {
            tooltip.classList.add('show');

            // Adjust if going outside viewport
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth - 10) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
                tooltip.style.transform = 'none';
            }
            if (tooltipRect.left < 10) {
                tooltip.style.left = '10px';
                tooltip.style.transform = 'none';
            }
        });

        tooltipMap.set(element, tooltip);
        return tooltip;
    }

    function removeTooltip(element) {
        const tooltip = tooltipMap.get(element);
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                tooltipMap.delete(element);
            }, 200);
        }
    }

    function removeAllTooltips() {
        document.querySelectorAll('.modern-tooltip').forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
    }

    function initTooltips() {
        // ONLY handle data-tooltip elements (explicit tooltips)
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            if (initializedElements.has(element)) return;
            initializedElements.add(element);

            const text = element.getAttribute('data-tooltip');
            const variant = element.getAttribute('data-tooltip-variant') || 'default';
            const position = element.getAttribute('data-tooltip-position') || 'bottom';

            element.addEventListener('mouseenter', function () {
                createTooltip(this, text, variant, position);
            });

            element.addEventListener('mouseleave', function () {
                removeTooltip(this);
            });

            element.addEventListener('click', function () {
                removeTooltip(this);
            });
        });
    }

    // Remove tooltips on scroll
    window.addEventListener('scroll', removeAllTooltips, true);

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltips);
    } else {
        initTooltips();
    }

    // Re-check for new elements
    setInterval(initTooltips, 2000);

    window.ModernTooltip = {
        create: createTooltip,
        remove: removeTooltip,
        removeAll: removeAllTooltips,
        init: initTooltips
    };
})();
