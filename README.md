# SidesWays
  ![Sides-ways-logo][(/src/assets/icons/logoFlat.png)
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.1.
Angular rules.  
Try it out.


## Summary  
Live [here](https://scriptthing.firebaseapp.com)
Sides-Ways is a front end portal built with angular 9, Firenase, Node and Express to create documents for film and television sets



## How does it work?
<ol>
  <li> The user uplaoads a properlly formatted pdf. </li>
  <li> The Server converts the file to classified JSON and returns it using PDF.js and propriteray classification algorithm. </li>
  <li> User selects scenes to shoot and possible watermark Via Angular Responive Forms </li>
  <li> User selects a page layout, adds a cover sheet, and sends data back to server </li>
  <li> Server creates PDF using Pupeteer.js, Headless Chrome Browser, and adds cover page via GraphicksMagick </li>
  <li> Server sends file back to user - all documents are deleted ensuring safe IP </li>
</ol>

