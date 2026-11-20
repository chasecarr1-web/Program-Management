// All visible copy lives here. Edit this file, not the markup.
//
// Assumptions (verify or replace before publishing):
//  - Full name "Chase Carr" and the employer NORDAM.
//  - Program scopes (nacelle and thrust reverser work on Falcon 2000EX, Citation Ascend, Citation Latitude).
//  - The weekly rhythm is taken from how the programs are run today; adjust if it changes.
//  - url, email and the LinkedIn link are placeholders.
//  - Every chart on the site is ILLUSTRATIVE. It contains no real schedule, shortage or delivery data.
//  - Case study body copy is drafted from the program workflow and marked placeholder: rewrite it in your words,
//    and clear anything you share publicly with your employer and customers first.

export type Section = { heading: string; text: string };
export type Program = {
  slug: string;
  title: string;
  customer: string;
  scope: string;
  role: string;
  years: string;
  summary: string;
  body: Section[];
  facts: { label: string; value: string }[];
  placeholder?: boolean;
};

export const site = {
  name: 'Chase Carr',
  role: 'Program manager, aerospace nacelles and thrust reversers',
  employer: 'NORDAM',
  url: 'https://chasecarr.com', // placeholder: production URL (canonical, OG, sitemap)
  description:
    'Chase Carr runs nacelle and thrust reverser programs for business jets, keeping plan, parts and people in balance from the shop floor to the customer.',
  email: 'hello@chasecarr.com', // placeholder
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' }, // placeholder: your profile URL
    { label: 'GitHub', href: 'https://github.com/chasecarr1-web' },
  ],
  hero: {
    line: 'I run nacelle and thrust reverser programs for business jets, and I keep the plan and the parts in balance.',
  },
  chartNote: 'Illustrative chart. Not program data.',
};

export const week = [
  { day: 'Mon', time: '08:00', items: ['Shortage board summary for Falcon and Textron, from the shop floor whiteboard'] },
  { day: 'Tue', time: '08:00', items: ['Board summary', 'Material shortages by program, sent to supply chain', 'PO deliveries checked against the customer forecast'] },
  { day: 'Wed', time: '08:00', items: ['Board summary', 'Open action items walked with the owners'] },
  { day: 'Thu', time: '08:00', items: ['Board summary', 'Delivery update and agenda for the weekly customer call'] },
  { day: 'Fri', time: '15:00', items: ['RAIL review with the program team', 'Two 5-15 reports to leadership: five minutes to read, fifteen to write'] },
];

export const monthly = 'Once a month: the program management review, with labor hours per shipset against goal.';

export const statement = 'Programs slip one part at a time. I find the part, name the owner and put a date on it.';

export const tools = {
  heading: 'I build the tools I run on',
  text: 'Most program reporting is the same data retyped five ways. I would rather build the pipe once. These are working tools, used every week, built with plain web code, spreadsheets and AI assistants.',
  items: [
    { name: 'Engineering change command center', note: 'One page for every open engineering change, its effectivity and who owes the next step.' },
    { name: 'Shortage report from Line of Balance', note: 'The weekly shortage list built straight from the LoB exports, split by in-house and supplier.' },
    { name: 'RAIL pages', note: 'The rolling action item list published to the team site, updated from one line of input.' },
    { name: 'Morning board summary', note: 'A photo of the 0800 whiteboard turned into the same email format every day.' },
  ],
};

export const about = {
  heading: 'About',
  text: 'I am a program manager at NORDAM. My programs build nacelle and thrust reverser hardware for Dassault Aviation and Textron Aviation business jets. The job is mostly rhythm: the same honest numbers every week, the hard conversation early, and an action item with a name and a date instead of a meeting about the meeting.',
  services: ['Program control and scheduling', 'Line of Balance and shortage management', 'Customer and executive reporting', 'Corrective action (8D)', 'RFQ pricing support'],
};

export const programs: Program[] = [
  {
    slug: 'falcon-2000ex',
    title: 'Falcon 2000EX',
    customer: 'Dassault Aviation and Pratt & Whitney Canada',
    scope: 'Nacelle and thrust reverser shipsets',
    role: 'Program manager',
    years: 'Current',
    summary: 'A weekly control loop for a long-running business jet line: shortages split between our shop and our suppliers, and one executive summary every Friday.',
    facts: [
      { label: 'Customer', value: 'Dassault Aviation and Pratt & Whitney Canada' },
      { label: 'Scope', value: 'Nacelle and thrust reverser shipsets' },
      { label: 'Role', value: 'Program manager' },
      { label: 'Cadence', value: 'Daily board, weekly RAIL and 5-15, monthly PMR' },
    ],
    body: [
      { heading: 'Context', text: 'A mature program carries a lot of small risks at once: a late casting, a rejected detail part, a supplier that ships on the last day of the month. None of them alone moves a delivery. Together they do.' },
      { heading: 'Approach', text: 'Every shortage on the Line of Balance gets one of two owners: the shop or a supplier. They are tracked on separate tabs, because the fix and the conversation are different. Each line has a need date tied to the shipset it blocks.' },
      { heading: 'Rhythm', text: 'The 0800 board shows what is short today. The RAIL holds what we are doing about it. The Friday 5-15 tells leadership what changed this week, in red, amber and green, with nothing they have to decode.' },
      { heading: 'What it produced', text: 'One version of the truth: the shop, supply chain, leadership and the customer read status from the same list, so meetings start at the problem instead of at the reconciliation.' },
    ],
    placeholder: true,
  },
  {
    slug: 'citation-ascend-latitude',
    title: 'Citation Ascend and Latitude',
    customer: 'Textron Aviation',
    scope: 'Thrust reverser and nacelle hardware',
    role: 'Program manager',
    years: 'Current',
    summary: 'Two aircraft lines for one customer, each with its own Line of Balance, and purchase order deliveries checked against the customer forecast every Tuesday.',
    facts: [
      { label: 'Customer', value: 'Textron Aviation' },
      { label: 'Scope', value: 'Ascend thrust reverser and nacelle, Latitude thrust reverser' },
      { label: 'Role', value: 'Program manager' },
      { label: 'Cadence', value: 'Weekly customer call, Tuesday PO check, Friday 5-15' },
    ],
    body: [
      { heading: 'Context', text: 'Ascend and Latitude share a customer but not a schedule. Combining them in one report hides which line is actually at risk.' },
      { heading: 'Approach', text: 'Each line keeps its own tab and its own Line of Balance. Purchase orders at risk of missing the forecast are flagged before the customer asks, with a recovery date and an owner.' },
      { heading: 'Rhythm', text: 'Tuesday: shortages by program to supply chain. Thursday: delivery update and an agenda for the customer call. After the call, the notes become RAIL updates the same day.' },
      { heading: 'What it produced', text: 'A customer call that runs on a written agenda and ends with dated actions, and a supply chain team that sees shortages by program instead of by part number alone.' },
    ],
    placeholder: true,
  },
  {
    slug: 'program-command-center',
    title: 'Program command center',
    customer: 'Internal tooling',
    scope: 'Engineering change, RAIL and reporting tools',
    role: 'Designer and builder',
    years: 'Ongoing',
    summary: 'A set of small tools that turn the weekly program data into the pages, emails and reports people already read, so nobody retypes a number.',
    facts: [
      { label: 'Users', value: 'Program team, supply chain, leadership' },
      { label: 'Scope', value: 'Engineering change tracking, RAIL pages, shortage report, board summaries' },
      { label: 'Role', value: 'Designer and builder' },
      { label: 'Built with', value: 'HTML, JavaScript, spreadsheets, AI assistants' },
    ],
    body: [
      { heading: 'Context', text: 'The same status was being written into a whiteboard photo, an email, a spreadsheet, a slide and a team site. Every copy was a chance for the numbers to disagree.' },
      { heading: 'Approach', text: 'One state file per program holds the facts. Every deliverable renders from it: the board summary, the shortage report, the RAIL page and the 5-15. Change a ship date once and it changes everywhere.' },
      { heading: 'Rhythm', text: 'The tools follow the week, not the other way around. Monday through Thursday they draft the board emails; Friday they assemble the 5-15s for review.' },
      { heading: 'What it produced', text: 'Less time formatting and more time chasing parts. Every report still gets a human check before it goes out.' },
    ],
    placeholder: true,
  },
];
