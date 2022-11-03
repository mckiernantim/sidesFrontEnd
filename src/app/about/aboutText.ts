export interface Blurb {
    title:string,
    align:string
    text:string,
    image?:string,
 
}

const aboutOne : Blurb = {
    image:"",
    title:`first`,
    align:"left",
    text: `Scott:
    "Hey could you make an app that makes sides"`
}
const aboutOneFive = {
    title:"oneFive",
    align:"right",
    text:`Tim: "Yeah."`
}
const aboutTwo:Blurb = {
    image:"",
    title:`second`,
    align:"left",
    text:`  We are Scott Thomas Reynolds and Tim McKiernan, two actor buds who met in college
    wasting our time pretending to be animals and learning how to dance the Minuet.
    
    Shockingly, we didnt make any money after school.
     Scott made his way to LA and and works in production.

    Tim made his way to New York and learned to code.
   
    
   
    
`
}

const aboutThree:Blurb = {
    image:"",
    title:"three",
    align:"right",
    text:`
    Working in production, Scott had to make sides. A lot of sides. SO MANY SIDES. By Hand. 
    Enter Sides-Ways.
    
    Programs that make sides for either stuidply expensive or amazingly not useful.`
}
const aboutFour:Blurb = {
    image:"",
    title:"fourth",
    align:"left",
    text:`
 
    
    You got a properly formatted script? We can make your sides.
    
    Upload your PDF and select what youre shooting. We'll process the script and send you the sides.
    
    We're actors. We're Filmmakers. We make sides
    
    
    Help us pay rent and buy burritos
    
    Use Sides-Ways
    -Scott and Tim`
}

export const blurbs:Blurb[] = [ aboutOne, aboutOneFive, aboutTwo, aboutThree, aboutFour]