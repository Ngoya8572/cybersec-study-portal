const db = require('./db');

const UNITS = [
  {
    id:'cybersecurity-basics', title:'Introduction to Cyber Security', icon:'🛡️',
    summary:'Understand information security, threats, vulnerabilities and core security principles.',
    lessons:[
      {t:'What is Cyber Security?',h:'Cyber security is the practice of protecting computers, networks, applications and data from unauthorized access, damage or disruption. It combines people, processes and technology.'},
      {t:'The CIA Triad',h:'Confidentiality means information is accessible only to authorized people. Integrity means information remains accurate and unaltered. Availability means systems and data are accessible when needed.'},
      {t:'Threats, vulnerabilities and risks',h:'A threat is something capable of causing harm. A vulnerability is a weakness that can be exploited. Risk is the likelihood and impact of a threat exploiting a vulnerability.'}
    ],
    quiz:[
      {q:'Which three principles form the CIA triad?',o:['Control, Internet, Access','Confidentiality, Integrity, Availability','Cyber, Information, Authentication','Confidentiality, Inspection, Authorization'],a:1,w:'The CIA triad consists of confidentiality, integrity and availability.'},
      {q:'A weakness in a system that can be exploited is called a:',o:['Threat','Vulnerability','Control','Backup'],a:1,w:'A vulnerability is a weakness that may be exploited by a threat.'},
      {q:'Which principle ensures data is accessible when required?',o:['Integrity','Confidentiality','Availability','Authentication'],a:2,w:'Availability concerns reliable and timely access to systems and data.'}
    ]
  },
  {
    id:'network-security',title:'Network Security',icon:'🌐',
    summary:'Learn network concepts, common attacks and ways to secure network communication.',
    lessons:[
      {t:'Network security overview',h:'Network security protects network infrastructure and traffic from unauthorized access, misuse, modification and disruption. Common controls include firewalls, segmentation and monitoring.'},
      {t:'IP addresses and ports',h:'An IP address identifies a device or interface on a network. A port identifies a service or application endpoint. For example, HTTPS commonly uses TCP port 443.'},
      {t:'Firewalls and monitoring',h:'A firewall applies traffic rules to allow or block network connections. Monitoring tools inspect logs and traffic to identify unusual or malicious activity.'}
    ],
    quiz:[
      {q:'What does an IP address identify?',o:['A network interface/device','A password','A file type','A programming language'],a:0,w:'An IP address identifies a device interface on an IP network.'},
      {q:'Which port is commonly used by HTTPS?',o:['21','25','80','443'],a:3,w:'HTTPS commonly uses TCP port 443.'},
      {q:'What is the main purpose of a firewall?',o:['Create documents','Filter network traffic','Increase screen brightness','Compile programs'],a:1,w:'Firewalls enforce rules that permit or block network traffic.'}
    ]
  },
  {
    id:'linux-security',title:'Linux and System Security',icon:'🐧',
    summary:'Explore Linux basics, permissions, users, processes and secure system administration.',
    lessons:[
      {t:'Linux file system and commands',h:'Linux organizes files in a hierarchical directory tree. Useful commands include pwd (current directory), ls (list files), cd (change directory), mkdir (create directory) and cp (copy files).'},
      {t:'Users and permissions',h:'Linux permissions control read (r), write (w) and execute (x) access for owner, group and others. Use least privilege: give each account only the access it needs.'},
      {t:'Updates and services',h:'Keep packages updated, disable unnecessary services, use strong authentication and review logs. On Debian-based systems, apt update refreshes package lists and apt upgrade installs available updates.'}
    ],
    quiz:[
      {q:'Which command displays the current working directory?',o:['ls','pwd','mkdir','whoami'],a:1,w:'pwd prints the current working directory.'},
      {q:'What does the Linux permission letter r mean?',o:['Run','Rename','Read','Remove'],a:2,w:'r stands for read permission.'},
      {q:'Which principle gives users only the access they need?',o:['Least privilege','Open access','Shared password','Default allow'],a:0,w:'Least privilege limits access to what is necessary for a task.'}
    ]
  },
  {
    id:'programming-fundamentals',title:'Programming Fundamentals with C',icon:'💻',
    summary:'Build programming foundations using variables, conditions, loops and functions in C.',
    lessons:[
      {t:'Structure of a C program',h:'A simple C program includes headers such as stdio.h and a main function. Example: #include <stdio.h> followed by int main(void) { printf("Hello"); return 0; }'},
      {t:'Variables and data types',h:'Variables store values. Common C types include int for integers, float for decimal values, char for characters and double for higher-precision decimal values.'},
      {t:'Decision making',h:'The if statement runs code when a condition is true. if...else selects between two paths. else if checks multiple conditions in sequence. Use == for comparison and = for assignment.'}
    ],
    quiz:[
      {q:'Which function is the usual entry point of a C program?',o:['start()','main()','printf()','include()'],a:1,w:'Execution of a standard hosted C program begins at main().'},
      {q:'Which operator tests equality in C?',o:['=','==','!=','<='],a:1,w:'== compares two values; = assigns a value.'},
      {q:'Which data type stores a whole number?',o:['int','char','float','void'],a:0,w:'int is commonly used for integer values.'}
    ]
  },
  {
    id:'digital-forensics',title:'Digital Forensics',icon:'🔎',
    summary:'Learn evidence handling, forensic processes, imaging and basic investigation principles.',
    lessons:[
      {t:'What is digital forensics?',h:'Digital forensics is the disciplined identification, preservation, acquisition, examination, analysis and reporting of digital evidence.'},
      {t:'Evidence integrity and chain of custody',h:'Preserve original evidence, document every handling step and maintain a chain-of-custody record. Hashes such as SHA-256 can help verify that an acquired image has not changed.'},
      {t:'Forensic imaging',h:'A forensic image is a bit-for-bit copy of digital media. Investigators work from verified copies where possible and document tools, settings, dates and results.'}
    ],
    quiz:[
      {q:'What is the purpose of a hash in digital forensics?',o:['To edit evidence','To help verify integrity','To delete files','To encrypt every folder'],a:1,w:'A cryptographic hash can help detect changes to evidence.'},
      {q:'What does chain of custody document?',o:['Internet speed','Who handled evidence and when','Computer screen size','User interface design'],a:1,w:'It records the possession, transfer and handling of evidence.'},
      {q:'A forensic image is generally:',o:['A screenshot only','A bit-for-bit media copy','A compressed photo','A password list'],a:1,w:'A forensic image aims to preserve a bit-for-bit copy of the source media.'}
    ]
  },
  {
    id:'ethical-hacking',title:'Ethical Hacking and Penetration Testing',icon:'🧪',
    summary:'Understand authorized security testing, methodology, scope and responsible reporting.',
    lessons:[
      {t:'Ethical hacking principles',h:'Ethical hacking is security testing performed with explicit authorization and a defined scope. Never test systems you do not own or have permission to assess.'},
      {t:'Testing methodology',h:'A controlled assessment typically includes planning and scope definition, reconnaissance, vulnerability identification, safe validation, analysis and reporting.'},
      {t:'Responsible reporting',h:'Reports should explain the finding, affected assets, evidence, risk, impact and practical remediation. Avoid unnecessary access, disruption or exposure of personal data.'}
    ],
    quiz:[
      {q:'What must be obtained before penetration testing?',o:['A public Wi-Fi password','Explicit authorization and scope','A social media account','A new operating system'],a:1,w:'Testing requires explicit permission and a clearly defined scope.'},
      {q:'What is the purpose of a penetration-test report?',o:['Hide vulnerabilities','Communicate findings and remediation','Publish passwords','Disable monitoring'],a:1,w:'The report helps the owner understand and fix security weaknesses.'},
      {q:'Which approach is responsible during testing?',o:['Cause maximum disruption','Access unrelated systems','Stay within agreed scope','Share discovered credentials publicly'],a:2,w:'Ethical testing must remain within the approved scope.'}
    ]
  }
];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) n FROM units').get().n;
  if (existing) {
    console.log(`Database already contains ${existing} units; seed skipped.`);
    return;
  }
  const insertUnit = db.prepare('INSERT INTO units(slug,title,icon,summary,position) VALUES(?,?,?,?,?)');
  const insertLesson = db.prepare('INSERT INTO lessons(unit_id,title,content,position) VALUES(?,?,?,?)');
  const insertQuestion = db.prepare('INSERT INTO questions(unit_id,question,options,correct_index,explanation,position) VALUES(?,?,?,?,?,?)');
  const tx = db.transaction(() => {
    UNITS.forEach((u,i) => {
      const id = insertUnit.run(u.id,u.title,u.icon,u.summary,i).lastInsertRowid;
      u.lessons.forEach((l,j) => insertLesson.run(id,l.t,l.h,j));
      u.quiz.forEach((q,j) => insertQuestion.run(id,q.q,JSON.stringify(q.o),q.a,q.w,j));
    });
  });
  tx();
  console.log(`Seeded ${UNITS.length} course units.`);
}
seed();
