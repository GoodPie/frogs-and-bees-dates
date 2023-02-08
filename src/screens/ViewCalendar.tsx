
const ViewCalendar = () => {

    /**
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [events, setEvents] = useState<ICalendarActivity[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {

    }, [events]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const GoToNextDate = () => {

        // Sort the events by the date, ascending
        const sortedEvents = events.sort((a, b) => {
           return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // Find the next event
        const nextEvent = sortedEvents.find(e => new Date(e.date).getTime() > currentDate.getTime());

        // If there is a next event, set the current date to the next event
        if (nextEvent) {
            setCurrentDate(new Date(nextEvent.date));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const GoToPreviousDate = () => {

    }
    **/

    return (
        <h1>Viewing Calendar</h1>

    )


}

export default ViewCalendar;