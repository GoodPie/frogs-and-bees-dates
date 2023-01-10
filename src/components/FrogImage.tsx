import React, {useState} from "react";
import {css, jsx} from "@emotion/react";


const FrogImage = () => {

    // Define the frog images in the public/imgs directory
    // We will just use basic index to load them for now
    const MAX_FROG_IMAGES = 3;

    const [index, setIndex] = useState(Math.floor(Math.random() * 3) + 1);

    return (
        <div  id={"frog-image"}>
            <img src={`imgs/frog_0${index}.png`} alt={"Frog Image Here"}/>
        </div>
    )

}


export default FrogImage;