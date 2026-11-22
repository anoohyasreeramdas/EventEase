const API_URL = 'https://eventease-backend-0qmn.onrender.com';

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

    const citySelector = document.getElementById('city');
    const restaurantsContainer = document.getElementById('restaurants-container');
    const bookingModal = document.getElementById('booking-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalRestaurantName = document.getElementById('modal-restaurant-name');
    const modalTimeSlotsContainer = document.getElementById('modal-time-slots');

    let currentRestaurantForBooking = null;

    // Get today's date in local time.
    function getLocalDate() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // Format date for display.
    function formatDate(date) {
        return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Display restaurants for the selected city.
    function renderRestaurants(city) {
        restaurantsContainer.innerHTML = '';

        const restaurants = window.RESTAURANTS[city] || [];

        if (restaurants.length === 0) {
            restaurantsContainer.textContent = 'No restaurants available in this city.';
            return;
        }

        restaurants.forEach(res => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const poster = document.createElement('img');
            poster.src = res.poster || '';
            poster.alt = res.name || 'Restaurant';
            poster.className = 'event-poster';

            const details = document.createElement('div');
            details.className = 'event-details';

            const name = document.createElement('h2');
            name.textContent = res.name || '';

            const cuisine = document.createElement('p');
            const cuisineLabel = document.createElement('strong');
            cuisineLabel.textContent = 'Cuisine: ';
            cuisine.append(cuisineLabel, document.createTextNode(res.cuisine || ''));

            const location = document.createElement('p');
            const locationLabel = document.createElement('strong');
            locationLabel.textContent = 'Location: ';
            location.append(locationLabel, document.createTextNode(res.place || ''));

            const price = document.createElement('p');
            price.className = 'price';
            const priceLabel = document.createElement('strong');
            priceLabel.textContent = 'Price for 2: ';
            price.append(priceLabel, document.createTextNode(`₹${res.price}`));

            const offer = document.createElement('span');
            offer.className = 'offer-badge';
            offer.textContent = `${res.offer || ''} OFF`;

            const bookButton = document.createElement('button');
            bookButton.className = 'book-btn';
            bookButton.dataset.id = res.id;
            bookButton.dataset.city = city;
            bookButton.textContent = 'Book Table';

            details.append(name, cuisine, location, price, offer, bookButton);
            card.append(poster, details);

            restaurantsContainer.appendChild(card);
        });
    }

    // Save the selected restaurant reservation.
    async function handleBooking(restaurant, selectedTime, selectedDate) {
        if (!restaurant || !selectedTime || !selectedDate) return;

        const bookingDetails = {
            title: restaurant.name,
            poster: restaurant.poster,
            place: restaurant.place,
            time: selectedTime,
            date: selectedDate
        };

        try {
            const response = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(bookingDetails)
            });

            const result = await response.json();

            if (response.ok) {
                alert(
                    `Table successfully reserved for ${restaurant.name} on ${formatDate(selectedDate)} at ${selectedTime}.`
                );
            } else {
                alert(`Error: ${result.message || 'Could not complete reservation.'}`);
            }
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Could not connect to the server.');
        }
    }

    // Open the restaurant booking modal.
    function openBookingModal(id, city) {
        const restaurants = window.RESTAURANTS[city] || [];
        const restaurant = restaurants.find(res => String(res.id) === String(id));

        if (!restaurant) {
            alert('Restaurant not found.');
            return;
        }

        currentRestaurantForBooking = restaurant;
        modalRestaurantName.textContent = restaurant.name;
        modalTimeSlotsContainer.innerHTML = '';

        // Add date selection.
        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Select Reservation Date';
        dateLabel.htmlFor = 'reservation-date';
        dateLabel.style.display = 'block';
        dateLabel.style.marginBottom = '8px';
        dateLabel.style.fontWeight = 'bold';

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'reservation-date';
        dateInput.min = getLocalDate();
        dateInput.value = getLocalDate();
        dateInput.style.display = 'block';
        dateInput.style.width = '100%';
        dateInput.style.padding = '10px';
        dateInput.style.marginBottom = '18px';
        dateInput.style.border = '1px solid #E2D5BD';
        dateInput.style.borderRadius = '5px';
        dateInput.style.boxSizing = 'border-box';

        modalTimeSlotsContainer.append(dateLabel, dateInput);

        // Display available time slots.
        if (restaurant.timeSlots && restaurant.timeSlots.length > 0) {
            const timeHeading = document.createElement('p');
            timeHeading.textContent = 'Select Reservation Time';
            timeHeading.style.fontWeight = 'bold';

            modalTimeSlotsContainer.appendChild(timeHeading);

            restaurant.timeSlots.forEach(time => {
                const timeButton = document.createElement('button');
                timeButton.className = 'time-slot-btn';
                timeButton.textContent = time;

                modalTimeSlotsContainer.appendChild(timeButton);
            });
        } else {
            const message = document.createElement('p');
            message.textContent = 'No time slots available for this restaurant.';
            modalTimeSlotsContainer.appendChild(message);
        }

        bookingModal.classList.remove('hidden');
    }

    // Handle restaurant selection.
    restaurantsContainer.addEventListener('click', event => {
        const button = event.target.closest('.book-btn');

        if (!button || !restaurantsContainer.contains(button)) return;

        openBookingModal(button.dataset.id, button.dataset.city);
    });

    // Handle selected booking time.
    modalTimeSlotsContainer.addEventListener('click', event => {
        const button = event.target.closest('.time-slot-btn');

        if (!button || !modalTimeSlotsContainer.contains(button)) return;

        const selectedDate = document.getElementById('reservation-date').value;
        const selectedTime = button.textContent;

        if (!selectedDate) {
            alert('Please select a reservation date first.');
            return;
        }

        if (selectedDate < getLocalDate()) {
            alert('Please select today or a future date.');
            return;
        }

        bookingModal.classList.add('hidden');

        handleBooking(
            currentRestaurantForBooking,
            selectedTime,
            selectedDate
        );
    });

    // Close the booking modal.
    modalCloseBtn.addEventListener('click', () => {
        bookingModal.classList.add('hidden');
    });

    bookingModal.addEventListener('click', event => {
        if (event.target === bookingModal) {
            bookingModal.classList.add('hidden');
        }
    });

    // Display restaurants when the city changes.
    citySelector.addEventListener('change', event => {
        renderRestaurants(event.target.value);
    });

    renderRestaurants(citySelector.value);
});
