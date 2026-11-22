const API_URL = 'https://eventease-backend-0qmn.onrender.com';
document.addEventListener('DOMContentLoaded', async () => {
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

    const movieListEl = document.getElementById('movie-list');
    const bookingSection = document.getElementById('booking-section');
    const bookingPoster = document.getElementById('booking-poster');
    const bookingTitle = document.getElementById('booking-title');
    const showdateSelect = document.getElementById('showdate');
    const showtimeSelect = document.getElementById('showtime');
    const seatContainer = document.getElementById('seat-container');
    const countEl = document.getElementById('count');
    const totalEl = document.getElementById('total');
    const addToCartBtn = document.getElementById('add-to-cart');
    const closeBookingBtn = document.getElementById('close-booking');

    const ROWS = 8;
    const COLS = 10;

    let currentMovie = null;
    let selectedSeats = new Set();
    let bookedSeats = [];

    // Display all available movies.
    function renderMovieGrid(movies) {
        movieListEl.innerHTML = '';

        if (!movies || movies.length === 0) {
            movieListEl.textContent = 'No movies available at the moment.';
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.dataset.id = movie.id;

            const poster = document.createElement('img');
            poster.src = movie.poster || '';
            poster.alt = movie.title || 'Movie poster';

            const title = document.createElement('h3');
            title.textContent = movie.title || '';

            const price = document.createElement('p');
            price.textContent = `From ₹${movie.price}`;

            const bookButton = document.createElement('button');
            bookButton.className = 'btn book-btn';
            bookButton.dataset.id = movie.id;
            bookButton.textContent = 'Book';

            card.append(poster, title, price, bookButton);
            movieListEl.appendChild(card);
        });
    }

    // Handle movie selection.
    movieListEl.addEventListener('click', event => {
        const button = event.target.closest('.book-btn');

        if (!button || !movieListEl.contains(button)) {
            return;
        }

        openBooking(Number(button.dataset.id));
    });

    // Open the booking section for the selected movie.
    function openBooking(movieId) {
        currentMovie = window.MOVIES.find(movie => movie.id === movieId);

        if (!currentMovie) {
            return;
        }

        bookingPoster.src = currentMovie.poster || '';
        bookingPoster.alt = currentMovie.title;
        bookingTitle.textContent = currentMovie.title;

        // Set the default show date to the current local date.
        const now = new Date();
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');

        showdateSelect.value = today;
        showdateSelect.min = today;

        showtimeSelect.innerHTML = '';

        currentMovie.showtimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            showtimeSelect.appendChild(option);
        });

        selectedSeats.clear();
        updateBookedSeatsFromStorage();
        renderSeatMap();
        updateSummary();

        bookingSection.classList.remove('hidden');
        scrollToSection(bookingSection);
    }

    // Retrieve previously selected seats for the current show.
    function updateBookedSeatsFromStorage() {
        const key = bookedSeatsKey();

        try {
            const storedSeats = JSON.parse(localStorage.getItem(key) || '[]');
            bookedSeats = Array.isArray(storedSeats) ? storedSeats : [];
        } catch (error) {
            console.error('Could not load saved seats:', error);
            bookedSeats = [];
        }
    }

    // Generate a separate seat record for each movie, date and showtime.
    function bookedSeatsKey() {
        const showtime = showtimeSelect.value || currentMovie.showtimes[0];
        const showdate = showdateSelect.value;

        return `booked_${currentMovie.id}_${showdate}_${showtime}`;
    }

    // Display the seat layout.
    function renderSeatMap() {
        seatContainer.innerHTML = '';

        for (let i = 0; i < ROWS * COLS; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.dataset.index = i;

            if (bookedSeats.includes(i)) {
                seat.classList.add('booked');
            }

            if (selectedSeats.has(i)) {
                seat.classList.add('selected');
            }

            seatContainer.appendChild(seat);
        }
    }

    // Handle seat selection.
    seatContainer.addEventListener('click', event => {
        const seat = event.target.closest('.seat');

        if (!seat || !seatContainer.contains(seat) ||
            seat.classList.contains('booked')) {
            return;
        }

        const index = Number(seat.dataset.index);

        if (selectedSeats.has(index)) {
            selectedSeats.delete(index);
        } else {
            selectedSeats.add(index);
        }

        updateSummary();
        renderSeatMap();
    });

    // Refresh seat availability when the date or showtime changes.
    function onSelectionChange() {
        if (!currentMovie) {
            return;
        }

        selectedSeats.clear();
        updateBookedSeatsFromStorage();
        renderSeatMap();
        updateSummary();
    }

    showtimeSelect.addEventListener('change', onSelectionChange);
    showdateSelect.addEventListener('change', onSelectionChange);

    // Calculate the selected seat count and booking total.
    function updateSummary() {
        countEl.textContent = selectedSeats.size;
        totalEl.textContent = currentMovie
            ? selectedSeats.size * currentMovie.price
            : 0;
    }

    // Validate the selection and add the booking to the cart.
    addToCartBtn.addEventListener('click', async () => {
        const showdate = showdateSelect.value;

        if (!currentMovie || selectedSeats.size === 0) {
            alert('Please select at least one seat.');
            return;
        }

        if (!showdate) {
            alert('Please select a show date.');
            return;
        }

        const selectedSeatNumbers = Array.from(selectedSeats);

        const bookingDetails = {
            title: currentMovie.title,
            poster: currentMovie.poster,
            price: selectedSeats.size * currentMovie.price,
            place: `Seats: ${selectedSeatNumbers.join(', ')}`,
            time: showtimeSelect.value,
            date: showdate
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
                const key = bookedSeatsKey();

                const newBooked = [
                    ...new Set([...bookedSeats, ...selectedSeatNumbers])
                ];

                localStorage.setItem(key, JSON.stringify(newBooked));

                alert('Successfully added to cart!');
                window.location.href = 'cart.html';
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Failed to add booking to cart:', error);
            alert('Could not connect to the server. Please try again later.');
        }
    });

    // Close the booking section and reset the current selection.
    closeBookingBtn.addEventListener('click', () => {
        bookingSection.classList.add('hidden');
        currentMovie = null;
        selectedSeats.clear();
        updateSummary();
    });

    // Scroll smoothly to the booking section.
    function scrollToSection(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Initialize the movie collection.
    renderMovieGrid(window.MOVIES);
});
