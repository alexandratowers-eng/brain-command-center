// Brem MCAT course schedule (reference content). Personal status lives in localStorage (D.classLog).
// Source: "2026 Fall Foundations + MCAT Prep Course — Schedule & Assignments Due" PDF + Cohort 1 "See Full Schedule" (Oct 2026).
// Fields: id, course ('found'|'c1'), wk, num, date (YYYY-MM-DD), time, topic, subj, pre (Xperiencify pre-class), post (Xperiencify post-class), uw (UWorld set due)
window.BREM_CLASSES=[
  // ---- Foundations (Sep 17 – Oct 29) ----
  {id:'f0', course:'found',wk:'Pre',num:'Kickoff',date:'2026-09-17',time:'5:30–7 PM',topic:'Intro Session + Study Skills Workshop',subj:'other',pre:'Log into Xperiencify · Pre-Program Essentials',post:'',uw:'Activate UWorld account'},
  {id:'f1', course:'found',wk:1,num:1, date:'2026-09-21',time:'5:30–7 PM',topic:'CARS Essentials',subj:'cars',pre:'CARS Essentials',post:'',uw:''},
  {id:'f2', course:'found',wk:1,num:2, date:'2026-09-23',time:'5:30–7 PM',topic:'General Chemistry Essentials',subj:'cp',pre:'General Chemistry Essentials',post:'CARS Essentials',uw:'CARS Essentials Practice Set'},
  {id:'f3', course:'found',wk:1,num:3, date:'2026-09-24',time:'5:30–7 PM',topic:'Cell Biology Essentials',subj:'bb',pre:'Cell Biology Essentials',post:'General Chemistry Essentials',uw:'General Chemistry Essentials Practice Set'},
  {id:'f4', course:'found',wk:2,num:4, date:'2026-09-28',time:'5:30–7 PM',topic:'CARS 2',subj:'cars',pre:'CARS 2',post:'Cell Biology Essentials',uw:'Cell Biology Essentials Practice Set'},
  {id:'f5', course:'found',wk:2,num:5, date:'2026-09-30',time:'5:30–7 PM',topic:'Math Essentials',subj:'cp',pre:'Math Essentials',post:'CARS 2',uw:'CARS 2 Practice Set'},
  {id:'f6', course:'found',wk:2,num:6, date:'2026-10-01',time:'5:30–7 PM',topic:'Research Essentials + Statistics',subj:'other',pre:'Research Essentials + Statistics',post:'Math Essentials',uw:'Math Essentials Practice Set'},
  {id:'f7', course:'found',wk:3,num:7, date:'2026-10-05',time:'5:30–7 PM',topic:'CARS 3',subj:'cars',pre:'CARS 3',post:'Research Essentials + Statistics',uw:'Research Essentials + Statistics Practice Set'},
  {id:'f8', course:'found',wk:3,num:8, date:'2026-10-07',time:'5:30–7 PM',topic:'Organic Chemistry Essentials',subj:'cp',pre:'Organic Chemistry Essentials',post:'CARS 3',uw:'CARS 3 Practice Set'},
  {id:'f9', course:'found',wk:3,num:9, date:'2026-10-08',time:'5:30–7 PM',topic:'Psychology Essentials',subj:'ps',pre:'Psychology Essentials',post:'Organic Chemistry Essentials',uw:'Organic Chemistry Essentials Practice Set'},
  {id:'f10',course:'found',wk:4,num:10,date:'2026-10-12',time:'5:30–7 PM',topic:'CARS 4',subj:'cars',pre:'CARS 4',post:'Psychology Essentials',uw:'Psychology Essentials Practice Set'},
  {id:'f11',course:'found',wk:4,num:11,date:'2026-10-14',time:'5:30–7 PM',topic:'Math Skills for Science',subj:'cp',pre:'Math Skills for Science',post:'CARS 4',uw:'CARS 4 Practice Set'},
  {id:'f12',course:'found',wk:4,num:12,date:'2026-10-15',time:'5:30–7 PM',topic:'Biological Systems Foundations Part 1',subj:'bb',pre:'Biological Systems Foundations Part 1',post:'Math Skills for Science',uw:'Math Skills for Science Practice Set'},
  {id:'f13',course:'found',wk:5,num:13,date:'2026-10-19',time:'5:30–7 PM',topic:'CARS 5',subj:'cars',pre:'CARS 5',post:'Biological Systems Foundations Part 1',uw:'Biological Systems Foundations Part 1 Practice Set'},
  {id:'f14',course:'found',wk:5,num:14,date:'2026-10-21',time:'5:30–7 PM',topic:'Physics Foundations',subj:'cp',pre:'Physics Foundations',post:'CARS 5',uw:'CARS 5 Practice Set'},
  {id:'f15',course:'found',wk:5,num:15,date:'2026-10-22',time:'5:30–7 PM',topic:'Cell Reproduction + Evolution Foundations',subj:'bb',pre:'Cell Reproduction + Evolution Foundations',post:'Physics Foundations',uw:'Physics Foundations Practice Set'},
  {id:'f16',course:'found',wk:6,num:16,date:'2026-10-26',time:'5:30–7 PM',topic:'CARS 6',subj:'cars',pre:'CARS 6',post:'Cell Reproduction + Evolution Foundations',uw:'Cell Reproduction + Evolution Foundations Practice Set'},
  {id:'f17',course:'found',wk:6,num:17,date:'2026-10-28',time:'5:30–7 PM',topic:'Sociology Foundations',subj:'ps',pre:'Sociology Foundations',post:'CARS 6',uw:'CARS 6 Practice Set'},
  {id:'f18',course:'found',wk:6,num:18,date:'2026-10-29',time:'6:30–8 PM',topic:'Biological Systems Foundations Part 2',subj:'bb',pre:'Biological Systems Foundations Part 2',post:'Sociology Foundations',uw:'Sociology Foundations Practice Set'},
  // ---- Cohort 1 main course (Oct 26 – Dec 10) ----
  {id:'c0', course:'c1',wk:1,num:'Welcome',date:'2026-10-27',time:'5:00–6:30 PM',topic:'Welcome Session',subj:'other',pre:'',post:'',uw:''},
  {id:'c1', course:'c1',wk:1,num:'Kickoff',date:'2026-10-29',time:'5:00–6:30 PM',topic:'Kickoff Session',subj:'other',pre:'',post:'',uw:''},
  {id:'c2', course:'c1',wk:2,num:1, date:'2026-11-03',time:'5–8 PM',topic:'Physics and Building Study Habits',subj:'cp',pre:'',post:'',uw:''},
  {id:'c3', course:'c1',wk:2,num:2, date:'2026-11-05',time:'5–8 PM',topic:'CARS Skills, MCAT Timing, and Mental Fitness Training Level 1',subj:'cars',pre:'',post:'',uw:''},
  {id:'c4', course:'c1',wk:3,num:3, date:'2026-11-10',time:'5–8 PM',topic:'Organic Chemistry and Research Techniques Part 1',subj:'cp',pre:'',post:'',uw:''},
  {id:'c5', course:'c1',wk:3,num:4, date:'2026-11-12',time:'5–8 PM',topic:'Biochemistry and Research Techniques Part 2',subj:'bb',pre:'',post:'',uw:''},
  {id:'c6', course:'c1',wk:4,num:5, date:'2026-11-17',time:'5–8 PM',topic:'General Chemistry and Math Skills',subj:'cp',pre:'',post:'',uw:''},
  {id:'c7', course:'c1',wk:4,num:6, date:'2026-11-19',time:'5–8 PM',topic:'Psych/Soc and Mental Fitness Training Level 2',subj:'ps',pre:'',post:'',uw:''},
  {id:'c8', course:'c1',wk:6,num:7, date:'2026-12-01',time:'5–8 PM',topic:'Biology and Advanced CARS Skills',subj:'bb',pre:'',post:'',uw:''},
  {id:'c9', course:'c1',wk:6,num:8, date:'2026-12-03',time:'5–8 PM',topic:'Science Passage Strategies and Test Day Game Plan',subj:'other',pre:'',post:'',uw:''},
  {id:'c10',course:'c1',wk:7,num:9, date:'2026-12-08',time:'5–8 PM',topic:'Challenging Science Topics and Mental Fitness Training Level 3',subj:'cp',pre:'',post:'',uw:''},
  {id:'c11',course:'c1',wk:7,num:10,date:'2026-12-10',time:'5–8 PM',topic:'Final Topics, CARS Active Practice, and Preparing for Test Day',subj:'cars',pre:'',post:'',uw:''}
];
window.BREM_COURSES={found:{label:'Foundations',sub:'Sep 17 – Oct 29 · Mon/Wed/Thu 5:30–7 PM ET'},c1:{label:'Cohort 1',sub:'Oct 27 – Dec 10 · Tue/Thu 5–8 PM ET (Welcome + Kickoff 5–6:30)'}};
