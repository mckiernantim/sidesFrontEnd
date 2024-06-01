import { Poster } from "src/app/types/Poster"

export const posters: Poster[] = [];

let paths = `/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Butch Cassidy.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Butch Vs Sundance.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Christmas On Ice.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Dying For A Daughter.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Hider In My House.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Holy Poker.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Killer Grades.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Mindcage.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Noteworthy.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Soulmate Search.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Top Gunner.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Unborn.jpg,
/Users/timmckiernan/Desktop/sides-Ways/sidesWaysFrontEnd/src/assets/posters/Vendetta.jpg`.split(",");

paths.forEach(str => {
    let poster: Poster = {
        name: "",
        imageUrl: ""
    };
    str = str.trim();

    poster.imageUrl = `assets/posters/${str.split('/assets/posters/')[1]}`;

    let name = str.split('/assets/posters/')[1];
    if (name) {
        poster.name = name.slice(0, -4);
    } else {
        console.error('Failed to extract name from path:', str);
    }

    posters.push(poster);
});

