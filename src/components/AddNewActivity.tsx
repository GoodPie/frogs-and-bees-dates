import {
    Button,
    Flex,
    Icon,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Tag,
    Text,
    Textarea,
    useDisclosure,
    VStack
} from "@chakra-ui/react";
import {doc, setDoc} from "firebase/firestore";
import React, {ChangeEvent, KeyboardEvent, useState} from "react";
import {AiOutlinePlus} from "react-icons/ai";
import {BsArrowRight} from "react-icons/bs";
import {FaMoneyBillAlt} from "react-icons/fa";
import {MdLocalActivity, MdLocalMovies} from "react-icons/md";
import {RiRestaurant2Fill} from "react-icons/ri";
import ActivityTime from "../enums/ActivityTime";
import ActivityType from "../enums/ActivityType";
import {db} from "../FirebaseConfig";

export interface IAddNewActivityProps {
    availableActivities: string[];
    onAdded: () => void;
}

enum ActivitySteps {
    NAME = 0,
    DESCRIPTION = 1,
    TYPE = 2,
    TAGS = 3,
}

const AddNewActivity = (props: IAddNewActivityProps) => {

    const {isOpen, onOpen, onClose} = useDisclosure();
    const [createStep, setCreateStep] = useState(0);
    const [activityName, setActivityName] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [activityType, setActivityType] = useState(ActivityType.NONE);
    const [activityTime, setActivityTime] = useState(ActivityTime.ANYTIME);
    const [activityTags, setActivityTags] = useState([] as string[]);
    const [currentTag, setCurrentTag] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const AddActivity = async () => {

        setIsAdding(true);

        try {
            for (const tag of activityTags) {
                // Create the tag
                await setDoc(doc(db, "tags", tag), {
                    name: tag,
                    createdOn: new Date()
                }, {merge: true});

            }
        } catch (e) {
            console.error(e);
        }

        try {
            // Add Activity to Firebase
            const activity = {
                name: activityName,
                type: activityType,
                time: activityTime,
                tags: activityTags,
                description: activityDescription
            }

            await setDoc(doc(db, "activities", activityName), activity, {merge: true});
        } catch (e) {
            console.error(e);
        }

        setIsAdding(false);
        ResetAddActivity();

        props.onAdded();
    }

    const ResetAddActivity = () => {
        setCreateStep(0);
        setActivityType(ActivityType.NONE);
        setActivityTime(ActivityTime.ANYTIME);
        setActivityTags([]);
        setCurrentTag("");
        setActivityName("");

        onClose();
    }

    const OnNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setActivityName(e.target.value);
    }

    const OnDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setActivityDescription(e.target.value);
    }

    const OnTagChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentTag(e.target.value);
    }

    const OnTagAdd = (tag: string) => {
        if (!tag) return;
        if (activityTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) return;

        const newTags = [...activityTags, tag];
        setActivityTags(newTags);
        setCurrentTag("");
    }

    const OnTagRemove = (tag: string) => {
        const newTags = activityTags.filter(t => t !== tag);
        setActivityTags(newTags);
    }

    const OnActivityTypeSelected = (type: ActivityType) => {
        setActivityType(type);
        setActivityTime(ActivityTime.ANYTIME);
        GoToNextStep();
    }


    /**
     * Go to the next step
     */
    const GoToNextStep = () => {
        const currentStep = createStep + 1;
        setCreateStep(currentStep);
    }


    const RenderActivityType = () => {
        return (
            <VStack>
                <Text fontSize='md'>Type of Activity?</Text>
                <Button onClick={() => OnActivityTypeSelected(ActivityType.FOOD)}
                        leftIcon={<Icon as={RiRestaurant2Fill}/>} w={"100%"}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Food
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.ACTIVITY)} w={"100%"}
                        leftIcon={<Icon as={MdLocalActivity}/>}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Activity
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.MOVIE)} w={"100%"}
                        leftIcon={<Icon as={MdLocalMovies}/>}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Movie
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.BIG)} w={"100%"}
                        leftIcon={<Icon as={FaMoneyBillAlt}/>}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Bougie Ballers
                </Button>
            </VStack>
        )
    }

    return (
        <>
            <IconButton colorScheme={"green"} id={"add-activity-button"} aria-label={"Add new activity"} size={"lg"}
                        icon={<Icon as={AiOutlinePlus}/>} onClick={onOpen}/>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Create Activity</ModalHeader>
                    <ModalCloseButton/>

                    <ModalBody>
                        {createStep === ActivitySteps.NAME &&
                            <Input value={activityName} onChange={OnNameChange} placeholder='Enter Activity Name'/>
                        }
                        {createStep === ActivitySteps.DESCRIPTION &&
                            <VStack>
                                <Text>{activityName}</Text>
                                <Textarea value={activityDescription} onChange={OnDescriptionChange}
                                          placeholder='Add some details'></Textarea>
                            </VStack>
                        }
                        {createStep === ActivitySteps.TYPE && <RenderActivityType/>}
                        {createStep === ActivitySteps.TAGS &&
                            <>
                                <Input type='text' placeholder={"Add Some Extra Tags"} value={currentTag}
                                       onChange={OnTagChange} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === "Enter") OnTagAdd((e.target as HTMLInputElement).value);
                                }
                                }/>

                                <Flex wrap={"wrap"} mt={4}>
                                    {activityTags.map((tag) => {
                                        return <Tag onClick={() => OnTagRemove(tag)} cursor={"pointer"}
                                                    colorScheme={"green"} mx={1} my={1}>{tag}</Tag>
                                    })}
                                </Flex>
                            </>
                        }
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            display={createStep === ActivitySteps.NAME || createStep === ActivitySteps.DESCRIPTION ? "block" : "none"}
                            onClick={GoToNextStep}
                            rightIcon={<Icon as={BsArrowRight}/>} colorScheme='green'>
                            Next
                        </Button>
                        <Button isLoading={isAdding} display={createStep === ActivitySteps.TAGS ? "block" : "none"}
                                onClick={AddActivity}
                                rightIcon={<Icon as={BsArrowRight}/>} colorScheme='green'>
                            Add Activity
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default AddNewActivity;