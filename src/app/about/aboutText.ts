export interface Blurb {
    title:string;
    text:string;
}

const aboutOne : Blurb = {
    title:`first`,
    text: `Scott:
    "Hey could you make an app that makes sides"`
}
const aboutOneFive = {
    title:"oneFive",
    text:`Tim: "Yeah."`
}
const aboutTwo:Blurb = {
    title:`second`,
    text:`  We are Scott Thomas Reynolds and Tim McKiernan, two actor buds who met in college
    wasting our time pretending to be animals and learning how to dance the Minuet.<br>
    <br>
    Shockingly, we didnt make any money after school.`
}

const aboutThree:Blurb = {
    title:"three",
    text:`Scott made his way to LA and became a writer/actor and works in production.
    <br>
    <br>
    Tim made his way to New York working on stage when he could and eventually got so sick of shitty jobs he learned
    to code.
    <br>
    <br>
    Working in production, Scott had to make sides. A lot of sides. SO MANY SIDES. By. Hand. 
    <br>
    Programs that make
    sides for you are expensive or make you pay for a subscription`
}
const aboutFour:Blurb = {
    title:"fourth",
    text:`So what about Film Students? What about low budget shows? What about artists shooting a short in their garage with
    their friends?
    <br>
    <br>
    Enter Sides-Ways.<br>
    <br>
    You got a properly formatted script? We can make your sides.<br>
    <br>
    Upload your PDF and select what youre shooting. We'll process the script and send you the sides.<br>
    <br>
    We're actors. We're Filmmakers. We make sides<br>
    <br>
    
    Help us pay rent and buy burritos<br>
    <br>
    Use Sides-Ways<br>
    <br>-Scott and Tim`
}

export const blurbs:Blurb[] = [ aboutOne, aboutOneFive, aboutTwo, aboutThree, aboutFour]