import {useEffect, useState} from "react";
import {Button, Icon, VStack} from "@chakra-ui/react";
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

    const GetAnActivity = async () => {
        console.log(currentFilters)
        // Filter based on our current selection
        const activityRef = collection(db, "activities");
        const activityQuery = query(activityRef,
            where("time", "==", currentFilters.time as number),
            where("type", "==", currentFilters.type as number));

        const querySnapshot = await getDocs(activityQuery);
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });

    }

    /**
     * Renders the type of activity we would like to partake in
     */
    const RenderActivityTypeSelect = () => {

        const OnActivityTypeSelect = (activityType: ActivityType) => {

            // Reset all filters
            const filters = {type: activityType} as IActivityFilters;
            setCurrentFilters(filters);

            const nextStep = activityStep + 1;
            setActivityStep(nextStep);
        };

        const OnUseFilterClick = () => {
            setShowingCustomFilters(true);
        }

        return (
            <>
                <Button onClick={() => OnActivityTypeSelect(ActivityType.ACTIVITY)} leftIcon={<Icon as={RiRestaurant2Fill}/>} w={"100%"} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Food
                </Button>

                <Button onClick={() => OnActivityTypeSelect(ActivityType.FOOD)} w={"100%"} leftIcon={<Icon as={MdLocalActivity}/>} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Activity
                </Button>

                <Button onClick={() => setShowingCustomFilters(true)} w={"100%"} leftIcon={<Icon as={BsFilter}/>} colorScheme={"green"}
                        size={"lg"}>
                    Use Filters
                </Button>
            </>

        )
    }

    /**
     * Renders the time we want to take part in the activity
     */
    const RenderActivityTimeSelect = () => {


        const OnActivityTimeSelect = (activityTime: ActivityTime) => {

            // Append to filters
            const filters = {...currentFilters, time: activityTime};
            setCurrentFilters(filters);

            const nextStep = activityStep + 1;
            setActivityStep(nextStep);
        }

        return (
            <>
                <Button onClick={() => OnActivityTimeSelect(ActivityTime.MORNING)} leftIcon={<Icon as={WiSunrise}/>} w={"100%"} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Morning
                </Button>

                <Button onClick={() => OnActivityTimeSelect(ActivityTime.AFTERNOON)} w={"100%"} leftIcon={<Icon as={WiDaySunny}/>} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Noon
                </Button>

                <Button onClick={() => OnActivityTimeSelect(ActivityTime.EVENING)} w={"100%"} leftIcon={<Icon as={WiMoonrise}/>} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Afternoon
                </Button>
            </>
        )
    }


    return (
        <VStack w={"80%"}>
            {activityStep === 0 && !showingCustomFilters && <RenderActivityTypeSelect/>}
            {activityStep === 1 && !showingCustomFilters && <RenderActivityTimeSelect/>}
            {showingCustomFilters && <InputAutocomplete options={availableTags}/>}

            {activityStep === 2 && <Button onClick={GetAnActivity}>Get Activity</Button>}

            <AddNewActivity onAdded={RefreshTags} availableActivities={availableTags}/>
        </VStack>

    )


}

export default ActivitySelection;