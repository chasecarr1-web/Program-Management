/* Domain constants: lifecycle, departments, impact categories, programs, personnel */
(function (E) {
  const C = (E.C = {});

  C.APP_VERSION = '1.0.0';
  C.STORAGE_KEY = 'ecm.commandcenter.v1';

  C.TYPES = ['ECR', 'ECO', 'ECN', 'Deviation', 'Waiver'];
  C.TYPE_DESC = {
    ECR: 'Engineering Change Request',
    ECO: 'Engineering Change Order',
    ECN: 'Engineering Change Notice',
    Deviation: 'Planned departure from approved design (pre-build)',
    Waiver: 'Acceptance of nonconforming product (post-build)',
  };
  C.PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
  C.RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low'];
  C.STATUSES = [
    'Identified',
    'ECR Submitted',
    'In Review',
    'Pending Approval',
    'Awaiting Customer',
    'Awaiting Supplier',
    'In Work',
    'On Hold',
    'Implemented',
    'Closed',
    'Rejected',
  ];
  C.CLOSED_STATUSES = ['Closed', 'Rejected'];
  C.CUSTOMER_APPROVAL = ['Not Required', 'Not Submitted', 'Submitted', 'Approved', 'Rejected'];
  C.IMPL_STATUS = ['Not Started', 'Planning', 'In Progress', 'Complete'];
  C.FUNDING = ['Customer-Funded', 'Internally Funded', 'Shared'];
  C.IMPACT_LEVELS = ['None', 'Minor', 'Moderate', 'Major', 'TBD'];
  C.APPROVAL_STATUS = ['Not Started', 'Pending', 'Approved', 'Approved w/ Comments', 'Rejected', 'N/A'];
  C.LABOR_RATE = 165; // $/hr fully burdened engineering rate

  C.STAGES = [
    { key: 'identified', name: 'Change Identified', short: 'Identified', owner: 'originator', days: 5, status: 'Identified' },
    { key: 'ecr', name: 'ECR Submitted', short: 'ECR', owner: 'cm', days: 3, status: 'ECR Submitted' },
    { key: 'initial', name: 'Initial Engineering Review', short: 'Init Review', owner: 'engineer', days: 7, status: 'In Review' },
    { key: 'tia', name: 'Technical Impact Assessment', short: 'Tech Impact', owner: 'engineer', days: 14, status: 'In Review' },
    { key: 'xfr', name: 'Cross-Functional Review', short: 'X-Func Review', owner: 'cm', days: 10, status: 'Pending Approval' },
    { key: 'cost', name: 'Cost and Schedule Assessment', short: 'Cost/Sched', owner: 'pm', days: 7, status: 'Pending Approval' },
    { key: 'customer', name: 'Customer Review / Approval', short: 'Customer', owner: 'pm', days: 21, status: 'Awaiting Customer' },
    { key: 'eco', name: 'ECO Released', short: 'ECO Release', owner: 'cm', days: 3, status: 'In Work' },
    { key: 'design', name: 'Design / Drawing Updates', short: 'Design Upd', owner: 'engineer', days: 14, status: 'In Work' },
    { key: 'vv', name: 'Verification and Validation', short: 'V&V', owner: 'test', days: 21, status: 'In Work' },
    { key: 'mfg', name: 'Manufacturing Implementation', short: 'Mfg Impl', owner: 'mfg', days: 21, status: 'In Work' },
    { key: 'config', name: 'Configuration Documentation Updated', short: 'Config Docs', owner: 'cm', days: 7, status: 'Implemented' },
    { key: 'closed', name: 'Change Closed', short: 'Closed', owner: 'cm', days: 0, status: 'Closed' },
  ];
  C.STAGE_ACTIONS = [
    'Document problem statement and submit ECR',
    'CM to log ECR, assign number and route for initial review',
    'Responsible engineer to confirm scope, classification (major/minor) and feasibility',
    'Complete technical impact assessment across all 16 impact areas',
    'Collect cross-functional approvals from all required disciplines',
    'Finalize cost estimate, schedule impact and funding source',
    'Obtain OEM customer approval of change / classification',
    'CM to release ECO and notify affected functions',
    'Revise drawings, models, specs and BOM; complete checking',
    'Execute verification & validation test plan; close test requirements',
    'Implement in production: planning, tooling, FAI and cut-in',
    'Update configuration baseline, as-built records and close documentation',
    'Change closed — no further action',
  ];

  C.DEPTS = [
    { key: 'design', name: 'Design Engineering', short: 'Design', target: 5 },
    { key: 'stress', name: 'Stress Engineering', short: 'Stress', target: 7 },
    { key: 'systems', name: 'Systems Engineering', short: 'Systems', target: 7 },
    { key: 'test', name: 'Test Engineering', short: 'Test', target: 7 },
    { key: 'quality', name: 'Quality', short: 'Quality', target: 5 },
    { key: 'mfg', name: 'Manufacturing Engineering', short: 'Mfg Eng', target: 5 },
    { key: 'supply', name: 'Supply Chain', short: 'Supply', target: 7 },
    { key: 'cm', name: 'Configuration Management', short: 'Config Mgmt', target: 3 },
    { key: 'pm', name: 'Program Management', short: 'Program Mgmt', target: 5 },
    { key: 'customer', name: 'Customer / OEM', short: 'Customer', target: 21 },
  ];

  C.IMPACTS = [
    { key: 'design', name: 'Design Impact', group: 'Engineering' },
    { key: 'drawing', name: 'Drawing Changes', group: 'Engineering' },
    { key: 'material', name: 'Material Changes', group: 'Engineering' },
    { key: 'weight', name: 'Weight Impact', group: 'Engineering' },
    { key: 'structural', name: 'Structural / Stress Impact', group: 'Engineering' },
    { key: 'performance', name: 'Performance Impact', group: 'Engineering' },
    { key: 'integration', name: 'System Integration Impact', group: 'Engineering' },
    { key: 'testing', name: 'Testing Requirements', group: 'Verification' },
    { key: 'qualification', name: 'Qualification Requirements', group: 'Verification' },
    { key: 'certification', name: 'Certification Impact', group: 'Regulatory' },
    { key: 'mfgProcess', name: 'Manufacturing Process Impact', group: 'Operations' },
    { key: 'supplier', name: 'Supplier Impact', group: 'Operations' },
    { key: 'tooling', name: 'Tooling Impact', group: 'Operations' },
    { key: 'inspection', name: 'Inspection Requirements', group: 'Operations' },
    { key: 'maintenanceDocs', name: 'Maintenance Documentation Impact', group: 'Regulatory' },
    { key: 'airworthiness', name: 'Airworthiness & Regulatory', group: 'Regulatory' },
  ];

  C.RISK_CATEGORIES = [
    'Technical',
    'Schedule',
    'Cost',
    'Production Disruption',
    'Supplier Dependency',
    'Customer Approval Dependency',
    'Certification',
    'Configuration Management',
  ];

  C.PROGRAMS = [
    {
      key: 'F2KEX',
      name: 'Falcon 2000EX Nacelle',
      customer: 'Dassault Aviation',
      baseline: 'PBL-F2K-2026.2',
      prefix: 'NF2',
      milestones: ['SN 412 Shipset Delivery', 'Rate 2.0/mo Break-in', 'EASA Minor Change Approval'],
      custRep: 'Dassault Liaison Eng. (M. Laurent)',
    },
    {
      key: 'ASC',
      name: 'Citation Ascend Thrust Reverser',
      customer: 'Textron Aviation',
      baseline: 'PBL-ASC-2026.3',
      prefix: 'TRA',
      milestones: ['Shipset 48 Delivery', 'FAA Conformity Inspection', 'Rate Increase to 6/mo'],
      custRep: 'Textron CPE (D. Hollis)',
    },
    {
      key: 'LAT',
      name: 'Citation Latitude Thrust Reverser',
      customer: 'Textron Aviation',
      baseline: 'PBL-LAT-2026.4',
      prefix: 'TRL',
      milestones: ['Shipset 311 Delivery', 'Q1 Production Lot Release', 'Customer PDR Closure'],
      custRep: 'Textron CPE (D. Hollis)',
    },
    {
      key: 'G700',
      name: 'G700 Interior Structures',
      customer: 'Gulfstream Aerospace',
      baseline: 'PBL-G7I-2026.1',
      prefix: 'G7I',
      milestones: ['A/C 87 Interior Install', 'Monument Qual Test Complete', 'FAI Package Submittal'],
      custRep: 'Gulfstream Supplier Eng. (K. Barrow)',
    },
    {
      key: '737',
      name: '737 MAX Composite Fairings',
      customer: 'Boeing Commercial Airplanes',
      baseline: 'PBL-7MF-2026.2',
      prefix: '7MF',
      milestones: ['LN 9120 Delivery', 'Rate 42 Readiness Review', 'BCA Source Inspection'],
      custRep: 'BCA Supplier Mgmt. (T. Ortega)',
    },
    {
      key: 'KC46',
      name: 'KC-46 Ducting & Brackets',
      customer: 'Boeing Defense',
      baseline: 'PBL-K46-2026.1',
      prefix: 'K46',
      milestones: ['Lot 11 Delivery', 'DCMA Audit', 'Qualification Test Readiness'],
      custRep: 'Boeing Defense SQE (A. Reyes)',
    },
  ];
  C.programByName = (n) => C.PROGRAMS.find((p) => p.name === n || p.key === n);

  C.PEOPLE = {
    design: ['R. Patel', 'M. Alvarez', 'J. Nguyen', 'K. Brooks', 'S. Whitfield'],
    stress: ['D. Okafor', 'L. Fischer'],
    systems: ['A. Kowalski', 'Y. Tanaka'],
    test: ['S. Ramirez', 'T. Lindqvist'],
    quality: ['B. Hughes', 'N. Sato'],
    mfg: ['E. Moreau', 'G. Whitaker'],
    supply: ['P. Castillo', 'H. Jensen'],
    cm: ['C. Dubois', 'F. Ibrahim'],
    pm: ['V. Morgan', 'W. Chen', 'J. Harlow'],
    leadership: ['S. Marshall (Dir. Engineering)', 'R. Delgado (VP Programs)', 'L. Quinn (Dir. Operations)'],
  };
  C.ROLE_OF = {};
  Object.entries(C.PEOPLE).forEach(([role, list]) => list.forEach((p) => (C.ROLE_OF[p] = role)));
  C.ROLE_NAMES = {
    design: 'Design Engineer',
    stress: 'Stress Engineer',
    systems: 'Systems Engineer',
    test: 'Test Engineer',
    quality: 'Quality Engineer',
    mfg: 'Manufacturing Engineer',
    supply: 'Supply Chain',
    cm: 'Configuration Mgmt',
    pm: 'Program Manager',
    leadership: 'Leadership',
  };
  C.ALL_PEOPLE = Object.values(C.PEOPLE).flat();
  C.ENGINEERS = [...C.PEOPLE.design, ...C.PEOPLE.stress, ...C.PEOPLE.systems, ...C.PEOPLE.test, ...C.PEOPLE.mfg];
})(window.ECM);
