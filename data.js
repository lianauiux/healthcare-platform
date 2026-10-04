/* Corvina Health Platform — fictional demo data. "Now" is Tue 29 Sep 2026, 10:40 AM. */
window.D=(function(){
const NOW=10+40/60;

const FACILITIES=[
  {id:'CGH',mk:'CG',name:'Corvina General Hospital',beds:420},
  {id:'WMC',mk:'WM',name:'Westbrook Medical Center',beds:310},
  {id:'HVH',mk:'HV',name:'Halden Valley Hospital',beds:160},
  {id:'ACH',mk:'AC',name:'Ashcombe Community Hospital',beds:140},
  {id:'CHI',mk:'CH',name:'Corvina Heart Institute',beds:90}
];

/* Roles: which modules each role sees (hidden, not disabled) */
const ROLES=[
  {id:'physician',label:'Physician',user:'Dr. Elena Marsh',ini:'EM',title:'Family Physician',mods:['dashboard','patients','appointments','homevisits','prescriptions'],home:'appointments',nav:['appointments','homevisits','prescriptions','dashboard','patients'],labels:{dashboard:'Analytics'}},
  {id:'nurse',label:'Nurse',user:'Jordan Okafor, RN',ini:'JO',title:'Charge Nurse · 4 West',mods:['dashboard','patients','admissions','clinical','diagnostics','medications','staff']},
  {id:'reception',label:'Reception',user:'Maya Chen',ini:'MC',title:'Front Desk · Outpatient',mods:['dashboard','patients','appointments','admissions']},
  {id:'admin',label:'Hospital Administrator',user:'Sam Ruiz',ini:'SR',title:'Hospital Administrator',mods:['dashboard','patients','admissions','facilities','staff','analytics','admin']},
  {id:'mgmt',label:'Management',user:'Dana Whitfield',ini:'DW',title:'Chief Operating Officer',mods:['dashboard','facilities','staff','analytics']}
];

const DOCTORS=[
  {id:'marsh',name:'Dr. Elena Marsh',spec:'Family Medicine',clinicDays:[0,1,3]},
  {id:'soto',name:'Dr. Rafael Soto',spec:'Emergency Medicine'},
  {id:'lindqvist',name:'Dr. Anika Lindqvist',spec:'Cardiology'},
  {id:'menon',name:'Dr. Ravi Menon',spec:'Endocrinology'},
  {id:'haddad',name:'Dr. Iman Haddad',spec:'Oncology'},
  {id:'adler',name:'Dr. Ben Adler',spec:'Pediatrics'},
  {id:'cole',name:'Dr. Hannah Cole',spec:'Obstetrics'},
  {id:'anand',name:'Dr. Priya Anand',spec:'Family Medicine'},
  {id:'brennan',name:'Dr. Sean Brennan',spec:'Family Medicine'}
];
const doc=id=>DOCTORS.find(d=>d.id===id);

const PATIENTS=[
  {id:'p1',name:'Margaret Hollis',mrn:'CG-104821',age:78,sex:'F',dob:'12 Mar 1948',status:'Inpatient',loc:'4 West · 412A',att:'marsh',dx:[['I50.23','Acute on chronic systolic heart failure'],['N18.3','Chronic kidney disease, stage 3'],['I10','Hypertension']],allergies:['Penicillin','Sulfa drugs'],admitted:'26 Sep',los:3,risk:'High',news:4,code:'Full Code'},
  {id:'p2',name:'Daniel Okoye',mrn:'CG-106604',age:54,sex:'M',dob:'02 Jul 1972',status:'Inpatient',loc:'ICU · Bed 07',att:'soto',dx:[['A41.9','Sepsis, unspecified organism'],['J18.9','Pneumonia, unspecified']],allergies:[],admitted:'28 Sep',los:1,risk:'Critical',news:9,code:'Full Code'},
  {id:'p3',name:'Thomas Becker',mrn:'CG-102290',age:67,sex:'M',dob:'19 Nov 1958',status:'Inpatient',loc:'5 East · 508B',att:'marsh',dx:[['J44.1','COPD with acute exacerbation']],allergies:['Aspirin'],admitted:'27 Sep',los:2,risk:'Moderate',news:5,code:'DNR'},
  {id:'p4',name:'Evelyn Park',mrn:'CG-108840',age:82,sex:'F',dob:'05 Jan 1944',status:'Inpatient',loc:'4 West · 406B',att:'marsh',dx:[['S72.001A','Fracture of right femoral neck'],['F03.90','Dementia, unspecified']],allergies:['Codeine'],admitted:'24 Sep',los:5,risk:'High',news:3,code:'DNR'},
  {id:'p5',name:'Marcus Reid',mrn:'CG-104477',age:61,sex:'M',dob:'23 Aug 1965',status:'Inpatient',loc:'Step-Down · 03',att:'lindqvist',dx:[['I21.4','Non-ST elevation myocardial infarction']],allergies:['Iodinated contrast'],admitted:'27 Sep',los:2,risk:'High',news:4,code:'Full Code'},
  {id:'p6',name:'William Carter',mrn:'CG-105102',age:70,sex:'M',dob:'14 Feb 1956',status:'Inpatient',loc:'4 West · 409A',att:'marsh',dx:[['N17.9','Acute kidney injury'],['E11.9','Type 2 diabetes']],allergies:[],admitted:'27 Sep',los:2,risk:'Moderate',news:2,code:'Full Code'},
  {id:'p7',name:'Kevin Tran',mrn:'CG-106128',age:41,sex:'M',dob:'30 Apr 1985',status:'Inpatient',loc:'5 East · 511A',att:'soto',dx:[['L03.115','Cellulitis of right lower limb']],allergies:['Latex'],admitted:'28 Sep',los:1,risk:'Low',news:1,code:'Full Code'},
  {id:'p8',name:'Lucía Fernández',mrn:'CG-103056',age:29,sex:'F',dob:'08 Jun 1997',status:'Inpatient',loc:'L&D · Room 4',att:'cole',dx:[['O82','Delivery by caesarean section']],allergies:[],admitted:'28 Sep',los:1,risk:'Low',news:1,code:'Full Code'},
  {id:'p9',name:'Samuel Adeyemi',mrn:'CG-107715',age:45,sex:'M',dob:'17 Oct 1980',status:'Emergency',loc:'ED · Bay 6',att:'soto',dx:[['R07.9','Chest pain, unspecified']],allergies:[],admitted:'Today',los:0,risk:'High',news:5,code:'Full Code'},
  {id:'p10',name:'Aisha Karimi',mrn:'CG-109013',age:8,sex:'F',dob:'11 Dec 2017',status:'Emergency',loc:'Peds ED · 2',att:'adler',dx:[['J45.901','Asthma with acute exacerbation']],allergies:['Peanuts'],admitted:'Today',los:0,risk:'Moderate',news:4,code:'Full Code'},
  {id:'p11',name:'Priya Raman',mrn:'CG-110382',age:36,sex:'F',dob:'21 May 1990',status:'Outpatient',loc:'Cardiology Clinic',att:'lindqvist',dx:[['R00.2','Palpitations']],allergies:[],risk:'Low',code:'—'},
  {id:'p12',name:'Nora Lindgren',mrn:'CG-101177',age:50,sex:'F',dob:'03 Sep 1976',status:'Outpatient',loc:'Oncology Clinic',att:'haddad',dx:[['C50.911','Malignant neoplasm of right breast']],allergies:['Morphine'],risk:'Moderate',code:'—'},
  {id:'p13',name:'Rosa Delgado',mrn:'CG-100923',age:58,sex:'F',dob:'27 Jan 1968',status:'Outpatient',loc:'Endocrinology Clinic',att:'menon',dx:[['E11.65','Type 2 diabetes with hyperglycemia']],allergies:[],risk:'Moderate',code:'—'},
  {id:'p14',name:'George Whitaker',mrn:'CG-100456',age:73,sex:'M',dob:'09 Aug 1953',status:'Discharged',loc:'Home',att:'marsh',dx:[['J18.9','Pneumonia, unspecified']],allergies:[],risk:'Moderate',code:'—'},
  {id:'p15',name:'Helen Osei',mrn:'CG-101502',age:64,sex:'F',dob:'16 Mar 1962',status:'Outpatient',loc:'Internal Medicine',att:'marsh',dx:[['I10','Hypertension']],allergies:['ACE inhibitors'],risk:'Low',code:'—'},
  {id:'p16',name:'Oliver Brandt',mrn:'CG-102918',age:12,sex:'M',dob:'04 Feb 2014',status:'Outpatient',loc:'Pediatrics',att:'adler',dx:[['J30.9','Allergic rhinitis']],allergies:[],risk:'Low',code:'—'}
];
const pat=id=>PATIENTS.find(p=>p.id===id);

/* Outpatient appointments today. start/end in decimal hours. */
const APPTS=[
  ['lindqvist',8,8.5,'Priya Raman','Follow-up · Holter results','done'],['lindqvist',8.5,9,'Frank Moretti','New patient · Chest pain','done'],['lindqvist',9,9.5,'Grace Liu','Echo review','noshow'],['lindqvist',9.5,10.25,'Paul Andersen','Stress test','done'],['lindqvist',10.5,11,'Irene Kowalski','Post-MI follow-up','progress'],['lindqvist',11,11.5,'Ahmed Farouk','AF management','waiting'],['lindqvist',13,13.5,'Carla Mendes','New patient · Murmur','sched'],['lindqvist',13.5,14,'Victor Hale','Pacemaker check','sched'],['lindqvist',14.5,15,'Sofia Brandt','Follow-up','cancel'],
  ['menon',8,8.5,'Rosa Delgado','Diabetes review · HbA1c','done'],['menon',9,9.5,'Martin Novak','Thyroid nodule','done'],['menon',10,10.5,'Linda Harper','Insulin titration','progress'],['menon',10.5,11,'Yusuf Demir','New patient · Diabetes','checkedin'],['menon',11.5,12,'Amelia Stone','Osteoporosis','sched'],['menon',14,14.5,'Rachel Kim','Follow-up','sched'],
  ['haddad',8.5,9.5,'Nora Lindgren','Chemotherapy cycle 4 review','done'],['haddad',9.5,10.25,'David Ortiz','Scan results','done'],['haddad',10.25,11,'Mei Tanaka','New referral','progress'],['haddad',11,12,'Hannah Weiss','Treatment planning','waiting'],['haddad',13.5,14.5,'Robert Lang','Follow-up','sched'],
  ['adler',8,8.25,'Oliver Brandt','Allergy follow-up','done'],['adler',8.5,8.75,'Lily Evans','Well child · 4 yr','done'],['adler',9,9.25,'Noah Price','Fever','done'],['adler',9.75,10,'Emma Scott','Vaccination','done'],['adler',10.5,10.75,'Leo Martin','Ear pain','waiting'],['adler',10.75,11,'Chloe Adams','Well child · 1 yr','checkedin'],['adler',11.25,11.5,'Jack Wilson','Rash','sched'],['adler',13,13.25,'Ava Turner','Asthma review','sched'],['adler',15,15.25,'Mason Hill','Sports physical','sched'],
  /* Dr. Marsh · Family Medicine · clinic Mon, Tue, Thu (day 0 = Mon 28 Sep, 1 = today, 3 = Thu 1 Oct) */
  ['marsh',8,8.5,'Helen Osei','Blood pressure review','done'],['marsh',8.5,9,'Peter Grant','Annual physical','done'],['marsh',9,9.25,'Lucas Reyes','Sore throat','done'],['marsh',9.25,9.75,'Julia Rossi','Lab results','done'],['marsh',9.75,10.25,'Amara Nwosu','Diabetes follow-up','done'],
  ['marsh',10.25,10.75,'Daniel Kim','Back pain','progress'],['marsh',10.75,11,'Sarah Cohen','Vaccination','checkedin',1,10.5],['marsh',11,11.5,'Samir Nair','New patient','waiting',1,10.33],['marsh',11.5,12,'Grace Whitman','Cholesterol follow-up','sched'],
  ['marsh',13,13.5,'Marco Bianchi','Knee pain','sched'],['marsh',13.5,14,'Elena Popescu','Anxiety follow-up','sched'],['marsh',14,14.5,'Ruth Castillo','Well-woman exam','sched'],['marsh',14.5,15,'Owen Park','Skin check','cancel'],['marsh',15,15.5,'Ibrahim Saleh','Blood pressure review','sched'],['marsh',15.5,16,'Nina Kovac','Lab results','sched'],
  ['marsh',8,8.5,'Arthur Bell','Annual physical','done',0],['marsh',8.5,9,'Maria Santos','Diabetes follow-up','done',0],['marsh',9,9.5,'Kenji Mori','Cough','done',0],['marsh',9.5,10,'Laura Fischer','Blood pressure review','noshow',0],['marsh',10,10.5,'Hugo Laurent','Lab results','done',0],['marsh',11,11.5,'Fatima Rahman','Well-woman exam','done',0],['marsh',13,13.5,'Tomás Silva','Back pain','done',0],['marsh',13.5,14,'Anna Novak','Vaccination','done',0],['marsh',14,14.5,'Felix Braun','Knee pain','done',0],['marsh',15,15.5,'Chen Wei','New patient','done',0],
  ['marsh',8,8.5,'Olga Ivanova','Annual physical','sched',3],['marsh',8.5,9,'Brian Walsh','Diabetes follow-up','sched',3],['marsh',9,9.5,'Priscilla Moore','Lab results','sched',3],['marsh',10,10.5,'Anton Weber','Blood pressure review','sched',3],['marsh',10.5,11,'Leila Haddad','Anxiety follow-up','sched',3],['marsh',11,11.5,'Oscar Lind','Skin check','sched',3],['marsh',13,13.5,'Rita Gomez','Cholesterol follow-up','sched',3],['marsh',14,14.5,'Hannah Ortiz','Well-woman exam','sched',3],['marsh',14.5,15,'Victor Chen','Knee pain','sched',3]
].map((a,i)=>({id:'a'+i,doc:a[0],s:a[1],e:a[2],name:a[3],reason:a[4],st:a[5],w:0,day:a[6]??1,arrived:a[7]??(a[5]==='waiting'?[10.08,10.25][i%2]:a[5]==='checkedin'?10.5:null)}));

/* Every appointment belongs to a patient record: link known patients, create the rest (outpatients). */
(function(){
  const F=/^(Frank|Paul|Ahmed|Victor|Martin|Yusuf|David|Robert|Noah|Leo|Jack|Mason|Peter|Samir|Oliver|Lucas|Daniel|Marco|Owen|Ibrahim|Arthur|Kenji|Hugo|Tomás|Felix|Chen|Brian|Anton|Oscar)$/;
  const DX={lindqvist:[['I48.91','Atrial fibrillation'],['I10','Hypertension'],['I25.10','Coronary artery disease']],menon:[['E11.9','Type 2 diabetes'],['E78.5','Hyperlipidemia']],haddad:[['C50.911','Malignant neoplasm of breast'],['D50.9','Iron deficiency anemia']],adler:[['Z00.129','Routine child health exam']],marsh:[['I10','Hypertension'],['E78.5','Hyperlipidemia']],famx:[]};
  const BY=[[/ear pain/i,['H66.90','Otitis media']],[/rash/i,['L30.9','Dermatitis']],[/asthma/i,['J45.909','Asthma']],[/fever/i,['R50.9','Fever']],[/thyroid/i,['E04.1','Thyroid nodule']],[/osteopor/i,['M81.0','Osteoporosis']],[/\bAF\b/,['I48.91','Atrial fibrillation']],[/pacemaker/i,['Z95.0','Presence of cardiac pacemaker']],[/murmur/i,['R01.1','Heart murmur']],[/chest pain/i,['R07.9','Chest pain, unspecified']],[/post-mi/i,['I25.2','Old myocardial infarction']],[/insulin|diabetes/i,['E11.65','Type 2 diabetes with hyperglycemia']],[/echo|stress test/i,['I25.10','Coronary artery disease']],[/scan|referral|treatment/i,['C50.911','Malignant neoplasm of breast']],[/sore throat/i,['J02.9','Acute pharyngitis']],[/back pain/i,['M54.50','Low back pain']],[/knee pain/i,['M25.561','Pain in right knee']],[/cough/i,['R05.9','Cough']],[/cholesterol/i,['E78.5','Hyperlipidemia']],[/anxiety/i,['F41.1','Generalized anxiety disorder']],[/skin check/i,['Z12.83','Skin cancer screening']],[/well-woman|annual physical/i,['Z00.00','General adult examination']],[/vaccination/i,['Z23','Encounter for immunization']],[/blood pressure/i,['I10','Hypertension']],[/lab results/i,['E78.5','Hyperlipidemia']]];
  const ALG=['Penicillin','Latex','Ibuprofen','Eggs'];
  APPTS.forEach((a,i)=>{
    let p=PATIENTS.find(x=>x.name===a.name);
    if(!p){
      const kid=a.doc==='adler', age=kid?1+(i*7)%14:32+(i*13)%48, first=a.name.split(' ')[0];
      const hit=BY.find(([re])=>re.test(a.reason)), dx0=hit?hit[1]:DX[a.doc][0], dx=[dx0].concat(DX[a.doc].filter(x=>x[0]!==dx0[0]).slice(0,kid?0:1));
      p={id:'o'+i,name:a.name,mrn:'CG-'+(112000+i*37),age,sex:F.test(first)?'M':'F',dob:`${String(1+(i*5)%28).padStart(2,'0')} ${['Jan','Mar','Apr','Jun','Aug','Oct','Nov'][i%7]} ${2026-age}`,status:'Outpatient',loc:a.day===1?'Clinic visit today':a.day<1?'Last visit Mon 28 Sep':'Next visit Thu 1 Oct',today:a.day===1,att:a.doc,dx,allergies:i%4===1?[ALG[i%ALG.length]]:[],risk:kid?'Low':i%3?'Low':'Moderate',code:'—'};
      PATIENTS.push(p);
    }
    a.pid=p.id;
  });
})();

/* Prescriptions (shared by the Medications page, patient records and the visit drawer) */
const RX=[['p1','Furosemide 40 mg IV every 12h','marsh','Active',''],['p1','Lisinopril 5 mg PO daily','marsh','On Hold','Potassium 5.3 mmol/L — review ACE inhibitor'],['p3','Ketorolac 15 mg IV every 6h','marsh','Pending Verification','Patient allergic to aspirin — NSAID cross-reactivity'],['p2','Piperacillin-tazobactam 4.5 g IV every 6h','soto','Active',''],['p5','Clopidogrel 75 mg PO daily','lindqvist','Active',''],['p6','Metformin 500 mg PO twice daily','marsh','Discontinued','Stopped: acute kidney injury'],['p7','Cefazolin 2 g IV every 8h','soto','Pending Verification','']].map(([pid,order,doc,status,warn])=>({pid,order,doc,status,warn}));
/* Outpatient formulary for the prescribing form */
const FORMULARY=[
  {drug:'Ibuprofen',list:18.4,generic:4.2,dose:'400 mg',route:'PO',freq:'Every 8h as needed',days:7,cls:'NSAID',note:'Take with food.'},
  {drug:'Naproxen',list:24.0,generic:6.1,dose:'500 mg',route:'PO',freq:'Twice daily',days:10,cls:'NSAID',note:'Take with food.'},
  {drug:'Cyclobenzaprine',list:32.5,generic:7.8,dose:'5 mg',route:'PO',freq:'At bedtime',days:7,cls:'Muscle relaxant',note:'May cause drowsiness. Do not drive.'},
  {drug:'Amoxicillin',list:21.0,generic:5.5,dose:'500 mg',route:'PO',freq:'Three times daily',days:7,cls:'Penicillin',note:'Finish the full course.'},
  {drug:'Lisinopril',list:28.0,generic:4.0,dose:'10 mg',route:'PO',freq:'Once daily',days:30,cls:'ACE inhibitor',note:'Check blood pressure weekly.'},
  {drug:'Metformin',list:26.0,generic:4.0,dose:'500 mg',route:'PO',freq:'Twice daily with meals',days:30,cls:'Biguanide',note:'Take with breakfast and dinner.'},
  {drug:'Atorvastatin',list:96.0,generic:9.8,dose:'20 mg',route:'PO',freq:'Nightly',days:30,cls:'Statin',note:''},
  {drug:'Sertraline',list:78.0,generic:8.6,dose:'50 mg',route:'PO',freq:'Once daily',days:30,cls:'SSRI',note:'Takes 2–4 weeks to work fully.'},
  {drug:'Salbutamol inhaler',list:64.0,generic:0,dose:'100 mcg, 2 puffs',route:'Inhaled',freq:'Every 4–6h as needed',days:30,cls:'Bronchodilator',note:''},
  {drug:'Acetaminophen',list:9.0,generic:3.2,dose:'500 mg',route:'PO',freq:'Every 6h as needed',days:5,cls:'Analgesic',note:'Max 4 g per day.'}
];
/* Allergy → drug classes it rules out */
const CROSS={Penicillin:['Penicillin'],'Ibuprofen':['NSAID'],'Aspirin':['NSAID'],'ACE inhibitors':['ACE inhibitor'],'Sulfa drugs':[]};

/* Admissions pipeline */
const ADMISSIONS=[
  {id:'ad1',name:'Samuel Adeyemi',age:45,sex:'M',dx:'Chest pain, rule out ACS',from:'Emergency',unit:'Step-Down',stage:'pending',since:1.2,doc:'soto',pri:'Urgent'},
  {id:'ad2',name:'Beatrice Lang',age:77,sex:'F',dx:'Community-acquired pneumonia',from:'Emergency',unit:'5 East',stage:'bed',since:3.8,doc:'marsh',pri:'Urgent'},
  {id:'ad3',name:'Carlos Vega',age:59,sex:'M',dx:'Diabetic foot infection',from:'Emergency',unit:'4 West',stage:'bed',since:2.6,doc:'marsh',pri:'Routine'},
  {id:'ad4',name:'Irene Walsh',age:68,sex:'F',dx:'Elective hip replacement',from:'Surgery',unit:'Orthopedics',stage:'bed',since:0.7,doc:'marsh',pri:'Elective'},
  {id:'ad5',name:'Aisha Karimi',age:8,sex:'F',dx:'Asthma exacerbation',from:'Emergency',unit:'Pediatrics',stage:'pending',since:0.5,doc:'adler',pri:'Urgent'},
  {id:'ad6',name:'Daniel Okoye',age:54,sex:'M',dx:'Sepsis, pneumonia',from:'ICU',unit:'Step-Down',stage:'transfer',since:1.5,doc:'soto',pri:'Routine',bed:'ICU · Bed 07'},
  {id:'ad7',name:'Margaret Hollis',age:78,sex:'F',dx:'Heart failure',from:'4 West',unit:'Home',stage:'discharge',since:2.1,doc:'marsh',bed:'4 West · 412A',checks:[1,1,0,0]},
  {id:'ad8',name:'Kevin Tran',age:41,sex:'M',dx:'Cellulitis',from:'5 East',unit:'Home',stage:'discharge',since:0.8,doc:'soto',bed:'5 East · 511A',checks:[1,1,1,0]},
  {id:'ad9',name:'Lucía Fernández',age:29,sex:'F',dx:'Post C-section',from:'L&D',unit:'Home',stage:'discharge',since:0.3,doc:'cole',bed:'L&D · Room 4',checks:[1,0,0,0]},
  {id:'ad10',name:'Marcus Reid',age:61,sex:'M',dx:'NSTEMI',from:'Emergency',unit:'Step-Down',stage:'admitted',since:0,doc:'lindqvist',bed:'Step-Down · 03'},
  {id:'ad11',name:'William Carter',age:70,sex:'M',dx:'Acute kidney injury',from:'Emergency',unit:'4 West',stage:'admitted',since:0,doc:'marsh',bed:'4 West · 409A'}
];
const FREE_BEDS={'4 West':['410B','415A','418B'],'5 East':['503A','514B'],'Step-Down':['07'],'Orthopedics':['O-12','O-15'],'Pediatrics':['P-04','P-09'],'ICU':[]};

/* Diagnostic orders */
const ORDERS=[
  {id:'LAB-88213',kind:'lab',test:'Basic Metabolic Panel',p:'p1',pri:'Routine',st:'resulted',ordered:6.0,tat:95,by:'marsh',flag:'abn',res:[['Sodium','134','mmol/L','135–145','L'],['Potassium','5.3','mmol/L','3.5–5.1','H'],['Creatinine','1.9','mg/dL','0.6–1.2','H'],['BUN','38','mg/dL','7–20','H'],['Glucose','112','mg/dL','70–99','H']]},
  {id:'LAB-88240',kind:'lab',test:'Lactate',p:'p2',pri:'STAT',st:'resulted',ordered:9.6,tat:22,by:'soto',flag:'crit',res:[['Lactate','4.1','mmol/L','0.5–2.2','C']]},
  {id:'LAB-88241',kind:'lab',test:'Blood Cultures ×2',p:'p2',pri:'STAT',st:'progress',ordered:9.6,by:'soto'},
  {id:'LAB-88252',kind:'lab',test:'Troponin I (serial)',p:'p9',pri:'STAT',st:'resulted',ordered:9.9,tat:38,by:'soto',flag:'crit',res:[['Troponin I · 0h','0.08','ng/mL','< 0.04','H'],['Troponin I · 3h','0.31','ng/mL','< 0.04','C']]},
  {id:'LAB-88230',kind:'lab',test:'Complete Blood Count',p:'p3',pri:'Routine',st:'resulted',ordered:6.0,tat:71,by:'marsh',flag:'abn',res:[['WBC','13.8','×10⁹/L','4.0–11.0','H'],['Hemoglobin','13.1','g/dL','13.5–17.5','L'],['Platelets','245','×10⁹/L','150–400','']]},
  {id:'LAB-88261',kind:'lab',test:'HbA1c',p:'p13',pri:'Routine',st:'resulted',ordered:8.1,tat:120,by:'menon',flag:'abn',res:[['HbA1c','8.4','%','< 5.7','H']]},
  {id:'LAB-88270',kind:'lab',test:'Coagulation Panel',p:'p4',pri:'Routine',st:'collected',ordered:9.0,by:'marsh'},
  {id:'LAB-88274',kind:'lab',test:'Magnesium',p:'p1',pri:'Routine',st:'ordered',ordered:10.2,by:'marsh'},
  {id:'LAB-88276',kind:'lab',test:'Blood Gas, Arterial',p:'p3',pri:'Urgent',st:'collected',ordered:10.3,by:'marsh'},
  {id:'IMG-40418',kind:'img',test:'Chest X-Ray, 2 views',p:'p2',pri:'STAT',st:'resulted',ordered:8.2,tat:64,by:'soto',flag:'abn',report:'Right lower lobe consolidation consistent with pneumonia. No pleural effusion. Heart size normal.'},
  {id:'IMG-40421',kind:'img',test:'CT Head without Contrast',p:'p4',pri:'Urgent',st:'resulted',ordered:7.5,tat:88,by:'marsh',flag:'norm',report:'No acute intracranial abnormality. Age-related volume loss.'},
  {id:'IMG-40433',kind:'img',test:'Echocardiogram',p:'p1',pri:'Routine',st:'scheduled',ordered:7.0,by:'marsh',slot:'Today 1:30 PM'},
  {id:'IMG-40436',kind:'img',test:'CT Angiogram, Chest',p:'p9',pri:'STAT',st:'progress',ordered:10.1,by:'soto'},
  {id:'IMG-40440',kind:'img',test:'Ultrasound, Right Lower Limb',p:'p7',pri:'Routine',st:'scheduled',ordered:9.4,by:'soto',slot:'Today 2:15 PM'},
  {id:'IMG-40444',kind:'img',test:'MRI Breast, Bilateral',p:'p12',pri:'Routine',st:'ordered',ordered:10.0,by:'haddad'}
];

/* ---------- Family medicine (Dr. Marsh) ---------- */
const byName=n=>(PATIENTS.find(p=>p.name===n)||{}).id;
/* Homebound patients seen at home on Wed and Fri */
[['h1','Walter Brooks',88,'M',[['I50.32','Chronic diastolic heart failure'],['N18.4','Chronic kidney disease, stage 4']],[],'14 Alder Lane'],
 ['h2','Doris Klein',91,'F',[['F03.90','Dementia, unspecified'],['M81.0','Osteoporosis']],['Codeine'],'220 Mill Road, Apt 3B'],
 ['h3','Harold Jensen',79,'M',[['J44.9','COPD'],['E11.9','Type 2 diabetes']],[],'7 Birch Court'],
 ['h4','Mabel Ortiz',85,'F',[['L89.153','Pressure ulcer of sacral region, stage 3'],['I10','Hypertension']],['Latex'],'51 Harbor Street'],
 ['h5','Frank Doyle',83,'M',[['C61','Prostate cancer · palliative care']],['Morphine'],'9 Quarry Hill']
].forEach(([id,name,age,sex,dx,allergies,addr],i)=>PATIENTS.push({id,name,mrn:'CG-0'+(98200+i*41),age,sex,dob:`${String(3+i*5).padStart(2,'0')} ${['Feb','May','Jul','Sep','Dec'][i]} ${2026-age}`,status:'Outpatient',loc:'Home visits',addr,att:'marsh',dx,allergies,risk:'High',code:'DNR',today:false,homebound:true}));
/* Chronic patients past their check-up interval (last seen before this demo's weeks) */
[['c1','Gloria Mendez',69,'F',[['E11.9','Type 2 diabetes']],'14 Apr',3,5.5],['c2','Bernard Cole',74,'M',[['I10','Hypertension'],['N18.3','Chronic kidney disease, stage 3']],'2 Mar',6,7],
 ['c3','Yuki Tanaka',58,'F',[['E78.5','Hyperlipidemia']],'20 Jan',6,8.3],['c4','Samuel Price',66,'M',[['J44.9','COPD']],'5 May',3,4.8],['c5','Irene Novak',61,'F',[['I10','Hypertension']],'18 Feb',6,7.4]
].forEach(([id,name,age,sex,dx,last,every,ago],i)=>PATIENTS.push({id,name,mrn:'CG-0'+(97100+i*53),age,sex,dob:`${String(4+i*6).padStart(2,'0')} ${['Jan','Apr','Jun','Aug','Nov'][i]} ${2026-age}`,status:'Outpatient',loc:'Registered patient',att:'marsh',dx,allergies:i===1?['ACE inhibitors']:[],risk:'Moderate',code:'—',today:false,lastSeen:last+' 2026',checkEvery:every,monthsAgo:ago}));
const pw=PATIENTS.find(p=>p.id==='p14'); pw.addr='38 Elm Street'; pw.homebound=true; pw.today=false;
/* day: -5 = Wed 23, -3 = Fri 25, 0 = Mon 28, 1 = today, 2 = Wed 30, 3 = Thu 1, 4 = Fri 2 */
/* w = week offset from this week (Mon 28 Sep), day = 0 Mon … 4 Fri. Today is w 0, day 1. */
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], WDL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MOL=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dayLabel(w,day,long){ w=w||0; if(!w&&day===1&&!long) return 'Today'; const dt=new Date(2026,8,28+w*7+day); return long?`${WDL[dt.getDay()]} ${dt.getDate()} ${MOL[dt.getMonth()]}`:`${WD[dt.getDay()]} ${dt.getDate()} ${MO[dt.getMonth()]}`; }
function hvReqs(w,day){ if(day>4||w*7+day>1) return []; /* no requests from the future */
  let seed=777+(w+30)*53+day*11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; }; for(let i=0;i<5;i++) rnd();
  const P=['Medication questions','Symptom check','Test results explained','Prescription renewal','Care plan questions'], V=['Wound care','Post-discharge check','Palliative care','Fall or mobility','Vaccination at home'];
  const n=1+Math.floor(rnd()*3); return Array.from({length:n},()=>rnd()<.62?['phone',P[Math.floor(rnd()*P.length)]]:['visit',V[Math.floor(rnd()*V.length)]]); }
function dayKey(w,day){ const dt=new Date(2026,8,28+(w||0)*7+day); return `${dt.getDate()} ${MO[dt.getMonth()]}`; }
function weekRange(w){ const a=new Date(2026,8,28+w*7), b=new Date(2026,8,28+w*7+4), f=x=>`${x.getDate()} ${MO[x.getMonth()]}`; return `${f(a)} – ${f(b)} 2026`; }
const DAYNAME=new Proxy({}, {get:(_,k)=>dayLabel(0,+k)});
const HOMEVISITS=[
  ['hv1','p14',2,9,9.75,'Post-discharge check · pneumonia','2.4 mi','Discharged 22 Sep. Check oxygen levels and inhaler technique.',[30,62]],
  ['hv2','h1',2,10.25,11,'Heart failure review · weight and fluids','3.1 mi','Daughter is there after 10 AM.',[58,30]],
  ['hv3','h2',2,11.5,12.25,'Dementia care review with family','1.8 mi','Buzzer 3B. Carer: Ana.',[78,48]],
  ['hv4','h4',2,13.5,14.25,'Wound care · sacral ulcer','4.0 mi','Bring dressing kit. Community nurse joins.',[66,80]],
  ['hv5','h3',4,9,9.75,'Diabetes and COPD review','2.2 mi','Recheck inhaler technique.',[36,24]],
  ['hv6','h5',4,10.5,11.5,'Palliative care · pain review','5.6 mi','Morphine allergy — on oxycodone.',[74,20]],
  ['hv7','h2',4,13,13.5,'Flu vaccination at home','1.8 mi','',[78,48]],
  ['hv8','h1',-3,9,9.75,'Heart failure review','3.1 mi','Weight up 1.2 kg. Furosemide increased.',[58,30],'done'],
  ['hv9','h4',-3,10.5,11.25,'Wound care · sacral ulcer','4.0 mi','Wound smaller. Continue dressing plan.',[66,80],'done'],
  ['hv10','h5',-5,10,11,'Palliative care · pain review','5.6 mi','Pain controlled. Family coping well.',[74,20],'done']
].map(([id,pid,day,s,e,reason,dist,note,xy,st])=>({id,pid,w:day<0?-1:0,day:day===-3?4:day===-5?2:day,s,e,reason,dist,note,xy,st:st||'sched'}));
/* Outpatient lab and imaging orders by Dr. Marsh */
ORDERS.push(
  {id:'LAB-88190',kind:'lab',test:'HbA1c',p:byName('Amara Nwosu'),pri:'Routine',st:'resulted',ordered:8.0,tat:140,by:'marsh',flag:'abn',res:[['HbA1c','8.9','%','< 5.7','H']]},
  {id:'LAB-88195',kind:'lab',test:'Lipid Panel',p:byName('Grace Whitman'),pri:'Routine',st:'resulted',ordered:7.6,tat:150,by:'marsh',flag:'abn',res:[['Total cholesterol','262','mg/dL','< 200','H'],['LDL','172','mg/dL','< 100','H'],['HDL','41','mg/dL','> 40',''],['Triglycerides','210','mg/dL','< 150','H']]},
  {id:'LAB-88202',kind:'lab',test:'TSH',p:byName('Elena Popescu'),pri:'Routine',st:'resulted',ordered:7.2,tat:130,by:'marsh',flag:'norm',res:[['TSH','2.1','mIU/L','0.4–4.0','']]},
  {id:'LAB-88281',kind:'lab',test:'Basic Metabolic Panel',p:byName('Ibrahim Saleh'),pri:'Routine',st:'ordered',ordered:10.1,by:'marsh'},
  {id:'IMG-40450',kind:'img',test:'X-Ray, Lumbar Spine',p:byName('Daniel Kim'),pri:'Routine',st:'ordered',ordered:10.5,by:'marsh'},
  {id:'IMG-40452',kind:'img',test:'Screening Mammogram',p:byName('Ruth Castillo'),pri:'Routine',st:'scheduled',ordered:9.0,by:'marsh',slot:'Thu 1 Oct 9:00 AM'}
);

/* Neighbouring weeks for Dr. Marsh: last week (done) and next week (booked), same patients */
(function(){
  const pool=PATIENTS.filter(p=>p.att==='marsh'&&p.status==='Outpatient'&&!p.homebound&&!p.checkEvery);
  const R=['Follow-up','Blood pressure review','Lab results','Diabetes follow-up','Annual physical','Medication review','Cholesterol follow-up','Cough'];
  const T=[8,8.5,9,9.5,10,11,13,13.5,14,15]; let k=0;
  [-1,1].forEach(w=>[0,1,3].forEach(day=>T.forEach((s,j)=>{ if((j*3+day+w+5)%4===0) return; const p=pool[(k*7)%pool.length]; k++;
    APPTS.push({id:'g'+APPTS.length,doc:'marsh',w,day,s,e:s+.5,name:p.name,pid:p.id,reason:R[(k+j)%R.length],st:w<0?(k%11===0?'noshow':'done'):'sched',arrived:null}); })));
  const xy=id=>(HOMEVISITS.find(v=>v.pid===id)||{xy:[50,50]}).xy;
  [['h1',2,9,'Heart failure review'],['h4',2,10.25,'Wound care · sacral ulcer'],['h2',4,9,'Dementia care review'],['h5',4,10.5,'Palliative care · pain review']].forEach(([pid,day,s,reason],i)=>
    HOMEVISITS.push({id:'hvn'+i,pid,w:1,day,s,e:s+.75,reason,dist:(HOMEVISITS.find(v=>v.pid===pid&&v.dist!=='—')||{dist:'2.0 mi'}).dist,note:'',xy:xy(pid),st:'sched'}));
})();
/* Home visit requests in September: closed by phone or visited in person, by reason */
const HVREQ={phone:[['Medication questions',7],['Symptom check',6],['Test results explained',4],['Prescription renewal',3],['Care plan questions',2]],
  visit:[['Wound care',5],['Post-discharge check',3],['Palliative care',3],['Fall or mobility',2],['Vaccination at home',1]]};

/* Any other week (Aug – Nov 2026) is generated on first view: past weeks done, future weeks booked, thinning out further ahead */
const madeWeeks=new Set([-1,0,1]);
function ensureWeek(w){
  if(madeWeeks.has(w)||w<-8||w>9) return; madeWeeks.add(w);
  let seed=48271+(w+20)*7919; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; }; for(let i=0;i<8;i++) rnd();
  const pool=PATIENTS.filter(p=>p.att==='marsh'&&p.status==='Outpatient'&&!p.homebound&&!p.checkEvery);
  const R=['Follow-up','Blood pressure review','Lab results','Diabetes follow-up','Annual physical','Medication review','Cholesterol follow-up','Cough','Back pain','Vaccination'];
  const T=[8,8.5,9,9.5,10,10.5,11,13,13.5,14,14.5,15], fill=w<0?.8:w===2?.7:w===3?.5:.3;
  [0,1,3].forEach(day=>{ const used=new Set(APPTS.filter(a=>a.w===w&&a.day===day).map(a=>a.pid)); T.forEach(s=>{ if(rnd()>fill) return; let k=Math.floor(rnd()*pool.length); for(let t=0;t<pool.length&&used.has(pool[k].id);t++) k=(k+1)%pool.length; const p=pool[k]; used.add(p.id);
    APPTS.push({id:'g'+APPTS.length,doc:'marsh',w,day,s,e:s+.5,name:p.name,pid:p.id,reason:R[Math.floor(rnd()*R.length)],st:w<0?(rnd()<.08?'noshow':rnd()<.05?'cancel':'done'):'sched',arrived:null}); }); });
  if(w<0){ const RXBY={'Blood pressure review':'Lisinopril','Diabetes follow-up':'Metformin','Cholesterol follow-up':'Atorvastatin','Cough':'Salbutamol inhaler','Back pain':'Naproxen','Medication review':'Atorvastatin','Follow-up':'Acetaminophen','Lab results':'Metformin','Annual physical':'Atorvastatin','Vaccination':null};
    APPTS.filter(a=>a.doc==='marsh'&&a.w===w&&a.st==='done').forEach(a=>{ const drug=RXBY[a.reason]; if(!drug||rnd()>.45) return; const f=FORMULARY.find(x=>x.drug===drug), p=PATIENTS.find(x=>x.id===a.pid);
      ORX.push({id:'RX-'+(51000+ORX.length*7),date:dayKey(w,a.day),pid:p.id,f,qty:f.days*(f.freq.includes('Twice')?2:1),status:'Picked Up',price:priceOf(f,p),refills:1}); }); }
  const H=PATIENTS.filter(p=>p.homebound), reasons=['Heart failure review','Wound care','Dementia care review','Palliative care · pain review','Post-discharge check','Medication review'];
  [2,4].forEach(day=>[9,10.5,13].forEach((s,k)=>{ if(w>2&&k>1) return; if(rnd()<.25) return; const p=H[Math.floor(rnd()*H.length)];
    const known=HOMEVISITS.find(v=>v.pid===p.id&&v.dist!=='—')||{xy:[40+Math.floor(rnd()*40),20+Math.floor(rnd()*60)],dist:(1.5+rnd()*4).toFixed(1)+' mi'};
    HOMEVISITS.push({id:'hvg'+HOMEVISITS.length,pid:p.id,w,day,s,e:s+.75,reason:reasons[Math.floor(rnd()*reasons.length)],dist:known.dist,note:w<0?'Visit note filed.':'',xy:known.xy,st:w<0?'done':'sched'}); }));
}

/* Other clinicians' days (for the front desk), generated on first view */
const madeDays=new Set(['0_1']);
function ensureDay(w,day){
  const key=w+'_'+day; ensureWeek(w); if(madeDays.has(key)) return; madeDays.add(key);
  if(day>4) return;
  let seed=91+(w+20)*131+day*17; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; }; for(let i=0;i<8;i++) rnd();
  const past=w*7+day<1, first=['Alice','Ben','Clara','Dev','Elif','Farah','Gus','Hana','Ivan','Jade','Kofi','Lena','Marta','Nils','Omar','Pia','Quinn','Rui','Sana','Theo'], last=['Adams','Brook','Chen','Diaz','Evans','Ford','Gray','Hayes','Ito','Jonas','Khan','Lopez','Moss','Nash','Olsen','Park','Reyes','Stone','Tate','Vogel'];
  const R={lindqvist:['Follow-up','Echo review','AF management','Stress test','Pacemaker check'],menon:['Diabetes review','Thyroid follow-up','Insulin titration','Osteoporosis'],haddad:['Treatment review','Scan results','New referral','Follow-up'],adler:['Well child visit','Vaccination','Ear pain','Fever','Asthma review']};
  Object.keys(R).forEach(doc=>{ const len=doc==='adler'?.25:.5; for(let t=8;t<16;t+=len){ if(t>=12&&t<13) continue; if(rnd()>.55) continue;
    const name=first[Math.floor(rnd()*20)]+' '+last[Math.floor(rnd()*20)];
    const age=doc==='adler'?1+Math.floor(rnd()*14):30+Math.floor(rnd()*50);
    const p={id:'r'+PATIENTS.length,name,mrn:'CG-'+(120000+PATIENTS.length*13),age,sex:rnd()<.5?'F':'M',dob:`${1+Math.floor(rnd()*27)} ${['Jan','Mar','May','Jul','Sep','Nov'][Math.floor(rnd()*6)]} ${2026-age}`,status:'Outpatient',loc:'Clinic visit',att:doc,dx:[['Z00.00','Outpatient visit']],allergies:[],risk:'Low',code:'—',today:false};
    PATIENTS.push(p);
    APPTS.push({id:'d'+APPTS.length,doc,w,day,s:t,e:t+len,name,pid:p.id,reason:R[doc][Math.floor(rnd()*R[doc].length)],st:past?(rnd()<.07?'noshow':'done'):'sched',arrived:null}); } });
}
/* Clinic drivers for home-visit days (fictional) */
const DRIVERS={2:{name:'Luis Mendoza',phone:'+1 555 0142',car:'Toyota Corolla Hybrid',color:'White',plate:'CGH 214',leave:'8:40 AM'},4:{name:'Anna Kowal',phone:'+1 555 0187',car:'Ford Transit Connect',color:'Silver',plate:'CGH 208',leave:'8:40 AM',note:'Wheelchair accessible'}};
/* Prescription pricing: generic substitution, insurance, discount programs */
const SELFPAY=['Lucas Reyes','Tomás Silva','Kenji Mori','Samir Nair'];
function planOf(p){ return SELFPAY.includes(p.name)?{name:'Self-pay',cov:0}:p.age>=65?{name:'Medicare Part D',cov:.75}:{name:'Corvina Care Plan',cov:.6}; }
function priceOf(f,p){
  const plan=planOf(p), steps=[], list=f.list; let cost=list;
  if(f.generic){ steps.push(['Generic substitution',list-f.generic]); cost=f.generic; }
  else { steps.push(['Manufacturer coupon',20]); cost=list-20; }
  if(plan.cov){ const c=cost*plan.cov; steps.push([`${plan.name} covers ${Math.round(plan.cov*100)}%`,c]); cost-=c; }
  else { const c=cost*.3; steps.push(['Clinic discount program −30%',c]); cost-=c; }
  return {plan:plan.name,list,steps,pays:Math.max(0,+cost.toFixed(2)),saved:+(list-cost).toFixed(2),pct:Math.round((list-cost)/list*100)};
}
const ORX=[
  ['29 Sep','Julia Rossi','Atorvastatin',30,'Sent'],['29 Sep','Amara Nwosu','Metformin',60,'Ready for Pickup'],['29 Sep','Lucas Reyes','Amoxicillin',21,'Picked Up'],['29 Sep','Helen Osei','Atorvastatin',30,'Ready for Pickup'],
  ['28 Sep','Kenji Mori','Salbutamol inhaler',1,'Picked Up'],['28 Sep','Maria Santos','Metformin',60,'Picked Up'],['28 Sep','Tomás Silva','Naproxen',20,'Picked Up'],['28 Sep','Fatima Rahman','Sertraline',30,'Picked Up'],
  ['25 Sep','Walter Brooks','Atorvastatin',30,'Refill Requested'],['25 Sep','Harold Jensen','Metformin',60,'Refill Requested'],['24 Sep','Doris Klein','Acetaminophen',60,'Picked Up'],['22 Sep','George Whitaker','Salbutamol inhaler',1,'Refill Requested'],
  ['21 Sep','Peter Grant','Atorvastatin',30,'Picked Up'],['18 Sep','Elena Popescu','Sertraline',30,'Picked Up'],['15 Sep','Frank Doyle','Acetaminophen',60,'Picked Up'],['12 Sep','Anna Novak','Ibuprofen',20,'Picked Up']
].map(([date,name,drug,qty,status],i)=>{ const f=FORMULARY.find(x=>x.drug===drug), p=PATIENTS.find(x=>x.name===name); return {id:'RX-'+(52400-i*7),date,pid:p.id,f,qty,status,price:priceOf(f,p),refills:status==='Refill Requested'?0:2}; });


/* Medication administration record for 4 West patients. times = scheduled hours. */
const MAR={
  p1:[
    {id:'m1',drug:'Furosemide',dose:'40 mg',route:'IV',freq:'Every 12h',times:[6,18],given:{6:['6:05','JO']}},
    {id:'m2',drug:'Metoprolol Succinate',dose:'25 mg',route:'PO',freq:'Daily',times:[8],given:{8:['8:12','JO']}},
    {id:'m3',drug:'Lisinopril',dose:'5 mg',route:'PO',freq:'Daily',times:[10],held:{10:'Held: potassium 5.3 — awaiting prescriber review'}},
    {id:'m4',drug:'Enoxaparin',dose:'40 mg',route:'SC',freq:'Daily',times:[10]},
    {id:'m5',drug:'Atorvastatin',dose:'40 mg',route:'PO',freq:'Nightly',times:[22]},
    {id:'m6',drug:'Acetaminophen',dose:'650 mg',route:'PO',freq:'Every 6h as needed · pain',prn:true,last:'4:20'}
  ],
  p4:[
    {id:'m7',drug:'Acetaminophen',dose:'1 g',route:'PO',freq:'Every 6h',times:[6,12,18,24],given:{6:['6:20','JO']}},
    {id:'m8',drug:'Donepezil',dose:'10 mg',route:'PO',freq:'Nightly',times:[22]},
    {id:'m9',drug:'Enoxaparin',dose:'40 mg',route:'SC',freq:'Daily',times:[9]},
    {id:'m10',drug:'Oxycodone',dose:'5 mg',route:'PO',freq:'Every 4h as needed · severe pain',prn:true,last:'2:10'}
  ],
  p6:[
    {id:'m11',drug:'Insulin Lispro',dose:'Sliding scale',route:'SC',freq:'Before meals',times:[8,12,17],given:{8:['7:55','MA']}},
    {id:'m12',drug:'Insulin Glargine',dose:'18 units',route:'SC',freq:'Nightly',times:[21]},
    {id:'m13',drug:'Sodium Chloride 0.9%',dose:'100 mL/h',route:'IV',freq:'Continuous',times:[8,16],given:{8:['8:00','MA']}},
    {id:'m14',drug:'Pantoprazole',dose:'40 mg',route:'PO',freq:'Daily',times:[10]}
  ]
};

const STAFF=[
  ['Dr. Elena Marsh','Physician','Internal Medicine','Day','on',14,16],['Dr. Rafael Soto','Physician','Emergency','Day','on',9,12],['Dr. Anika Lindqvist','Physician','Cardiology','Day','on',11,14],['Dr. Ravi Menon','Physician','Endocrinology','Day','on',6,12],['Dr. Iman Haddad','Physician','Oncology','Day','on',5,12],['Dr. Ben Adler','Physician','Pediatrics','Day','on',8,14],['Dr. Hannah Cole','Physician','Obstetrics','Night','off',0,10],['Dr. Omar Siddiqui','Physician','Critical Care','Day','leave',0,8],
  ['Jordan Okafor, RN','Nurse','4 West','Day','on',4,5],['Mia Alvarez, RN','Nurse','4 West','Day','on',6,5],['Chris Brandt, RN','Nurse','5 East','Day','on',5,5],['Leah Novak, RN','Nurse','ICU','Day','on',2,2],['Tom Haddock, RN','Nurse','ICU','Day','on',3,2],['Grace Mensah, RN','Nurse','Step-Down','Day','on',4,4],['Priya Shah, RN','Nurse','Emergency','Day','on',4,4],['Owen Fitzgerald, RN','Nurse','4 West','Night','off',0,5],['Nadia Petrova, RN','Nurse','Pediatrics','Day','leave',0,4],
  ['Luis Ortega','Allied Health','Physical Therapy','Day','on',7,10],['Emily Watson','Allied Health','Pharmacy','Day','on',0,0],['Kwame Asante','Allied Health','Radiology','Day','on',0,0],['Maya Chen','Admin','Front Desk','Day','on',0,0],['Sam Ruiz','Admin','Administration','Day','on',0,0]
].map(([name,role,dept,shift,st,load,cap])=>({name,role,dept,shift,st,load,cap}));

const DEPTS=[
  ['Emergency','Ground',32,29,'Priya Shah, RN'],['ICU','2nd floor',24,23,'Leah Novak, RN'],['Step-Down','2nd floor',32,31,'Grace Mensah, RN'],['4 West · Medicine','4th floor',36,33,'Jordan Okafor, RN'],['5 East · Medicine','5th floor',36,34,'Chris Brandt, RN'],['Orthopedics','3rd floor',28,22,'Aaron Blake, RN'],['Oncology','6th floor',28,25,'Ines Moreau, RN'],['Cardiology','3rd floor',30,27,'Ruth Adebayo, RN'],['Pediatrics','1st floor',24,16,'Nadia Petrova, RN'],['Labor & Delivery','1st floor',18,11,'Sara Lindholm, RN']
].map(([name,floor,beds,occ,lead])=>({name,floor,beds,occ,lead}));

return {hvReqs,DRIVERS,ensureDay,ensureWeek,HVREQ,RX,FORMULARY,CROSS,HOMEVISITS,DAYNAME,dayLabel,dayKey,weekRange,ORX,priceOf,planOf,NOW,FACILITIES,ROLES,DOCTORS,doc,PATIENTS,pat,APPTS,ADMISSIONS,FREE_BEDS,ORDERS,MAR,STAFF,DEPTS};
})();
