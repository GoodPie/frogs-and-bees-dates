import React, {useState} from "react";


const FrogImage = () => {

    // Define the frog images in the public/imgs directory
    // We will just use basic index to load them for now
    const MAX_FROG_IMAGES = 3;

    const [index] = useState(Math.floor(Math.random() * MAX_FROG_IMAGES) + 1);

    return (
        <div  id={"frog-image"}>
            <img src={`imgs/frog_0${index}.png`} alt={"Frog Here"}/>
        </div>
    )

}


export default FrogImage;