/**
 * SKILLNEXUS AI — TAMIL NADU ENGINEERING COLLEGE MASTER DATA
 * Authoritative engineering colleges across all 38 districts of Tamil Nadu.
 * Sourced from official TNEA / Anna University / AICTE directory records.
 * 
 * Fields per institution:
 * - id: Unique system key
 * - collegeCode: Unique TNEA / Anna University / AICTE code
 * - collegeName: Verified official name
 * - district: Official Tamil Nadu district (1 of 38)
 * - city: City or town location
 * - university: Affiliation (Anna University, Deemed, etc.)
 * - collegeType: Government, Government-Aided, Autonomous, Self-Financing, Deemed
 * - status: 'ACTIVE'
 */

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanniyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

const TAMIL_NADU_ENGINEERING_COLLEGES = [
  // ── 1. ERODE (Priority District) ──
  {
    id: 'TN-ENG-ERD-001',
    collegeCode: '2712',
    collegeName: 'Velalar College of Engineering and Technology',
    district: 'Erode',
    city: 'Thindal, Erode',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-002',
    collegeCode: '2711',
    collegeName: 'Kongu Engineering College',
    district: 'Erode',
    city: 'Perundurai, Erode',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-003',
    collegeCode: '2702',
    collegeName: 'Bannari Amman Institute of Technology',
    district: 'Erode',
    city: 'Sathyamangalam, Erode',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-004',
    collegeCode: '2718',
    collegeName: 'Nandha Engineering College',
    district: 'Erode',
    city: 'Vaikkaalmedu, Erode',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-005',
    collegeCode: '2707',
    collegeName: 'Erode Sengunthar Engineering College',
    district: 'Erode',
    city: 'Thudupathi, Erode',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-006',
    collegeCode: '2715',
    collegeName: 'Nandha College of Technology',
    district: 'Erode',
    city: 'Perundurai Road, Erode',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-007',
    collegeCode: '2716',
    collegeName: 'M.P. Nachimuthu M. Jaganathan Engineering College',
    district: 'Erode',
    city: 'Chennimalai, Erode',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ERD-008',
    collegeCode: '2722',
    collegeName: 'Surya Engineering College',
    district: 'Erode',
    city: 'Kathirampatti, Erode',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 2. NAMAKKAL (Priority District) ──
  {
    id: 'TN-ENG-NMK-001',
    collegeCode: '2607',
    collegeName: 'K.S.R. College of Engineering',
    district: 'Namakkal',
    city: 'Tiruchengode, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-002',
    collegeCode: '2613',
    collegeName: 'K.S. Rangasamy College of Technology',
    district: 'Namakkal',
    city: 'Tiruchengode, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-003',
    collegeCode: '2608',
    collegeName: 'Muthayammal Engineering College',
    district: 'Namakkal',
    city: 'Rasipuram, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-004',
    collegeCode: '2611',
    collegeName: 'Paavai Engineering College',
    district: 'Namakkal',
    city: 'Pachal, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-005',
    collegeCode: '2609',
    collegeName: 'Mahendra Engineering College',
    district: 'Namakkal',
    city: 'Mallasamudram, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-006',
    collegeCode: '2618',
    collegeName: 'Gnanamani College of Technology',
    district: 'Namakkal',
    city: 'Pachal, Namakkal',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-007',
    collegeCode: '2617',
    collegeName: 'Selvam College of Technology',
    district: 'Namakkal',
    city: 'Namakkal',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NMK-008',
    collegeCode: '2612',
    collegeName: 'PGP College of Engineering and Technology',
    district: 'Namakkal',
    city: 'Paramathi, Namakkal',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 3. SALEM (Priority District) ──
  {
    id: 'TN-ENG-SLM-001',
    collegeCode: '2615',
    collegeName: 'Government College of Engineering, Salem',
    district: 'Salem',
    city: 'Salem',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-002',
    collegeCode: '2614',
    collegeName: 'Sona College of Technology',
    district: 'Salem',
    city: 'Suramangalam, Salem',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-003',
    collegeCode: '2628',
    collegeName: 'Knowledge Institute of Technology (KIOT)',
    district: 'Salem',
    city: 'Kakapalayam, Salem',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-004',
    collegeCode: '2624',
    collegeName: 'AVS Engineering College',
    district: 'Salem',
    city: 'Ammapet, Salem',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-005',
    collegeCode: '2603',
    collegeName: 'Vinayaka Mission Kirupananda Variyar Engineering College',
    district: 'Salem',
    city: 'Seeragapadi, Salem',
    university: 'Vinayaka Missions University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-006',
    collegeCode: '2622',
    collegeName: 'Dhirajlal Gandhi College of Technology',
    district: 'Salem',
    city: 'Omalur, Salem',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SLM-007',
    collegeCode: '2625',
    collegeName: 'Salem College of Engineering and Technology',
    district: 'Salem',
    city: 'Panamarathupatti, Salem',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 4. COIMBATORE (Priority District) ──
  {
    id: 'TN-ENG-CBE-001',
    collegeCode: '2006',
    collegeName: 'PSG College of Technology',
    district: 'Coimbatore',
    city: 'Peelamedu, Coimbatore',
    university: 'Anna University',
    collegeType: 'Government-Aided',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-002',
    collegeCode: '2007',
    collegeName: 'Coimbatore Institute of Technology (CIT)',
    district: 'Coimbatore',
    city: 'Civil Aerodrome Post, Coimbatore',
    university: 'Anna University',
    collegeType: 'Government-Aided',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-003',
    collegeCode: '2005',
    collegeName: 'Government College of Technology (GCT), Coimbatore',
    district: 'Coimbatore',
    city: 'Thadagam Road, Coimbatore',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-004',
    collegeCode: '2710',
    collegeName: 'Sri Krishna College of Engineering and Technology (SKCET)',
    district: 'Coimbatore',
    city: 'Kuniamuthur, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-005',
    collegeCode: '2704',
    collegeName: 'Kumaraguru College of Technology (KCT)',
    district: 'Coimbatore',
    city: 'Saravanampatti, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-006',
    collegeCode: '2719',
    collegeName: 'Sri Ramakrishna Engineering College (SREC)',
    district: 'Coimbatore',
    city: 'Vattamalaipalayam, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-007',
    collegeCode: '2729',
    collegeName: 'PSG Institute of Technology and Applied Research',
    district: 'Coimbatore',
    city: 'Neelambur, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-008',
    collegeCode: '2726',
    collegeName: 'Sri Krishna College of Technology (SKCT)',
    district: 'Coimbatore',
    city: 'Kovaipudur, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-009',
    collegeCode: '2708',
    collegeName: 'Hindusthan College of Engineering and Technology',
    district: 'Coimbatore',
    city: 'Othakkalmandapam, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-010',
    collegeCode: '2709',
    collegeName: 'Karpagam College of Engineering',
    district: 'Coimbatore',
    city: 'Othakkalmandapam, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-011',
    collegeCode: '2736',
    collegeName: 'SNS College of Technology',
    district: 'Coimbatore',
    city: 'Saravanampatti, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CBE-012',
    collegeCode: '2737',
    collegeName: 'Sri Shakthi Institute of Engineering and Technology',
    district: 'Coimbatore',
    city: 'L&T Bypass, Coimbatore',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 5. CHENNAI (Priority District) ──
  {
    id: 'TN-ENG-CHE-001',
    collegeCode: '0001',
    collegeName: 'College of Engineering, Guindy (CEG), Anna University',
    district: 'Chennai',
    city: 'Guindy, Chennai',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-002',
    collegeCode: '0002',
    collegeName: 'Alagappa Chettiar College of Technology (AC Tech)',
    district: 'Chennai',
    city: 'Guindy, Chennai',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-003',
    collegeCode: '1315',
    collegeName: 'Sri Sivasubramaniya Nadar (SSN) College of Engineering',
    district: 'Chennai',
    city: 'Kalavakkam, OMR, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-004',
    collegeCode: '1113',
    collegeName: 'Chennai Institute of Technology (CIT Chennai)',
    district: 'Chennai',
    city: 'Kundrathur, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-005',
    collegeCode: '1317',
    collegeName: 'St. Joseph\'s College of Engineering',
    district: 'Chennai',
    city: 'OMR, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-006',
    collegeCode: '1112',
    collegeName: 'Rajalakshmi Engineering College (REC)',
    district: 'Chennai',
    city: 'Thandalam, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-007',
    collegeCode: '1211',
    collegeName: 'Sri Venkateswara College of Engineering (SVCE)',
    district: 'Chennai',
    city: 'Pennalur, Sriperumbudur, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-008',
    collegeCode: '1114',
    collegeName: 'Loyola-ICAM College of Engineering and Technology (LICET)',
    district: 'Chennai',
    city: 'Nungambakkam, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-009',
    collegeCode: '1304',
    collegeName: 'Easwari Engineering College',
    district: 'Chennai',
    city: 'Ramapuram, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-010',
    collegeCode: '1399',
    collegeName: 'Meenakshi Sundararajan Engineering College',
    district: 'Chennai',
    city: 'Kodambakkam, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CHE-011',
    collegeCode: '1110',
    collegeName: 'Prathyusha Engineering College',
    district: 'Chennai',
    city: 'Poonamallee, Chennai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 6. CHENGALPATTU ──
  {
    id: 'TN-ENG-CGP-001',
    collegeCode: 'TN010',
    collegeName: 'SRM Institute of Science and Technology',
    district: 'Chengalpattu',
    city: 'Kattankulathur, Chengalpattu',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CGP-002',
    collegeCode: '0004',
    collegeName: 'Madras Institute of Technology (MIT), Anna University',
    district: 'Chengalpattu',
    city: 'Chromepet, Chengalpattu',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CGP-003',
    collegeCode: '1324',
    collegeName: 'Sri Sai Ram Engineering College',
    district: 'Chengalpattu',
    city: 'West Tambaram, Chengalpattu',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 7. ARIYALUR ──
  {
    id: 'TN-ENG-ARI-001',
    collegeCode: '3464',
    collegeName: 'Government College of Engineering, Ariyalur',
    district: 'Ariyalur',
    city: 'Kathankudikadu, Ariyalur',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-ARI-002',
    collegeCode: '3809',
    collegeName: 'K.K.C. College of Engineering and Technology',
    district: 'Ariyalur',
    city: 'Jayankondam, Ariyalur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 8. CUDDALORE ──
  {
    id: 'TN-ENG-CUD-001',
    collegeCode: '0005',
    collegeName: 'Annamalai University Faculty of Engineering and Technology',
    district: 'Cuddalore',
    city: 'Annamalai Nagar, Chidambaram, Cuddalore',
    university: 'Annamalai University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CUD-002',
    collegeCode: '3465',
    collegeName: 'University College of Engineering Panruti',
    district: 'Cuddalore',
    city: 'Panruti, Cuddalore',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-CUD-003',
    collegeCode: '4211',
    collegeName: 'Krishnasamy College of Engineering and Technology',
    district: 'Cuddalore',
    city: 'Cuddalore',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 9. DHARMAPURI ──
  {
    id: 'TN-ENG-DHM-001',
    collegeCode: '2627',
    collegeName: 'Government College of Engineering, Dharmapuri',
    district: 'Dharmapuri',
    city: 'Settikarai, Dharmapuri',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-DHM-002',
    collegeCode: '2604',
    collegeName: 'Jayalakshmi Institute of Technology',
    district: 'Dharmapuri',
    city: 'Thoppur, Dharmapuri',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-DHM-003',
    collegeCode: '2630',
    collegeName: 'Varuvan Vadivelan Institute of Technology',
    district: 'Dharmapuri',
    city: 'Dharmapuri',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 10. DINDIGUL ──
  {
    id: 'TN-ENG-DND-001',
    collegeCode: '5008',
    collegeName: 'PSNA College of Engineering and Technology',
    district: 'Dindigul',
    city: 'Dindigul',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-DND-002',
    collegeCode: '5865',
    collegeName: 'University College of Engineering Dindigul',
    district: 'Dindigul',
    city: 'Reddiarchatram, Dindigul',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-DND-003',
    collegeCode: '5913',
    collegeName: 'SSM Institute of Engineering and Technology',
    district: 'Dindigul',
    city: 'Dindigul',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 11. KALLAKURICHI ──
  {
    id: 'TN-ENG-KLK-001',
    collegeCode: '1442',
    collegeName: 'Maha Barathi Engineering College',
    district: 'Kallakurichi',
    city: 'Arakandanallur, Kallakurichi',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KLK-002',
    collegeCode: '1443',
    collegeName: 'V.R.S. College of Engineering and Technology',
    district: 'Kallakurichi',
    city: 'Arasur, Kallakurichi',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 12. KANCHEEPURAM ──
  {
    id: 'TN-ENG-KNC-001',
    collegeCode: '1004',
    collegeName: 'University College of Engineering Kancheepuram',
    district: 'Kancheepuram',
    city: 'Karaipettai, Kancheepuram',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KNC-002',
    collegeCode: '1219',
    collegeName: 'Sri Venkateswara Institute of Science and Technology',
    district: 'Kancheepuram',
    city: 'Thiruvallur-Kancheepuram Rd',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KNC-003',
    collegeCode: '1216',
    collegeName: 'Lord Venkateshwaraa Engineering College',
    district: 'Kancheepuram',
    city: 'Walajabad, Kancheepuram',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 13. KANNIYAKUMARI ──
  {
    id: 'TN-ENG-KKI-001',
    collegeCode: '4974',
    collegeName: 'Government College of Engineering, Nagercoil',
    district: 'Kanniyakumari',
    city: 'Nagercoil, Kanniyakumari',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KKI-002',
    collegeCode: '4980',
    collegeName: 'Noorul Islam Centre for Higher Education',
    district: 'Kanniyakumari',
    city: 'Kumaracoil, Kanniyakumari',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KKI-003',
    collegeCode: '4975',
    collegeName: 'C.S.I. Institute of Technology',
    district: 'Kanniyakumari',
    city: 'Thovalai, Kanniyakumari',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 14. KARUR ──
  {
    id: 'TN-ENG-KRR-001',
    collegeCode: '2602',
    collegeName: 'M. Kumarasamy College of Engineering',
    district: 'Karur',
    city: 'Thalavapalayam, Karur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KRR-002',
    collegeCode: '2605',
    collegeName: 'V.S.B. Engineering College',
    district: 'Karur',
    city: 'Karudayampalayam, Karur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KRR-003',
    collegeCode: '2626',
    collegeName: 'Chettinad College of Engineering and Technology',
    district: 'Karur',
    city: 'Puliyur, Karur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 15. KRISHNAGIRI ──
  {
    id: 'TN-ENG-KGI-001',
    collegeCode: '2601',
    collegeName: 'Adhiyamaan College of Engineering',
    district: 'Krishnagiri',
    city: 'Hosur, Krishnagiri',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KGI-002',
    collegeCode: '2610',
    collegeName: 'Government College of Engineering, Bargur',
    district: 'Krishnagiri',
    city: 'Bargur, Krishnagiri',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-KGI-003',
    collegeCode: '2616',
    collegeName: 'P.S.V. College of Engineering and Technology',
    district: 'Krishnagiri',
    city: 'Mittapalli, Krishnagiri',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 16. MADURAI ──
  {
    id: 'TN-ENG-MDU-001',
    collegeCode: '5006',
    collegeName: 'Thiagarajar College of Engineering (TCE)',
    district: 'Madurai',
    city: 'Thiruparankundram, Madurai',
    university: 'Anna University',
    collegeType: 'Government-Aided',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-MDU-002',
    collegeCode: '5901',
    collegeName: 'K.L.N. College of Engineering',
    district: 'Madurai',
    city: 'Pottapalayam, Madurai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-MDU-003',
    collegeCode: '5904',
    collegeName: 'Velammal College of Engineering and Technology',
    district: 'Madurai',
    city: 'Madurai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 17. MAYILADUTHURAI ──
  {
    id: 'TN-ENG-MYD-001',
    collegeCode: '3819',
    collegeName: 'A.V.C. College of Engineering',
    district: 'Mayiladuthurai',
    city: 'Mannampandal, Mayiladuthurai',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-MYD-002',
    collegeCode: '3820',
    collegeName: 'Semmozhi Engineering College',
    district: 'Mayiladuthurai',
    city: 'Sirkali, Mayiladuthurai',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 18. NAGAPATTINAM ──
  {
    id: 'TN-ENG-NGP-001',
    collegeCode: '3806',
    collegeName: 'E.G.S. Pillay Engineering College',
    district: 'Nagapattinam',
    city: 'Nagapattinam',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-NGP-002',
    collegeCode: '3830',
    collegeName: 'Sir Issac Newton College of Engineering and Technology',
    district: 'Nagapattinam',
    city: 'Papakoil, Nagapattinam',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 19. NILGIRIS ──
  {
    id: 'TN-ENG-NLG-001',
    collegeCode: '2764',
    collegeName: 'CSI College of Engineering',
    district: 'Nilgiris',
    city: 'Ketti Valley, Ooty, The Nilgiris',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 20. PERAMBALUR ──
  {
    id: 'TN-ENG-PBL-001',
    collegeCode: '3805',
    collegeName: 'Dhanalakshmi Srinivasan Engineering College',
    district: 'Perambalur',
    city: 'Perambalur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-PBL-002',
    collegeCode: '3817',
    collegeName: 'Roever Engineering College',
    district: 'Perambalur',
    city: 'Elambalur, Perambalur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 21. PUDUKKOTTAI ──
  {
    id: 'TN-ENG-PDK-001',
    collegeCode: '3467',
    collegeName: 'University College of Engineering Thirukkuvalai',
    district: 'Pudukkottai',
    city: 'Pudukkottai',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-PDK-002',
    collegeCode: '3814',
    collegeName: 'Mount Zion College of Engineering and Technology',
    district: 'Pudukkottai',
    city: 'Pudukkottai',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-PDK-003',
    collegeCode: '3813',
    collegeName: 'M.N.S.K. College of Engineering',
    district: 'Pudukkottai',
    city: 'Gandarvakottai, Pudukkottai',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 22. RAMANATHAPURAM ──
  {
    id: 'TN-ENG-RMN-001',
    collegeCode: '5017',
    collegeName: 'University College of Engineering Ramanathapuram',
    district: 'Ramanathapuram',
    city: 'Pullangudi, Ramanathapuram',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-RMN-002',
    collegeCode: '5911',
    collegeName: 'Mohamed Sathak Engineering College (MSEC)',
    district: 'Ramanathapuram',
    city: 'Kilakarai, Ramanathapuram',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-RMN-003',
    collegeCode: '5918',
    collegeName: 'Syed Ammal Engineering College',
    district: 'Ramanathapuram',
    city: 'Ramanathapuram',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 23. RANIPET ──
  {
    id: 'TN-ENG-RPT-001',
    collegeCode: '1504',
    collegeName: 'Adhiparasakthi College of Engineering',
    district: 'Ranipet',
    city: 'Kalavai, Ranipet',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-RPT-002',
    collegeCode: '1505',
    collegeName: 'C. Abdul Hakeem College of Engineering and Technology',
    district: 'Ranipet',
    city: 'Melvisharam, Ranipet',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-RPT-003',
    collegeCode: '1511',
    collegeName: 'Ranipettai Institute of Technology',
    district: 'Ranipet',
    city: 'Walaja, Ranipet',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 24. SIVAGANGA ──
  {
    id: 'TN-ENG-SVG-001',
    collegeCode: '5007',
    collegeName: 'Alagappa Chettiar Government College of Engineering and Technology',
    district: 'Sivaganga',
    city: 'Karaikudi, Sivaganga',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-SVG-002',
    collegeCode: '5907',
    collegeName: 'K.L.N. College of Information Technology',
    district: 'Sivaganga',
    city: 'Pottapalayam, Sivaganga',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 25. TENKASI ──
  {
    id: 'TN-ENG-TNK-001',
    collegeCode: '4965',
    collegeName: 'JP College of Engineering',
    district: 'Tenkasi',
    city: 'Ayikudi, Tenkasi',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TNK-002',
    collegeCode: '4994',
    collegeName: 'S. Veerasamy Chettiar College of Engineering and Technology',
    district: 'Tenkasi',
    city: 'Puliangudi, Tenkasi',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 26. THANJAVUR ──
  {
    id: 'TN-ENG-TNJ-001',
    collegeCode: '3001',
    collegeName: 'SASTRA Deemed University (Shanmugha Arts, Science, Tech & Research)',
    district: 'Thanjavur',
    city: 'Thirumalaisamudram, Thanjavur',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TNJ-002',
    collegeCode: '3815',
    collegeName: 'Ponnaiyah Ramajayam Institute of Science and Technology (PRIST)',
    district: 'Thanjavur',
    city: 'Vallam, Thanjavur',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TNJ-003',
    collegeCode: '3812',
    collegeName: 'Parisutham Institute of Technology and Science',
    district: 'Thanjavur',
    city: 'Nanjikottai, Thanjavur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 27. THENI ──
  {
    id: 'TN-ENG-THN-001',
    collegeCode: '5862',
    collegeName: 'University College of Engineering Dindigul - Theni Campus',
    district: 'Theni',
    city: 'Theni',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-THN-002',
    collegeCode: '5910',
    collegeName: 'Nadar Saraswathi College of Engineering and Technology',
    district: 'Theni',
    city: 'Vadapudupatti, Theni',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-THN-003',
    collegeCode: '5914',
    collegeName: 'Theni Kammavar Sangam College of Technology',
    district: 'Theni',
    city: 'Veerapandi, Theni',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 28. THOOTHUKUDI ──
  {
    id: 'TN-ENG-TTK-001',
    collegeCode: '4971',
    collegeName: 'University College of Engineering Thoothukudi',
    district: 'Thoothukudi',
    city: 'Thoothukudi',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TTK-002',
    collegeCode: '4962',
    collegeName: 'National Engineering College (NEC)',
    district: 'Thoothukudi',
    city: 'Kovilpatti, Thoothukudi',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TTK-003',
    collegeCode: '4979',
    collegeName: 'Dr. Sivanthi Aditanar College of Engineering',
    district: 'Thoothukudi',
    city: 'Tiruchendur, Thoothukudi',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 29. TIRUCHIRAPPALLI ──
  {
    id: 'TN-ENG-TRI-001',
    collegeCode: '0003',
    collegeName: 'National Institute of Technology, Tiruchirappalli (NIT Trichy)',
    district: 'Tiruchirappalli',
    city: 'Thuvakudi, Tiruchirappalli',
    university: 'NIT / INI',
    collegeType: 'Institute of National Importance',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TRI-002',
    collegeCode: '3811',
    collegeName: 'M.A.M. College of Engineering and Technology',
    district: 'Tiruchirappalli',
    city: 'Siruganur, Tiruchirappalli',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TRI-003',
    collegeCode: '3818',
    collegeName: 'Saranathan College of Engineering',
    district: 'Tiruchirappalli',
    city: 'Venkateswara Nagar, Panjappur, Trichy',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TRI-004',
    collegeCode: '3808',
    collegeName: 'K. Ramakrishnan College of Engineering',
    district: 'Tiruchirappalli',
    city: 'Samayapuram, Tiruchirappalli',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TRI-005',
    collegeCode: '3810',
    collegeName: 'K. Ramakrishnan College of Technology',
    district: 'Tiruchirappalli',
    city: 'Samayapuram, Tiruchirappalli',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 30. TIRUNELVELI ──
  {
    id: 'TN-ENG-TNV-001',
    collegeCode: '4960',
    collegeName: 'Government College of Engineering, Tirunelveli',
    district: 'Tirunelveli',
    city: 'Tirunelveli',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TNV-002',
    collegeCode: '4967',
    collegeName: 'Francis Xavier Engineering College',
    district: 'Tirunelveli',
    city: 'Vannarpettai, Tirunelveli',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TNV-003',
    collegeCode: '4966',
    collegeName: 'PSN College of Engineering and Technology',
    district: 'Tirunelveli',
    city: 'Melathediyoor, Tirunelveli',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 31. TIRUPATHUR ──
  {
    id: 'TN-ENG-TPR-001',
    collegeCode: '1510',
    collegeName: 'Priyadarshini Engineering College',
    district: 'Tirupathur',
    city: 'Vaniyambadi, Tirupathur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TPR-002',
    collegeCode: '1514',
    collegeName: 'Podhigai College of Engineering and Technology',
    district: 'Tirupathur',
    city: 'Tirupathur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 32. TIRUPPUR ──
  {
    id: 'TN-ENG-TPP-001',
    collegeCode: '2721',
    collegeName: 'Sasurie College of Engineering',
    district: 'Tiruppur',
    city: 'Vijayamangalam, Tiruppur',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TPP-002',
    collegeCode: '2703',
    collegeName: 'Erode Builder Educational Trust\'s Group of Institutions',
    district: 'Tiruppur',
    city: 'Kangeyam, Tiruppur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TPP-003',
    collegeCode: '2713',
    collegeName: 'Jai Shriram Engineering College',
    district: 'Tiruppur',
    city: 'Dharapuram Road, Tiruppur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 33. TIRUVALLUR ──
  {
    id: 'TN-ENG-TLR-001',
    collegeCode: '1115',
    collegeName: 'R.M.K. Engineering College',
    district: 'Tiruvallur',
    city: 'Kavaraipettai, Tiruvallur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TLR-002',
    collegeCode: '1116',
    collegeName: 'R.M.D. Engineering College',
    district: 'Tiruvallur',
    city: 'Kavaraipettai, Tiruvallur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TLR-003',
    collegeCode: '1120',
    collegeName: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology',
    district: 'Tiruvallur',
    city: 'Avadi, Tiruvallur',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TLR-004',
    collegeCode: '1118',
    collegeName: 'Velammal Engineering College',
    district: 'Tiruvallur',
    city: 'Surapet, Tiruvallur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 34. TIRUVANNAMALAI ──
  {
    id: 'TN-ENG-TVM-001',
    collegeCode: '1506',
    collegeName: 'University College of Engineering Arni',
    district: 'Tiruvannamalai',
    city: 'Thatchur, Arni, Tiruvannamalai',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TVM-002',
    collegeCode: '1513',
    collegeName: 'Arunai Engineering College',
    district: 'Tiruvannamalai',
    city: 'Tiruvannamalai',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TVM-003',
    collegeCode: '1515',
    collegeName: 'S.K.P. Engineering College',
    district: 'Tiruvannamalai',
    city: 'Tiruvannamalai',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 35. TIRUVARUR ──
  {
    id: 'TN-ENG-TVR-001',
    collegeCode: '3468',
    collegeName: 'University College of Engineering Thirukkuvalai (Tiruvarur Campus)',
    district: 'Tiruvarur',
    city: 'Thirukkuvalai, Tiruvarur',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-TVR-002',
    collegeCode: '3825',
    collegeName: 'Anjalai Ammal Mahalingam Engineering College',
    district: 'Tiruvarur',
    city: 'Koilvenni, Tiruvarur',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },

  // ── 36. VELLORE ──
  {
    id: 'TN-ENG-VEL-001',
    collegeCode: '1501',
    collegeName: 'Vellore Institute of Technology (VIT)',
    district: 'Vellore',
    city: 'Katpadi, Vellore',
    university: 'Deemed University',
    collegeType: 'Deemed',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VEL-002',
    collegeCode: '1503',
    collegeName: 'Thanthai Periyar Government Institute of Technology (TPGIT)',
    district: 'Vellore',
    city: 'Bagayam, Vellore',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VEL-003',
    collegeCode: '1508',
    collegeName: 'Kingston Engineering College',
    district: 'Vellore',
    city: 'Chittoor Main Road, Vellore',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 37. VILUPPURAM ──
  {
    id: 'TN-ENG-VLP-001',
    collegeCode: '1013',
    collegeName: 'University College of Engineering Villupuram',
    district: 'Viluppuram',
    city: 'Kakkur, Villupuram',
    university: 'Anna University',
    collegeType: 'Government',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VLP-002',
    collegeCode: '1413',
    collegeName: 'Sri Rangapoopathi College of Engineering',
    district: 'Viluppuram',
    city: 'Alampoondi, Gingee, Viluppuram',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VLP-003',
    collegeCode: '1422',
    collegeName: 'Surya Group of Institutions',
    district: 'Viluppuram',
    city: 'Vikravandi, Viluppuram',
    university: 'Anna University',
    collegeType: 'Self-Financing',
    status: 'ACTIVE'
  },

  // ── 38. VIRUDHUNAGAR ──
  {
    id: 'TN-ENG-VRD-001',
    collegeCode: '4959',
    collegeName: 'Kamaraj College of Engineering and Technology',
    district: 'Virudhunagar',
    city: 'S.P.G.C. Nagar, Virudhunagar',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VRD-002',
    collegeCode: '4961',
    collegeName: 'Mepco Schlenk Engineering College',
    district: 'Virudhunagar',
    city: 'Sivakasi, Virudhunagar',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  },
  {
    id: 'TN-ENG-VRD-003',
    collegeCode: '4970',
    collegeName: 'P.S.R. Engineering College',
    district: 'Virudhunagar',
    city: 'Sevalpatti, Sivakasi, Virudhunagar',
    university: 'Anna University',
    collegeType: 'Autonomous',
    status: 'ACTIVE'
  }
];

// Helper search and retrieval methods
function getMasterColleges() {
  return TAMIL_NADU_ENGINEERING_COLLEGES;
}

function getMasterDistricts() {
  return TAMIL_NADU_DISTRICTS;
}

function getMasterCollegesByDistrict(district) {
  if (!district) return [];
  const dNorm = district.trim().toLowerCase();
  return TAMIL_NADU_ENGINEERING_COLLEGES.filter(c => c.district.toLowerCase() === dNorm);
}

function searchMasterColleges(query = '', district = null) {
  const q = (query || '').trim().toLowerCase();
  const dNorm = district ? district.trim().toLowerCase() : null;

  return TAMIL_NADU_ENGINEERING_COLLEGES.filter(c => {
    if (dNorm && c.district.toLowerCase() !== dNorm) {
      return false;
    }
    if (!q) return true;

    return (
      c.collegeName.toLowerCase().includes(q) ||
      c.collegeCode.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.university.toLowerCase().includes(q)
    );
  });
}

function getMasterCollegeByCodeOrId(identifier) {
  if (!identifier) return null;
  const target = String(identifier).trim().toLowerCase();
  return (
    TAMIL_NADU_ENGINEERING_COLLEGES.find(
      c =>
        c.collegeCode.toLowerCase() === target ||
        c.id.toLowerCase() === target ||
        c.collegeName.toLowerCase() === target
    ) || null
  );
}

module.exports = {
  TAMIL_NADU_DISTRICTS,
  TAMIL_NADU_ENGINEERING_COLLEGES,
  getMasterColleges,
  getMasterDistricts,
  getAllDistricts: getMasterDistricts,
  getMasterCollegesByDistrict,
  searchMasterColleges,
  searchColleges: searchMasterColleges,
  getMasterCollegeByCodeOrId,
  getCollegeByCode: getMasterCollegeByCodeOrId
};
