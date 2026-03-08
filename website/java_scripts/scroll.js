document.addEventListener('DOMContentLoaded', () => {
	const logo = document.getElementById('logo');

    if (logo) {
        logo.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent the default jump to #top which is instant

            window.scrollTo({
                top: 0,            // Scroll to the very top of the page
                behavior: 'smooth' // Make the scrolling animation smooth
            });
        });
    }