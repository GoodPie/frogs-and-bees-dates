import React from "react";
import {
    Button,
    Icon,
    IconButton, Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useDisclosure, VStack,
} from "@chakra-ui/react";
import {AiOutlinePlus} from "react-icons/ai";



const AddToCalendar = () => {

    const {isOpen, onOpen, onClose} = useDisclosure();

    return (
        <>
            <IconButton colorScheme={"green"} id={"add-activity-button"} aria-label={"Add new activity"} size={"lg"}
                        icon={<Icon as={AiOutlinePlus}/>} onClick={onOpen}/>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Add to Calendar</ModalHeader>
                    <ModalCloseButton/>

                    <ModalBody>
                        <VStack>
                            <Text>Choose a Date:</Text>
                            <Input type={"date"}/>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant={"ghost"} colorScheme={"green"}>Close</Button>
                        <Button colorScheme={"green"}>Add to Calendar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default AddToCalendar;