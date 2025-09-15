import React, { ChangeEvent, useState } from "react";
import {
    Button,
    Icon,
    Input,
    Dialog,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import {BsPlus} from "react-icons/bs";
import {addDoc, collection} from "firebase/firestore";
import {db} from "../FirebaseConfig";

interface IAddToCalendarProps {
    activityName: string
    activityDescription: string

}


const AddToCalendar = (props: IAddToCalendarProps) => {

    const { open, onOpen, onClose } = useDisclosure();

    const [calendarDate, setCalendarDate] = useState("")

    const AddCalendarEvent = async () => {
        try {

            const calendarEvent = {
                date: new Date(calendarDate).valueOf() / 1000,
                activityName: props.activityName,
                activityDescription: props.activityDescription
            }

            const newEventRef = collection(db, "calendarEvents");
            await addDoc(newEventRef, calendarEvent);
            onClose();
        } catch (e) {
            console.error(e);
        }
    }

    const OnDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCalendarDate(e.target.value);
    }

    return (
        <>
            <Button onClick={onOpen} colorPalette={"green"} variant={"solid"}>
                <Icon as={BsPlus} /> Add to Calendar
            </Button>

            <Dialog.Root open={open} onOpenChange={(next) => { if(!next) onClose(); }}>
                <Dialog.Backdrop />
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Add <strong>{props.activityName}</strong> to the calendar</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.CloseTrigger />

                    <Dialog.Body>
                        <VStack alignItems={"flex-start"} justifyContent={"start"}>
                            <Text>Choose a Date:</Text>
                            <Input type={"date"} value={calendarDate} onChange={OnDateChange} />
                        </VStack>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Button variant={"ghost"} colorPalette={"green"} onClick={onClose}>Close</Button>
                        <Button colorPalette={"green"} onClick={AddCalendarEvent}>Add to Calendar</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </>
    )
}

export default AddToCalendar;