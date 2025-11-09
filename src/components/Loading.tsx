import {Center, Spinner} from "@chakra-ui/react";

export const Loading = () => {
    return (
        <Center w={"full"} h={"full"}>
            <Spinner/>
        </Center>
    );
}
