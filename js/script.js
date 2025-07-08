function formatDate(dateStr) {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj)) return dateStr;

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatTime(timeStr) {
    const timeObj = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(timeObj)) return timeStr;

    return timeObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateWithWeekday(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return 'Invalid Date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    return `${day}/${month}/${year}, ${weekday}`;
}