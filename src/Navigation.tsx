import {Center, SegmentGroup} from "@chakra-ui/react";
import {useLocation, useNavigate} from "react-router-dom";
import {ROUTES} from "@/routing/routes.ts";
import {useEffect, useState} from "react";

export function     Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const [value, setValue] = useState<string | null>(path)

    useEffect(() => {
        console.log(path)
        setValue("/" + path.split('/')[1] || null);
    }, [path]);

    const navigateToRoute = (route: string | null) => {
        if (route) navigate(route);
    }


    return (
        <Center position="fixed" bottom="8" left="0" right="0" zIndex="1000">
            <SegmentGroup.Root
                colorPalette="green"
                rounded={"full"}
                defaultValue={ROUTES.RECIPES}
                value={value}
                onValueChange={(e) => navigateToRoute(e.value)}
            >
                <SegmentGroup.Indicator rounded={"full"} bg={"green"} color={"white"}/>
                <SegmentGroup.Items
                    items={[
                        {value: ROUTES.RECIPES, label: "Recipes"},
                        {value: ROUTES.ACTIVITIES, label: "Dates"},
                        {value: ROUTES.CALENDAR, label: "Calendar"},
                    ]}
                />
            </SegmentGroup.Root>
        </Center>
    );
}