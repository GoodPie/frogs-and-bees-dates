import {useEffect, useState} from "react";
import {collection, getDocs, orderBy, query, where} from "firebase/firestore";
import type {ICalendarActivity} from "../interfaces/ICalendarActivity";
import CalendarEvent from "../components/CalendarEvent";
import {Button, Heading, Stack, VStack} from "@chakra-ui/react";
import dayjs from "dayjs";
import {db, RegisterFirebaseToken} from "../FirebaseConfig.ts";

const ViewCalendar = () => {

    const calendarRef = collection(db, "calendarEvents");
    const [calendarEvents, setCalendarEvents] = useState([] as ICalendarActivity[]);

    useEffect(() => {
        RefreshEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const RefreshEvents = () => {
        const startDate = dayjs().startOf("day").toDate().valueOf() / 1000;

        const calendarQuery = query(calendarRef,
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
                }

            })
    }

    return (
        <VStack h={"50vh"} overflow={"auto"} p={10}>

            <Stack gap={4} justifyContent={"center"} flexWrap={"wrap"}>
                {calendarEvents.map(ce => {
                    return <CalendarEvent id={ce.id} activityName={ce.activityName} date={ce.date}
                                          activityDesc={ce.activityDesc} onEventMarkedAsDone={RefreshEvents}/>
                })}

                {calendarEvents.length === 0 &&
                    <Stack>
                        <Heading as={"h3"}>No Upcoming Events 😔</Heading>
                        <div style={{position: "absolute", left: 0, right: 0, bottom: 16}}>
                            <div style={{display: "flex", justifyContent: "center"}}>
                                <Button variant={"ghost"} onClick={() => RegisterFirebaseToken()}>
                                    Get Notifications
                                </Button>
                            </div>
                        </div>
                    </Stack>
                }
            </Stack>

        </VStack>
    )


}

export default ViewCalendar;