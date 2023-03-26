import React, {useEffect, useState} from "react";
import {collection, getDocs, orderBy, query, where} from "firebase/firestore";
import {db} from "../FirebaseConfig";
import ICalendarActivity from "../interfaces/ICalendarActivity";
import CalendarEvent from "../components/CalendarEvent";
import {Heading, Stack, VStack} from "@chakra-ui/react";
import dayjs from "dayjs";

const ViewCalendar = () => {

    const calendarRef = collection(db, "calendarEvents");
    const [calendarEvents, setCalendarEvents] = useState([] as ICalendarActivity[]);

    useEffect(() => {
        RefreshEvents();
    });


    const RefreshEvents = () => {
        const startDate = dayjs().startOf("day").toDate().valueOf() / 1000;

        let calendarQuery = query(calendarRef,
            where("date", ">=", startDate),
            orderBy("date"))

        getDocs(calendarQuery)
            .then((snapShot) => {
                if (!snapShot.empty) {
                    const events = [] as ICalendarActivity[];
                    snapShot.docs.forEach((doc) => {

                        const model = doc.data() as ICalendarActivity;
                        if (model.done !== true) {
                            model.id = doc.id;
                            events.push(model)
                        }
                    });
                    setCalendarEvents(events);
                } else {

                }

            })
    }

    return (
        <VStack h={"50vh"} overflow={"auto"} p={10}>

            <Stack spacing={4} justifyContent={"center"} flexWrap={"wrap"}>
                {calendarEvents.map(ce => {
                    return <CalendarEvent id={ce.id} activityName={ce.activityName} date={ce.date}
                                          activityDesc={ce.activityDesc} onEventMarkedAsDone={RefreshEvents}/>
                })}

                {calendarEvents.length === 0 &&
                    <Stack>
                        <Heading as={"h3"}>No Upcoming Events 😔</Heading>

                    </Stack>
                }
            </Stack>

        </VStack>
    )


}

export default ViewCalendar;