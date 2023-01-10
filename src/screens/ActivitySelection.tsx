import {useEffect, useState} from "react";
import {Button, Heading, Icon, Spinner, VStack} from "@chakra-ui/react";
import {RiRestaurant2Fill} from "react-icons/ri";
import {MdLocalActivity} from "react-icons/md";
import {WiDaySunny, WiMoonrise, WiSunrise} from "react-icons/wi";
import {BsFilter} from "react-icons/bs";
import AddNewActivity from "../components/AddNewActivity";
import InputAutocomplete from "../components/InputAutocomplete";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../FirebaseConfig";
import ActivityType from "../enums/ActivityType";
import ActivityTime from "../enums/ActivityTime";


interface IActivityFilters {
    type?: ActivityType,
    time?: ActivityTime
}

const ActivitySelection = () => {

    const [currentFilters, setCurrentFilters] = useState({} as IActivityFilters);
    const [showingCustomFilters, setShowingCustomFilters] = useState(false);
    const [activityStep, setActivityStep] = useState(0);
    const [availableTags, setAvailableTags] = useState([] as string[]);
    const [loadingResult, setIsLoadingResult] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState("");

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

    const GetAnActivity = async (filters: IActivityFilters) => {
        console.log(filters)
        const queryClauses = [];
        if (filters.time !== ActivityTime.ANYTIME) {
            queryClauses.push(where("time", "==", filters.time as number));
        }

        queryClauses.push(where("type", "==", filters.type as number));

        // Filter based on our current selection
        const activityRef = collection(db, "activities");
        const activityQuery = query(activityRef, ...queryClauses);

        const querySnapshot = await getDocs(activityQuery);
        if (querySnapshot.size > 0) {
            // We have at least one activity
            const randomIndex = Math.floor(Math.random() * querySnapshot.size);
            const randomActivity = querySnapshot.docs[randomIndex];
            console.log(randomActivity.data());
            setSelectedActivity(randomActivity.data().name)
        } else {
            console.log("No activities found");
        }


        setIsLoadingResult(false);
    }

    const OnActivityTimeSelect = async (activityTime: ActivityTime) => {

        // Append to filters
        const filters = {...currentFilters, time: activityTime};
        await setCurrentFilters(filters);

        const nextStep = activityStep + 1;
        await setActivityStep(nextStep);

        await setIsLoadingResult(true);
        await GetAnActivity(filters);
    }

    const OnActivityTypeSelect = (activityType: ActivityType) => {

        // Reset all filters
        const filters = {type: activityType} as IActivityFilters;
        setCurrentFilters(filters);

        const nextStep = activityStep + 1;
        setActivityStep(nextStep);
    };


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
                            colorScheme={"green"} variant={"outline"}
                            size={"lg"}>
                        Anytime
                    </Button>
                </>
            }
            {showingCustomFilters && <InputAutocomplete options={availableTags}/>}

            {activityStep === 2 && loadingResult && <Spinner colorScheme={"green"}/>}
            {activityStep === 2 && !loadingResult && <Heading>{selectedActivity}</Heading>}

            <AddNewActivity onAdded={RefreshTags} availableActivities={availableTags}/>
        </VStack>

    )


}

export default ActivitySelection;