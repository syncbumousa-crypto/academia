"""The majors, by college — shared by kinds_2026.py and check_catalog.py so
the two can never disagree about who belongs where.

COLLEGES   college -> generations of plans -> majors. A college's majors
           share its college courses; "most majors of the college" is
           counted within a generation (the Business School has the
           2026 plans and the earlier ones, each with its own core).
HOME       the subject prefixes of each major's own department: a plan
           course from them is always the major's own course, even a
           common or college one (MATH 101 for Mathematics, MKT 250 for
           Marketing).
SCIENCE    math & science prefixes: their 100/200-level plan courses are
           college courses (outside the major's own department).
"""

COLLEGES = {
    'business': [['acf', 'ffe', 'dsmm', 'fte', 'baai', 'osc'],
                 ['mis', 'acct', 'fin', 'mgt', 'mkt', 'hrm']],
    'computing': [['cs', 'swe', 'coe', 'ise', 'amai', 'dse', 'sde', 'aics', 'math', 'asfm']],
    'chemicals': [['che', 'mse', 'chem', 'bioe', 'bioepm']],
    'petroleum': [['pete', 'geop', 'geol', 'mine']],
    'design': [['ce', 'are', 'idsn', 'ssc', 'ese']],
    'engineering': [['ae', 'ee', 'me', 'phys', 'cie', 'eep']],
}

HOME = {'mis': ['MIS'], 'acf': ['ACF', 'ACCT'], 'ffe': ['FFE', 'FIN'], 'dsmm': ['DSMM', 'MKT'], 'fte': ['FNT', 'ENTR'],
        'baai': ['BAI'], 'osc': ['OSC', 'OM'], 'acct': ['ACCT'], 'fin': ['FIN'], 'mgt': ['MGT'], 'mkt': ['MKT'],
        'hrm': ['HRM'], 'cs': ['ICS'], 'swe': ['SWE'], 'coe': ['COE'], 'ise': ['ISE'], 'amai': ['MATH'],
        'dse': ['DATA'], 'sde': ['SDE'], 'aics': ['AISC'], 'math': ['MATH'], 'asfm': ['AS'], 'che': ['CHE'],
        'mse': ['MSE'], 'chem': ['CHEM'], 'bioe': ['BIOE'], 'bioepm': ['BIOE'], 'pete': ['PETE'], 'geop': ['GEOP'],
        'geol': ['GEOL'], 'mine': ['MINE'], 'ce': ['CE'], 'are': ['ARE'], 'idsn': ['ITD'], 'ssc': ['SSC'],
        'ese': ['ESE'], 'ae': ['AE'], 'ee': ['EE'], 'me': ['ME'], 'phys': ['PHYS'], 'cie': ['CIE'],
        'eep': ['EE', 'PHYS']}

SCIENCE = {'MATH', 'STAT', 'PHYS', 'CHEM', 'BIOL'}

COLLEGE_OF = {t: c for c, gens in COLLEGES.items() for g in gens for t in g}
MAJORS = [t for gens in COLLEGES.values() for g in gens for t in g]


def is_home(code, tag):
    return code.split()[0] in HOME[tag]
