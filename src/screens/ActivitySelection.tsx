import React, {useEffect, useState} from "react";
import {Box, Button, Heading, HStack, Icon, Spinner, VStack} from "@chakra-ui/react";
import {RiRestaurant2Fill} from "react-icons/ri";
import {MdLocalActivity, MdLocalMovies} from "react-icons/md";
import {WiDaySunny, WiMoonrise, WiSunrise} from "react-icons/wi";
import {BsArrowCounterclockwise, BsArrowLeft, BsFilter, BsPlus} from "react-icons/bs";
import AddNewActivity from "../components/AddNewActivity";
import InputAutocomplete from "../components/InputAutocomplete";
import {collection, getDocs, query, QueryFieldFilterConstraint, where} from "firebase/firestore";
import {db} from "../FirebaseConfig";
import ActivityType from "../enums/ActivityType";
import ActivityTime from "../enums/ActivityTime";
import {FaMoneyBillAlt} from "react-icons/fa";


interface IActivityFilters {
    type?: ActivityType,
    time?: ActivityTime
}

interface IActivityDetails {
    name: string,
    description: string
}

const ActivitySelection = () => {

    const [availableTags, setAvailableTags] = useState([] as string[]);

    const [currentFilters, setCurrentFilters] = useState({} as IActivityFilters);
    const [showingCustomFilters, setShowingCustomFilters] = useState(false);
    const [activityStep, setActivityStep] = useState(0);

    const [loadingResult, setIsLoadingResult] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState({} as IActivityDetails);
    const [invalidResult, setInvalidResult] = useState(false);

    useEffect(() => {
        RefreshTags();
    }, []);

    /**
     * Refreshes all the tags to be used throughout the app
     */
    const RefreshTags = () => {
        // Get all the available tags from Firebase
        try {

            const docRef = collection(db, "tags");
            getDocs(docRef).then((querySnapshot) => {
                const allTags: string[] = [];
                querySnapshot.forEach((doc) => {
                    allTags.push(doc.id as string);
                })
                setAvailableTags(allTags);
            });

        } catch (e) {
            console.error(e);
        }

    }

    /**
     * Gets the activities that match the current filters from Firebase
     * @param filters
     */
    const GetAnActivityBasicFilters = async (filters: IActivityFilters) => {

        const queryClauses = [];

        // Only apply a time filter if we're looking for something time specific
        if (filters.time !== ActivityTime.ANYTIME) {
            queryClauses.push(where("time", "in", [filters.time as number, ActivityTime.ANYTIME]));
        }

        queryClauses.push(where("type", "==", filters.type as number));
        await RunActivityQuery(queryClauses);
    }

    /**
     * Gets the activities that match the current filters from Firebase
     * @param selectedTags
     */
    const GetActivityFromTags = async (selectedTags: string[]) => {
        const queryClauses = [];
        queryClauses.push(where("tags", "array-contains-any", selectedTags));
        setShowingCustomFilters(false);
        setActivityStep(2);
        await RunActivityQuery(queryClauses);
    }

    /**
     * Runs the query to get the activity from Firebase
     * @param queryClauses
     */
    const RunActivityQuery = async (queryClauses: QueryFieldFilterConstraint[]) => {
        setInvalidResult(false);
        setIsLoadingResult(true);

        // Filter based on our current selection
        const activityRef = collection(db, "activities");
        const activityQuery = query(activityRef, ...queryClauses);

        const querySnapshot = await getDocs(activityQuery);

        if (querySnapshot.size === 0) {
            setIsLoadingResult(false);
            setInvalidResult(true);
            return;
        }

        // We have at least one activity
        const randomIndex = Math.floor(Math.random() * querySnapshot.size);
        const randomActivity = querySnapshot.docs[randomIndex];

        const activityDetails = randomActivity.data();
        setSelectedActivity({
            name: activityDetails.name,
            description: activityDetails.description ?? ""
        })

        setIsLoadingResult(false);

    }

    /**
     * Select an activity type and apply it to the filters
     * This will reset the filters as this is the first step
     * @param activityType
     */
    const OnActivityTypeSelect = async (activityType: ActivityType) => {

        // Reset all filters
        const filters = {type: activityType} as IActivityFilters;
        setCurrentFilters(filters);

        const nextStep = activityStep + 1;
        setActivityStep(nextStep);
    };

    /**
     * Select an activity time and apply it to the filters
     * This will also trigger the activity selection as it's the last step
     * @param activityTime
     */
    const OnActivityTimeSelect = async (activityTime: ActivityTime) => {

        // Append to filters
        const filters = {...currentFilters, time: activityTime};
        await setCurrentFilters(filters);

        const nextStep = activityStep + 1;
        await setActivityStep(nextStep);

        await setIsLoadingResult(true);
        await GetAnActivityBasicFilters(filters);
    }

    const ResetActivitySelection = () => {
        setActivityStep(0);
        setSelectedActivity({} as IActivityDetails);
        setCurrentFilters({} as IActivityFilters);
    }

    const GetNewActivityBasedOnExisting = async () => {
        await setIsLoadingResult(true);
        await GetAnActivityBasicFilters(currentFilters);
    }

    const AddActivityToCalendar = async () => {



    }

    return (
        <VStack w={"80%"}>
            {activityStep === 0 && !showingCustomFilters &&
                <>
                    <Button onClick={() => OnActivityTypeSelect(ActivityType.FOOD)}
                            leftIcon={<Icon as={RiRestaurant2Fill}/>} w={"100%"} colorScheme={"green"}
                            variant={"outline"}
                            size={"lg"}>
                        Food
                    </Button>

                    <Button onClick={() => OnActivityTypeSelect(ActivityType.ACTIVITY)} w={"100%"}
                            leftIcon={<Icon as={MdLocalActivity}/>} colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Activity
                    </Button>

                    <Button onClick={() => OnActivityTypeSelect(ActivityType.MOVIE)} w={"100%"}
                            leftIcon={<Icon as={MdLocalMovies}/>}
                            colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Movie
                    </Button>

                    <Button onClick={() => OnActivityTypeSelect(ActivityType.BIG)} w={"100%"}
                            leftIcon={<Icon as={FaMoneyBillAlt}/>}
                            colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Bougie Ballers
                    </Button>

                    <Button onClick={() => setShowingCustomFilters(true)} w={"100%"} leftIcon={<Icon as={BsFilter}/>}
                            colorScheme={"green"}
                            size={"lg"}>
                        Use Filters
                    </Button>
                </>
            }
            {activityStep === 1 && !showingCustomFilters &&
                <>
                    <Button onClick={() => OnActivityTimeSelect(ActivityTime.MORNING)} leftIcon={<Icon as={WiSunrise}/>}
                            w={"100%"} colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Morning
                    </Button>

                    <Button onClick={() => OnActivityTimeSelect(ActivityTime.AFTERNOON)} w={"100%"}
                            leftIcon={<Icon as={WiDaySunny}/>} colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Afternoon
                    </Button>

                    <Button onClick={() => OnActivityTimeSelect(ActivityTime.EVENING)} w={"100%"}
                            leftIcon={<Icon as={WiMoonrise}/>} colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Evening
                    </Button>

                    <Button onClick={() => OnActivityTimeSelect(ActivityTime.ANYTIME)} w={"100%"}
                            colorScheme={"green"} variant={"solid"}
                            size={"lg"}>
                        Anytime
                    </Button>

                    <Button onClick={ResetActivitySelection} leftIcon={<Icon as={BsArrowLeft}/>} colorScheme={"green"}
                            variant={"ghost"}>Go Back</Button>
                </>
            }
            {showingCustomFilters && <InputAutocomplete onSubmit={GetActivityFromTags} options={availableTags}/>}

            {activityStep === 2 && loadingResult && <Spinner colorScheme={"green"}/>}
            {activityStep === 2 && !loadingResult && <>

                <HStack w={"100"}>

                </HStack>

                <VStack spacing={6}>


                    {invalidResult &&
                        <VStack spacing={2}>
                            <Heading textAlign={"center"} colorScheme={"red"}>No Activities Found</Heading>
                            <Heading textAlign={"center"} size={"sm"}>Try using different filters</Heading>
                        </VStack>
                    }
                    {!invalidResult &&
                        <VStack spacing={2}>
                            <Heading textAlign={"center"}>{selectedActivity.name}</Heading>
                            <Heading textAlign={"center"} size={"md"}>{selectedActivity.description}</Heading>
                        </VStack>
                    }


                    <HStack>
                        <Button onClick={GetNewActivityBasedOnExisting}
                                colorScheme={"green"} variant={"outline"}><Icon as={BsArrowCounterclockwise}/></Button>

                        <Button onClick={GetNewActivityBasedOnExisting} leftIcon={<Icon as={BsPlus}/>}
                                colorScheme={"green"} variant={"solid"}>Add to Calendar</Button>
                    </HStack>

                    <Button onClick={ResetActivitySelection}
                            colorScheme={"green"} variant={"ghost"}>Reset</Button>


                </VStack>
            </>
            }


            <AddNewActivity onAdded={RefreshTags} availableActivities={availableTags}/>
        </VStack>

    );


}

export default ActivitySelection;