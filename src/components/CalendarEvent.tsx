import ICalendarActivity from "../interfaces/ICalendarActivity";
import {Box, Button, Heading, Text, VStack} from "@chakra-ui/react";
import React from "react";
import { doc, updateDoc} from "firebase/firestore";
import {db} from "../FirebaseConfig";


const CalendarEvent = (props: ICalendarActivity) =>  {

    const eventColors = [
        "#F0F7EE", "#C4D7F2", "#AFDEDC", "#AFDEDC", "#776871"
    ]

    const SecondsToDate = (seconds: number) => {
        return new Date(seconds * 1000);
    }

    const GetColorForCalendarIcon = (eventName: string) => {

        const nameLength = eventName.length;
        let total = 0;
        for (let i = 0; i < nameLength; i++) {
            total += eventName.charCodeAt(i);
        }

        return eventColors[total % eventColors.length];

    }


    const OnEventCompleted = async () => {

        const calendarRef = doc(db, "calendarEvents", props.id ?? "")
        await updateDoc(calendarRef, {
            done: true
        });

        if (props.onEventMarkedAsDone) {
            props.onEventMarkedAsDone();
        }

    }



    const date = SecondsToDate(props.date);
    const backgroundColor = GetColorForCalendarIcon(props.activityName);


    return (
        <Box p={10} rounded={"lg"} backgroundColor={backgroundColor}>
            <VStack>
                <Heading as={"h4"} fontSize={26}>{props.activityName}</Heading>
                <Text>{date.toLocaleDateString()}</Text>
                <Text>{props.activityDesc}</Text>

                <Button onClick={OnEventCompleted} colorScheme={"green"}>Done</Button>
            </VStack>
        </Box>
    )
}

export default CalendarEvent;