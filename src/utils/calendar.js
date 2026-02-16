// Calendar file (.ics) generator utility
export const generateICSFile = (booking) => {
    const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CalendarioAloe//IT
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${booking.id || Date.now()}@calendarioaloe.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(booking.start_time)}
DTEND:${formatDate(booking.end_time)}
SUMMARY:${booking.eventTitle}
DESCRIPTION:Appuntamento - ${booking.eventTitle}\\nCliente: ${booking.user_name} ${booking.user_surname}
LOCATION:${booking.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Promemoria appuntamento
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
};

export const downloadICSFile = (booking) => {
    const icsContent = generateICSFile(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appuntamento-${booking.user_name}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
