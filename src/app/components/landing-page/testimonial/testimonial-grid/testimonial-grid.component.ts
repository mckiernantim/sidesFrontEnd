import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonial-grid',
  templateUrl: './testimonial-grid.component.html',
  styleUrls: ['./testimonial-grid.component.css']
})
export class TestimonialGridComponent {
  films:string[] = [
    "Butch Cassidy & The Wild Bunch",
    "Butch vs Sundance",
    "A Royal Chirstmas On Ice",
    "Dying For A Daughter",
    "Hider In My House",
    "Holy Poker",
    "Killer Grades",
    "Mindcage",
    "Noteworthy",
    "The Soulmate Search",
    "Top Gunner: Danger Zone",
    "Unborn",
    "Vendetta"




 ];
   posters:string[] = [

    `butchCassidy`,
   `butchVsSundance`,
   `christmasOnIce`,
   `dyingForADaughter`,
   `hiderInMyHouse`,
   `holyPoker`,
   `KillerGrades`,
   `Mindcage`,
   `noteworthy`,
   `soulmate`,
   `topGunner`,
   `unborn`,
   `vendetta`
]
  
}
