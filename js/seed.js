/* Sample aerospace engineering change data (dates generated relative to today) */
(function (E) {
  const { U, C } = E;

  const PM_OF = { F2KEX: 'V. Morgan', ASC: 'W. Chen', LAT: 'W. Chen', G700: 'J. Harlow', '737': 'J. Harlow', KC46: 'V. Morgan' };

  /* ---------- Hand-authored demonstration records ---------- */
  // sub: days ago submitted | req: required date offset from today | slip: forecast - required (days)
  const RECORDS = [
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4410-2201-501', part: 'Blocker Door Hinge Fitting', cur: 'C', prop: 'D',
      title: 'Blocker door hinge fitting material change — 15-5PH to Ti-6Al-4V',
      desc: 'Replace 15-5PH H1025 steel hinge fitting with Ti-6Al-4V (AMS 4928) forging to recover 2.1 lb per shipset and eliminate galvanic corrosion findings at the CFRP interface. Requires new forging die, fatigue coupon testing and customer approval of material substitution.',
      eng: 'R. Patel', orig: 'D. Okafor', pri: 'High', risk: 'High', stage: 9, status: 'Awaiting Supplier', sub: 128, req: 18, slip: 21,
      cust: true, prod: true, supp: true, ms: [0, 25],
      imp: 'material:Major,structural:Major,weight:Moderate,qualification:Major,testing:Major,supplier:Moderate,drawing:Moderate,design:Moderate,certification:Minor,inspection:Moderate,tooling:Moderate',
      cost: 180, fund: 'Shared', w: -2.1,
    },
    {
      t: 'ECR', prog: 'F2KEX', pn: 'NF2-3120-104', part: 'IFS Acoustic Panel, LH', cur: 'B', prop: 'C',
      title: 'Inner fixed structure acoustic panel core density increase',
      desc: 'Field returns show core crushing and skin-to-core disbond on IFS acoustic panels at the aft attach. Proposed change increases HRP core density from 3.0 to 4.5 pcf in the attach zone and adds a doubler ply. Impacts acoustic performance and requires certification review.',
      eng: 'M. Alvarez', orig: 'B. Hughes', pri: 'Critical', risk: 'Critical', stage: 3, sub: 21, req: 45, slip: 12,
      cust: true, prod: true, esc: true, ms: [1, 38],
      imp: 'design:Major,structural:Moderate,weight:Minor,testing:Major,qualification:Moderate,mfgProcess:Moderate,tooling:Minor,inspection:Moderate,certification:TBD,performance:Moderate',
      cost: 240, fund: 'Shared', w: 0.6,
    },
    {
      t: 'Deviation', prog: 'LAT', pn: 'TRL2205-0312-003', part: 'Fan Cowl Latch Bracket Assy', cur: 'E', prop: 'E (DEV-01)',
      title: 'Fan cowl latch bracket washer substitution — NAS1149 alternate',
      desc: 'Supplier shortage of NAS1149F0363P washers. Request temporary deviation to install NAS1149C0363R (CRES) for shipsets 305–318 pending supplier recovery. No fit/form/function impact; galvanic compatibility confirmed by M&P.',
      eng: 'K. Brooks', orig: 'P. Castillo', pri: 'Medium', risk: 'Low', stage: 6, sub: 34, req: -4, slip: 10,
      cust: true, prod: true, supp: true, ms: [0, 12],
      imp: 'material:Minor,supplier:Moderate,inspection:Minor', cost: 8, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'Waiver', prog: 'ASC', pn: 'TRA4400-1001-011', part: 'Translating Sleeve Outer Skin', cur: 'F', prop: 'F (WVR-03)',
      title: 'Translating sleeve surface finish Ra 63 vs Ra 32 — SN 1187–1192',
      desc: 'Six translating sleeve outer skins exceed surface finish requirement (measured Ra 48–63 µin vs 32 µin max) following tool wear on the trim router. Request use-as-is disposition. Aerodynamic assessment shows negligible drag impact; parts are otherwise conforming.',
      eng: 'J. Nguyen', orig: 'N. Sato', pri: 'High', risk: 'Medium', stage: 6, sub: 19, req: 6, slip: 9,
      cust: true, prod: true, ms: [0, 9], imp: 'performance:Minor,inspection:Moderate,airworthiness:Minor', cost: 12, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'LAT', pn: 'TRL2210-0450-001', part: 'Actuator Mount Bracket, Upper', cur: 'C', prop: 'D',
      title: 'Actuator mounting bracket wall thickness increase — negative margin in FEM',
      desc: 'Updated FEM with revised actuator stall loads shows MS = -0.08 at the lug net section. Increase lug thickness from 0.250 to 0.312 in. and add fillet radius. Requires drawing update, NC program change, and fixture modification.',
      eng: 'S. Whitfield', orig: 'L. Fischer', pri: 'Critical', risk: 'High', stage: 8, sub: 62, req: 20, slip: 0,
      cust: true, prod: true, ms: [1, 30],
      imp: 'structural:Major,design:Major,drawing:Moderate,weight:Minor,mfgProcess:Moderate,tooling:Moderate,inspection:Minor,testing:Moderate',
      cost: 95, fund: 'Internally Funded', w: 0.4,
    },
    {
      t: 'ECN', prog: 'F2KEX', pn: 'NF2-3300-221', part: 'Aft Cowl Seal Retainer', cur: 'G', prop: 'H',
      title: 'Drawing note clarification — sealant AMS-S-8802 class B-1/2',
      desc: 'Clarify drawing note 7 to specify AMS-S-8802 Type 2 Class B-1/2 (fast cure) for fillet seal, eliminating shop confusion and repeat NCRs. Documentation-only change.',
      eng: 'M. Alvarez', orig: 'E. Moreau', pri: 'Low', risk: 'Low', stage: 11, sub: 40, req: 5, slip: -3,
      cust: false, imp: 'drawing:Minor,mfgProcess:Minor', cost: 3, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECR', prog: 'G700', pn: 'G7I-5501-330', part: 'Divider Panel Attach Angle', cur: 'A', prop: 'B',
      title: 'Replace obsolete Hi-Lok HL18 with HL1018 alternate',
      desc: 'Fastener supplier issued end-of-life notice for HL18PB8 pins. Evaluate HL1018 as alternate with equivalent shear and bearing allowables. Change requires parts list update and supplier source approval.',
      eng: '', orig: 'H. Jensen', pri: 'Medium', risk: 'Medium', stage: 2, sub: 12, req: 60, slip: 0,
      cust: true, supp: true, imp: 'supplier:Moderate,drawing:Minor,structural:Minor', cost: 15, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4420-3300-201', part: 'Cascade Segment, Position 3', cur: 'B', prop: 'C',
      title: 'Cascade vane segment redesign for tooling access',
      desc: 'Redesign cascade segment end-rib geometry to allow single-piece RTM tooling and eliminate two secondary bond operations. Projected recurring savings $1,850 per shipset. Flow area unchanged.',
      eng: 'R. Patel', orig: 'G. Whitaker', pri: 'Medium', risk: 'Medium', stage: 5, sub: 50, req: 40, slip: 5,
      cust: true, imp: 'design:Moderate,drawing:Moderate,tooling:Major,mfgProcess:Moderate,performance:Minor,testing:Minor', cost: 70, fund: 'Internally Funded', w: -0.3, recurring: -1850,
    },
    {
      t: 'ECO', prog: 'F2KEX', pn: 'NF2-3410-118', part: 'Lower Bifurcation Fire Seal', cur: 'D', prop: 'E',
      title: 'Lower bifurcation fire seal material change — silicone/Nomex per 14 CFR 25.1193',
      desc: 'Existing fluoroelastomer fire seal fails updated burn-through test at 2000°F for 15 min. Change to silicone/Nomex reinforced seal (AMS 3320 equivalent). Requires fire test qualification, EASA minor change approval via Dassault and CMM update.',
      eng: 'K. Brooks', orig: 'A. Kowalski', pri: 'Critical', risk: 'Critical', stage: 6, sub: 75, req: -9, slip: 30,
      cust: true, prod: true, supp: true, esc: true, ms: [2, 20],
      imp: 'material:Major,certification:Major,qualification:Major,testing:Major,airworthiness:Major,supplier:Moderate,maintenanceDocs:Moderate,drawing:Moderate',
      cost: 210, fund: 'Customer-Funded', w: 0.2,
    },
    {
      t: 'ECR', prog: 'G700', pn: 'G7I-5520-101', part: 'Divider Panel Assy, FWD Galley', cur: 'C', prop: 'D',
      title: 'Divider panel insert pull-out failure — potted insert redesign',
      desc: 'Lot acceptance test showed potted insert pull-out at 82% of required load. Proposed redesign uses larger-diameter insert with extended potting radius and change to BMS 5-28 potting compound.',
      eng: 'S. Whitfield', orig: 'T. Lindqvist', pri: 'High', risk: 'High', stage: 4, sub: 30, req: 30, slip: 14,
      cust: true, prod: true, noTIA: true,
      imp: 'structural:Major,design:Moderate,testing:Major,qualification:Moderate,mfgProcess:Moderate,inspection:Moderate,certification:Moderate',
      cost: 85, fund: 'Shared', w: 0.15,
    },
    {
      t: 'Deviation', prog: '737', pn: '7MF-1140-022', part: 'Flap Track Fairing Skin', cur: 'J', prop: 'J (DEV-07)',
      title: 'Prepreg out-life extension — lot 26-0451 (BMS 8-256)',
      desc: 'Freezer excursion during receiving reduced remaining out-life on prepreg lot 26-0451. Request deviation to use material with extended out-life per supplier re-certification and tack/flow testing. Affects LN 9105–9118.',
      eng: 'J. Nguyen', orig: 'N. Sato', pri: 'High', risk: 'Medium', stage: 4, sub: 6, req: 3, slip: 4,
      cust: true, prod: true, supp: true, ms: [0, 10], imp: 'material:Moderate,inspection:Moderate,testing:Minor', cost: 6, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: '737', pn: '7MF-1150-310', part: 'Flap Track Fairing Aft Attach Fitting', cur: 'B', prop: 'C',
      title: 'Flap track fairing aft attach fitting — fretting mitigation',
      desc: 'In-service reports of fretting at the aft attach fitting bushing. Add flanged CRES bushing with wear-resistant coating and revise fastener grip. Requires SRM inspection update.',
      eng: 'R. Patel', orig: 'B. Hughes', pri: 'High', risk: 'High', stage: 7, sub: 88, req: 35, slip: 7,
      cust: true, prod: true, imp: 'design:Moderate,structural:Moderate,material:Minor,testing:Moderate,maintenanceDocs:Minor,mfgProcess:Minor', cost: 60, fund: 'Customer-Funded', w: 0.1,
    },
    {
      t: 'ECO', prog: 'KC46', pn: 'K46-7210-044', part: 'Bleed Air Duct Support Bracket', cur: 'D', prop: 'E',
      title: 'Bleed air duct bracket clamp change — vibration test failure',
      desc: 'Bracket cracked at 6.2 hr into 10 hr random vibration qualification (RTCA DO-160 Cat. U). Root cause: resonance at 212 Hz. Redesign adds gusset and changes to cushioned loop clamp. Re-qualification required before Lot 11 delivery.',
      eng: 'Y. Tanaka', orig: 'S. Ramirez', pri: 'Critical', risk: 'High', stage: 9, sub: 70, req: -12, slip: 18,
      cust: true, prod: true, esc: true, ms: [2, 15],
      imp: 'design:Moderate,structural:Major,testing:Major,qualification:Major,integration:Moderate,drawing:Moderate', cost: 130, fund: 'Customer-Funded', w: 0.25,
    },
    {
      t: 'ECN', prog: 'KC46', pn: 'K46-7200-000', part: 'Bleed Duct Installation', cur: 'K', prop: 'L',
      title: 'BOM update — supersede MS21919WDG6 with AS21919WDG6',
      desc: 'Administrative supersession of cancelled MS clamp standard to AS equivalent. No form, fit or function change.',
      eng: 'G. Whitaker', orig: 'F. Ibrahim', pri: 'Low', risk: 'Low', stage: 12, sub: 45, req: -5, closedAgo: 10,
      cust: false, imp: 'drawing:Minor,supplier:Minor', cost: 2, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECR', prog: 'LAT', pn: 'TRL2300-0711-002', part: 'Lock Actuator Harness', cur: 'A', prop: 'B',
      title: 'TR lock actuator harness re-route — chafe at frame 14',
      desc: 'Chafe marks found on lock actuator harness at frame 14 during production inspection. Proposed re-route with additional P-clamp and chafe sleeve. Requires harness length change and integration check with ECU connector.',
      eng: 'A. Kowalski', orig: 'E. Moreau', pri: 'High', risk: 'Medium', stage: 3, sub: 16, req: 38, slip: 0,
      cust: true, prod: true, imp: 'integration:Major,design:Moderate,drawing:Moderate,maintenanceDocs:Minor,testing:Minor', cost: 25, fund: 'Internally Funded', w: 0.05,
    },
    {
      t: 'ECO', prog: 'F2KEX', pn: 'NF2-3305-050', part: 'Aft Cowl Lower Panel', cur: 'C', prop: 'D',
      title: 'Aft cowl drain hole relocation — fluid accumulation',
      desc: 'Fluid accumulation observed at aft cowl low point during ground runs. Relocate drain hole 1.2 in. aft and add second drain. Requires drill template update and CMM figure revision.',
      eng: 'M. Alvarez', orig: 'Q. Field Service', pri: 'Medium', risk: 'Medium', stage: 10, sub: 110, req: 8, slip: 4,
      cust: true, prod: true, imp: 'design:Minor,drawing:Moderate,mfgProcess:Moderate,tooling:Minor,inspection:Minor,maintenanceDocs:Minor', cost: 30, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'Waiver', prog: 'G700', pn: 'G7I-5530-210', part: 'Sidewall Close-out Panel', cur: 'B', prop: 'B (WVR-02)',
      title: 'Ply drop-off location out of tolerance — panel SN G7-0884',
      desc: 'Ply 6 drop-off located 0.38 in. from nominal (0.25 in. allowed). Stress review indicates positive margin. Request use-as-is for one panel.',
      eng: 'S. Whitfield', orig: 'N. Sato', pri: 'Medium', risk: 'Medium', stage: 5, sub: 14, req: 2, slip: 6,
      cust: true, prod: true, imp: 'structural:Minor,inspection:Moderate', cost: 4, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4430-1100-101', part: 'Hinge Beam', cur: 'E', prop: 'F',
      title: 'Hinge beam machining consolidation to 5-axis',
      desc: 'Consolidate four 3-axis setups into one 5-axis operation, adding tooling tabs and datum features. Projected recurring savings of $3,200 per shipset and 6.5 hr cycle time reduction.',
      eng: 'E. Moreau', orig: 'G. Whitaker', pri: 'Medium', risk: 'Low', stage: 10, sub: 95, req: 25, slip: 0,
      prod: true, imp: 'mfgProcess:Major,tooling:Major,inspection:Moderate,drawing:Minor', cost: 110, fund: 'Internally Funded', w: 0, recurring: -3200,
    },
    {
      t: 'ECR', prog: 'F2KEX', pn: 'NF2-3500-015', part: 'Torque Box Upper Skin', cur: 'B', prop: 'C',
      title: 'Torque box lightning strike protection — expanded copper foil weight change',
      desc: 'Customer requested evaluation of 0.015 lb/ft² expanded copper foil in lieu of 0.045 lb/ft² to reduce weight. Requires lightning strike Zone 2A testing and certification review.',
      eng: 'K. Brooks', orig: 'Dassault Aviation', pri: 'High', risk: 'High', stage: 1, sub: 4, req: 75, slip: 0,
      cust: true, imp: 'material:Moderate,certification:Major,weight:Moderate,testing:Major,qualification:Moderate', cost: 160, fund: 'Customer-Funded', w: -1.4,
    },
    {
      t: 'ECO', prog: 'F2KEX', pn: 'NF2-3010-300', part: 'Inlet Anti-Ice Piccolo Duct', cur: 'F', prop: 'G',
      title: 'Inlet lip anti-ice duct weld specification revision',
      desc: 'Revise weld callout from AWS D17.1 Class B to Class A with 100% radiographic inspection following porosity findings. Weld supplier must re-qualify procedure and welders.',
      eng: 'R. Patel', orig: 'B. Hughes', pri: 'High', risk: 'Medium', stage: 8, status: 'Awaiting Supplier', sub: 58, req: 12, slip: 15,
      cust: true, prod: true, supp: true, imp: 'mfgProcess:Moderate,supplier:Major,inspection:Moderate,testing:Moderate,qualification:Minor', cost: 45, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECN', prog: 'LAT', pn: 'TRL2210-0500-009', part: 'Bonded Fitting Assy', cur: 'D', prop: 'E',
      title: 'Add CT scan inspection for bonded fittings',
      desc: 'Add computed tomography inspection of bondline for bonded fittings per corrective action CAR-26-118. Updates inspection plan and drawing inspection notes.',
      eng: 'J. Nguyen', orig: 'N. Sato', pri: 'Medium', risk: 'Low', stage: 11, sub: 66, req: 10, slip: -5,
      imp: 'inspection:Major,mfgProcess:Minor', cost: 22, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4410-2201-520', part: 'Hinge Fitting Forging', cur: 'A', prop: 'B',
      title: 'Titanium forging second source qualification',
      desc: 'Qualify second-source forging supplier for Ti-6Al-4V hinge fitting forging to mitigate single-source risk and 38-week lead time. Requires FAI, mechanical property testing, and customer source approval.',
      eng: 'R. Patel', orig: 'H. Jensen', pri: 'High', risk: 'High', stage: 9, status: 'Awaiting Supplier', sub: 140, req: -20, slip: 25,
      cust: true, prod: true, supp: true, ms: [2, 28],
      imp: 'supplier:Major,qualification:Major,material:Moderate,testing:Major,inspection:Moderate', cost: 150, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECR', prog: '737', pn: '7MF-1200-404', part: 'WTB Fairing Access Panel', cur: 'A', prop: 'B',
      title: 'Wing-to-body fairing access panel quick-release fasteners',
      desc: 'Airline feedback requests quarter-turn fasteners on access panel to reduce maintenance time. Initial concept stage.',
      eng: '', orig: 'T. Ortega', pri: 'Low', risk: 'Low', stage: 0, sub: 2, req: 90, slip: 0,
      cust: true, imp: 'design:Moderate,maintenanceDocs:Moderate,drawing:Moderate', cost: 18, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'G700', pn: 'G7I-5600-150', part: 'Galley Monument Attach Fitting', cur: 'B', prop: 'C',
      title: 'Galley monument attach fitting Rev C — 16g dynamic test',
      desc: 'Strengthen monument attach fitting to pass 16g dynamic test per 14 CFR 25.562 after fitting yield in development test. Requires repeat sled test and certification data package.',
      eng: 'S. Whitfield', orig: 'T. Lindqvist', pri: 'Critical', risk: 'High', stage: 9, sub: 100, req: 14, slip: 12,
      cust: true, prod: true, ms: [1, 18],
      imp: 'structural:Major,testing:Major,qualification:Major,certification:Major,airworthiness:Moderate,design:Moderate', cost: 190, fund: 'Customer-Funded', w: 0.8,
    },
    {
      t: 'Deviation', prog: '737', pn: '7MF-1140-050', part: 'Fairing Support Rib', cur: 'C', prop: 'C (DEV-05)',
      title: 'Alternate primer lot — BMS 10-11 Type I',
      desc: 'Use of alternate qualified primer lot due to supplier allocation. Closed after customer concurrence.',
      eng: 'J. Nguyen', orig: 'P. Castillo', pri: 'Medium', risk: 'Low', stage: 12, sub: 30, req: -8, closedAgo: 6,
      cust: true, supp: true, imp: 'material:Minor,inspection:Minor', cost: 2, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'KC46', pn: 'K46-7250-012', part: 'Duct Seal Retainer', cur: 'A', prop: 'B',
      title: 'Seal retainer redesign — FOD risk reduction',
      desc: 'Replace loose-washer seal retainer with captive design to eliminate FOD risk during maintenance. Requires customer approval and IPC update.',
      eng: 'Y. Tanaka', orig: 'A. Reyes', pri: 'Medium', risk: 'Medium', stage: 6, sub: 48, req: 15, slip: 20,
      cust: true, imp: 'design:Moderate,drawing:Moderate,maintenanceDocs:Minor,mfgProcess:Minor', cost: 35, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'ECR', prog: 'LAT', pn: 'TRL2400-0100-SW', part: 'TR Position Sensor / ECU Calibration Table', cur: 'SW 3.1', prop: 'SW 3.2',
      title: 'TR position sensor LVDT calibration table — software rev 3.2',
      desc: 'Revise LVDT calibration table in TR control software to correct stow-position indication drift at cold soak (-54°C). DO-178C Level C change impact analysis required.',
      eng: 'A. Kowalski', orig: 'S. Ramirez', pri: 'High', risk: 'High', stage: 4, sub: 26, req: 20, slip: 10,
      cust: true, imp: 'integration:Major,performance:Moderate,testing:Major,certification:Moderate,qualification:Moderate', cost: 75, fund: 'Shared', w: 0, sw: true,
    },
    {
      t: 'ECO', prog: 'F2KEX', pn: 'NF2-3200-410', part: 'Blocker Door Link Rod Assy', cur: 'D', prop: 'E',
      title: 'Blocker door link rod end bearing change',
      desc: 'Change rod end bearing to self-lubricating liner type to extend service life. Implemented and closed.',
      eng: 'K. Brooks', orig: 'Q. Field Service', pri: 'Medium', risk: 'Medium', stage: 12, sub: 150, req: -15, closedAgo: 20,
      cust: true, supp: true, imp: 'design:Minor,supplier:Moderate,testing:Minor', cost: 25, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4450-2000-301', part: 'Upper Bifurcation Panel', cur: 'C', prop: 'D',
      title: 'Upper bifurcation panel fastener pattern change',
      desc: 'Revise fastener pattern to clear relocated hydraulic line bracket. Implemented at shipset 41.',
      eng: 'R. Patel', orig: 'A. Kowalski', pri: 'Medium', risk: 'Low', stage: 12, sub: 160, req: -40, closedAgo: 35,
      cust: true, imp: 'design:Minor,drawing:Moderate,structural:Minor,mfgProcess:Minor', cost: 20, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECN', prog: 'G700', pn: 'G7I-5501-000', part: 'Interior Panel Family', cur: 'H', prop: 'J',
      title: 'Composite repair procedure added to SRM chapter 25',
      desc: 'Add approved cosmetic and structural repair procedures for honeycomb interior panels to SRM.',
      eng: 'S. Whitfield', orig: 'K. Barrow', pri: 'Low', risk: 'Low', stage: 12, sub: 120, req: -30, closedAgo: 45,
      cust: true, imp: 'maintenanceDocs:Moderate', cost: 12, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'ECR', prog: 'F2KEX', pn: 'NF2-3600-077', part: 'Pressure Relief Door', cur: 'B', prop: 'C',
      title: 'Pressure relief door spring rate change',
      desc: 'Pressure relief door opening pressure measured at upper limit during ATP. Evaluate spring rate reduction from 14.2 to 12.8 lb/in.',
      eng: '', orig: 'S. Ramirez', pri: 'Medium', risk: 'Medium', stage: 2, sub: 18, req: 40, slip: 0,
      cust: true, imp: 'design:Minor,performance:Moderate,testing:Moderate,supplier:Minor', cost: 20, fund: 'Internally Funded', w: 0,
    },
    {
      t: 'ECO', prog: 'LAT', pn: 'TRL2210-0460-004', part: 'Deploy Actuator Rod End', cur: 'B', prop: 'C',
      title: 'TR deploy actuator rod end — corrosion protection upgrade',
      desc: 'Change cadmium plate to zinc-nickel (AMS 2417) per REACH compliance initiative. On hold pending customer funding decision.',
      eng: 'K. Brooks', orig: 'B. Hughes', pri: 'Medium', risk: 'Medium', stage: 5, status: 'On Hold', sub: 55, req: 10, slip: 30,
      cust: true, supp: true, imp: 'material:Moderate,supplier:Moderate,qualification:Minor,maintenanceDocs:Minor', cost: 40, fund: 'Customer-Funded', w: 0,
    },
    {
      t: 'ECR', prog: 'KC46', pn: 'K46-7300-020', part: 'Duct Insulation Blanket', cur: 'C', prop: 'D',
      title: 'Duct insulation blanket material obsolescence',
      desc: 'Insulation blanket facing film discontinued by supplier. Identify and qualify replacement with equivalent flammability (14 CFR 25.856) and temperature rating.',
      eng: 'Y. Tanaka', orig: 'H. Jensen', pri: 'High', risk: 'Medium', stage: 3, sub: 25, req: 30, slip: 8,
      cust: true, supp: true, imp: 'material:Major,supplier:Major,certification:Moderate,qualification:Moderate,testing:Moderate', cost: 55, fund: 'Shared', w: 0,
    },
    {
      t: 'ECO', prog: 'ASC', pn: 'TRA4400-1001-020', part: 'Translating Sleeve Inner Skin', cur: 'D', prop: 'E',
      title: 'Translating sleeve inner skin gauge reduction — weight savings',
      desc: 'Proposed reduction from 0.063 to 0.050 in. skin gauge. Rejected at cross-functional review: insufficient damage tolerance margin.',
      eng: 'J. Nguyen', orig: 'W. Chen', pri: 'Low', risk: 'Medium', stage: 4, status: 'Rejected', sub: 70, req: -10, closedAgo: 41, reject: 'stress',
      cust: true, imp: 'structural:Major,weight:Moderate,design:Moderate', cost: 30, fund: 'Internally Funded', w: -1.1,
    },
  ];

  /* ---------- Historical closed changes (for trend analytics) ---------- */
  const HIST = [
    ['ECO', 'Fastener grip length correction', 'Fastener Installation'],
    ['ECN', 'Drawing title block revision for supplier code', 'Panel Assy'],
    ['ECO', 'Bracket edge distance increase', 'Support Bracket'],
    ['Deviation', 'Alternate adhesive lot usage', 'Bonded Assy'],
    ['ECO', 'Sealant fillet size clarification', 'Fairing Assy'],
    ['ECR', 'Shim tolerance relaxation', 'Attach Fitting'],
    ['Waiver', 'Hole elongation use-as-is', 'Frame Segment'],
    ['ECO', 'Nutplate pattern change', 'Access Panel'],
    ['ECN', 'BOM quantity correction', 'Installation'],
    ['ECO', 'Corrosion protection finish upgrade', 'Hinge Assy'],
    ['ECO', 'Doubler ply addition at cutout', 'Composite Skin'],
    ['Deviation', 'Alternate washer material', 'Latch Assy'],
    ['ECO', 'Radius increase to reduce Kt', 'Machined Fitting'],
    ['ECR', 'Inspection frequency reduction', 'Bonded Panel'],
    ['ECO', 'Harness clamp relocation', 'Harness Assy'],
    ['ECN', 'Specification revision update', 'Honeycomb Panel'],
    ['Waiver', 'Surface porosity acceptance', 'Composite Panel'],
    ['ECO', 'Insert type change', 'Sandwich Panel'],
    ['ECO', 'Drain path addition', 'Lower Cowl'],
    ['ECO', 'Tooling hole relocation', 'Spar Web'],
    ['Deviation', 'Supplier process substitution', 'Forging'],
    ['ECN', 'Note clarification — torque values', 'Actuator Install'],
    ['ECO', 'Wear strip material change', 'Seal Land'],
    ['ECO', 'Gusset thickness increase', 'Bracket Assy'],
    ['ECR', 'Paint system change', 'Exterior Panel'],
    ['ECO', 'Weight reduction pocketing', 'Machined Rib'],
    ['Waiver', 'Bond line thickness exceedance', 'Bonded Fitting'],
    ['ECO', 'Lightning strike bonding jumper add', 'Panel Assy'],
    ['ECN', 'Parts list supersession', 'Installation'],
    ['ECO', 'Hinge pin retention improvement', 'Hinge Assy'],
    ['ECO', 'Edge seal change', 'Access Door'],
    ['Deviation', 'Alternate fastener finish', 'Bracket'],
  ];

  const IMPACT_NOTE = {
    design: 'Geometry/feature change to {part}; CAD model and interfaces with adjacent structure require update.',
    drawing: 'Drawing {pn} to revision {prop}; affected sheets, notes and parts list to be revised and checked.',
    material: 'Material callout change on {part}; M&P specifications updated and design allowables confirmed.',
    weight: 'Estimated weight delta {w} lb per shipset; weight & balance report to be updated.',
    structural: 'Stress report revision required — static, fatigue and damage tolerance margins to be re-verified.',
    performance: 'Assess effect on functional / aerodynamic performance against specification limits.',
    integration: 'Interfaces with adjacent systems (harness, actuation, ECU) to be verified in integration test.',
    testing: 'Test plan required; coupon / component tests to substantiate the change.',
    qualification: 'Qualification by test or similarity per qualification test plan.',
    certification: 'Certification basis review — classify major/minor; OEM to coordinate with authority (FAA/EASA).',
    mfgProcess: 'Manufacturing planning, work instructions and process sheets to be revised.',
    supplier: 'Supplier PO and flow-down requirements affected; supplier FAI and capacity confirmation required.',
    tooling: 'Tool modification or new tool required; tool proof prior to production cut-in.',
    inspection: 'Inspection plan and key characteristics updated; FAI per AS9102 for affected characteristics.',
    maintenanceDocs: 'CMM / SRM / IPC updates required; customer technical publications notified.',
    airworthiness: 'No unsafe condition identified; compliance with applicable 14 CFR Part 25 / CS-25 requirements to be shown.',
  };

  const VALIDATION = {
    structural: ['Stress analysis report revision', 'Analysis', 'stress'],
    testing: ['Component test per test plan', 'Test', 'test'],
    qualification: ['Qualification test / similarity report', 'Test', 'test'],
    inspection: ['First Article Inspection (AS9102)', 'Inspection', 'quality'],
    certification: ['Certification compliance summary', 'Analysis', 'systems'],
    integration: ['System integration / functional test', 'Test', 'systems'],
    material: ['Material property / M&P verification', 'Test', 'quality'],
    tooling: ['Tool proof / first part verification', 'Inspection', 'mfg'],
  };

  const APPROVAL_COMMENTS = {
    design: ['Design intent confirmed; model and drawing updates scoped.', 'Concur — interfaces reviewed with adjacent structure.'],
    stress: ['Margins positive with revised loads; stress report to be revised.', 'Concur pending fatigue check at lug.'],
    systems: ['No adverse system interaction identified.', 'Integration test required prior to release.'],
    test: ['Test plan TP draft reviewed; fixture available.', 'Test sequence acceptable.'],
    quality: ['Inspection plan updates identified; FAI required.', 'Concur — add KC to control plan.'],
    mfg: ['Planning and tooling impacts captured.', 'Cut-in point agreed with production control.'],
    supply: ['Supplier quote received; lead time confirmed.', 'Flow-down requirements to be added to PO.'],
    cm: ['Classification and effectivity verified.', 'Baseline impact reviewed.'],
    pm: ['Cost and schedule impact accepted.', 'Funding source confirmed.'],
    customer: ['Customer concurrence received.', 'OEM approves classification as minor change.'],
  };
  const PENDING_ACTIONS = {
    design: 'Provide updated interface control drawing',
    stress: 'Provide updated FEM with revised fastener loads',
    systems: 'Confirm ECU / harness interface impact',
    test: 'Submit test plan and fixture readiness date',
    quality: 'Define inspection characteristics and FAI scope',
    mfg: 'Confirm planning changes and cut-in shipset',
    supply: 'Obtain supplier quote and lead time commitment',
    cm: 'Verify effectivity and baseline impact',
    pm: 'Approve cost estimate and funding source',
    customer: 'OEM decision on change classification and approval',
  };

  const ACTION_TEMPLATES = [
    [2, 'Confirm change classification (major / minor)', 'engineer'],
    [3, 'Complete stress margin assessment', 'stress'],
    [3, 'Obtain supplier feasibility and quote', 'supply'],
    [4, 'Close cross-functional review comments', 'cm'],
    [5, 'Finalize NRE estimate and funding request', 'pm'],
    [6, 'Submit change package to customer engineering', 'pm'],
    [6, 'Follow up with OEM on approval status', 'pm'],
    [7, 'Distribute ECO release notification', 'cm'],
    [8, 'Complete drawing check and release', 'engineer'],
    [8, 'Update NC program and work instructions', 'mfg'],
    [9, 'Execute test per approved test plan', 'test'],
    [9, 'Close out supplier test coupon delivery', 'supply'],
    [10, 'Complete FAI on first production part', 'quality'],
    [10, 'Confirm production cut-in shipset', 'mfg'],
    [11, 'Update as-built configuration records', 'cm'],
  ];

  function parseImp(s) {
    const m = {};
    (s || '').split(',').filter(Boolean).forEach((p) => {
      const [k, v] = p.split(':');
      m[k] = v;
    });
    return m;
  }

  function roleOwner(role, c, rnd) {
    if (role === 'originator') return c.originator;
    if (role === 'engineer') return c.engineer;
    if (role === 'pm') return c.programManager;
    return rnd.pick(C.PEOPLE[role] || C.PEOPLE.cm);
  }
  E.roleOwner = roleOwner;

  function prevRev(r) {
    const base = String(r).split(' ')[0];
    if (/^SW/.test(base)) return null;
    if (base.length === 1 && base > 'A') return String.fromCharCode(base.charCodeAt(0) - 1);
    return null;
  }

  function stageEntries(start, endDate, stage, closed) {
    const w = C.STAGES.map((s) => Math.max(s.days, 2));
    const total = Math.max(U.diff(endDate, start), stage + 1);
    const weights = [];
    for (let i = 0; i < stage; i++) weights.push(w[i]);
    const tail = closed ? 0 : w[stage] * 0.55;
    const denom = weights.reduce((a, b) => a + b, 0) + tail || 1;
    const out = [];
    let acc = 0;
    for (let i = 0; i <= stage; i++) {
      out.push(U.addDays(start, Math.round((total * acc) / denom)));
      if (i < stage) acc += weights[i];
    }
    return out;
  }

  function build(r, idx, rnd, today, seqByYear) {
    const prog = C.programByName(r.prog);
    const submitted = U.addDays(today, -r.sub);
    const isClosedRec = r.closedAgo != null;
    const actual = isClosedRec ? U.addDays(today, -r.closedAgo) : null;
    const stage = r.stage;
    const start = U.addDays(submitted, -rnd.int(2, 5));
    const entries = stageEntries(start, actual || today, stage, isClosedRec && stage === 12);
    const year = U.parse(submitted).getFullYear();
    seqByYear[year] = (seqByYear[year] || 100) + rnd.int(1, 4);
    const typePrefix = { ECR: 'ECR', ECO: 'ECO', ECN: 'ECN', Deviation: 'DEV', Waiver: 'WVR' }[r.t];
    const number = `${typePrefix}-${year}-${String(seqByYear[year]).padStart(4, '0')}`;
    const required = U.addDays(today, r.req);
    const status = r.status || C.STAGES[stage].status;
    const cust = !!r.cust;

    const c = {
      id: `ec_${idx + 1}`,
      number,
      title: r.title,
      description: r.desc,
      type: r.t,
      program: prog.name,
      customer: prog.customer,
      partNumber: r.pn,
      partName: r.part,
      currentRev: r.cur,
      proposedRev: r.prop,
      originator: r.orig || rnd.pick([...C.PEOPLE.quality, ...C.PEOPLE.mfg, ...C.PEOPLE.design]),
      engineer: r.eng,
      programManager: PM_OF[prog.key],
      priority: r.pri,
      risk: r.risk,
      stage,
      status,
      dateSubmitted: submitted,
      requiredDate: required,
      forecastDate: actual || U.addDays(required, r.slip || 0),
      actualDate: status === 'Implemented' ? null : actual,
      customerApprovalRequired: cust,
      customerApproval: !cust
        ? 'Not Required'
        : status === 'Rejected'
        ? 'Not Submitted'
        : stage < 6
        ? 'Not Submitted'
        : stage === 6
        ? 'Submitted'
        : 'Approved',
      implementationStatus: stage < 7 ? 'Not Started' : stage < 9 ? 'Planning' : stage < 11 ? 'In Progress' : 'Complete',
      productionImpact: !!r.prod,
      supplierDependency: !!r.supp,
      escalated: !!r.esc,
      escalationNote: r.esc ? 'Escalated at weekly program review — risk to customer delivery commitment.' : '',
      milestone: r.ms ? { name: prog.milestones[r.ms[0]], date: U.addDays(today, r.ms[1]) } : null,
      stageLog: entries.map((d, i) => ({ stage: i, entered: d })),
      stageOwner: '',
      stageDue: null,
      approvals: [],
      impact: {},
      technical: {},
      financial: {},
      risks: [],
      config: {},
      actions: [],
      comments: [],
      history: [],
    };
    if (status === 'Implemented') c.forecastDate = U.addDays(today, rnd.int(2, 8));
    const stageDef = C.STAGES[stage];
    c.stageOwner = stage === 12 || status === 'Rejected' ? '' : roleOwner(stageDef.owner, c, rnd) || '';
    c.stageDue = stage === 12 || status === 'Rejected' ? null : U.addDays(entries[stage], stageDef.days + (r.slip > 15 ? -6 : 2));

    /* --- Impact assessment --- */
    const imp = parseImp(r.imp);
    C.IMPACTS.forEach((k) => {
      const lvl = imp[k.key] || 'None';
      c.impact[k.key] = {
        level: stage <= 1 && lvl !== 'None' ? 'TBD' : lvl,
        notes:
          lvl === 'None'
            ? ''
            : IMPACT_NOTE[k.key].replace('{part}', r.part).replace('{pn}', r.pn).replace('{prop}', r.prop).replace('{w}', (r.w > 0 ? '+' : '') + (r.w || 0)),
      };
    });
    const tiaDone = stage >= 4 && !r.noTIA;
    const valActs = [];
    Object.entries(VALIDATION).forEach(([k, [act, method, role]]) => {
      const lvl = imp[k];
      if (lvl && lvl !== 'None' && lvl !== 'Minor') {
        const due = U.addDays(entries[Math.min(stage, entries.length - 1)], rnd.int(10, 40));
        valActs.push({
          id: U.uid('va'),
          activity: act,
          method,
          owner: rnd.pick(C.PEOPLE[role]),
          due,
          status: stage >= 10 ? 'Complete' : stage === 9 ? (rnd.chance(0.5) ? 'In Progress' : 'Open') : 'Open',
        });
      }
    });
    c.technical = {
      justification: r.desc.split('. ').slice(0, 2).join('. ') + '.',
      evidence: tiaDone
        ? `FEM run ${r.pn.split('-')[0]}-FEM-${rnd.int(10, 99)}; NCR/CAR history; ${cust ? 'customer correspondence ' + prog.key + '-CR-' + rnd.int(1000, 9999) + '; ' : ''}supplier data package.`
        : '',
      riskAssessment: tiaDone
        ? `Overall technical risk assessed as ${r.risk}. ${imp.structural === 'Major' ? 'Structural margins are the primary driver. ' : ''}${imp.certification === 'Major' ? 'Certification path requires OEM/authority coordination. ' : ''}`
        : '',
      validationPlan: valActs.length ? `${valActs.length} verification activities defined; closure required before configuration update.` : 'Verification by inspection only.',
      validations: valActs,
      weightDelta: r.w || 0,
      classification: imp.certification === 'Major' || imp.airworthiness === 'Major' ? 'Major' : 'Minor',
      assessmentComplete: tiaDone,
      assessedBy: tiaDone ? r.eng || 'D. Okafor' : '',
      assessedDate: tiaDone ? entries[Math.min(4, stage)] : '',
      testingResolved: stage >= 10 || !imp.testing || imp.testing === 'None' || imp.testing === 'Minor',
    };

    /* --- Approvals --- */
    const need = {
      design: true,
      stress: ['structural', 'material', 'weight'].some((k) => imp[k] && imp[k] !== 'None'),
      systems: ['integration', 'performance', 'certification'].some((k) => imp[k] && imp[k] !== 'None'),
      test: ['testing', 'qualification'].some((k) => imp[k] && imp[k] !== 'None'),
      quality: true,
      mfg: ['mfgProcess', 'tooling', 'inspection'].some((k) => imp[k] && imp[k] !== 'None') || !!r.prod,
      supply: !!r.supp || ['supplier', 'material'].some((k) => imp[k] && imp[k] !== 'None'),
      cm: true,
      pm: true,
      customer: cust,
    };
    const xfrDate = entries[4];
    const custDate = entries[6];
    let overdueBudget = r.slip > 8 ? 2 : r.slip > 0 ? 1 : 0;
    C.DEPTS.forEach((d) => {
      const a = {
        dept: d.key,
        required: !!need[d.key],
        reviewer: d.key === 'customer' ? prog.custRep : d.key === 'pm' ? c.programManager : rnd.pick(C.PEOPLE[d.key]),
        assigned: null,
        completed: null,
        status: need[d.key] ? 'Not Started' : 'N/A',
        comments: '',
        actions: '',
        target: d.target,
      };
      if (!need[d.key]) {
        c.approvals.push(a);
        return;
      }
      if (d.key === 'customer') {
        if (stage >= 6 && custDate) {
          a.assigned = custDate;
          if (stage > 6 || (isClosedRec && stage === 12)) {
            a.completed = U.addDays(custDate, rnd.int(6, 18));
            a.status = 'Approved';
            a.comments = rnd.pick(APPROVAL_COMMENTS.customer);
          } else {
            a.status = 'Pending';
            a.actions = PENDING_ACTIONS.customer;
          }
        }
      } else if (stage >= 4 && xfrDate) {
        a.assigned = xfrDate;
        const age = U.diff(today, xfrDate);
        if (status === 'Rejected' && d.key === r.reject) {
          a.completed = U.addDays(xfrDate, 6);
          a.status = 'Rejected';
          a.comments = 'Damage tolerance margin insufficient at 0.050 gauge; resubmit with revised analysis or alternate concept.';
          a.actions = '';
        } else if (stage >= 6 || status === 'Rejected') {
          a.completed = U.addDays(xfrDate, rnd.int(1, Math.min(d.target + 2, Math.max(1, (U.diff(entries[Math.min(stage, 6)], xfrDate) || 2)))));
          a.status = rnd.chance(0.25) ? 'Approved w/ Comments' : 'Approved';
          a.comments = rnd.pick(APPROVAL_COMMENTS[d.key]);
        } else {
          // stage 4 or 5: mixed progress
          const done = rnd.chance(stage === 5 ? 0.75 : 0.45) && !(overdueBudget > 0 && ['stress', 'supply', 'test', 'systems', 'quality'].includes(d.key) && rnd.chance(0.7));
          if (done) {
            const cd = U.addDays(xfrDate, rnd.int(1, Math.max(1, Math.min(d.target, age))));
            if (cd <= today) {
              a.completed = cd;
              a.status = rnd.chance(0.3) ? 'Approved w/ Comments' : 'Approved';
              a.comments = rnd.pick(APPROVAL_COMMENTS[d.key]);
            }
          }
          if (!a.completed) {
            a.status = 'Pending';
            a.actions = PENDING_ACTIONS[d.key];
            if (age > d.target) overdueBudget--;
          }
        }
        if (a.completed && a.completed > today) a.completed = today;
      }
      c.approvals.push(a);
    });

    /* --- Financials --- */
    const s = r.cost * 1000;
    const hrsEst = Math.round((s * 0.45) / C.LABOR_RATE);
    const progress = isClosedRec ? 1 : Math.min(1, stage / 11);
    const over = r.slip > 10 ? 1.25 : r.slip > 0 ? 1.08 : 0.95;
    const est = {
      laborHours: hrsEst,
      material: Math.round(s * (imp.material && imp.material !== 'None' ? 0.12 : 0.03)),
      tooling: Math.round(s * (imp.tooling && imp.tooling !== 'None' ? (imp.tooling === 'Major' ? 0.25 : 0.1) : 0)),
      supplier: Math.round(s * (imp.supplier && imp.supplier !== 'None' ? 0.15 : 0.02)),
      testing: Math.round(s * (imp.testing && imp.testing !== 'None' ? (imp.testing === 'Major' ? 0.22 : 0.08) : 0)),
    };
    const act = (v) => Math.round(v * progress * over * (0.9 + rnd() * 0.2));
    c.financial = {
      laborHoursEst: est.laborHours,
      laborHoursAct: Math.round(est.laborHours * progress * over),
      laborRate: C.LABOR_RATE,
      materialEst: est.material,
      materialAct: act(est.material),
      toolingEst: est.tooling,
      toolingAct: act(est.tooling),
      supplierEst: est.supplier,
      supplierAct: act(est.supplier),
      testingEst: est.testing,
      testingAct: act(est.testing),
      recurringDelta: r.recurring != null ? r.recurring : Math.round((r.w || 0) * 120 + (imp.material === 'Major' ? 420 : 0) + (imp.mfgProcess ? 85 : 0)),
      annualQty: { F2KEX: 24, ASC: 60, LAT: 52, G700: 40, '737': 480, KC46: 15 }[prog.key],
      funding: r.fund || 'Internally Funded',
      scheduleImpactDays: Math.max(0, r.slip || 0),
      productionImpact: r.prod
        ? `Affects production cut-in on ${prog.key === '737' ? 'LN' : 'shipset'} ${rnd.int(40, 400)}; ${r.slip > 10 ? 'risk of delivery slip without mitigation' : 'no delivery impact if released on forecast'}.`
        : 'No production impact.',
      contractualImpact: cust
        ? r.fund === 'Customer-Funded'
          ? `Customer-directed change; covered under contract change proposal ${prog.key}-CCP-${rnd.int(100, 999)}.`
          : 'Requires customer concurrence; no price adjustment planned.'
        : 'No contractual impact.',
      costRecovery: r.fund === 'Customer-Funded' ? Math.round(s * 0.9) : r.fund === 'Shared' ? Math.round(s * 0.45) : 0,
      recoveryStatus: r.fund === 'Customer-Funded' ? (stage >= 7 ? 'Approved' : 'Proposed') : r.fund === 'Shared' ? 'In Negotiation' : 'N/A',
    };

    /* --- Risks --- */
    const ratingFor = (bump) => C.RISK_LEVELS[Math.max(0, Math.min(3, C.RISK_LEVELS.indexOf(r.risk) - bump))];
    const addRisk = (category, description, mitigation, bump, ownerRole) =>
      c.risks.push({
        id: U.uid('rk'),
        category,
        rating: ratingFor(bump),
        description,
        mitigation,
        owner: roleOwner(ownerRole, c, rnd) || c.programManager,
        status: isClosedRec ? 'Closed' : 'Open',
      });
    if (imp.structural === 'Major' || imp.design === 'Major')
      addRisk('Technical', `Design solution for ${r.part} may not close all margins on first iteration.`, 'Early stress review; parallel concept evaluation.', 0, 'stress');
    if ((r.slip || 0) > 0)
      addRisk('Schedule', `Forecast completion ${r.slip} days beyond required date.`, 'Re-baseline plan; daily stand-up on critical path tasks.', r.slip > 14 ? -1 : 0, 'pm');
    if (r.supp) addRisk('Supplier Dependency', 'Closure dependent on supplier response / capacity.', 'Supply chain to secure commit date; weekly supplier call.', 0, 'supply');
    if (cust && stage <= 6 && !isClosedRec)
      addRisk('Customer Approval Dependency', `${prog.customer} approval required prior to ECO release.`, 'Pre-brief customer engineering; request decision date.', 1, 'pm');
    if (r.prod) addRisk('Production Disruption', 'Change cut-in may disrupt production flow / line of balance.', 'Define cut-in shipset; build ahead or interim deviation.', 1, 'mfg');
    if (imp.certification === 'Major' || imp.certification === 'Moderate')
      addRisk('Certification', 'Certification data package required; authority acceptance timing uncertain.', 'Engage OEM certification focal; align on compliance plan.', 0, 'systems');
    if (r.cost >= 120) addRisk('Cost', `NRE estimate ${U.money(s, true)} with test cost uncertainty.`, 'Track actuals weekly; pursue customer cost recovery.', 1, 'pm');
    if (stage >= 8 && stage < 12 && r.prod)
      addRisk('Configuration Management', 'As-built configuration lags as-designed until cut-in complete.', 'CM to track serial effectivity and interim build records.', 2, 'cm');

    /* --- Configuration traceability --- */
    const sn0 = rnd.int(100, 1200);
    const revHist = [];
    let rv = r.cur.split(' ')[0];
    let dt = U.addDays(submitted, -rnd.int(120, 300));
    const chain = [];
    while (rv) {
      chain.unshift(rv);
      rv = prevRev(rv);
      if (chain.length > 3) break;
    }
    chain.forEach((rev, i) => {
      revHist.push({
        rev,
        date: U.addDays(dt, -((chain.length - 1 - i) * rnd.int(150, 320))),
        change: i === 0 ? 'Initial Release' : `ECO-${U.parse(dt).getFullYear() - (chain.length - 1 - i)}-${String(rnd.int(10, 99)).padStart(4, '0')}`,
        description: i === 0 ? 'Initial release' : rnd.pick(['Dimension update', 'Note revision', 'Material spec update', 'Fastener change', 'Tolerance update']),
        by: rnd.pick(C.PEOPLE.cm),
      });
    });
    if (stage >= 11 && !/\(/.test(r.prop) && status !== 'Rejected')
      revHist.push({ rev: r.prop, date: entries[11] || actual || today, change: number, description: r.title, by: rnd.pick(C.PEOPLE.cm) });
    const asBuilt = stage >= 11 ? r.prop : r.cur;
    c.config = {
      serialApplicability: `SN ${prog.prefix}-${sn0} and subsequent`,
      effectivity: prog.key === '737' ? `LN ${rnd.int(9100, 9200)} & on` : `Shipset ${rnd.int(20, 320)} & on`,
      baseline: prog.baseline,
      drawingRev: `${r.pn.replace(/-SW$/, '')} Rev ${r.cur} → ${r.prop}`,
      specRev: rnd.pick(['PS-3020 Rev F', 'MPS-1104 Rev C', 'ES-2210 Rev H', 'BAC 5010 Rev AB', 'DMS 2104 Rev D']),
      bomChanges: [
        { action: 'Revise', pn: r.pn, desc: r.part, qty: 1 },
        ...(imp.supplier || imp.material ? [{ action: 'Add', pn: `${r.pn.split('-')[0]}-${rnd.int(1000, 9999)}-${rnd.int(1, 9)}`, desc: 'Replacement detail / hardware', qty: rnd.int(1, 8) }] : []),
      ],
      supplierChanges: r.supp ? `${rnd.pick(['Precision Forge Co. (CAGE 4K2L1)', 'AeroFast Supply (CAGE 1R7T3)', 'Western Composites (CAGE 6P9A2)', 'Mid-Continent Plating (CAGE 3H8Z5)'])} — source approval / PO flow-down update.` : 'None',
      swHwRev: r.sw ? `ECU SW ${r.cur} → ${r.prop}; HW P/N unchanged` : 'N/A',
      customerDocs: cust ? (stage >= 7 ? `${prog.key}-CA-${rnd.int(1000, 9999)} (approval letter)` : stage === 6 ? `${prog.key}-CR-${rnd.int(1000, 9999)} (submitted)` : 'Pending submittal') : 'N/A',
      verificationEvidence: stage >= 10 ? valActs.map((v) => `${v.activity} — complete`).join('; ') || 'Inspection record' : stage >= 9 ? 'Test in progress' : 'Not started',
      faiRequired: !!(imp.inspection || imp.mfgProcess || imp.supplier || imp.tooling),
      faiStatus: !(imp.inspection || imp.mfgProcess || imp.supplier || imp.tooling) ? 'N/A' : stage >= 11 ? 'Complete' : stage >= 10 ? 'In Progress' : 'Planned',
      asDesigned: stage >= 7 ? r.prop : r.cur,
      asBuilt,
      revHistory: revHist,
    };

    /* --- Action items --- */
    if (!isClosedRec && status !== 'Rejected') {
      ACTION_TEMPLATES.filter((a) => a[0] === stage || a[0] === stage - 1).forEach((a, i) => {
        const current = a[0] === stage;
        const due = current ? U.addDays(today, rnd.int(-8, 14) + (r.slip > 10 ? -6 : 0)) : U.addDays(entries[stage], rnd.int(-3, 3));
        c.actions.push({
          id: U.uid('ai'),
          text: a[1],
          owner: roleOwner(a[2], c, rnd) || '',
          due,
          status: current ? 'Open' : 'Closed',
          created: entries[Math.max(0, stage - 1)],
          closed: current ? null : due,
        });
      });
      c.approvals
        .filter((a) => a.status === 'Pending' && a.actions)
        .slice(0, 2)
        .forEach((a) =>
          c.actions.push({
            id: U.uid('ai'),
            text: `${C.DEPTS.find((d) => d.key === a.dept).short}: ${a.actions}`,
            owner: a.reviewer,
            due: U.addDays(a.assigned, a.target),
            status: 'Open',
            created: a.assigned,
            closed: null,
          })
        );
    }

    /* --- Comments --- */
    const cm = [
      [Math.min(2, stage), c.engineer || c.originator, 'Initial review complete — scope confirmed with originator.'],
      [Math.min(4, stage), c.programManager, 'Discussed at program CCB. Need cost/schedule estimate before customer submittal.'],
      [Math.min(7, stage), rnd.pick(C.PEOPLE.cm), 'Effectivity confirmed against current build schedule.'],
    ];
    const seen = new Set();
    cm.forEach(([st, author, text]) => {
      if (st > stage || seen.has(st) || !author) return;
      seen.add(st);
      c.comments.push({ id: U.uid('cm'), author, date: U.addDays(entries[st], 1) <= today ? U.addDays(entries[st], 1) : today, text });
    });
    if (r.esc) c.comments.push({ id: U.uid('cm'), author: 'R. Delgado (VP Programs)', date: U.addDays(today, -3), text: 'Need recovery plan with dates at Friday program review.' });

    /* --- Audit history --- */
    const H = (ts, user, action, detail, extra) => c.history.push({ id: U.uid('h'), ts, user, action, detail, ...(extra || {}) });
    H(entries[0], c.originator, 'Created', `${r.t} created: ${r.title}`, { field: 'status', to: 'Identified' });
    for (let i = 1; i <= stage; i++) {
      const st = C.STAGES[i];
      H(entries[i], rnd.pick(C.PEOPLE.cm), 'Stage Advanced', `Entered stage ${i + 1}: ${st.name}`, { field: 'status', to: st.status, stage: i });
    }
    c.approvals.forEach((a) => {
      const dn = C.DEPTS.find((d) => d.key === a.dept).name;
      if (a.assigned) H(a.assigned, rnd.pick(C.PEOPLE.cm), 'Approval Requested', `${dn} review assigned to ${a.reviewer}`);
      if (a.completed) H(a.completed, a.reviewer, a.status === 'Rejected' ? 'Rejected' : 'Approved', `${dn}: ${a.status}${a.comments ? ' — ' + a.comments : ''}`);
    });
    if (status !== C.STAGES[stage].status) {
      const sd = status === 'Rejected' ? actual : U.addDays(entries[stage], Math.min(4, Math.max(0, U.diff(today, entries[stage]) - 1)));
      H(sd, status === 'Rejected' ? c.programManager : rnd.pick(C.PEOPLE.supply), 'Status Changed', `Status changed to ${status}`, { field: 'status', to: status });
    }
    if (r.esc) H(U.addDays(today, -5), c.programManager, 'Escalated', 'Escalated to leadership');
    c.history.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    return c;
  }

  E.generateSeed = function () {
    const today = U.today();
    const rnd = U.rng(20261120);
    const seq = {};
    const out = [];
    // historical first so numbering is chronological-ish
    const progKeys = C.PROGRAMS.map((p) => p.key);
    const hist = HIST.map((h, i) => {
      const sub = rnd.int(95, 360);
      const cycle = rnd.int(28, 115);
      const closedAgo = Math.max(3, sub - cycle);
      const reqSpan = rnd.int(40, 100);
      const prog = rnd.pick(progKeys);
      const pdef = C.programByName(prog);
      return {
        t: h[0],
        prog,
        pn: `${pdef.prefix}${prog === '737' || prog === 'KC46' || prog === 'F2KEX' || prog === 'G700' ? '-' : ''}${rnd.int(1000, 7999)}-${String(rnd.int(10, 999)).padStart(4, '0')}-${rnd.int(1, 9)}0${rnd.int(1, 9)}`,
        part: h[2],
        cur: rnd.pick(['B', 'C', 'D', 'E', 'F']),
        prop: '',
        title: h[1],
        desc: `${h[1]} on ${h[2].toLowerCase()} — implemented and closed. Historical record retained for configuration traceability.`,
        eng: rnd.pick(C.PEOPLE.design.concat(C.PEOPLE.mfg)),
        pri: rnd.pick(['High', 'Medium', 'Medium', 'Low']),
        risk: rnd.pick(['Medium', 'Low', 'Low', 'High']),
        stage: 12,
        sub,
        req: -sub + reqSpan,
        closedAgo,
        cust: rnd.chance(0.6),
        prod: rnd.chance(0.4),
        supp: rnd.chance(0.3),
        imp: rnd.pick(['drawing:Minor,design:Minor', 'material:Minor,inspection:Minor', 'structural:Moderate,design:Moderate,drawing:Minor', 'mfgProcess:Moderate,tooling:Minor', 'supplier:Moderate,inspection:Minor']),
        cost: rnd.int(3, 60),
        fund: rnd.pick(C.FUNDING),
        w: 0,
      };
    });
    hist.forEach((h) => {
      h.prop = /^[A-Z]$/.test(h.cur) ? String.fromCharCode(h.cur.charCodeAt(0) + 1) : h.cur;
      if (h.t === 'Deviation' || h.t === 'Waiver') h.prop = `${h.cur} (${h.t === 'Deviation' ? 'DEV' : 'WVR'}-0${rnd.int(1, 9)})`;
    });
    const all = hist.concat(RECORDS).sort((a, b) => b.sub - a.sub);
    all.forEach((r, i) => out.push(build(r, i, rnd, today, seq)));
    return out;
  };
})(window.ECM);
