// Add white calendar icons to all date inputs
document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach(input => {
        // Wrap input if not already wrapped
        if (!input.parentElement.classList.contains('date-input-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'date-input-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.width = input.style.width || 'auto';

            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            // Add calendar icon
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-calendar date-calendar-icon';
            icon.style.position = 'absolute';
            icon.style.right = '10px';
            icon.style.top = '50%';
            icon.style.transform = 'translateY(-50%)';
            icon.style.color = '#ffffff';
            icon.style.pointerEvents = 'none';
            icon.style.fontSize = '0.9rem';
            icon.style.zIndex = '1';

            wrapper.appendChild(icon);
        }
    });

    // Observer for dynamically added date inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const newDateInputs = node.querySelectorAll?.('input[type="date"]') || [];
                    newDateInputs.forEach(input => {
                        if (!input.parentElement.classList.contains('date-input-wrapper')) {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'date-input-wrapper';
                            wrapper.style.position = 'relative';
                            wrapper.style.display = 'inline-block';
                            wrapper.style.width = input.style.width || 'auto';

                            input.parentNode.insertBefore(wrapper, input);
                            wrapper.appendChild(input);

                            const icon = document.createElement('i');
                            icon.className = 'fa-regular fa-calendar date-calendar-icon';
                            icon.style.position = 'absolute';
                            icon.style.right = '10px';
                            icon.style.top = '50%';
                            icon.style.transform = 'translateY(-50%)';
                            icon.style.color = '#ffffff';
                            icon.style.pointerEvents = 'none';
                            icon.style.fontSize = '0.9rem';
                            icon.style.zIndex = '1';

                            wrapper.appendChild(icon);
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
