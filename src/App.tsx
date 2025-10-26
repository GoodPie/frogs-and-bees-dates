import {Button, ChakraProvider, defaultSystem, IconButton} from "@chakra-ui/react"
import {BrowserRouter, useNavigate, useLocation} from "react-router-dom"

import "./main.css";

import FrogImage from "./components/FrogImage";
import {RegisterFirebaseToken} from "./FirebaseConfig";
import {ColorModeSwitcher} from "./ColorModeSwitcher";
import {AiTwotoneCalendar} from "react-icons/ai";
import {MdRestaurantMenu} from "react-icons/md";
import {ROUTES} from "./routing/routes";
import {AppRouter} from "./routing/AppRouter";
import {useAuth} from "./hooks/useAuth";

export const App = () => {
    return (
        <ChakraProvider value={defaultSystem}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </ChakraProvider>
    )
}

// App content (separated to use routing hooks within BrowserRouter context)
const AppContent = () => {
    const { user } = useAuth();

    return (
        <>
            <ColorModeSwitcher/>
            <div className={"content-container"}>
                <AppRouter />
            </div>

            <FrogImage/>
            {user &&
                <>
                    <CalendarToggleButton />
                    <RecipeToggleButton />
                </>
            }

            {user &&
                <div style={{position: "absolute", left: 0, right: 0, bottom: 16}}>
                    <div style={{display: "flex", justifyContent: "center"}}>
                        <Button variant={"ghost"} onClick={() => RegisterFirebaseToken()}>
                            Refresh Notification
                        </Button>
                    </div>
                </div>
            }
        </>
    );
};

// Calendar toggle button component
const CalendarToggleButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCalendarView = location.pathname === ROUTES.CALENDAR;

    const toggleCalendar = () => {
        navigate(isCalendarView ? ROUTES.ACTIVITIES : ROUTES.CALENDAR);
    };

    return (
        <div style={{position: "absolute", right: 8, top: 8}}>
            <IconButton aria-label={"View Calendar"} onClick={toggleCalendar}>
                <AiTwotoneCalendar/>
            </IconButton>
        </div>
    );
};

// Recipe toggle button component
const RecipeToggleButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isRecipesView = location.pathname.startsWith('/recipes');

    const toggleRecipes = () => {
        navigate(isRecipesView ? ROUTES.ACTIVITIES : ROUTES.RECIPES);
    };

    return (
        <div style={{position: "absolute", right: 8, top: 64}}>
            <IconButton aria-label={"View Recipes"} onClick={toggleRecipes}>
                <MdRestaurantMenu/>
            </IconButton>
        </div>
    );
};
