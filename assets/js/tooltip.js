// Modern Tooltip System
(function () {
    'use strict';

    const tooltipMap = new WeakMap();
    const initializedElements = new WeakSet();

    function createTooltip(element, text, variant = 'default', position = 'top') {
        // Remove any existing tooltip for this element
        removeTooltip(element);

        if (!text || text.trim() === '') return;

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

        // Trigger animation and check position
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
            adjustTooltipPosition(tooltip, element, position);
        });

        tooltipMap.set(element, tooltip);
        return tooltip;
    }

    function adjustTooltipPosition(tooltip, element, preferredPosition) {
        const rect = tooltip.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Check if tooltip is going outside viewport
        let newPosition = preferredPosition;

        // Check vertical overflow
        if (preferredPosition === 'top' && rect.top < 0) {
            newPosition = 'bottom';
            tooltip.classList.remove('top');
            tooltip.classList.add('bottom');
        } else if (preferredPosition === 'bottom' && rect.bottom > viewportHeight) {
            newPosition = 'top';
            tooltip.classList.remove('bottom');
            tooltip.classList.add('top');
        }

        // Check horizontal overflow and adjust
        if (rect.left < 0) {
            tooltip.style.left = '10px';
            tooltip.style.transform = 'translateY(0)';
        } else if (rect.right > viewportWidth) {
            tooltip.style.left = 'auto';
            tooltip.style.right = '10px';
            tooltip.style.transform = 'translateY(0)';
        }
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

    // Auto-initialize tooltips on elements with data-tooltip or title attribute
    function initTooltips() {
        // Handle data-tooltip elements
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            if (initializedElements.has(element)) return;
            initializedElements.add(element);

            const text = element.getAttribute('data-tooltip');
            const variant = element.getAttribute('data-tooltip-variant') || 'default';
            const position = element.getAttribute('data-tooltip-position') || 'top';

            element.addEventListener('mouseenter', function (e) {
                e.stopPropagation();
                createTooltip(this, text, variant, position);
            });

            element.addEventListener('mouseleave', function (e) {
                e.stopPropagation();
                removeTooltip(this);
            });

            element.addEventListener('click', function (e) {
                removeTooltip(this);
            });
        });

        // Handle native title attribute elements
        document.querySelectorAll('[title]:not([data-tooltip])').forEach(element => {
            if (initializedElements.has(element)) return;

            const titleText = element.getAttribute('title');
            if (!titleText || titleText.trim() === '') return;

            initializedElements.add(element);

            // Store original title and remove it to prevent native tooltip
            element.setAttribute('data-original-title', titleText);
            element.removeAttribute('title');

            element.addEventListener('mouseenter', function (e) {
                e.stopPropagation();
                const text = this.getAttribute('data-original-title');
                createTooltip(this, text, 'default', 'top');
            });

            element.addEventListener('mouseleave', function (e) {
                e.stopPropagation();
                removeTooltip(this);
            });

            element.addEventListener('click', function (e) {
                removeTooltip(this);
            });
        });
    }

    // Remove tooltips when scrolling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        removeAllTooltips();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(initTooltips, 100);
    }, true);

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltips);
    } else {
        initTooltips();
    }

    // Re-run initialization periodically for dynamic content
    setInterval(initTooltips, 2000);

    // Export functions globally
    window.ModernTooltip = {
        create: createTooltip,
        remove: removeTooltip,
        removeAll: removeAllTooltips,
        init: initTooltips
    };
})();
