-- موادُّ صناديق الاختياريّ الناقصة. مولَّد بـ_addcourses.py، لا يُحرَّر بيد.
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 303','محاسبة 303','Computer Control and Audit',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 303','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 304','محاسبة 304','International Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 304','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 305','محاسبة 305','Accounting for Governmental & Non-Profit Entities',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 305','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 306','محاسبة 306','Zakat & Income Tax Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 306','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 307','محاسبة 307','Islamic Financial Jurisprudence',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 307','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 311','محاسبة 311','Auditing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 311','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 314','محاسبة 314','Computer Control and Audit',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 314','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 401','محاسبة 401','Cost Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 401','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 402','محاسبة 402','Managerial Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 402','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 404','محاسبة 404','Auditing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 404','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 405','محاسبة 405','Accounting Theory & Research',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 405','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 406','محاسبة 406','Internal Auditing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 406','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 408','محاسبة 408','Zakat and Business Tax Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 408','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 409','محاسبة 409','International BusinessTaxation',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 409','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 411','محاسبة 411','Cost Management & Management Control',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 411','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 420','محاسبة 420','Petroleum Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 421','محاسبة 421','Oil & Gas Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 421','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 495','محاسبة 495','Special topics in Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ACCT 499','محاسبة 499','Special topics in Accounting',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ACCT 499','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 301','اقتصاد 301','Intermediate Microeconomic Theory',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 301','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 302','اقتصاد 302','Intermediate Macroeconomic Theory',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 302','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 305','اقتصاد 305','Money & Banking',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 305','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 330','اقتصاد 330','Labor Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 330','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 401','اقتصاد 401','Managerial Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 401','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 403','اقتصاد 403','Engineering Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 403','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 410','اقتصاد 410','International Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 410','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 415','اقتصاد 415','Public Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 415','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 420','اقتصاد 420','Islamic Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 425','اقتصاد 425','Economic Development',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 425','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 450','اقتصاد 450','Introduction to Energy Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 450','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ECON 495','اقتصاد 495','Special Topics in Economics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ECON 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 310','ريادة 310','Startup Financing, Venture Capital, and Exit Strategies',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 310','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 320','ريادة 320','Product and Growth Strategy',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 320','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 322','ريادة 322','Introduction to Entrepreneurship',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 322','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 413','ريادة 413','Entrepreneurial Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 413','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 415','ريادة 415','Social Entrepreneurship',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 415','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 416','ريادة 416','Entrepreneurship and New Venture Creation',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 416','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 420','ريادة 420','Venture Launch Innovation Lab',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 423','ريادة 423','Small and Medium Enterprise Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 423','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('ENTR 495','ريادة 495','Special Topics in Entrepreneurship',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('ENTR 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 301','مالية 301','Financial Management I',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 301','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 302','مالية 302','Financial Management II',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 302','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 310','مالية 310','Intermediate Financial Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 310','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 321','مالية 321','Financial Econometrics',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 321','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 410','مالية 410','International Financial Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 410','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 416','مالية 416','Entrepreneurial Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 416','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 420','مالية 420','Investments',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 422','مالية 422','Financial Risk Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 422','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 423','مالية 423','Fixed Income Analysis',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 423','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 424','مالية 424','Investment Valuation',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 424','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 430','مالية 430','Risk Management, Conventional and Islamic Insurance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 430','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 435','مالية 435','Real Estate and Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 435','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 440','مالية 440','Islamic Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 440','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 441','مالية 441','Governance of Islamic Financial Institutions',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 441','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 442','مالية 442','Islamic Capital Markets',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 442','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 443','مالية 443','Accounting of Islamic Financial Institutions',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 443','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 445','مالية 445','Big Data in Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 445','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 450','مالية 450','Case Studies in Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 450','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 460','مالية 460','Futures and Options Markets',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 460','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 470','مالية 470','Financial Engineering',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 470','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 480','مالية 480','Special Topics in Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 480','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('FIN 495','مالية 495','Special Topics in Finance',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('FIN 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 312','موارد 312','Employment Law',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 312','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 403','موارد 403','Compensation and Benefits Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 403','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 406','موارد 406','Business Negotiations',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 406','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 411','موارد 411','International Human Resource Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 411','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 450','موارد 450','Strategic Human Resource Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 450','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('HRM 495','موارد 495','Special Topics in Human Resource Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('HRM 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 312','إدارة 312','Ethics & Social Responsibility',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 312','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 401','إدارة 401','Human Resources Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 401','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 405','إدارة 405','Compensation and Benefits Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 405','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 410','إدارة 410','Organization Behavior & Design',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 410','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 411','إدارة 411','Saudi & International Commercial Arbitration',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 411','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 412','إدارة 412','Entrepreneurship and Small Business Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 412','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 413','إدارة 413','International Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 413','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 415','إدارة 415','Industrial Psychology',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 415','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 420','إدارة 420','Materials Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 425','إدارة 425','Organizational Changes & Development',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 425','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 448','إدارة 448','Project Feasibility Analysis (in Arabic)',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 448','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 475','إدارة 475','Business Strategy & Competitive Advantage',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 475','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MGT 495','إدارة 495','Special Topics in Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MGT 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 302','نظم 302','Business Applications Development',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 302','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 320','نظم 320','Knowledge Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 320','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 325','نظم 325','Human Resources Information Systems',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 325','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 345','نظم 345','Information Technology in Society',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 345','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 355','نظم 355','Enterprise Systems',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 355','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 375','نظم 375','Human Computer Factors in Systems Design',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 375','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 400','نظم 400','Digital Business Project',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 400','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 401','نظم 401','Business Systems Analysis & Design II',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 401','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 402','نظم 402','Electronic Commerce Project',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 402','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 410','نظم 410','Management Support Systems',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 410','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 411','نظم 411','Database Application Development',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 411','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 415','نظم 415','Computer Supported Collaborative Work',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 415','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 420','نظم 420','Computer Control and Audit',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 425','نظم 425','End-User Computing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 425','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 490','نظم 490','Information Resources Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 490','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 495','نظم 495','Special Topics in MIS',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MIS 499','نظم 499','Special Topics in MIS',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MIS 499','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 301','تسويق 301','Principles of Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 301','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 313','تسويق 313','Marketing for Entrepreneurs',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 313','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 320','تسويق 320','Sales Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 320','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 330','تسويق 330','Advertising & Sales Promotion',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 330','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 340','تسويق 340','Retail Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 340','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 380','تسويق 380','Marketing Channels',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 380','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 390','تسويق 390','New Product Development',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 390','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 400','تسويق 400','Industrial Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 400','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 410','تسويق 410','Consumer Behavior',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 410','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 430','تسويق 430','Services Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 430','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 440','تسويق 440','Retail Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 440','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 450','تسويق 450','Strategic Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 450','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 460','تسويق 460','Advertising',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 460','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 470','تسويق 470','Personal Selling and Sales Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 470','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 480','تسويق 480','Internet Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 480','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('MKT 495','تسويق 495','Special Topics in Marketing',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('MKT 495','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 310','عمليات 310','Quantitative Methods for Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 310','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 320','عمليات 320','Introduction to Supply Chain Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 320','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 321','عمليات 321','Procurement and Supplier Relationship Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 321','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 322','عمليات 322','Inventory and Warehouse Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 322','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 323','عمليات 323','Logistics and Transportation Management',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 323','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 405','عمليات 405','Production Planning & Control',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 405','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 407','عمليات 407','Quality Control & Reliability',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 407','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
INSERT INTO courses (code, ar, full, h, lab) VALUES ('OM 420','عمليات 420','Operation Research',3,0)
  ON CONFLICT(code) DO NOTHING;
INSERT INTO course_tags (code, tag_id) VALUES ('OM 420','mis')
  ON CONFLICT(code, tag_id) DO NOTHING;
UPDATE meta SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT) WHERE k = 'catalog_rev';
