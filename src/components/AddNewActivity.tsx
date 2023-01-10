import React, {ChangeEvent, KeyboardEvent, useEffect, useState} from "react";
import {
    Button, Flex, FormControl, FormLabel, HStack,
    Icon,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay, SimpleGrid, Tag, TagLabel,
    Text,
    useDisclosure,
    VStack
} from "@chakra-ui/react";
import {AiOutlinePlus} from "react-icons/ai";
import {BsArrowRight} from "react-icons/bs";
import {WiDaySunny, WiMoonrise, WiSunrise} from "react-icons/wi";
import {RiRestaurant2Fill} from "react-icons/ri";
import {MdLocalActivity} from "react-icons/md";
import ActivityType from "../enums/ActivityType";
import ActivityTime from "../enums/ActivityTime";
import {collection, doc, getDoc, getDocs, setDoc} from "firebase/firestore";
import {db} from "../FirebaseConfig";

export interface IAddNewActivityProps {
    availableActivities: string[];
    onAdded: () => void
}


const AddNewActivity = (props: IAddNewActivityProps) => {

    const {isOpen, onOpen, onClose} = useDisclosure();
    const [createStep, setCreateStep] = useState(0);
    const [activityName, setActivityName] = useState("");
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


        const activity = {
            name: activityName,
            type: activityType,
            time: activityTime,
            tags: activityTags,
        }


        try {
            // Add Activity to Firebase
            await setDoc(doc(db, "activities", activityName), activity, {merge: true});
        } catch (e) {
            console.error(e);
        }

        setIsAdding(false);

        setCreateStep(0);
        setActivityType(ActivityType.NONE);
        setActivityTime(ActivityTime.ANYTIME);
        setActivityTags([]);
        setCurrentTag("");
        setActivityName("");

        onClose();

        props.onAdded();
    }

    const OnNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setActivityName(e.target.value);
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
        GoToNextStep();
    }

    /**
     * Set the time of the activity
     * @param time Time enum of the activity
     */
    const OnActivityTimeSelected = (time: ActivityTime) => {
        setActivityTime(time);
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
            </VStack>
        )
    }

    const RenderActivityTime = () => {
        return (
            <VStack>
                <Text fontSize='md'>Best Time For the Activity?</Text>
                <Button onClick={() => OnActivityTimeSelected(ActivityTime.MORNING)} leftIcon={<Icon as={WiSunrise}/>}
                        w={"100%"}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Morning
                </Button>

                <Button onClick={() => OnActivityTimeSelected(ActivityTime.AFTERNOON)} w={"100%"}
                        leftIcon={<Icon as={WiDaySunny}/>}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Afternoon
                </Button>

                <Button onClick={() => OnActivityTimeSelected(ActivityTime.EVENING)} w={"100%"}
                        leftIcon={<Icon as={WiMoonrise}/>}
                        colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Evening
                </Button>

                <Button onClick={() => OnActivityTimeSelected(ActivityTime.ANYTIME)} w={"100%"} colorScheme={"green"}
                        size={"lg"}>
                    Anytime
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
                        {createStep === 0 &&
                            <Input value={activityName} onChange={OnNameChange} placeholder='Enter Activity Name'/>
                        }
                        {createStep === 1 && <RenderActivityType/>}
                        {createStep === 2 && <RenderActivityTime/>}
                        {createStep === 3 &&
                            <>
                                <Input type='text' placeholder={"Add Some Extra Tags"} value={currentTag}
                                       onChange={OnTagChange} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === "Enter") OnTagAdd((e.target as HTMLInputElement).value);
                                    console.log((e.target as HTMLInputElement).value);
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
                        <Button display={createStep === 0 ? "block" : "none"} onClick={GoToNextStep}
                                rightIcon={<Icon as={BsArrowRight}/>} colorScheme='green'>
                            Next
                        </Button>
                        <Button isLoading={isAdding} display={createStep === 3 ? "block" : "none"} onClick={AddActivity}
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