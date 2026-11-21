const API_URL = 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', async () => {

    // Check whether the user is logged in.
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
        console.error('Could not check session:', error);
        window.location.href = 'login.html';
        return;
    }

    const container = document.getElementById('standup-container');

    // Display stand-up shows.
    function renderShows() {
        container.innerHTML = '';

        const shows = window.STANDUP_SHOWS || [];

        if (shows.length === 0) {
            container.textContent = 'No stand-up shows available at the moment.';
            return;
        }

        shows.forEach(show => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const poster = document.createElement('img');
            poster.src = show.poster || '';
            poster.alt = show.title || 'Stand-up show poster';
            poster.className = 'event-poster';

            const details = document.createElement('div');
            details.className = 'event-details';

            const title = document.createElement('h2');
            title.textContent = show.title || '';

            const place = document.createElement('p');
            const placeLabel = document.createElement('strong');
            placeLabel.textContent = 'Place: ';
            place.append(placeLabel, document.createTextNode(show.place || ''));

            const time = document.createElement('p');
            const timeLabel = document.createElement('strong');
            timeLabel.textContent = 'Time: ';
            time.append(timeLabel, document.createTextNode(show.time || ''));

            const price = document.createElement('p');
            price.className = 'price';
            price.textContent = `Price: ₹${show.price}`;

            const bookButton = document.createElement('button');
            bookButton.className = 'book-btn';
            bookButton.dataset.id = show.id;
            bookButton.textContent = 'Book Ticket';

            details.append(title, place, time, price, bookButton);
            card.append(poster, details);

            container.appendChild(card);
        });
    }

    // Handle ticket booking.
    async function handleBooking(showId) {
        const show = (window.STANDUP_SHOWS || []).find(
            item => String(item.id) === String(showId)
        );

        if (!show) return;

        const bookingDetails = {
            title: show.title,
            poster: show.poster,
            price: show.price,
            place: show.place,
            time: show.time
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
                alert(`🎭 Booking Confirmed for "${show.title}"`);
                window.location.href = 'cart.html';
            } else {
                alert(`Error: ${result.message || 'Booking failed.'}`);
            }

        } catch (error) {
            console.error('Booking failed:', error);
            alert('Could not connect to the server.');
        }
    }

    // Handle clicks on booking buttons.
    container.addEventListener('click', event => {
        const button = event.target.closest('.book-btn');

        if (!button || !container.contains(button)) return;

        handleBooking(button.dataset.id);
    });

    renderShows();
});
