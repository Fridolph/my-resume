export default {
  download: 'Download PDF',
  anchor: {
    a1: 'Education',
    a2: 'Professional',
    a3: 'Experience',
    a4: 'Project',
  },
  avatar: {
    p1: 'Love Coding, life is endless, endless tossing',
    p2: 'Love badminton. Like sports, ames, music ...',
  },
  baseinfo: {
    title: 'Basic information',
    r1: 'Name',
    r1v: 'Yinsheng Fu',
    r2: 'Education',
    r2v: 'Communication Engineering',
    r3: 'Experience',
    r3v: '8 years',
    r4: 'location',
    r4v: 'Chengdu High-tech Zone',
    r5: 'Job intention',
    r5v: 'Front-end engineer',
  },
  contact: {
    title: 'Contact',
    r1: 'Telphone',
    r2: 'Email',
    r4: 'Blog',
  },
  hobbies: 'Hobbies',
  education: {
    title: 'Education',
    r1: 'Sichuan University Jinjiang College / Communication Engineering',
    r1v: '2012.09——2016.06',
    verify: 'Verifify ChSi',
    alt: 'Online code',
    p1: '1. Inspection of verification report -> ',
    p2: '2. Use App to scan the QR code',
    check: 'View screenshot',
    updated: '(Updated on Feb 18, 2024)'
  },
  skill: {
    title: 'Professional skills',

    p1: `Proficient in HTML, CSS, JS, ES6, and TS syntax, familiar with the HTTP protocol.`,

    p2: `Familiar with the Vue ecosystem, including ElementUI, iView, NaiveUI, and the new features and Composition API of Vue3.`,

    p3: `Familiar with routine Webpack and Vite configuration, loaders, plugins, as well as performance optimization settings.`,

    p4: `Experienced in front-end unit testing, established Vue component unit testing standards and processes for the team.`,

    p5: `Understand Gitlab CI configuration process and collaborate with Jenkins to complete the deployment and launch of front-end projects.`,

    p6: `Worked on government projects with strict and comprehensive practices in web security.`,

    p7: `Familiar with common Linux commands and development environments.`,
  },
  work: 'Work Experience',
  responsibilities: 'Job content and responsibilities',
  wskp: {
    name: 'OneScorpion Technology Co., Ltd.',
    time: 'July 2017 - January 2024',
    d1: 'Responsible for building the front-end architecture of the project, determining the technical framework, and clarifying team development specifications;',
    d2: 'Organize product requirements documents and write development documents;',
    d3: 'Cooperate with designers in front-end development to complete the needs and functions of products and customers;',
    d4: 'Negotiate the data interface with the back-end engineer to complete the front-end and back-end data interaction;',
    d5: 'Complete project-related requirement development, self-test and Code Review, and provide timely feedback on test-related issues;',
    d6: 'Team Leader, team building and resource sharing. ',
  },
  stack: 'Technology',
  refactor: 'Refactor',
  contributions: 'Contributions',
  hard: 'Difficulties',
  proEdr: {
    name: 'Terminal detection and response platform',
    description:
      'The project explains the concept of EDR, which monitors processes and files on user terminals in real-time through probes and reports the data back to the server in real-time for aggregation. Finally, the aggregated data is displayed on the web interface for security analysts to review. It has achieved early warning and prediction of malicious code, significantly improving the security level for clients. As the front-end leader, my primary responsibility is the development and maintenance of the web front-end part of the project.',
      
    c1: `Responsible for the front-end architecture of the project, including refining the basic modules and utils, writing detailed documentation and example code, guiding <b>the team to follow best practices and development processes</b>.`,

    c2: `Implemented a home page security overview and configurable display, enhancing <b>user experience and customer satisfaction</b>.`,
    
    c3: `Completed the asset detail page, obtaining and displaying online terminal information through <b>Websocket</b>, improving performance and real-time responsiveness.`,
    
    c4: `Encapsulated business components like API requests, advanced search, filters, PowerShell, etc., <b>increasing development efficiency</b>.`,
    
    c5: `Designed front-end filtering and pre-caching solutions for pages like alerts and processes which request large amounts of data, boosting page loading speed and performance.`,
    
    c6: `Customized pages and added export functions for html, pdf, and excel (custom reports).`,
    
    c7: `Responsible for the <b>private deployment</b> solution of this ToB project and related performance optimizations.`,
    
    h1: `Designing advanced search and filters was complex due to the multitude of form items, the need for data linkage, and the necessity to consider security to block some sensitive data <b>complexities in design</b>.`,
    
    h2: `Used third-party <b>vxe-table</b> to implement complex tables, taking into account large amounts of interface data, extensive content to display, numerous columns, and intense user interactions, with customization in mind.`,
    
    h3: `When a single alert interface had too much data (over 1k entries), the display and rendering post-processing was considered, using <b>Web Worker</b> for parallel processing to enhance performance.`,
  },
  proAdmin: {
    name: 'Integrated management system',
    description: `The company's core project, this system is used to manage user permissions and customize the display of functional modules.`,
    c1: `Led and completed the upgrade of the project architecture to Vue3, including related configuration and build work, improving development efficiency.`,
    c2: `Defined theme variables and wrote standard component specifications for the team, enhancing the readability and consistency of team code.`,
    c3: `Component encapsulation: common forms, file upload, and advanced search, etc., which improved development efficiency and maintained user interface consistency.`,
    c4: `Designed and developed the system authorization module, including routing and menu permissions.`,
    c5: `Designed roles such as administrators and client leaders; different roles were assigned different permissions to ensure system security.`,
    c6: `Customized forms and their validations, achieving display and linkage effects with searches and related lists, charts, templates, etc.`
    // h1: 'Filtering, processing and display of complex list information',
    // h2: 'Customized form, verification, data linkage and display',
    // h3: 'User-customized smtp service related settings and activation',
    // h4: 'Linkage between search and display of lists, charts, templates and search terms',
  },
  proLarge: {
    name: 'Security analysis big screen',
    description:
      'Combined with the EDR project, a visual chart is finally used to explain to users whether the current network environment is safe.',
    d1: 'Use CSS and Svg as possible to improve loading speed',
    d2: 'Display processing of non-core display under lg size',
    d3: 'ATT&CK heat map regular display',
    h1: 'Related performance optimization',
    h2: 'ECharts and d3 draw each sub-module',
    h3: 'Each chart rendering is updated in real time',
    h4: 'Layout responsive',
  },
  team: {
    name: 'Team building',
    wskpuiDesc:
      'Intranet online documentation. The original intention is to make it easier for product and design colleagues to review. Having a physical object allows for better communication and timely feedback.',
    main: 'Core content',
    m1: 'The team develops UI specifications; clarifies public variable names, theme color values, etc.;',
    m2: 'Front-end code specifications (including ESlint, Prettier and other configurations, module, component naming, writing and other conventions);',
    m3: 'theme related theme variables, normalize, mixin, etc.;',
    m4: 'Secondary encapsulation of business components, providing demo examples for products and UI;',
    m5: 'Unit testing at the granularity of basic components;',
    m6: 'A supporting vuepress document that is as detailed as possible to facilitate future generations. ',
    grow: 'Growth',
    g1: 'Sense of team participation, members gain a sense of accomplishment',
    g2: 'Review each submission and learn from each other',
    g3: 'Pay more attention to feedback and user experience',
    mockDesc:
      'Deploy easy-mock to the intranet, and axios simulates request data for real development. ',
    deployDesc: `Automated packaging and rapid deployment solution, convenient for developers and testers. After selecting the project and branch configurations, it automatically packages and generates the Dist, automatically assigns IP and ports, and deploys to the intranet for quick demonstration and testing. `,
  },
  aili: {
    name: 'Sichuan Aili Technology Co., Ltd.',
    time: '2016.01——2017.07',
    r1: "- Participated in the development of the company's main project interface and the development of the Aili official website pages.",
    r2: '- Accurately replicated the provided design drawings to ensure consistency between the front-end pages and the design drawings.',
    r3: '- Decomposed the sub-modules of the pages into reusable components to improve development efficiency and code maintainability.',
    r4: '- Responsively adapted front-end pages for mainstream mobile devices.',
    r5: 'Worked closely with the backend development team to complete the integration of front-end pages with backend interfaces.',
    pj: 'Global Etiquette Knowledge Platform',
    pjDesc:
      'Traditional content-based community comprehensive website, similar to Jianshu and Xiaohongshu. ',
    para: `At the end of 2016, in order to optimize the content of the platform, the architecture was upgraded. Especially the front-end undergoes a major reconstruction`,
    c1: '- Take pages as units, rapid development iteration, static pages and related style coding',
    c2: '- Encapsulation of some tool modules, such as scrolling, full-screen effects, toolbars, animation and transition-related mixins',
    c3: '- Encapsulation of the page module so that it can be displayed well on both PC and mobile terminals',
    h1: '- Project reconstruction, various changes, adjustments and adaptations faced due to changes in the underlying framework',
    h2: '- Learn JSX, understand the concept of Redux one-way data flow, changes in front-end development models and thinking',
    h3: '- It’s a pitfall. Some functions still require the use of jQuery and plug-ins. In the early days, it was difficult to describe jQuery in React.',
    g1: '- From the traditional static page development model to the modern front-end engineering development model',
    g2: '-Learn BootStrap, customize UI components, and re-encapsulate',
    g3: '- Master the application of responsive layout, transition and animation',
    g4: '- Change the way of thinking of traditional DOM operations and understand the core idea of state change view',
    g5: '- Understand and master the idea of componentization through learning and using React',
    
  },
  personal: {
    title: 'Project & Open-Source',
    r1: 'Comprehensive learning materials storage',
    recommend: 'Recommend',
    r1_t1: 'Do you really understand EDR?',
    r1_t2: 'Learn responsive design',
    r2: 'Online resume, quickly built with Vite + TailWindCSS',
    r3: 'demo warehouse, simple CSS and JS implementation',
    r3_t1: 'CSS3 Transform common effects',
    r4: 'Vue3 + Vite + TS4 build your compopnent library',
    r5: 'Front-end interview',
    b1: 'Vue Source',
    b3: 'ESNext',
    b5: 'Safe',
    b6: 'Performance',
  },
  thanks: {
    title: 'Acknowledgments',
    p1: 'Thank you for taking the time to read my resume. My name is Yinsheng Fu.  ^_^ ',
    p2: 'A front-end engineer who likes badminton, I look forward to the opportunity to work with you!'
  }
}
