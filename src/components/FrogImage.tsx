import  {useState} from "react";

// Define the frog images in the public/imgs directory
// We will just use basic index to load them for now
const MAX_FROG_IMAGES = 3;


const FrogImage = () => {

    const [index] = useState(Math.floor(Math.random() * MAX_FROG_IMAGES) + 1);

    return (
        <div data-testid={"frog-image"} id={"frog-image"}>
            <img src={`/imgs/frog_0${index}.png`} alt={"Frog Here"}/>
        </div>
    )
}

export default FrogImage;