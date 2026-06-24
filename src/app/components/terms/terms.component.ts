import { Component } from '@angular/core';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
  closingText?: string;
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.css'],
  standalone: false
})
export class TermsComponent {
  readonly effectiveDate = '[INSERT DATE]';
  readonly contactEmail = 'sideswaysscriptsides@gmail.com';

  readonly sections: LegalSection[] = [
    {
      id: 'what-sidesways-does',
      title: '1. What SidesWays does',
      paragraphs: [
        'SidesWays is a tool that processes screenplay PDFs to generate "sides" and related production documents (such as callsheets and watermarked pages). You upload a script, the Service extracts and organizes its content, and you can select, edit, and download generated sides.'
      ]
    },
    {
      id: 'your-content',
      title: '2. Your content and intellectual property',
      paragraphs: [
        'You keep ownership of everything you upload. Scripts, callsheets, and other materials you provide ("Your Content") remain yours. SidesWays does not claim ownership of Your Content.',
        'You are solely responsible for Your Content and for having the rights to it. By uploading or processing any material through the Service, you represent and warrant that:'
      ],
      listItems: [
        'You own Your Content, or you have all licenses, permissions, and authority necessary to upload it and to generate sides from it; and',
        'Your use of the Service, and SidesWays\' processing of Your Content at your direction, does not and will not infringe, misappropriate, or violate the intellectual property, privacy, or other rights of any third party.'
      ],
      closingText: 'SidesWays is not responsible for Your Content or for any intellectual property you upload. We do not review Your Content for ownership, rights, or legality. We have no obligation to verify that you have the rights to any script or material you submit. You — not SidesWays — bear full responsibility and liability for the content you upload and for the sides and documents you generate from it.'
    },
    {
      id: 'license',
      title: '3. License you grant us (only to run the Service)',
      paragraphs: [
        'Solely so we can provide the Service to you, you grant SidesWays a limited, non-exclusive license to host, store, process, and display Your Content for the purpose of operating the Service for your account (for example, scanning, classifying, generating, watermarking, and letting you download sides). We do not use Your Content to train models for unrelated purposes or sell it to third parties. This license ends when Your Content is deleted from the Service, except for backups or copies in the ordinary course that age out over time.'
      ]
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable use',
      paragraphs: ['You agree not to:'],
      listItems: [
        'Upload content you do not have the rights to use;',
        'Use the Service to infringe anyone\'s intellectual property or other rights;',
        'Upload malware, or attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service;',
        'Use the Service in violation of any applicable law.'
      ],
      closingText: 'We may suspend or terminate accounts that violate these Terms.'
    },
    {
      id: 'payments',
      title: '5. Payments',
      paragraphs: [
        'Paid features are billed as described at the point of purchase. Unless stated otherwise, fees are non-refundable. We may change pricing prospectively; continued use after a change means you accept it. For billing questions, contact sideswaysscriptsides@gmail.com.'
      ]
    },
    {
      id: 'as-is',
      title: '6. Service provided "as is"',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTY THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT SCANNING/GENERATION WILL BE ACCURATE OR COMPLETE. You are responsible for reviewing generated sides before using them.'
      ]
    },
    {
      id: 'limitation-of-liability',
      title: '7. Limitation of liability',
      paragraphs: [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIDESWAYS AND ITS OWNERS, OPERATORS, AND AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, GOODWILL, OR INTELLECTUAL PROPERTY, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE OR YOUR CONTENT. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID SIDESWAYS IN THE 12 MONTHS BEFORE THE CLAIM, OR (B) USD $100.'
      ]
    },
    {
      id: 'indemnification',
      title: '8. Indemnification',
      paragraphs: [
        'You agree to indemnify and hold harmless SidesWays and its owners, operators, and affiliates from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of or related to (a) Your Content, (b) your use of the Service, or (c) your violation of these Terms or of any third party\'s rights — including any claim that Your Content infringes or misappropriates a third party\'s intellectual property.'
      ]
    },
    {
      id: 'termination',
      title: '9. Termination',
      paragraphs: [
        'You may stop using the Service at any time. We may suspend or terminate your access if you violate these Terms or if we discontinue the Service. Provisions that by their nature should survive termination (including Sections 2, 6, 7, and 8) will survive.'
      ]
    },
    {
      id: 'changes',
      title: '10. Changes to these Terms',
      paragraphs: [
        'We may update these Terms from time to time. If we make material changes, we will update the effective date and, where appropriate, provide notice. Your continued use of the Service after changes take effect means you accept the updated Terms.'
      ]
    },
    {
      id: 'governing-law',
      title: '11. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of [INSERT STATE/COUNTRY], without regard to its conflict-of-laws rules.'
      ]
    },
    {
      id: 'contact',
      title: '12. Contact',
      paragraphs: [
        'Questions about these Terms? Email sideswaysscriptsides@gmail.com.'
      ]
    }
  ];
}
