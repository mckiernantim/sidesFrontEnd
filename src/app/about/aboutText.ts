export interface Blurb {
    title?:string,
    align?:string
    text:string,
    image?:string,
 
}
const aboutHeaderOne = {
    text: `INT:  SCOTT"S HOUSE, PROBABLY.  LA.  COVID LOCKDOWN`,
    align: "header"
}
const aboutHeaderTwo = {
    text: `INT:  TIM'S APARTMENT.  RIDGEWOOD, QUEENS.`,
    align: "header"
}
const aboutOne : Blurb = {
    image:"",
    title:`first`,
    align:"blurb",
    text: `    
 
    
    Scott:
    "Hey could you make an app that makes sides"`
}
const aboutOneFive = {
    title:"oneFive",
    align:"blurb",
    text:`Tim: "Yeah."`
}
const aboutTwo:Blurb = {
    image:"",
    title:`second`,
    align:"blurb",
    text:` We are Scott Thomas Reynolds and Tim McKiernan, two actor buds who met in college wasting our time pretending to be animals and learning how to dance the Minuet. Shockingly, we didnt make any money after school. Scott made his way to LA and and works in production. Tim made his way to New York and learned to code.
   
    
   
    
`
}

const aboutThree:Blurb = {
    image:"",
    title:"three",
    align:"blurb",
    text:`
    Working in production, Scott had to make sides. A lot of sides. SO MANY SIDES. By Hand. Enter Sides-Ways. Other programs that make sides are either stupidly expensive or amazingly not useful.`
}
const aboutFour:Blurb = {
    image:"",
    title:"fourth",
    align:"blurb",
    text:`
 
    
    You got a properly formatted script? We can make your sides. Upload your PDF and select what scenes you're shooting. Attach a callsheet... and BOOK. We'll process the script and send you the sides. 
    `
}
const aboutFive:Blurb = {
    image:"",
    title:"fifth",
    align:"blurb",
    text:
    `Sides-ways is currently in our free open Beta. We need users to throws scripts our way so we can figure out anything we missed during production.
    We're commited to creating an affordable, useful solution for generating film set documentaition.  
   `
}
const aboutSix:Blurb = {
    image:"",
    title:"sixth",
    align:"blurb",
    text:
    ` We're actors. We're Filmmakers. We make SIDES. 
    Help us learn to do it better. 
`
   
}
const aboutSeven:Blurb = {
    image:"",
    title:"sixth",
    align:"blurb",
    text:
    `- Scott and Tim` 

   
}

export const blurbs:Blurb[] = [aboutHeaderOne, aboutOne, aboutHeaderTwo,aboutOneFive, aboutTwo, aboutThree, aboutFour, aboutFive, aboutSix, aboutSeven]