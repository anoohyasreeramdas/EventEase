const API_URL = 'http://127.0.0.1:3000';
document.addEventListener('DOMContentLoaded', async () => {
    const concertsContainer = document.getElementById('concerts-container');

    // Verify the user's login session.
    try {
        const sessionResponse = await fetch(`${API_URL}/check-session`, {
            credentials: 'include'
        });

        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok || !sessionData.isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Session verification failed:', error);
        window.location.href = 'login.html';
        return;
    }

    if (!concertsContainer) {
        console.error('Concerts container not found.');
        return;
    }

    // Create a detail row for each concert.
    function createDetail(label, value, className = '') {
        const paragraph = document.createElement('p');

        if (className) {
            paragraph.className = className;
        }

        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;

        paragraph.append(strong, document.createTextNode(value ?? ''));

        return paragraph;
    }

    // Display the available concerts.
    function renderConcerts() {
        concertsContainer.innerHTML = '';

        if (!window.CONCERTS || window.CONCERTS.length === 0) {
            concertsContainer.textContent = 'No concerts available at the moment.';
            return;
        }

        window.CONCERTS.forEach(concert => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const poster = document.createElement('img');
            poster.src = concert.poster || '';
            poster.alt = concert.title || 'Concert poster';
            poster.className = 'event-poster';

            const details = document.createElement('div');
            details.className = 'event-details';

            const title = document.createElement('h2');
            title.textContent = concert.title || '';

            const price = document.createElement('p');
            price.className = 'price';

            const bookButton = document.createElement('button');
            bookButton.className = 'book-btn';
            bookButton.dataset.id = concert.id;
            bookButton.textContent = 'Book Ticket';

            details.append(
                title,
                createDetail('Artist', concert.artist),
                createDetail('Place', concert.place),
                createDetail('Time', concert.time),
                createDetail('Price', `₹${concert.price}`, 'price'),
                bookButton
            );

            card.append(poster, details);
            concertsContainer.appendChild(card);
        });
    }

    // Add the selected concert to the user's cart.
    async function handleBooking(id) {
        const concert = window.CONCERTS.find(
            item => item.id === Number(id)
        );

        if (!concert) {
            alert('Concert not found.');
            return;
        }

        const bookingDetails = {
            title: concert.title,
            poster: concert.poster,
            price: concert.price,
            artist: concert.artist,
            time: concert.time,
            place: concert.place
        };

        try {
            const response = await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(bookingDetails)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Successfully added ${concert.title} to your cart!`);
                window.location.href = 'cart.html';
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Concert booking failed:', error);
            alert('Could not connect to the server. Please try again later.');
        }
    }

    // Handle clicks on concert booking buttons.
    concertsContainer.addEventListener('click', event => {
        const bookButton = event.target.closest('.book-btn');

        if (bookButton && concertsContainer.contains(bookButton)) {
            handleBooking(bookButton.dataset.id);
        }
    });

    renderConcerts();
});
