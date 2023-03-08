export class FeedbackTicket {
    constructor(
      public title: string,
      public id:string,
      public category: string,
      public text: string,
      public date: string,
      public handled?:boolean,
      public email?:string
    ) {}
  }
