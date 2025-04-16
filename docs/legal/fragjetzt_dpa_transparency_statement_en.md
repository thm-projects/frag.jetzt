# Data Processing Transparency Statement – frag.jetzt

_Note: This document serves to transparently outline the data protection and technical framework of the open-source platform “frag.jetzt”. It does not constitute a legally binding agreement._

## 1. Public Statement (GDPR-compliant)

**Operator:**  
Prof. Dr. Klaus Quibeldey-Cirkel  
Heinrich-Heine-Str. 46  
D-35039 Marburg, Germany  
E-Mail: klaus.quibeldey@gmail.com

**Operating model:**  
Software-as-a-Service (SaaS)  
Hosted by: Hetzner Online GmbH, Germany (ISO/IEC 27001 certified)

**Data protection compliance:**

- GDPR-compliant data processing
- No registration required (except for moderation)
- IP addresses are anonymized
- Local Matomo analytics
- Optional: AI moderation (locally or via OpenAI)

## 2. Description of typical data processing

In the context of a possible contractual relationship, “frag.jetzt” processes personal data exclusively on behalf of and according to the instructions of the using institution.

Processing is carried out primarily for the purpose of providing an anonymous question forum and interactive feedback and moderation functionalities in the context of lectures, seminars, and conferences.

Registration is only required for moderators. Email addresses are not linked to user-generated content.

## 3. Feature Overview

| Feature Group            | Description                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Question Forum           | Submit, upvote, downvote, and comment on questions anonymously and in real time.      |
| Moderation               | Live moderation by room owners; manual or AI-based release of new questions.          |
| Bonus System             | Award stars for high-quality contributions; tokens can be exchanged for bonus points. |
| Quick Polls              | Single-choice polls with Markdown formatting and optional media integration.          |
| Quiz & Brainstorming     | Includes arsnova.click quiz mode and AI-enhanced brainstorming with word clouds.      |
| Filter & Sorting Options | Sort/filter by time, rating, topic, user, or moderation status.                       |
| Controversy Analysis     | Sort questions by degree of disagreement using a controversy metric.                  |
| Word Clouds (Radar)      | Highlight frequent terms from questions using NER and keyword clustering.             |
| Mail Reminders           | Email notifications for registered users about new questions or answers.              |
| PWA & Accessibility      | Progressive Web App (PWA) compatible, WCAG 2.1 AA-compliant interface.                |
| Usage & Hosting          | Privacy-friendly SaaS on Docker infrastructure, hosted in Germany.                    |

## 4. Technical and Organizational Measures (TOM)

### Access Control

SSH access via key authentication only; web access TLS-encrypted; database access is local only.

### Login Control

User sessions are secured; moderation roles are strictly managed via internal role model.

### Data Minimization

Only email addresses of moderators are stored; IP addresses are anonymized.

### Pseudonymization

Questions are submitted without personal identifiers.

### Encryption

TLS 1.3 for transport encryption; encrypted backups using GPG.

### Data Storage

Daily backups on separate encrypted volumes; backups deleted after 30 days.

### Availability

Regular restore tests; container-based deployment with rollback support.

### Monitoring

Error and access logging with rotation; monitoring via Prometheus/Grafana.

### Updates

Weekly updates of base images and urgent patches immediately.

### Subprocessor Control

Hetzner under DPA; no other subprocessors without prior consent.
