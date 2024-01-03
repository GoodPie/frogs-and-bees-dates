import React, {ChangeEvent, useState} from "react";
import {
    Button,
    Icon,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
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

    const {isOpen, onOpen, onClose} = useDisclosure();

    // Form details
    const [activityName, setActivityName] = useState(props.activityName);
    const [activityDescription, setActivityDescription] = useState(props.activityDescription)
    const [calendarDate, setCalendarDate] = useState("")

    const AddCalendarEvent = async () => {
        try {

            const calendarEvent = {
                date: new Date(calendarDate).valueOf() / 1000,
                activityName,
                activityDescription
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
            <Button onClick={onOpen} leftIcon={<Icon as={BsPlus}/>}
                    colorScheme={"green"} variant={"solid"}>Add to Calendar</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Add <strong>{props.activityName}</strong> to the calendar</ModalHeader>
                    <ModalCloseButton/>

                    <ModalBody>
                        <VStack alignItems={"left"} justifyContent={"start"}>

                            <Text>Choose a Date:</Text>
                            <Input type={"date"} value={calendarDate} onChange={OnDateChange}/>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant={"ghost"} colorScheme={"green"}>Close</Button>
                        <Button colorScheme={"green"} onClick={AddCalendarEvent}>Add to Calendar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default AddToCalendar;