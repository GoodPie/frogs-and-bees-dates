import {useEffect, useState} from "react";
import {Button, Icon, VStack} from "@chakra-ui/react";
import {RiRestaurant2Fill} from "react-icons/ri";
import {MdLocalActivity} from "react-icons/md";
import {WiSunrise, WiDaySunny, WiMoonrise} from "react-icons/wi";
import {BsFilter} from "react-icons/bs";
import AddNewActivity from "../components/AddNewActivity";
import InputAutocomplete from "../components/InputAutocomplete";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../FirebaseConfig";

interface ActivityType {
    FOOD: 0,
    ACTIVITY: 1
}

interface ActivityTime  {
    MORNING: 0,
    NOON: 1,
    AFTERNOON: 2
}


const ActivitySelection = () => {

    const [currentFilters, setCurrentFilters] = useState({});
    const [showingCustomFilters, setShowingCustomFilters] = useState(false);
    const [activityStep, setActivityStep] = useState(0);
    const [availableTags, setAvailableTags] = useState([] as string[]);

    useEffect(() => {

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


    }, []);



    /**
     * Renders the type of activity we would like to partake in
     */
    const RenderActivityTypeSelect = () => {

        const OnActivityTypeSelect = (activityType: number) => {

            // Reset all filters
            const filters = {activityType};
            setCurrentFilters(filters);

            const nextStep = activityStep + 1;
            setActivityStep(nextStep);
        };

        const OnUseFilterClick = () => {
            setShowingCustomFilters(true);
        }

        return (
            <>
                <Button onClick={() => OnActivityTypeSelect(0)} leftIcon={<Icon as={RiRestaurant2Fill}/>} w={"100%"} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Food
                </Button>

                <Button onClick={() => OnActivityTypeSelect(1)} w={"100%"} leftIcon={<Icon as={MdLocalActivity}/>} colorScheme={"green"} variant={"outline"}
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


        const OnActivityTimeSelect = (activityTime: number) => {

            // Append to filters
            const filters = {...currentFilters, activityTime};
            setCurrentFilters(filters);

            const nextStep = activityStep + 1;
            setActivityStep(nextStep);
        }

        return (
            <>
                <Button onClick={() => OnActivityTimeSelect(0)} leftIcon={<Icon as={WiSunrise}/>} w={"100%"} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Morning
                </Button>

                <Button onClick={() => OnActivityTimeSelect(1)} w={"100%"} leftIcon={<Icon as={WiDaySunny}/>} colorScheme={"green"} variant={"outline"}
                        size={"lg"}>
                    Noon
                </Button>

                <Button onClick={() => OnActivityTimeSelect(2)} w={"100%"} leftIcon={<Icon as={WiMoonrise}/>} colorScheme={"green"} variant={"outline"}
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

            <AddNewActivity availableActivities={availableTags}/>
        </VStack>

    )


}

export default ActivitySelection;