import { Component } from '@angular/core';
import { LegalSection } from '../terms/terms.component';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css'],
  standalone: false
})
export class PrivacyComponent {
  readonly effectiveDate = '[INSERT DATE]';
  readonly contactEmail = 'sideswaysscriptsides@gmail.com';

  readonly sections: LegalSection[] = [
    {
      id: 'information-we-collect',
      title: '1. Information we collect',
      paragraphs: [],
      listItems: [
        'Account information — such as your email address and authentication details when you create an account.',
        'Content you upload — the scripts, callsheets, and related materials you submit, and the structured data we derive from them (extracted text lines, scene information, selected scenes) to generate sides.',
        'Usage information — basic information about how you use the Service (for example, documents generated and feature usage) so we can operate and improve it.',
        'Payment information — handled by our payment processor. We do not store full card numbers on our servers.'
      ]
    },
    {
      id: 'how-we-use-information',
      title: '2. How we use information',
      paragraphs: ['We use the information to:'],
      listItems: [
        'Provide the Service (scan, classify, generate, watermark, and let you download sides);',
        'Maintain your account and process payments;',
        'Operate, secure, and improve the Service;',
        'Communicate with you about your account or support requests.'
      ],
      closingText: 'We do not sell your personal information, and we do not use your uploaded content to train models for unrelated purposes.'
    },
    {
      id: 'how-content-is-handled',
      title: '3. How your content is handled',
      paragraphs: [
        'Your uploaded content is processed to provide the Service for your account. We aim to limit access to what is needed to operate the Service. You are responsible for the rights to the content you upload (see the Terms of Service). If you delete a document, we remove it from the active Service; copies in routine backups age out over time.'
      ]
    },
    {
      id: 'sharing',
      title: '4. Sharing',
      paragraphs: [
        'We share information only with service providers that help us run the Service (such as hosting, PDF generation, and payment processing), and only as needed for them to perform those functions. We may disclose information if required by law or to protect our rights, users, or the Service.'
      ]
    },
    {
      id: 'data-retention',
      title: '5. Data retention and deletion',
      paragraphs: [
        'We retain account and content data for as long as your account is active or as needed to provide the Service. You can request deletion of your documents or account by contacting sideswaysscriptsides@gmail.com. Once deleted, content should be treated as unrecoverable.'
      ]
    },
    {
      id: 'security',
      title: '6. Security',
      paragraphs: [
        'We use reasonable technical and organizational measures to protect information, including transmission over secure (HTTPS/TLS) connections. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.'
      ]
    },
    {
      id: 'cookies',
      title: '7. Cookies',
      paragraphs: [
        'We use cookies and similar technologies that are necessary to operate the Service (for example, to keep you signed in). You can control cookies through your browser settings, though some features may not work without them.'
      ]
    },
    {
      id: 'childrens-privacy',
      title: '8. Children\'s privacy',
      paragraphs: [
        'The Service is not directed to children under 13 (or the minimum age in your jurisdiction), and we do not knowingly collect their personal information.'
      ]
    },
    {
      id: 'changes',
      title: '9. Changes to this Policy',
      paragraphs: [
        'We may update this Policy from time to time. We will update the effective date and, where appropriate, provide notice. Continued use after changes take effect means you accept the updated Policy.'
      ]
    },
    {
      id: 'contact',
      title: '10. Contact',
      paragraphs: [
        'Questions about this Policy or your data? Email sideswaysscriptsides@gmail.com.'
      ]
    }
  ];
}
