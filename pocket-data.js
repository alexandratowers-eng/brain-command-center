/* pocket-data.js — content for the MCAT Pocket section.
   Sheets are rebuilt from Alex's own cheat sheets + running term lists.
   Block types: f = formula, tbl = table, tip = MCAT tip, warn = trap, n = note, h = subhead */

const POCKET_SHEETS = [
{
  id:'ph', title:'pH, Logs & Exponents', sub:'Chem', color:'teal', icon:'science',
  blocks:[
    {t:'f', k:'The core formula', v:'pH = −log[H⁺]\n[H⁺] = 10⁻ᵖᴴ'},
    {t:'h', v:'Powers of 10 — start from 1, NOT 10'},
    {t:'tbl', head:['Exponent','Value','Trick'], rows:[
      ['10³','1,000','3 zeros after 1'],
      ['10²','100','2 zeros after 1'],
      ['10¹','10','1 zero after 1'],
      ['10⁰','1','⬅ START HERE for negatives'],
      ['10⁻¹','0.1','Decimal 1 left of 1.0'],
      ['10⁻²','0.01','Decimal 2 left of 1.0'],
      ['10⁻³','0.001','Decimal 3 left of 1.0'],
      ['10⁻⁶','0.000001','Decimal 6 left of 1.0']
    ]},
    {t:'warn', v:"Don't start from 10. The negative exponent moves the decimal left starting from 1.0."},
    {t:'h', v:'pH ↔ [H⁺] quick reference'},
    {t:'tbl', head:['pH','[H⁺] (M)','Where'], rows:[
      ['0','1','Battery acid'],
      ['1','10⁻¹','Gastric acid'],
      ['2','10⁻²','Stomach (chyme)'],
      ['3','10⁻³','Vinegar'],
      ['5','10⁻⁵','Coffee'],
      ['6','10⁻⁶','Duodenum'],
      ['7','10⁻⁷','NEUTRAL — pure water'],
      ['10','10⁻¹⁰','Antacids'],
      ['14','10⁻¹⁴','Drain cleaner']
    ]},
    {t:'h', v:'"How many times more acidic?"'},
    {t:'n', v:'Subtract the two pH values. That difference is your exponent on 10.'},
    {t:'tbl', head:['ΔpH','Times more acidic'], rows:[
      ['1','10× '],['2','100×'],['3','1,000×'],['4','10,000×'],['5','100,000×']
    ]},
    {t:'n', v:'Stomach (pH 2) vs duodenum (pH 6) → Δ4 → 10,000× more acidic.'},
    {t:'f', k:'pOH rule', v:'pH + pOH = 14  (always, at 25°C)\npOH = −log[OH⁻]'},
    {t:'f', k:'Henderson-Hasselbalch', v:'pH = pKa + log([A⁻]/[HA])'},
    {t:'n', v:'At half-equivalence [A⁻] = [HA] → log(1) = 0 → pH = pKa.\nMore conjugate base → pH > pKa. More acid → pH < pKa.'},
    {t:'h', v:'pH from a non-integer [H⁺] (MCAT favorite)'},
    {t:'f', k:'The move', v:'pH = n − log(A)  when [H⁺] = A × 10⁻ⁿ'},
    {t:'tbl', head:['[H⁺]','n − log(A)','pH'], rows:[
      ['1 × 10⁻³','3 − 0','3.0'],
      ['2 × 10⁻³','3 − 0.3','2.7'],
      ['5 × 10⁻⁵','5 − 0.7','4.3'],
      ['3 × 10⁻⁸','8 − 0.5','7.5']
    ]}
  ],
  cards:[
    {q:'pH = ?', a:'pH = −log[H⁺]'},
    {q:'[H⁺] = 10⁻⁵. pH?', a:'5'},
    {q:'pH 3 vs pH 7 — how many times more acidic?', a:'Δ = 4 → 10⁴ = 10,000× more acidic'},
    {q:'pH + pOH = ?', a:'14 (at 25°C)'},
    {q:'At the half-equivalence point, pH equals what?', a:'pH = pKa (because [A⁻] = [HA], so log(1) = 0)'},
    {q:'[H⁺] = 2 × 10⁻³. pH?', a:'2.7  →  3 − log(2) = 3 − 0.3'},
    {q:'[H⁺] = 5 × 10⁻⁵. pH?', a:'4.3  →  5 − log(5) = 5 − 0.7'},
    {q:'Henderson-Hasselbalch equation?', a:'pH = pKa + log([A⁻]/[HA])'},
    {q:'10⁻³ equals what decimal?', a:'0.001 — start from 1.0 and move the decimal 3 left'}
  ]
},
{
  id:'logs', title:'Log Rules & Values', sub:'Math', color:'blue', icon:'functions',
  blocks:[
    {t:'tbl', head:['Rule','Formula','Example'], rows:[
      ['Product','log(A×B) = logA + logB','log200 = log2 + 2 ≈ 2.3'],
      ['Quotient','log(A/B) = logA − logB','log50 = 2 − 0.3 = 1.7'],
      ['Power','log(Aⁿ) = n·logA','log(10³) = 3'],
      ['log 1','= 0','Always'],
      ['log 10','= 1','Always'],
      ['Negative log','−log(10⁻ˣ) = x','This IS pH']
    ]},
    {t:'h', v:'Log values to memorize (no calculator)'},
    {t:'tbl', head:['Value','log₁₀','How to remember'], rows:[
      ['log 1','0','10⁰ = 1'],
      ['log 2','0.3','"2 is 30% of the way to 10"'],
      ['log 3','0.48 ≈ 0.5','"3 is about halfway"'],
      ['log 4','0.6','log(2²) = 2 × 0.3'],
      ['log 5','0.7','log(10/2) = 1 − 0.3'],
      ['log 6','0.78 ≈ 0.8','log(2×3) = 0.3 + 0.5'],
      ['log 7','0.85','Just memorize — between 0.8 and 0.9'],
      ['log 8','0.9','log(2³) = 3 × 0.3'],
      ['log 9','0.95','log(3²) = 2 × 0.48'],
      ['log 10','1','10¹ = 10']
    ]},
    {t:'tip', v:'Master trick: memorize only log(2) = 0.3 and log(3) = 0.5. You can derive every other value from those two.'}
  ],
  cards:[
    {q:'log(2) = ?', a:'0.3'},
    {q:'log(3) = ?', a:'≈ 0.48, round to 0.5'},
    {q:'log(5) = ?', a:'0.7  →  log(10/2) = 1 − 0.3'},
    {q:'log(4) = ?', a:'0.6  →  log(2²) = 2 × 0.3'},
    {q:'log(8) = ?', a:'0.9  →  log(2³) = 3 × 0.3'},
    {q:'log(A × B) = ?', a:'log A + log B'},
    {q:'log(A / B) = ?', a:'log A − log B'},
    {q:'log(Aⁿ) = ?', a:'n × log A'},
    {q:'Which two log values unlock all the others?', a:'log(2) = 0.3 and log(3) = 0.5'}
  ]
},
{
  id:'trig', title:'Sin, Cos & Trig Pattern', sub:'Math', color:'blue', icon:'change_history',
  blocks:[
    {t:'f', k:'The √n / 2 pattern', v:'sin(θ) = √n / 2, where n goes 0, 1, 2, 3, 4'},
    {t:'tbl', head:['Angle','0°','30°','45°','60°','90°'], rows:[
      ['sin','0','0.5','0.7','0.87','1'],
      ['cos','1','0.87','0.7','0.5','0'],
      ['tan','0','0.58','1','1.73','undef']
    ]},
    {t:'tip', v:'For sin, n goes UP (0→1→2→3→4). For cos, n goes DOWN (4→3→2→1→0). They are mirrors.'},
    {t:'h', v:'Know cold'},
    {t:'n', v:'√2 ≈ 1.4 → √2/2 ≈ 0.7\n√3 ≈ 1.7 → √3/2 ≈ 0.87\nsin30 = cos60 = 0.5 (the easy one)\nsin45 = cos45 = 0.7 (the mirror)'},
    {t:'h', v:'SOH-CAH-TOA'},
    {t:'tbl', head:['Function','Stands for','Formula'], rows:[
      ['sin θ','SOH','Opposite / Hypotenuse'],
      ['cos θ','CAH','Adjacent / Hypotenuse'],
      ['tan θ','TOA','Opposite / Adjacent = sin/cos']
    ]},
    {t:'h', v:'Quadrant signs — "All Students Take Calculus"'},
    {t:'tbl', head:['Quadrant','Angles','Positive'], rows:[
      ['I','0–90°','ALL'],['II','90–180°','sin only'],
      ['III','180–270°','tan only'],['IV','270–360°','cos only']
    ]}
  ],
  cards:[
    {q:'sin 30° = ?', a:'0.5'},
    {q:'cos 60° = ?', a:'0.5'},
    {q:'sin 45° = cos 45° = ?', a:'≈ 0.7  (√2/2)'},
    {q:'sin 60° = ?', a:'≈ 0.87  (√3/2)'},
    {q:'What is the √n/2 pattern?', a:'sin = √n/2 with n going UP 0→4; cos uses the same n going DOWN 4→0'},
    {q:'SOH-CAH-TOA — what is tan θ?', a:'Opposite / Adjacent, which also equals sin θ / cos θ'},
    {q:'Which quadrant has all trig functions positive?', a:'Quadrant I (All Students Take Calculus)'}
  ]
},
{
  id:'mathtricks', title:'Math Tricks & Sci Notation', sub:'Math', color:'blue', icon:'calculate',
  blocks:[
    {t:'tbl', head:['Operation','Rule','Example'], rows:[
      ['Multiply','Multiply coefficients, ADD exponents','(3×10⁴)(2×10⁻²) = 6×10²'],
      ['Divide','Divide coefficients, SUBTRACT exponents','(8×10⁶)/(4×10²) = 2×10⁴'],
      ['Add / Sub','Make exponents EQUAL first','3×10⁴ + 2×10³ = 3.2×10⁴']
    ]},
    {t:'h', v:'Dimensional analysis trick'},
    {t:'n', v:'Stuck on a formula? Check the UNITS. The answer units tell you how to combine the given values.\nWant m/s? meters ÷ seconds.\nWant N? N = kg·m/s² → mass × acceleration.\nWant J? J = kg·m²/s² = N·m.'},
    {t:'h', v:'Estimation strategy'},
    {t:'n', v:'1. Round to 1 sig fig, solve, see which choice is closest.\n2. If two are close, refine the rounding for just those two.\n3. Balance rounding: if you round one number UP, round another DOWN to cancel the error.'},
    {t:'h', v:'Metric prefixes'},
    {t:'tbl', head:['Prefix','Symbol','Power'], rows:[
      ['tera','T','10¹²'],['giga','G','10⁹'],['mega','M','10⁶'],['kilo','k','10³'],
      ['centi','c','10⁻²'],['milli','m','10⁻³'],['micro','µ','10⁻⁶'],['nano','n','10⁻⁹'],['pico','p','10⁻¹²']
    ]}
  ],
  cards:[
    {q:'(3×10⁴)(2×10⁻²) = ?', a:'6×10²  — multiply coefficients, add exponents'},
    {q:'(8×10⁶)/(4×10²) = ?', a:'2×10⁴ — divide coefficients, subtract exponents'},
    {q:'Adding scientific notation — first step?', a:'Make the exponents equal, then add the coefficients'},
    {q:'Balance rounding rule?', a:'If you round one number up, round another down so the errors cancel'},
    {q:'A newton in base units?', a:'N = kg·m/s²'},
    {q:'A joule in base units?', a:'J = kg·m²/s² = N·m'}
  ]
},
{
  id:'equations', title:'Must-Know Equations', sub:'Physics', color:'indigo', icon:'bolt',
  blocks:[
    {t:'tbl', head:['Topic','Equation','Remember'], rows:[
      ['Ohm’s Law','V = IR','Double R → double V (const I)'],
      ['Power','P = IV = I²R = V²/R','Three forms, pick what you’re given'],
      ['Series R','R = R₁ + R₂ + …','Resistors ADD; current is the same everywhere'],
      ['Parallel R','1/R = 1/R₁ + 1/R₂ + …','Total R DECREASES; voltage same per branch'],
      ['Kinetic energy','KE = ½mv²','v² means velocity matters MORE'],
      ['Potential energy','PE = mgh','Height above a reference point'],
      ['Work-Energy','W_net = ΔKE','Shortcut that skips kinematics'],
      ['Work','W = Fd','Force along the direction of motion'],
      ['Ideal gas','PV = nRT','T must be in KELVIN'],
      ['Bernoulli','P + ½ρv² + ρgh = const','Faster flow = LOWER pressure'],
      ['Continuity','A₁v₁ = A₂v₂','Narrow pipe = faster flow'],
      ['Pressure at depth','P = P₀ + ρgh','Deeper = more pressure'],
      ['Kinematics','v = v₀ + at\nx = v₀t + ½at²','g ≈ 10 m/s² is fine for estimating'],
      ['Snell’s Law','n₁sinθ₁ = n₂sinθ₂','Higher n = slower light = bends toward normal'],
      ['Lens / Mirror','1/f = 1/dₒ + 1/dᵢ','f + = converging, f − = diverging'],
      ['Wave speed','v = fλ','Speed = frequency × wavelength'],
      ['Newton’s 2nd','F = ma','The one everything else hangs off']
    ]},
    {t:'tip', v:'In SERIES current is the same everywhere. In PARALLEL voltage is the same across each branch. This is the distinction they test.'}
  ],
  cards:[
    {q:'Ohm’s Law?', a:'V = IR'},
    {q:'Three forms of electrical power?', a:'P = IV = I²R = V²/R'},
    {q:'Series resistors — what happens to total R?', a:'They ADD. R = R₁ + R₂ + …'},
    {q:'Parallel resistors — what happens to total R?', a:'Total R decreases. 1/R = 1/R₁ + 1/R₂ + …'},
    {q:'In series, what is constant? In parallel?', a:'Series: current is the same everywhere. Parallel: voltage is the same across each branch.'},
    {q:'Kinetic energy equation?', a:'KE = ½mv²'},
    {q:'Work-Energy theorem?', a:'W_net = ΔKE'},
    {q:'Ideal gas law — and the trap?', a:'PV = nRT. The trap is temperature must be in Kelvin.'},
    {q:'Bernoulli in one sentence?', a:'P + ½ρv² + ρgh = constant → faster flow means lower pressure'},
    {q:'Continuity equation?', a:'A₁v₁ = A₂v₂ — narrow pipe means faster flow'},
    {q:'Snell’s Law?', a:'n₁sinθ₁ = n₂sinθ₂. Higher n = slower light = bends toward the normal.'},
    {q:'Wave speed?', a:'v = fλ'},
    {q:'Pressure at depth?', a:'P = P₀ + ρgh'}
  ]
},
{
  id:'optics', title:'Optics & Vision', sub:'Physics', color:'indigo', icon:'visibility',
  blocks:[
    {t:'f', k:'Thin lens', v:'1/f = 1/dₒ + 1/dᵢ'},
    {t:'n', v:'f = focal length | dₒ = object distance (always +) | dᵢ = image distance (+ = real, − = virtual)'},
    {t:'f', k:'Magnification', v:'m = −dᵢ / dₒ'},
    {t:'n', v:'|m| > 1 enlarged | |m| < 1 reduced | m positive = upright | m negative = inverted'},
    {t:'f', k:'Lens power', v:'P = 1/f   (f in meters, P in diopters)'},
    {t:'h', v:'Vision corrections'},
    {t:'tbl', head:['Condition','Problem','Fix','Trick'], rows:[
      ['Myopia (nearsighted)','Focuses BEFORE retina, eyeball too long','Diverging (concave), negative f','"MiNus" = Myopia = Negative'],
      ['Hyperopia (farsighted)','Focuses BEHIND retina, eyeball too short','Converging (convex), positive f','Hyper = too far = converge light inward']
    ]},
    {t:'tip', v:'They give you focal length and ask for diopters, or the reverse. P = 1/f. That is the whole question — just division.'}
  ],
  cards:[
    {q:'Thin lens equation?', a:'1/f = 1/dₒ + 1/dᵢ'},
    {q:'Magnification equation?', a:'m = −dᵢ/dₒ'},
    {q:'Negative magnification means?', a:'Inverted image'},
    {q:'Lens power in diopters?', a:'P = 1/f, with f in meters'},
    {q:'Myopia — what lens?', a:'Diverging (concave), negative focal length. "MiNus = Myopia = Negative."'},
    {q:'Hyperopia — what lens?', a:'Converging (convex), positive focal length'},
    {q:'Negative image distance (dᵢ) means?', a:'Virtual image'}
  ]
},
{
  id:'neuro', title:'Neurotransmitters', sub:'Psych/Bio', color:'purple', icon:'neurology',
  blocks:[
    {t:'tbl', head:['NT','Hook','Function','When it’s off'], rows:[
      ['Dopamine','"DO-something"','Reward, motivation, movement','↓ Parkinson’s, depression / ↑ schizophrenia'],
      ['Serotonin','"SERENE-tonin"','Mood, sleep, appetite, calm','↓ depression, anxiety, OCD'],
      ['Norepinephrine','Adrenaline’s calmer cousin','Alertness, arousal, fight-or-flight','↓ depression / ↑ anxiety'],
      ['Epinephrine','Full adrenaline','Fight-or-flight, stronger than NE','Acute stress; adrenal medulla'],
      ['GABA','"Go Away, Brain Activity"','INHIBITORY — calms everything','↓ anxiety, seizures. Benzos & alcohol ↑'],
      ['Glutamate','"GLUE-tamate glues brain ON"','EXCITATORY — main go signal','↑ excitotoxicity, seizures. Ketamine blocks NMDA'],
      ['Acetylcholine','"ACh = ACTion"','Muscle contraction, memory, attention','↓ Alzheimer’s. Botox blocks it'],
      ['Endorphins','Endogenous morphine','Pain relief, pleasure','Runner’s high; opioids mimic'],
      ['Histamine','Same word as histidine','Wakefulness, inflammation, stomach acid','Allergies'],
      ['Glycine','Spinal cord calmer','INHIBITORY — mainly spinal cord','↓ muscle spasticity']
    ]},
    {t:'tip', v:'GABA vs Glycine: GABA is the main inhibitory in the BRAIN. Glycine is the main inhibitory in the SPINAL CORD. They test this distinction.'},
    {t:'h', v:'Precursor pathways — what builds what'},
    {t:'tbl', head:['Precursor','Makes','Hook'], rows:[
      ['Tyrosine','Dopamine → NE → Epinephrine','One cascade, three neurotransmitters'],
      ['Tryptophan','Serotonin → Melatonin','"TRYPtophan = TRIP to serenity." Turkey → sleepy.'],
      ['Glutamine','Glutamate AND GABA','"GlutaMINE is the mine that makes gas & brake"'],
      ['Histidine','Histamine','Same root word'],
      ['Serine','Glycine','Both amino acids, low yield']
    ]},
    {t:'tip', v:'"A tyrosine deficiency affects which NT?" → Dopamine, it is first in the chain. NE and Epi are hit downstream.'},
    {t:'h', v:'Ionotropic vs metabotropic'},
    {t:'tbl', head:['Type','How','Speed','Which NTs'], rows:[
      ['Ionotropic (IS a channel)','NT binds → channel opens directly','Milliseconds, brief','Glutamate, GABA, Glycine, ACh at NMJ'],
      ['Metabotropic (GPCR)','NT binds → G-protein → second messenger','Seconds to minutes, lasting','NE, Epi, Dopamine, Serotonin, Histamine']
    ]},
    {t:'n', v:'Ionotropic = a door that opens directly. Fast but brief.\nMetabotropic = ringing a doorbell so someone inside opens a window. Slow but sustained.'},
    {t:'tip', v:'"Which receptor gives the fastest postsynaptic response?" → ALWAYS ionotropic. And metabotropic receptors ARE GPCRs, same thing with a different name depending on whether it is a neuro or biochem question.'}
  ],
  cards:[
    {q:'Main INHIBITORY NT in the brain?', a:'GABA — "Go Away, Brain Activity"'},
    {q:'Main inhibitory NT in the spinal cord?', a:'Glycine'},
    {q:'Main EXCITATORY NT?', a:'Glutamate — "GLUE-tamate glues the brain ON"'},
    {q:'Tyrosine makes which neurotransmitters?', a:'Dopamine → Norepinephrine → Epinephrine (one cascade, three NTs)'},
    {q:'Tryptophan makes?', a:'Serotonin, then melatonin'},
    {q:'Glutamine makes?', a:'Both glutamate AND GABA — the gas and the brake'},
    {q:'Low dopamine causes?', a:'Parkinson’s and depression. High dopamine → schizophrenia symptoms.'},
    {q:'Which NT is low in Alzheimer’s?', a:'Acetylcholine'},
    {q:'Ionotropic vs metabotropic — which is faster?', a:'Ionotropic. It IS the channel, so it opens directly. Milliseconds, brief.'},
    {q:'Metabotropic receptors are also called?', a:'GPCRs — G-protein coupled receptors. Same thing, different name.'},
    {q:'A tyrosine deficiency hits which NT first?', a:'Dopamine — it is first in the chain'}
  ]
},
{
  id:'hormones', title:'Steroid vs Peptide Hormones', sub:'Bio', color:'green', icon:'water_drop',
  blocks:[
    {t:'f', k:'The one rule', v:'STEROID = STRAIGHT INSIDE'},
    {t:'n', v:'Steroid hormones are made from CHOLESTEROL, are LIPID-SOLUBLE, so they cross the membrane and bind INTRACELLULAR receptors (usually nuclear → gene transcription). Peptide hormones are the opposite: they bind SURFACE receptors.'},
    {t:'h', v:'The steroid hormones — "TEACP"'},
    {t:'tbl', head:['','Hormone','Source','Function'], rows:[
      ['T','Testosterone','Testes / adrenal','Male sex characteristics, anabolic'],
      ['E','Estrogen','Ovaries / adrenal','Female sex characteristics, bone density'],
      ['A','Aldosterone','Adrenal cortex','Na⁺ reabsorption → ↑ blood pressure (RAAS)'],
      ['C','Cortisol','Adrenal cortex','Stress, ↑ blood glucose, anti-inflammatory'],
      ['P','Progesterone','Ovaries / placenta','Pregnancy maintenance, uterine lining']
    ]},
    {t:'tip', v:'"Which hormone binds an intracellular receptor?" → Steroids + thyroid (T3/T4) go INSIDE. Everything else (insulin, epinephrine, growth hormone) hits a SURFACE receptor.'},
    {t:'warn', v:'ADH (vasopressin) is NOT a steroid, it is a peptide. Common trap.'},
    {t:'warn', v:'Thyroid hormones bind intracellular receptors even though they are amino-acid derived. They are THE exception. Memorize: "Steroids + Thyroid = inside. Everything else = surface."'},
    {t:'h', v:'Blood sugar pair'},
    {t:'n', v:'Insulin lowers blood sugar and stores glucose. Glucagon raises it and breaks down glycogen.\nPancreas, Islets of Langerhans: β-cells make insulin, α-cells make glucagon.\nInsulin resistance = Type 2 diabetes. Glucagon activates gluconeogenesis and glycogenolysis.'}
  ],
  cards:[
    {q:'The five steroid hormones (TEACP)?', a:'Testosterone, Estrogen, Aldosterone, Cortisol, Progesterone'},
    {q:'Steroid hormones bind which receptors, and why?', a:'Intracellular/nuclear — they are made from cholesterol, so they are lipid-soluble and cross the membrane'},
    {q:'Which non-steroid hormones bind intracellular receptors?', a:'Thyroid hormones T3/T4 — the exception'},
    {q:'Is ADH a steroid?', a:'No. ADH (vasopressin) is a PEPTIDE hormone. Classic trap.'},
    {q:'Aldosterone does what?', a:'Na⁺ reabsorption in the kidney → raises blood pressure (RAAS)'},
    {q:'β-cells vs α-cells?', a:'β-cells make insulin (lowers blood sugar). α-cells make glucagon (raises it).'},
    {q:'Glucagon activates which two processes?', a:'Gluconeogenesis and glycogenolysis'}
  ]
},
{
  id:'metabolism', title:'Metabolism Pathway Map', sub:'Biochem', color:'green', icon:'autorenew',
  blocks:[
    {t:'f', k:'Follow the carbon', v:'Glucose (6C) → Glycolysis → 2 Pyruvate (3C) → PDH → 2 Acetyl-CoA (2C) → TCA → CO₂ + carriers → ETC → ATP + H₂O'},
    {t:'tbl', head:['Stage','Where','In → Out','ATP','Key detail'], rows:[
      ['Glycolysis','Cytoplasm','Glucose → 2 pyruvate, 2 NADH','2 net','No O₂ needed. Rate-limiting: PFK-1'],
      ['Pyruvate dehydrogenase','Mito matrix','Pyruvate → acetyl-CoA + CO₂ + NADH','0','Links glycolysis to TCA. Irreversible.'],
      ['TCA (Krebs)','Mito matrix','Acetyl-CoA → 2 CO₂, 3 NADH, 1 FADH₂, 1 GTP','2 GTP','Rate-limiting: isocitrate dehydrogenase'],
      ['ETC + OxPhos','Inner mito membrane','NADH/FADH₂ → pump H⁺ → ATP synthase','~30–34','O₂ is the final electron acceptor']
    ]},
    {t:'tip', v:'Total ATP per glucose ≈ 30–32. The old 36–38 number is outdated; the MCAT uses the updated one.'},
    {t:'tip', v:'No oxygen? Pyruvate → lactate (animals) or ethanol (yeast). That regenerates NAD⁺ so glycolysis can keep running.'},
    {t:'h', v:'Your TCA mnemonic'},
    {t:'n', v:'"Can I Keep Selling Stickers For Money Officer?"\nCitrate → Isocitrate → α-Ketoglutarate → Succinyl-CoA → Succinate → Fumarate → Malate → Oxaloacetate'}
  ],
  cards:[
    {q:'Rate-limiting enzyme of glycolysis?', a:'PFK-1 (phosphofructokinase-1)'},
    {q:'Rate-limiting enzyme of the TCA cycle?', a:'Isocitrate dehydrogenase'},
    {q:'Where does glycolysis happen?', a:'Cytoplasm — and it needs no oxygen'},
    {q:'Net ATP from glycolysis?', a:'2'},
    {q:'Total ATP per glucose (MCAT number)?', a:'About 30–32, not the old 36–38'},
    {q:'Final electron acceptor in the ETC?', a:'Oxygen'},
    {q:'No oxygen — what happens to pyruvate, and why?', a:'→ lactate (animals) or ethanol (yeast), to regenerate NAD⁺ so glycolysis can continue'},
    {q:'TCA cycle order mnemonic?', a:'"Can I Keep Selling Stickers For Money Officer?" Citrate, Isocitrate, α-Ketoglutarate, Succinyl-CoA, Succinate, Fumarate, Malate, Oxaloacetate'},
    {q:'Which step links glycolysis to the TCA cycle?', a:'Pyruvate dehydrogenase — pyruvate → acetyl-CoA. Irreversible.'}
  ]
},
{
  id:'psychsoc', title:'Psych/Soc Fast Points', sub:'Psych/Soc', color:'purple', icon:'groups',
  blocks:[
    {t:'h', v:'The big sociology theories'},
    {t:'tbl', head:['Theory','Core idea','Hook'], rows:[
      ['Functionalism','Society is a system of parts working together, each with a function','Body analogy — each organ has a job. Durkheim.'],
      ['Conflict theory','Society is competition for limited resources; power dynamics','The rich vs everyone else. Marx.'],
      ['Symbolic interactionism','Society is built from everyday interactions and shared symbols','Micro-level. How you read a handshake or a flag. Mead.']
    ]},
    {t:'h', v:'Learning theories'},
    {t:'tbl', head:['Type','What’s happening','Key details'], rows:[
      ['Classical conditioning','Learning by ASSOCIATION, pairing stimuli','Pavlov. UCS→UCR natural, CS→CR learned. Extinction, spontaneous recovery, generalization, discrimination.'],
      ['Operant conditioning','Learning by CONSEQUENCES, behavior → outcome','Skinner. Reinforcement ↑ behavior, punishment ↓ behavior.'],
      ['Observational learning','Learning by WATCHING','Bandura’s Bobo doll. Modeling, mirror neurons.']
    ]},
    {t:'tip', v:'"Positive" = ADDING something. "Negative" = REMOVING something. It is about the operation, not whether it is good or bad.'},
    {t:'h', v:'Reinforcement schedules'},
    {t:'tbl', head:['Schedule','How','Example + pattern'], rows:[
      ['Fixed ratio','Reward after a set # of responses','Paid per 10 widgets. Fast, then pause after reward.'],
      ['Variable ratio','Reward after an unpredictable #','Slot machines. Highest, steadiest rate.'],
      ['Fixed interval','Reward after a set time','Paycheck every 2 weeks. Scalloped, ramps up near the end.'],
      ['Variable interval','Reward after unpredictable time','Checking email. Slow and steady.']
    ]},
    {t:'tip', v:'Variable ratio is the most resistant to extinction. That is why gambling is addictive, and it is tested often.'},
    {t:'h', v:'Emotion theories'},
    {t:'tbl', head:['Theory','The order'], rows:[
      ['James-Lange','I’m shaking, so I must be scared. The body response comes FIRST and is the signal.'],
      ['Cannon-Bard','I’m scared AND my heart races. Physiological response and emotion happen at the SAME time.'],
      ['Schachter-Singer','Arousal + a cognitive label. You notice arousal, then interpret the context to name the emotion.']
    ]},
    {t:'h', v:'Personality — Big Five: OCEAN'},
    {t:'n', v:'Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism'},
    {t:'h', v:'Personality disorder clusters — the three W’s'},
    {t:'n', v:'Cluster A = Weird (odd/eccentric)\nCluster B = Wild (dramatic/erratic)\nCluster C = Worried (anxious/fearful)\nPersonality disorders are EGO-SYNTONIC: the person does not see it as a problem.'},
    {t:'tip', v:'OCD is ego-DYSTONIC (the obsessions distress you, you know they are irrational). OCPD is ego-SYNTONIC (you think your rigidity is correct). Hoarding can show up in either.'},
    {t:'h', v:'Depression criteria — SIG E CAPS'},
    {t:'n', v:'Sleep, Interest (anhedonia), Guilt, Energy, Concentration, Appetite, Psychomotor, Suicidality'}
  ],
  cards:[
    {q:'Functionalism in one line?', a:'Society is a system of parts each doing a job — the body analogy. Durkheim.'},
    {q:'Conflict theory in one line?', a:'Society is competition over limited resources and power. Marx.'},
    {q:'Symbolic interactionism in one line?', a:'Society is built from everyday interactions and shared symbols. Micro-level. Mead.'},
    {q:'James-Lange vs Cannon-Bard?', a:'James-Lange: body response FIRST, then you read it as emotion. Cannon-Bard: body response and emotion happen SIMULTANEOUSLY.'},
    {q:'Schachter-Singer theory?', a:'Arousal + cognitive label — you feel arousal, then use context to name the emotion'},
    {q:'Which reinforcement schedule resists extinction most?', a:'Variable ratio — slot machines'},
    {q:'Fixed interval produces what response pattern?', a:'Scalloped — responding ramps up as the reward time approaches'},
    {q:'In operant conditioning, what does "negative" mean?', a:'REMOVING something. It has nothing to do with good or bad.'},
    {q:'Big Five personality traits?', a:'OCEAN — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism'},
    {q:'Personality disorder clusters A, B, C?', a:'A = Weird, B = Wild, C = Worried'},
    {q:'OCD vs OCPD — the key distinction?', a:'OCD is ego-dystonic (distressing, you know it is irrational). OCPD is ego-syntonic (you think you are right).'},
    {q:'SIG E CAPS stands for?', a:'Sleep, Interest, Guilt, Energy, Concentration, Appetite, Psychomotor, Suicidality'},
    {q:'Bandura is associated with?', a:'Observational learning — the Bobo doll study, modeling'}
  ]
},
{
  id:'gases', title:'Gases, STP & Standard State', sub:'Chem', color:'teal', icon:'air',
  blocks:[
    {t:'f', k:'Standard state', v:'298 K = 25°C, 1 M'},
    {t:'f', k:'STP', v:'273 K. 1 mole of gas occupies 22.4 L'},
    {t:'n', v:'If you are NOT at 1 mole, set up the ratio:\n1 mol / 22.4 L = n / V'},
    {t:'h', v:'Temperature vs heat'},
    {t:'n', v:'Gas temperature is a STATE value — a property of the system.\nHeat is about TRANSFER of energy — a flow, a process. It makes particles move faster or slower.'},
    {t:'h', v:'Rigid container vs balloon (the classic setup)'},
    {t:'n', v:'Rigid wall (cylinder, basketball): volume CANNOT change, so adding gas forces the PRESSURE up.\nBalloon: adding gas makes the VOLUME grow, and the pressure stays constant.'},
    {t:'h', v:'Numbers worth knowing cold'},
    {t:'n', v:'pH of blood = 7.35–7.45\nBlood osmolarity ≈ 300 mOsm\nBody temp = 310 K'},
    {t:'tip', v:'Histidine at physiological pH has a pKa near 6, so it is effectively neutral — do not give it a +1 charge.'}
  ],
  cards:[
    {q:'Volume of 1 mole of gas at STP?', a:'22.4 L'},
    {q:'STP temperature?', a:'273 K (0°C)'},
    {q:'Standard state conditions?', a:'298 K (25°C), 1 M'},
    {q:'pH of blood?', a:'7.35–7.45'},
    {q:'Blood osmolarity?', a:'≈ 300 mOsm'},
    {q:'Add gas to a RIGID container — what changes?', a:'Pressure goes up. Volume cannot change.'},
    {q:'Add gas to a balloon — what changes?', a:'Volume grows; pressure stays constant'},
    {q:'Temperature vs heat?', a:'Temperature is a state value of the system. Heat is the transfer of energy, a flow.'},
    {q:'Histidine charge at physiological pH?', a:'Effectively neutral — its pKa is ~6, so do not assign it +1'}
  ]
},
{
  id:'renal', title:'Nephron & Kidney Function', sub:'Bio', color:'green', icon:'filter_alt',
  blocks:[
    {t:'n', v:'Your kidneys are a filter machine. Each one has millions of nephrons.'},
    {t:'h', v:'1. Filtration'},
    {t:'n', v:'Blood enters the glomerulus, which acts like a sieve. Water, salts and small molecules pass into the tubule. Big things (most proteins) stay in the blood because they cannot fit through.'},
    {t:'h', v:'2. Reabsorption'},
    {t:'n', v:'The tubule is a recycling center. It takes back almost all of the water, salts and useful molecules your body still needs.\nGlucose: essentially 100% reabsorbed — it is fuel, you do not throw it out.\nProteins: too big to be filtered in the first place.'},
    {t:'h', v:'3. What is left'},
    {t:'n', v:'Extra water, waste and salts that were not reabsorbed become urine.'},
    {t:'tip', v:'Absorbed = taken in for the first time (food or water in the gut). Reabsorbed = the good stuff that got filtered out is picked back up and returned to the blood.'},
    {t:'warn', v:'Protein in the urine means the filter is damaged — proteins should never have gotten through the glomerulus.'}
  ],
  cards:[
    {q:'Where does filtration happen in the nephron?', a:'The glomerulus — it acts as the sieve'},
    {q:'Why is glucose almost never in urine?', a:'It is essentially 100% reabsorbed in the tubule — the body needs it for fuel'},
    {q:'Why are proteins normally absent from urine?', a:'They are too big to be filtered at the glomerulus in the first place'},
    {q:'Protein in the urine suggests what?', a:'Glomerular damage — the filter is letting through what it should not'},
    {q:'Absorbed vs reabsorbed?', a:'Absorbed = taken in for the first time (gut). Reabsorbed = filtered-out good stuff returned to the blood (kidney).'}
  ]
},
{
  id:'brain', title:'Brain Anatomy Hooks', sub:'Psych/Bio', color:'purple', icon:'psychology',
  blocks:[
    {t:'tbl', head:['Structure','Job','Your hook'], rows:[
      ['Hippocampus','Forming new memories','"Memories on CAMPUS"'],
      ['Cerebellum','Balance and coordination','"Bell princess dancing"'],
      ['Amygdala','Emotion, fear','Part of the limbic system'],
      ['Basal ganglia','Movement initiation, habit','Degenerates in Parkinson’s'],
      ['Hypothalamus','Homeostasis, hunger, hormones','The four F’s'],
      ['Medulla oblongata','Breathing, heart rate','Hindbrain — the stuff that keeps you alive'],
      ['Pons','Sleep, arousal, bridges the brain','Hindbrain — "pons" = bridge'],
      ['Frontal lobe','Executive function, planning, impulse control','The last to develop']
    ]},
    {t:'tip', v:'Parkinson’s: dopamine-producing neurons in the substantia nigra die, which starves the basal ganglia. Resting tremor, bradykinesia, rigidity, postural instability.'}
  ],
  cards:[
    {q:'Which structure forms new memories?', a:'Hippocampus — "memories on campus"'},
    {q:'Cerebellum does what?', a:'Balance and coordination — "bell princess dancing"'},
    {q:'Amygdala does what?', a:'Emotion, especially fear. Part of the limbic system.'},
    {q:'What degenerates in Parkinson’s?', a:'Dopamine neurons in the substantia nigra, which starves the basal ganglia'},
    {q:'Medulla oblongata controls?', a:'Breathing and heart rate — the automatic survival functions'},
    {q:'Hypothalamus controls?', a:'Homeostasis — hunger, temperature, hormones'}
  ]
}
];

/* Seed terms lifted from your running lists, in your own format.
   conf: 1 = red (shaky), 2 = yellow, 3 = green (solid) */
const POCKET_SEED_TERMS = [
  {term:'James-Lange Theory of Emotion', def:"I'm shaking, so I must be scared. The physical response comes first, and noticing it is what tells you the emotion.", ex:'', tag:'Psych/Soc', conf:2},
  {term:'Cannon-Bard', def:"I'm scared AND my heart is racing. The physiological response and the emotion happen at the SAME time.", ex:'', tag:'Psych/Soc', conf:2},
  {term:'Hippocampus', def:'Part of the brain responsible for forming memory.', ex:'"Memories on campus"', tag:'Psych/Soc', conf:3},
  {term:'Cerebellum', def:'Balance and coordination.', ex:'"Bell princess dancing"', tag:'Psych/Soc', conf:3},
  {term:'Amygdala', def:'Emotion, especially fear. Part of the limbic system.', ex:'', tag:'Psych/Soc', conf:3},
  {term:'OCD vs OCPD', def:'OCD is ego-dystonic: the obsessions distress you and you know they are irrational. OCPD is ego-syntonic: you think your rigidity is correct.', ex:'Hoarding can be a symptom of either one.', tag:'Psych/Soc', conf:1},
  {term:'Ego-syntonic', def:'The person does NOT see the trait as a problem. This is the hallmark of personality disorders.', ex:'', tag:'Psych/Soc', conf:2},
  {term:'Personality disorder clusters', def:'A = Weird (odd/eccentric). B = Wild (dramatic/erratic). C = Worried (anxious/fearful).', ex:'', tag:'Psych/Soc', conf:2},
  {term:'SIG E CAPS', def:'Depression criteria: Sleep, Interest, Guilt, Energy, Concentration, Appetite, Psychomotor, Suicidality.', ex:'', tag:'Psych/Soc', conf:2},
  {term:'Big Five (OCEAN)', def:'Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.', ex:'', tag:'Psych/Soc', conf:3},
  {term:'GAD', def:'Disproportionate, hard-to-control worry about multiple things, most days, for 6+ months.', ex:'', tag:'Psych/Soc', conf:3},
  {term:'Reabsorption', def:'In the kidney, the good stuff that got filtered out is picked back up and returned to the blood. Different from absorption, which is taking something in for the first time.', ex:'Glucose is almost completely reabsorbed because the body needs the fuel.', tag:'Bio', conf:2},
  {term:'Histidine at physiological pH', def:'pKa is around 6, so at pH 7.4 it is effectively neutral. Do not give it a +1 charge.', ex:'', tag:'Biochem', conf:1},
  {term:'Citric Acid Cycle order', def:'Citrate, Isocitrate, α-Ketoglutarate, Succinyl-CoA, Succinate, Fumarate, Malate, Oxaloacetate.', ex:'"Can I Keep Selling Stickers For Money Officer?"', tag:'Biochem', conf:2},
  {term:'STP vs Standard State', def:'STP = 273 K, and 1 mole of gas occupies 22.4 L. Standard state = 298 K (25°C) and 1 M.', ex:'', tag:'Chem', conf:2},
  {term:'Rigid container vs balloon', def:'A rigid wall cannot change volume, so adding gas drives PRESSURE up. A balloon expands, so VOLUME grows and pressure stays constant.', ex:'Cylinder or basketball vs a party balloon.', tag:'Physics', conf:2},
  {term:'Heat vs temperature', def:'Temperature is a state value, a property of the system. Heat is the TRANSFER of energy, a flow.', ex:'', tag:'Physics', conf:2},
  {term:'Insulin vs Glucagon', def:'Insulin lowers blood sugar and stores glucose. Glucagon raises it, triggering glycogenolysis and gluconeogenesis. β-cells make insulin, α-cells make glucagon.', ex:'Insulin resistance is Type 2 diabetes.', tag:'Bio', conf:3}
];

const POCKET_TAGS = ['Psych/Soc','Bio','Biochem','Chem','Orgo','Physics','CARS','Math','Other'];
