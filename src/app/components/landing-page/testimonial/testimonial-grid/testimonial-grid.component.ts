import { Component } from '@angular/core';
interface Film {
  title:string,
  alt:string,
  poster:string
}
@Component({
  selector: 'app-testimonial-grid',
  templateUrl: './testimonial-grid.component.html',
  styleUrls: ['./testimonial-grid.component.css'],
})

export class TestimonialGridComponent {
  
  films: Film[] = [
    {
      poster:"assets/posters/butchCassidy.jpg",
      alt:"",
      title:'Butch Cassidy & The Wild Bunch',

    },
    {
      poster:"assets/posters/butchVsSundance.jpg",
      alt:"",
      title:'Butch vs Sundance',
    },
    {
      poster:"assets/posters/chistmasOnIce.jpg",
      alt:"",
      title:'A Royal Chirstmas On Ice',
    },
    {
      poster:"assets/posters/dyingForADaugther.jpg",
      alt:"",
      title:'Dying For A Daughter',
    },
    {
      poster:"assets/posters/hiderInMyHouse.jpg",
      alt:"",
      title:'Hider In My House',
    },
    {
      poster:"assets/posters/holyPoker.jpg",
      alt:"",
      title:'Holy Poker',
    },
    {
      poster:"assets/posters/killerGrades.jpg",
      alt:"",
      title:'Killer Grades',
    },
    {
      poster:"assets/posters/mindcage.jpg",
      alt:"",
      title:'Mindcage',
    },
    {
      poster:"assets/posters/noteworhy.jpg",
      alt:"",
      title:'Noteworthy',
    },
    {
      poster:"assets/posters/soulmateSearch.jpg",
      alt:"",
      title:'The Soulmate Search',
    },
    {
      poster:"assets/posters/topGunner.jpg",
      alt:"",
      title:'Top Gunner: Danger Zone',
    },
    {
      poster:"assets/posters/unborn.jpg",
      alt:"",
      title:'Unborn',
    },
    {
      poster:"assets/posters/vendetta.jpg",
      alt:"",
      title:'Vendetta',
    },
    
  ];
}



