import {Button, Center, Heading, HStack, Icon, Spinner, VStack} from "@chakra-ui/react";
import {collection, deleteDoc, getDocs, query, QueryFieldFilterConstraint, where} from "firebase/firestore";
import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {BsArrowCounterclockwise} from "react-icons/bs";
import {FaMoneyBillAlt} from "react-icons/fa";
import {MdLocalActivity, MdLocalMovies} from "react-icons/md";
import {RiRestaurant2Fill} from "react-icons/ri";
import AddNewActivity from "@/screens/activities/components/AddNewActivity.tsx";
import ActivityTime from "@/screens/activities/types/ActivityTime.ts";
import ActivityType from "@/screens/activities/types/ActivityType.ts";
import {db} from "@/FirebaseConfig";
import type {IActivityDetails} from "@/screens/activities/types/IActivityDetails.ts";
import {getActivityTypeRoute} from "@/routing/routes";

import AddToCalendar from "@/screens/activities/components/AddToCalendar.tsx";

interface IActivityFilters {
    type?: ActivityType,
    time?: ActivityTime
}

const ActivitySelection = () => {
    const navigate = useNavigate();
    const {type} = useParams<{ type: string }>();
    const hasProcessedUrlType = useRef(false);

    const [availableTags, setAvailableTags] = useState([] as string[]);

    const [currentFilters, setCurrentFilters] = useState({} as IActivityFilters);
    const [activityStep, setActivityStep] = useState(0);

    const [loadingResult, setIsLoadingResult] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState({} as IActivityDetails);

    const [activities, setActivities] = useState({
        allActivities: [] as IActivityDetails[],
        alreadySelectedActivities: [] as IActivityDetails[]
    });


    const [invalidResult, setInvalidResult] = useState(false);


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
     * Runs the query to get the activity from Firebase
     * @param queryClauses
     */
    const RunActivityQuery = async (queryClauses: QueryFieldFilterConstraint[]) => {

        setInvalidResult(false);
        setIsLoadingResult(true);

        const allActivities = activities.allActivities;

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

        // Navigate back to activities home
        navigate('/activities');
    }

    /**
     * Fetches a new activity based on the current filters
     */
    const GetNewActivityBasedOnExisting = async () => {
        await setIsLoadingResult(true);
        await GetAnActivityBasicFilters(currentFilters);
    }


    useEffect(() => {
        RefreshTags();
    }, []);

    // Handle activity type from URL parameter
    useEffect(() => {
        if (type && !hasProcessedUrlType.current) {
            const activityTypeMap: Record<string, ActivityType> = {
                'food': ActivityType.FOOD,
                'activity': ActivityType.ACTIVITY,
                'movie': ActivityType.MOVIE,
                'big': ActivityType.BIG,
            };

            const activityType = activityTypeMap[type.toLowerCase()];
            if (activityType !== undefined) {
                hasProcessedUrlType.current = true;
                OnActivityTypeSelect(activityType);
            }
        } else if (!type && activityStep !== 0) {
            // Reset component state when navigating back to activities home
            hasProcessedUrlType.current = false;
            setActivityStep(0);
            setActivities({
                allActivities: [],
                alreadySelectedActivities: []
            });
            setSelectedActivity({} as IActivityDetails);
            setCurrentFilters({} as IActivityFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);


    return (
        <Center h={"full"} my={"auto"} w={"full"}>
            <VStack w={"full"} maxW={"5xl"}>
                {activityStep === 0 &&
                    <>
                        <Button onClick={() => navigate(getActivityTypeRoute('food'))}
                                w={"100%"} colorScheme={"green"}
                                variant={"outline"}
                                size={"lg"}>
                            <Icon as={RiRestaurant2Fill}/>
                            Food
                        </Button>

                        <Button onClick={() => navigate(getActivityTypeRoute('activity'))} w={"100%"}
                                colorScheme={"green"} variant={"outline"}
                                size={"lg"}>
                            <Icon as={MdLocalActivity}/>
                            Activity
                        </Button>

                        <Button onClick={() => navigate(getActivityTypeRoute('movie'))} w={"100%"}
                                colorScheme={"green"} variant={"outline"}
                                size={"lg"}>
                            <Icon as={MdLocalMovies}/>
                            Movie
                        </Button>

                        <Button onClick={() => navigate(getActivityTypeRoute('big'))} w={"100%"}
                                colorScheme={"green"} variant={"outline"}
                                size={"lg"}>
                            <Icon as={FaMoneyBillAlt}/>
                            Bougie Ballers
                        </Button>

                    </>
                }

                {activityStep === 1 && loadingResult && <Spinner colorScheme={"green"}/>}
                {activityStep === 1 && !loadingResult && <>

                    <HStack w={"100"}></HStack>

                    <VStack gap={6}>
                        {invalidResult &&
                            <VStack gap={2}>
                                <Heading textAlign={"center"} colorScheme={"red"}>No Activities Found</Heading>
                                <Heading textAlign={"center"} size={"sm"}>Try using different filters</Heading>
                            </VStack>
                        }

                        {!invalidResult &&
                            <VStack gap={2}>
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
                                    colorScheme={"green"} variant={"outline"}><Icon
                                as={BsArrowCounterclockwise}/></Button>

                        </HStack>
                        <Button onClick={ResetActivitySelection}
                                colorScheme={"green"} variant={"ghost"}>Return Home</Button>
                    </VStack>
                </>
                }
                <AddNewActivity onAdded={RefreshTags} availableActivities={availableTags}/>
            </VStack>
        </Center>
    );


}

export default ActivitySelection;