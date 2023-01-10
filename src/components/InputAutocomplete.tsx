import {Badge, Box, Button, Center, Flex, HStack, Icon, Input, Text} from "@chakra-ui/react";
import React, {ChangeEvent, useState} from "react";
import {BsArrowRight} from "react-icons/bs";

export interface IInputAutoCompleteProps {
    options: string[];
    onSubmit: (options: string[]) => void
}

interface IOption {
    text: string,
    isSelected?: boolean,
    onClick: (tag: string) => void;

}

const InputAutocompleteOption = (props: IOption) => {
    return (
        <Badge onClick={() => props.onClick(props.text)} cursor={"pointer"} size={"lg"} p={2} colorScheme={"green"}
               variant={props.isSelected ?? false ? "solid" : "outline"} m={1}>
            {props.text}
        </Badge>
    )
}


const InputAutocomplete = (props: IInputAutoCompleteProps) => {

    const MAX_OPTIONS = 10;

    const [searchInput, setSearchInput] = useState("");
    const [currentlySelected, setCurrentlySelected] = useState([] as string[])


    const UpdateSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }

    const AddTag = (tag: string) => {
        if (currentlySelected.length < MAX_OPTIONS) {
            setCurrentlySelected([...currentlySelected, tag]);
        }
    }

    const RemoveTag = (tag: string) => {
        setCurrentlySelected(currentlySelected.filter((t) => t !== tag));
    }

    return (
        <Box width={"80%"}>
            {currentlySelected.length >= MAX_OPTIONS &&
                <Center>
                    <Text size={"lg"} mb={4} colorScheme={"red"}>Only 10 filters at a time please 😘</Text>
                </Center>
            }
            <HStack mb={3} spacing={0}>
                <Input placeholder={"Type here for more tags"} roundedRight={0} type={"text"} onChange={UpdateSearchInput} value={searchInput}/>
                <Button disabled={currentlySelected.length === 0} onClick={() => props.onSubmit(currentlySelected)} px={8} roundedLeft={0}
                        rightIcon={<Icon as={BsArrowRight}/>} aria-label={"Search"} colorScheme={"green"}>Get
                    Activity</Button>
            </HStack>

            {
                <Flex wrap={"wrap"} justifyContent={"center"}>

                    {currentlySelected.map((option) => {
                        return <InputAutocompleteOption key={option} onClick={RemoveTag} text={option}
                                                        isSelected={true}/>
                    })}

                    {searchInput.length > 2 && props.options.map((option) => {
                        if (option.toLowerCase().includes(searchInput.toLowerCase()) && !currentlySelected.includes(option)) {
                            return <InputAutocompleteOption key={option} onClick={AddTag} text={option}
                                                            isSelected={false}/>
                        }
                        return null;
                    })}

                    {searchInput.length <= 2 && props.options.filter((option) => !currentlySelected.includes(option)).slice(0, 5).map((option) => {
                        if (!currentlySelected.includes(option)) {
                            return <InputAutocompleteOption key={option} onClick={AddTag} text={option}
                                                            isSelected={false}/>
                        }
                        return null;
                    })}


                </Flex>
            }
        </Box>

    )

}

export default InputAutocomplete;