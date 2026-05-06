import { Component } from '@angular/core';
import { fadeInOutAnimation } from '../../animations/animations';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  summary: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-help-center',
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false
})
export class HelpCenterComponent {
  readonly sections: FaqSection[] = [
    {
      id: 'uploading',
      title: 'Uploading',
      summary: 'Everything you need to know before uploading your screenplay PDF.',
      items: [
        {
          question: 'Why do certain PDFs not work?',
          answer:
            'SidesWays works best with text-based screenplay PDFs exported from scriptwriting software such as Final Draft or Celtx. PDFs may fail or scan poorly if they are password-protected, corrupted, image-only scans, flattened screenshots, heavily designed documents, or exports with unusual text layering. If your upload fails, check that the file is a real text-based export rather than a photographed or printed-then-scanned copy.'
        },
        {
          question: 'What does a good PDF look like?',
          answer:
            'A good PDF is a standard screenplay-style export: text-based, normal page size, readable scene headings, consistent screenplay formatting, and ideally standard script fonts and margins, title page, and scene numbers. Exports from common screenwriting tools are more likely to scan correctly than manually designed or image-heavy documents.'
        },
        {
          question: 'What happens if my script has no scene numbers?',
          answer:
            'Screenplays without scene numbers are not recommended for accurate sides generation.  Any Script missing scene numbers will have their scenes sequentialy numbered starting with "1" to the number of scenes in the script.'
        },
        {
          question: 'What happens to formatting like color or images?',
          answer:
            'Scanning is focused on extracting screenplay text and structure. Decorative colors, background images, embedded images, unusual styling, and graphic layout details may not carry through to generated sides.  Future version of SidesWays will include the ability to preserve some visual details from the source PDF.'
        },
        {
          question: 'What are the effects of nonstandard scripts?',
          answer:
            'Nonstandard indentation, mixed fonts, tables, split columns, missing scene headings, embedded images, scanned pages, or unusual line spacing can reduce scan accuracy. Always review the scene list and Last Looks page before downloading your final sides.'
        },
        {
          question: 'Can my script contain extra content prior to the first scene?',
          answer:
            'Front matter, or any content prior to the first scene, will be ignored by the scan process.  This is also true of coverpages and other non-script content.'
        },
        {
          question: 'Does my script need a title page?',
          answer:
            'Title pages are not required, but are recommended for accurately scanning content of the script.'
        }
      ]
    },
    {
      id: 'scanning',
      title: 'Scanning',
      summary: 'How the scan pipeline reads your script and what data it stores.',
      items: [
        {
          question: 'What does the scan logic do?',
          answer:
            'SidesWays reads the text from your uploaded PDF, groups it into lines, identifies screenplay structure, detects scene headings, and classifies content into usable script elements for scene selection and side generation. The goal is to produce a structured representation of your script — not to store the script itself.'
        },
        {
          question: 'What data do we record?',
          answer:
            'The app records the structured information needed to build sides: extracted text lines, page and order information, content categories, scene headings, and scene numbers when present. This data is used to generate your sides and is not stored beyond the generation process.  Once created, this data is immediately sent to your browser and deleted from our servers.'
        },
        {
          question: 'What happens to my intellectual property?',
          answer:
            'Your uploaded script is used to process and generate sides for your account and your original script is immideately deleted from our servers after the document is scanned.  None of your scanned script is saved, ever.  Completed documents and callsheets are deleted from our servers after 10 minutes of uploading.  Documents that are deleted are not recoverable.'
        },
        {
          question: 'Is my content secure in transit?',
          answer:
            'Content is transmitted over secure HTTPS/TLS connections. If you have specific questions about internal service encryption, logging retention windows, or storage guarantees for your production, please contact us directly so we can give you an accurate, up-to-date answer.'
        }
      ]
    },
    {
      id: 'scene-selection',
      title: 'Scene Selection',
      summary: 'Choosing which scenes to include in your generated sides.',
      items: [
        {
          question: 'How does scene selection work?',
          answer:
            'After scanning, you see the detected scenes from your script and choose which ones to include in your sides. The scenes you select drive the Last Looks preview and the final generated PDF. You can review scene headings, page references, and detected content before confirming your selection.'
        },
        {
          question: 'What is casting selection vs. production selection?',
          answer:
            'Casting selection is centered around choosing scenes for auditions, typically by role, character, or audition packet needs. Production selection is centered around building sides for a shoot day or broader production workflow where scenes are grouped by shooting order or location.'
        },
        {
          question: 'What is scheduling?',
          answer:
            'Scheduling is the planned production workflow for organizing scenes by shoot order, shoot day, or other production schedule metadata. It allows sides to be built around a specific day\'s work rather than an arbitrary scene list.'
        },
        {
          question: 'When will scheduling arrive?',
          answer:
            'Scheduling is planned for a future release. It is not available today. We will not promise a specific delivery date, but it is a priority feature on our roadmap. Contact us if scheduling is critical for your production timeline.'
        }
      ]
    },
    {
      id: 'last-looks',
      title: 'Last Looks',
      summary: 'Reviewing and adjusting your sides before generating the final PDF.',
      items: [
        {
          question: 'What can I edit?',
          answer:
            'The Last Looks page lets you review your selected scenes, adjust available side options, add or change supported extras such as watermarks or callsheets, and confirm the final output before PDF generation. Additionally, text may be added, crossed out, or highlighted to help with the production process, arrows may be added to mark scene transitions, and pages may be deleted or reordered to help with the production process.  Casting sides may be reduced in an effort to comply with SAG-AFTRA 8-page limits.'
        },
        {
          question: 'How do the editing tools work?',
          answer:
            'Last Looks is the final review step before generating your PDF. Think of it by outcome: you can review the layout, adjust supported options, preview changes, and confirm before committing to generation. The controls available on the page represent the full edit surface for the current release.'
        },
        {
          question: 'How are callsheets uploaded?',
          answer:
            'You can upload a callsheet from within the Last Looks workflow. When supported, the callsheet is appended to the final generated PDF so recipients receive both the sides and the callsheet in a single document. Check the Last Looks page for the accepted file type and any size restrictions, as these may be updated over time.'
        },
        {
          question: 'When are callsheets deleted?',
          answer:
            'Callsheets are associated with the document they were uploaded for. If you delete a document from your dashboard, its associated callsheet is also removed. Uploading a new callsheet for the same document replaces the previous one. If you have questions about a specific retention scenario, contact us at support@sides-ways.com.'
        }
      ]
    },
    {
      id: 'pdf-generation',
      title: 'PDF Generation',
      summary: 'What happens to your document after you generate and download it.',
      items: [
        {
          question: 'What happens to my document after download?',
          answer:
            'Downloading a generated PDF gives you a local copy of the file. The app-side document record may remain visible in your dashboard depending on your current plan and the document lifecycle. Your local download is your copy — treat it as the authoritative file for distribution.'
        },
        {
          question: 'How long do my sides exist in the app?',
          answer:
            'Completed documents and callsheets are deleted from our servers after 10 minutes of uploading.  Documents that are deleted are not recoverable.'
        },
        {
          question: 'Can I get my sides back after they have been deleted?',
          answer:
            'Deleted documents should be treated as unrecoverable. Your IP is our primary concern and when we delete a document it is gone forever.'
        }
      ]
    },
    {
      id: 'pricing',
      title: 'Pricing',
      summary: 'Billing, usage, discounts, and where to send billing concerns.',
      items: [
        {
          question: 'When do we charge?',
          answer:
            'Currently, billing is tied to a weekly subscription.  You will be charged the weekly rate for your subscription on the day you sign up.  You can cancel your subscription at any time and you will not be charged again.  Renewing your subscription will automatically charge you the weekly rate for the next week.'
        },
        {
          question: 'Do you offer discounts?',
          answer:
            'Discounts are not available at this time. Future discounts are planned for film schools and other educational institutions.'
        },
        {
          question: 'How many times can I use the service?',
          answer:
            'There is no limit to the number of times you can use the service.  You can generate as many sides as you need, for as long as you need within reason.  Rate limiters to exist to prevent abuse and ensure the service is available to all users.'
        },
        {
          question: 'Where do I address billing or account concerns?',
          answer:
            'For billing, upload, scan, security, or account concerns, contact us at support@sides-ways.com. We respond within 24 hours. You can also use the contact form on the Contact page.'
        }
      ]
    }
  ];

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();

    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
