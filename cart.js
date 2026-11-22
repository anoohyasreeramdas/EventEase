const API_URL = 'https://eventease-backend-0qmn.onrender.com';
document.addEventListener('DOMContentLoaded', async () => {
    const usernameEl = document.getElementById('username');

    // Check the current login session.
    try {
        const sessionResponse = await fetch(`${API_URL}/check-session`, {
            credentials: 'include'
        });

        const sessionData = await sessionResponse.json();

        if (sessionResponse.ok && sessionData.isLoggedIn) {
            if (usernameEl) {
                usernameEl.textContent = sessionData.user.username;
            }

            fetchCartItems();
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Could not check session:', error);
        window.location.href = 'login.html';
    }
});

// Fetch cart items from the server.
async function fetchCartItems() {
    const cartContainer = document.getElementById('cart-container');

    try {
        const response = await fetch(`${API_URL}/cart`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Could not fetch cart.');
        }

        const cartItems = await response.json();
        renderCart(cartItems);

    } catch (error) {
        console.error('Error fetching cart:', error);
        cartContainer.textContent = 'Could not load your cart. Please try again.';
    }
}

// Format the date without changing its calendar day.

function formatDate(dateValue) {
    if (!dateValue) return 'Not specified';

    // Extract the date directly without timezone conversion.
    const datePart = String(dateValue).split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) return datePart;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// Create a labelled detail row.
function createDetail(label, value) {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');

    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value || ''));

    return paragraph;
}

// Display cart items.
function renderCart(cart) {
    const cartContainer = document.getElementById('cart-container');
    const totalPriceEl = document.getElementById('total-price');

    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContainer.textContent = 'Your cart is empty.';
        totalPriceEl.textContent = 0;
        return;
    }

    cart.forEach(item => {
        const price = Number(item.event_price) || 0;
        total += price;

        const card = document.createElement('div');
        card.className = 'event-card';

        const poster = document.createElement('img');
        poster.className = 'event-poster';
        poster.src = item.event_poster || '';
        poster.alt = item.event_title || 'Event poster';

        const details = document.createElement('div');
        details.className = 'event-details';

        const title = document.createElement('h2');
        title.textContent = item.event_title || '';

        const place = createDetail('Place', item.event_place);
        const date = createDetail('Date', formatDate(item.event_date));
        const time = createDetail('Time', item.event_time);
        const priceText = createDetail('Price', `₹${price}`);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeItem(item.id));

        details.append(
            title,
            place,
            date,
            time,
            priceText,
            removeButton
        );

        card.append(poster, details);
        cartContainer.appendChild(card);
    });

    totalPriceEl.textContent = total;
}

// Remove an item from the cart.
async function removeItem(itemId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to remove item.');
        }

        await fetchCartItems();

    } catch (error) {
        console.error('Error removing item:', error);
        alert('Could not remove item. Please try again.');
    }
}

// Proceed to payment.
document.getElementById('pay-now').addEventListener('click', () => {
    const totalPriceEl = document.getElementById('total-price');

    if (Number(totalPriceEl.textContent) > 0) {
        window.location.href = 'payment.html';
    } else {
        alert('Your cart is empty. Please add items before proceeding to payment.');
    }
});
