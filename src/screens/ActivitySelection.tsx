import {Button, Heading, HStack, Icon, Spinner, VStack} from "@chakra-ui/react";
import {collection, deleteDoc, getDocs, query, QueryFieldFilterConstraint, where} from "firebase/firestore";
import React, {useEffect, useState} from "react";
import {BsArrowCounterclockwise, BsFilter} from "react-icons/bs";
import {FaMoneyBillAlt} from "react-icons/fa";
import {MdLocalActivity, MdLocalMovies} from "react-icons/md";
import {RiRestaurant2Fill} from "react-icons/ri";
import AddNewActivity from "../components/AddNewActivity";
import InputAutocomplete from "../components/InputAutocomplete";
import ActivityTime from "../enums/ActivityTime";
import ActivityType from "../enums/ActivityType";
import {db} from "../FirebaseConfig";
import IActivityDetails from "../interfaces/IActivityDetails";

import AddToCalendar from "../components/AddToCalendar";

interface IActivityFilters {
    type?: ActivityType,
    time?: ActivityTime
}

const ActivitySelection = () => {

    const [availableTags, setAvailableTags] = useState([] as string[]);

    const [currentFilters, setCurrentFilters] = useState({} as IActivityFilters);
    const [showingCustomFilters, setShowingCustomFilters] = useState(false);
    const [activityStep, setActivityStep] = useState(0);

    const [loadingResult, setIsLoadingResult] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState({} as IActivityDetails);

    const [activities, setActivities] = useState({
        allActivities: [] as IActivityDetails[],
        alreadySelectedActivities: [] as IActivityDetails[]
    });


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

        let allActivities = activities.allActivities;

        // First check that we haven't already loaded the activities
        if (allActivities.length === 0) {
            const activityRef = collection(db, "activities");
            const activityQuery = query(activityRef, ...queryClauses);

            const querySnapshot = await getDocs(activityQuery);


            querySnapshot.forEach((doc) => {
                allActivities.push(doc.data() as IActivityDetails);
            })

            setActivities({
                allActivities: allActivities,
                alreadySelectedActivities: []
            });

        }

        // No activities
        if (allActivities.length === 0) {
            setIsLoadingResult(false);
            setInvalidResult(true);
            return;
        }



        // We have at least one activity
        const randomIndex = Math.floor(Math.random() * activities.allActivities.length);
        const randomActivity = activities.allActivities.splice(randomIndex, 1)[0];
        activities.alreadySelectedActivities.push(randomActivity);

        // If we've used all the activities, reset
        if (activities.allActivities.length === 0) {
            setActivities({
                allActivities: activities.alreadySelectedActivities,
                alreadySelectedActivities: []
            });
        }

        setSelectedActivity({
            name: randomActivity.name,
            description: randomActivity.description ?? ""
        })

        setIsLoadingResult(false);

    }

    /**
     * Removes an activity from Firebase
     * @param name The name of the activity to remove
     */
    const RemoveActivity = (name: string) => {

        // Alert and ask if we want to remove
        const remove = window.confirm("Are you sure you want to remove: " + name);
        if (!remove) return;

        // Remove the given activity from Firebase
        const activityRef = collection(db, "activities");
        const nameQuery = where("name", "==", name);

        getDocs(query(activityRef, nameQuery)).then((querySnapshot) => {
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            })
        });

        // Clear the activities to force a new load
        setActivities({
            allActivities: [],
            alreadySelectedActivities: []
        });

        GetNewActivityBasedOnExisting();
    }

    /**
     * Select an activity type and apply it to the filters
     * This will reset the filters as this is the first step
     * @param activityType
     */
    const OnActivityTypeSelect = async (activityType: ActivityType) => {

        // Reset all filters
        const filters = {type: activityType, time: ActivityTime.ANYTIME} as IActivityFilters;
        setCurrentFilters(filters);


        const nextStep = activityStep + 1;
        setActivityStep(nextStep);
        await setIsLoadingResult(true);
        await GetAnActivityBasicFilters(filters);
    };

    /**
     * Resets all the filters to nothing
     */
    const ResetActivitySelection = () => {
        setActivityStep(0);

        // Reset all the activities
        setActivities({
            allActivities: [],
            alreadySelectedActivities: []
        });

        setSelectedActivity({} as IActivityDetails);
        setCurrentFilters({} as IActivityFilters);
    }

    /**
     * Fetches a new activity based on the current filters
     */
    const GetNewActivityBasedOnExisting = async () => {
        await setIsLoadingResult(true);
        await GetAnActivityBasicFilters(currentFilters);
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

            {showingCustomFilters && <InputAutocomplete onSubmit={GetActivityFromTags} options={availableTags}/>}

            {activityStep === 1 && loadingResult && <Spinner colorScheme={"green"}/>}
            {activityStep === 1 && !loadingResult && <>

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
                        <Button onClick={() => RemoveActivity(selectedActivity.name)}
                                colorScheme={"red"} variant={"outline"}>- Remove</Button>

                        <AddToCalendar activityDescription={selectedActivity.description}
                                       activityName={selectedActivity.name}/>

                        <Button onClick={GetNewActivityBasedOnExisting}
                                colorScheme={"green"} variant={"outline"}><Icon as={BsArrowCounterclockwise}/></Button>


                    </HStack>

                    <Button onClick={ResetActivitySelection}
                            colorScheme={"green"} variant={"ghost"}>Return Home</Button>


                </VStack>
            </>
            }

            <AddNewActivity onAdded={RefreshTags} availableActivities={availableTags}/>

        </VStack>

    );


}

export default ActivitySelection;