export class FeedbackTicket {
    constructor(
      public title: string,
      public category: string,
      public text: string,
      public date: string,
      private submitted:boolean,
      public email:string
    ) {}
  } 