import {
    Button,
    Flex,
    Icon,
    IconButton,
    Input,
    Dialog,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogBackdrop,
    Tag,
    Text,
    Textarea,
    useDisclosure,
    VStack
} from "@chakra-ui/react";
import { doc, setDoc } from "firebase/firestore";
import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsArrowRight } from "react-icons/bs";
import { FaMoneyBillAlt } from "react-icons/fa";
import { MdLocalActivity, MdLocalMovies } from "react-icons/md";
import { RiRestaurant2Fill } from "react-icons/ri";
import ActivityTime from "../enums/ActivityTime";
import ActivityType from "../enums/ActivityType";
import { db } from "../FirebaseConfig";

export interface IAddNewActivityProps {
    availableActivities: string[];
    onAdded: () => void;
}

interface ICreateActivity {
    name: string;
    description: string;
    type: ActivityType | null;
    time: ActivityTime;
    tags: string[];
}

enum ActivitySteps {
    NAME = 0,
    DESCRIPTION = 1,
    TYPE = 2,
    TAGS = 3,
}

const AddNewActivity = (props: IAddNewActivityProps) => {

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [createStep, setCreateStep] = useState(0);

    const [newActivity, setNewActivity] = useState({
        name: "",
        description: "",
        type: null,
        time: ActivityTime.ANYTIME,
        tags: []
    } as ICreateActivity);
    const [currentTag, setCurrentTag] = useState(""); // Used for custom tag inputs
    const [isAdding, setIsAdding] = useState(false);

    /**
     * Add the activity to Firebase
     */
    const AddActivity = async () => {

        setIsAdding(true);

        try {
            for (const tag of newActivity.tags) {
                // Create the tag
                await setDoc(doc(db, "tags", tag), {
                    name: tag,
                    createdOn: new Date()
                }, { merge: true });

            }
        } catch (e) {
            console.error(e);
        }

        try {
            await setDoc(doc(db, "activities", newActivity.name), newActivity, { merge: true });
        } catch (e) {
            console.error(e);
        }

        setIsAdding(false);
        ResetAddActivity();

        props.onAdded();
    }

    const ResetAddActivity = () => {
        setCreateStep(0);
        setNewActivity({
            name: "",
            description: "",
            type: null,
            time: ActivityTime.ANYTIME,
            tags: []
        } as ICreateActivity);
        onClose();
    }

    const OnNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewActivity((prev) => {
            return { ...prev, name: e.target.value }
        });
    }

    const OnDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNewActivity((prev) => {
            return { ...prev, description: e.target.value }
        });
    }

    const OnTagChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentTag(e.target.value);
    }

    /**
     * When enter is pushed when entering tags, a new tag will be added to the list of tags
     * @param tag Tag to be added
     */
    const OnTagAdd = (tag: string) => {
        if (!tag) return;
        if (newActivity.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) return;

        const newTags = [...newActivity.tags, tag];
        setNewActivity((prev) => {
            return { ...prev, tags: newTags }
        })
        setCurrentTag("");
    }

    const OnTagRemove = (tag: string) => {
        const newTags = newActivity.tags.filter(t => t !== tag);
        setNewActivity((prev) => {
            return { ...prev, tags: newTags }
        })
    }

    /**
     * Set the activity type
     * Set the time to ANYTIME all the time as we no longer want to use the time feature
     * @param type type of activity
     */
    const OnActivityTypeSelected = (type: ActivityType) => {

        setNewActivity((prev) => {
            return { ...prev, type, time: ActivityTime.ANYTIME }
        });

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
                <Button onClick={() => OnActivityTypeSelected(ActivityType.FOOD)} w={"100%"}
                    colorScheme={"green"} variant={"outline"}
                    size={"lg"}>
                    <Icon as={RiRestaurant2Fill} /> Food
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.ACTIVITY)} w={"100%"}
                    colorScheme={"green"} variant={"outline"}
                    size={"lg"}>
                    <Icon as={MdLocalActivity} /> Activity
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.MOVIE)} w={"100%"}
                    colorScheme={"green"} variant={"outline"}
                    size={"lg"}>
                    <Icon as={MdLocalMovies} /> Movie
                </Button>

                <Button onClick={() => OnActivityTypeSelected(ActivityType.BIG)} w={"100%"}
                    colorScheme={"green"} variant={"outline"}
                    size={"lg"}>
                    <Icon as={FaMoneyBillAlt} /> Bougie Ballers
                </Button>
            </VStack>
        )
    }

    return (
        <>
            <IconButton colorScheme={"green"} id={"add-activity-button"} aria-label={"Add new activity"} size={"lg"}
                icon={<Icon as={AiOutlinePlus} />} onClick={onOpen} />

            <Dialog.Root isOpen={isOpen} onClose={onClose}>
                <DialogBackdrop />
                <DialogContent>
                    <DialogHeader>Create Activity</DialogHeader>
                    <DialogCloseTrigger />

                    <DialogBody>
                        {createStep === ActivitySteps.NAME &&
                            <Input value={newActivity.name} onChange={OnNameChange} placeholder='Enter Activity Name' />
                        }
                        {createStep === ActivitySteps.DESCRIPTION &&
                            <VStack>
                                <Text>{newActivity.name}</Text>
                                <Textarea value={newActivity.description} onChange={OnDescriptionChange}
                                    placeholder='Add some details'></Textarea>
                            </VStack>
                        }
                        {createStep === ActivitySteps.TYPE && <RenderActivityType />}
                        {createStep === ActivitySteps.TAGS &&
                            <>
                                <Input type='text' placeholder={"Add Some Extra Tags"} value={currentTag}
                                    onChange={OnTagChange} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === "Enter") {
                                            OnTagAdd((e.target as HTMLInputElement).value);
                                        }
                                    }
                                    } />

                                <Flex wrap={"wrap"} mt={4}>
                                    {newActivity.tags.map((tag) => {
                                        return <Tag onClick={() => OnTagRemove(tag)} cursor={"pointer"}
                                            colorScheme={"green"} mx={1} my={1}>{tag}</Tag>
                                    })}
                                </Flex>
                            </>
                        }
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            display={createStep === ActivitySteps.NAME || createStep === ActivitySteps.DESCRIPTION ? "block" : "none"}
                            onClick={GoToNextStep}
                            rightIcon={<Icon as={BsArrowRight} />} colorScheme='green'>
                            Next
                        </Button>
                        <Button isLoading={isAdding} display={createStep === ActivitySteps.TAGS ? "block" : "none"}
                            onClick={AddActivity}
                            rightIcon={<Icon as={BsArrowRight} />} colorScheme='green'>
                            Add Activity
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default AddNewActivity;