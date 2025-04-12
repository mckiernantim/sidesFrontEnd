import { Poster } from "src/app/types/Poster"

export const posters: Poster[] = [];

// Fix: Use a cleaner approach to define the paths
const posterNames = [
  "Butch Cassidy.jpg",
  "Butch Vs Sundance.jpg",
  "Christmas On Ice.jpg",
  "Dying For A Daughter.jpg",
  "Hider In My House.jpg",
  "Holy Poker.jpg",
  "Killer Grades.jpg",
  "Mindcage.jpg",
  "Noteworthy.jpg",
  "Soulmate Search.jpg",
  "Top Gunner.jpg",
  "Unborn.jpg",
  "Vendetta.jpg"
];

// Create poster objects from the names
posterNames.forEach(filename => {
  posters.push({
    name: filename.slice(0, -4), // Remove .jpg extension
    imageUrl: `assets/posters/${filename}`
  });
});

