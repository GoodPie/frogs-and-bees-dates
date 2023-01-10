import {Badge, Box, Button, Flex, Grid, HStack, Icon, IconButton, Input, Select, SimpleGrid, VStack} from "@chakra-ui/react";
import React, {ChangeEvent, EventHandler, useState} from "react";
import {BsArrowRight} from "react-icons/bs";
export interface IInputAutoCompleteProps  {
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
        <Badge onClick={() => props.onClick(props.text)} cursor={"pointer"} size={"lg"} p={2} colorScheme={"green"} variant={props.isSelected ?? false ? "solid" : "outline"} m={1}>
            {props.text}
        </Badge>
    )
}


const InputAutocomplete = (props: IInputAutoCompleteProps) => {

    const [searchInput, setSearchInput] = useState("");
    const [currentlySelected, setCurrentlySelected] = useState([] as string[])


    const UpdateSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }

    const AddTag = (tag: string) => {
        setCurrentlySelected([...currentlySelected, tag]);
    }

    const RemoveTag = (tag: string) => {
        setCurrentlySelected(currentlySelected.filter((t) => t !== tag));
    }

    return (
        <Box>
            <HStack mb={3} spacing={0}>
                <Input roundedRight={0} type={"text"} onChange={UpdateSearchInput} value={searchInput} />
                <Button onClick={() => props.onSubmit(currentlySelected)} px={8} roundedLeft={0} rightIcon={<Icon as={BsArrowRight} /> } aria-label={"Search"} colorScheme={"green"}>Get Activity</Button>
            </HStack>

            {
                <Flex wrap={"wrap"} justifyContent={"center"}>

                    {currentlySelected.map((option) => {
                            return <InputAutocompleteOption key={option} onClick={RemoveTag} text={option} isSelected={true}/>
                    })}

                    {searchInput.length > 2 && props.options.map((option) => {
                        if (option.toLowerCase().includes(searchInput.toLowerCase()) && currentlySelected.includes(option) === false) {
                            return <InputAutocompleteOption key={option} onClick={AddTag} text={option} isSelected={false}/>
                        }

                    })}
                </Flex>
            }
        </Box>

    )

}

export default InputAutocomplete;