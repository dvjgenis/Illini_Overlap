#!/usr/bin/env python3
"""
Improved version: Transform the Programs CSV to focus on minors and certificates.
Uses both csv.reader and DictReader for maximum robustness.
"""

import csv
import re
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

# Import helper functions from original
def parse_catalog_term(term_str: str, catalog: str = '') -> Optional[str]:
    """Parse catalog term to determine if it's up to date."""
    if not term_str or term_str.strip() == '':
        return None
    
    year_match = re.search(r'(\d{4})-(\d{4})', term_str)
    if year_match:
        start_year = int(year_match.group(1))
        current_year = datetime.now().year
        if start_year >= current_year - 1:
            return "Up to date"
        else:
            return f"Outdated (from {start_year})"
    
    if term_str.isdigit() and len(term_str) == 6:
        year_part = int(term_str[:2])
        if year_part >= 22:
            return "Up to date"
        elif year_part >= 20:
            return f"Potentially outdated (term {term_str})"
        else:
            return f"Outdated (term {term_str})"
    
    return term_str

def normalize_course_code(code: str) -> str:
    """Normalize course code format."""
    if not code:
        return ''
    code = code.replace('\u00A0', ' ').replace('\u00AD', ' ')
    code = re.sub(r'\s+', ' ', code.strip())
    return code

def extract_courses(text: str) -> List[str]:
    """Extract course codes from text."""
    if not text:
        return []
    
    pattern = r'\b([A-Z]{2,5})[\s\u00A0\u00AD\u2009\u202F]*(\d{3,4})\b'
    matches = re.findall(pattern, text)
    courses = [f"{dept} {num}" for dept, num in matches]
    
    pattern2 = r'([A-Z]{2,5})[\s\u00A0\u00AD\u2009\u202F]+(\d{3,4})\b'
    matches2 = re.findall(pattern2, text)
    courses2 = [f"{dept} {num}" for dept, num in matches2]
    
    all_courses = list(set(courses + courses2))
    return all_courses

def extract_overlap_info(text: str) -> Optional[str]:
    """Extract information about major overlaps/exclusions."""
    if not text:
        return None
    
    text_lower = text.lower()
    overlap_keywords = [
        'distinct from', 'cannot count toward', 'may not count', 'excluded',
        'not eligible', 'overlap', 'same as major', 'different from major',
        'must be distinct', 'distinct from credit'
    ]
    
    overlap_sentences = []
    sentences = re.split(r'[.!?]\s+', text)
    for sentence in sentences:
        sentence_lower = sentence.lower()
        for keyword in overlap_keywords:
            if keyword in sentence_lower:
                cleaned = sentence.strip()
                if len(cleaned) > 10:
                    overlap_sentences.append(cleaned)
                    break
    
    if overlap_sentences:
        return ' | '.join(overlap_sentences[:2])
    
    return None

def extract_excluded_majors(text: str) -> List[str]:
    """Extract specific major names that are excluded."""
    if not text:
        return []
    
    pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:major|majors|student|students|program)'
    matches = re.findall(pattern, text)
    
    excluded = []
    false_positives = {'General', 'University', 'College', 'Department', 'Program'}
    for match in matches:
        if match not in false_positives and len(match.split()) <= 3:
            excluded.append(match)
    
    return list(set(excluded))

def extract_advisory_approval(text: str) -> bool:
    """Check if advisory approval is mentioned."""
    if not text:
        return False
    
    text_lower = text.lower()
    approval_keywords = [
        'advisor approval', 'advisory approval', 'consult advisor',
        'advisor consultation', 'permission', 'approval required',
        'special permission', 'prior approval', 'academic office', 'minor advisor'
    ]
    
    return any(keyword in text_lower for keyword in approval_keywords)

def extract_credit_hours_from_text(text: str) -> Optional[str]:
    """Extract credit hours information from text."""
    if not text:
        return None
    
    patterns = [
        r'total\s+(?:credit\s+)?hours?[:\s]*(\d+(?:-\d+)?)',
        r'(\d+(?:-\d+)?)\s+(?:credit\s+)?hours?',
        r'hours?[:\s]*(\d+(?:-\d+)?)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(1)
    
    return None

def parse_program_data(csv_file: str) -> List[Dict]:
    """Parse using csv.reader for more control."""
    programs = []
    
    # Read file with csv.reader for precise control
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    rows = None
    
    for encoding in encodings:
        try:
            with open(csv_file, 'r', encoding=encoding, errors='replace') as f:
                reader = csv.reader(f)
                rows = list(reader)
                if rows:
                    break
        except (UnicodeDecodeError, ValueError):
            continue
    
    if not rows:
        return []
    
    header = rows[0]
    data_rows = rows[1:]
    
    # Create column index map
    col_map = {}
    for i, col_name in enumerate(header):
        col_map[col_name] = i
    
    current_program = None
    all_text = []
    current_section_type = None
    
    for i, row in enumerate(data_rows):
        # Ensure row has enough columns
        while len(row) < 33:
            row.append('')
        
        # Get key fields using column indices
        code_col = row[0].strip() if len(row) > 0 else ''
        minor_code = row[13].strip() if len(row) > 13 else ''
        program_name = row[18].strip() if len(row) > 18 else ''
        status = row[32].strip() if len(row) > 32 else ''
        body_text = row[26].strip() if len(row) > 26 else ''
        
        # Check if this is a new program header
        is_program_header = False
        if minor_code:
            # Has minor_code - check if it's different from current program
            if not current_program or current_program.get('code') != minor_code:
                is_program_header = True
        elif program_name and ('minor' in program_name.lower() or 'certificate' in program_name.lower() or 'cert' in program_name.lower()):
            # Has program name indicating minor/cert - check if it's different
            if not current_program or current_program.get('name') != program_name:
                is_program_header = True
        
        if is_program_header and status.lower() != 'deleted':
            # Save previous program
            if current_program:
                programs.append(current_program)
            
            # Start new program
            prog_code = minor_code or code_col
            current_program = {
                'program_type': 'Minor' if 'minor' in program_name.lower() else 'Certificate',
                'name': program_name,
                'code': prog_code,
                'college': row[24].strip() if len(row) > 24 else '',
                'department': row[25].strip() if len(row) > 25 else '',
                'effective_catalog_term': row[7].strip() if len(row) > 7 else '',
                'effective_catalog': row[8].strip() if len(row) > 8 else '',
                'status': status,
                'credit_hours': None,
                'required_courses': [],
                'elective_courses': [],
                'prerequisites': row[10].strip() if len(row) > 10 else '',
                'prerequisites_picker': row[11].strip() if len(row) > 11 else '',
                'description': body_text,
                'proposal_title': row[21].strip() if len(row) > 21 else '',
                'notes': [],
                'overlap_info': None,
                'excluded_majors': [],
                'advisory_approval_required': False,
                'up_to_date': None,
            }
            all_text = [body_text] if body_text else []
            current_section_type = None
        
        # Process row as part of current program (if we have one)
        if current_program:
            # Collect text
            if body_text:
                all_text.append(body_text)
            
            # Check credit hours columns
            for col_idx in [14, 15, 16, 17]:
                if len(row) > col_idx and row[col_idx].strip():
                    if not current_program['credit_hours']:
                        current_program['credit_hours'] = row[col_idx].strip()
                        break
            
            # Detect section type
            if body_text:
                body_lower = body_text.lower()
                if any(kw in body_lower for kw in ['required', 'core', 'must take', 'courses required']):
                    current_section_type = 'required'
                elif any(kw in body_lower for kw in ['elective', 'select', 'choose', 'pick', 'option']):
                    current_section_type = 'elective'
            
            # Extract courses from body text
            normalized_body = normalize_course_code(body_text)
            is_course_row = False
            course_code = None
            
            # Check if body starts with course code
            if normalized_body:
                match = re.match(r'^([A-Z]{2,5})\s+(\d{3,4})(?:\s|$)', normalized_body)
                if match:
                    is_course_row = True
                    course_code = f"{match.group(1)} {match.group(2)}"
            
            if is_course_row and course_code:
                if current_section_type == 'elective':
                    if course_code not in current_program['elective_courses']:
                        current_program['elective_courses'].append(course_code)
                else:
                    if course_code not in current_program['required_courses']:
                        current_program['required_courses'].append(course_code)
            
            # Extract all courses from text
            courses_in_text = extract_courses(body_text)
            for course in courses_in_text:
                if course in current_program['required_courses'] or course in current_program['elective_courses']:
                    continue
                
                dept, num = course.split()
                if len(dept) < 2 or len(dept) > 5 or len(num) < 3 or len(num) > 4:
                    continue
                
                body_lower = body_text.lower()
                if any(kw in body_lower for kw in ['required', 'core', 'must take']):
                    if course not in current_program['required_courses']:
                        current_program['required_courses'].append(course)
                elif any(kw in body_lower for kw in ['elective', 'select', 'choose']):
                    if course not in current_program['elective_courses']:
                        current_program['elective_courses'].append(course)
                elif current_section_type == 'elective':
                    if course not in current_program['elective_courses']:
                        current_program['elective_courses'].append(course)
                else:
                    if course not in current_program['required_courses']:
                        current_program['required_courses'].append(course)
            
            # Extract credit hours from text
            if not current_program['credit_hours'] and body_text:
                credit_from_text = extract_credit_hours_from_text(body_text)
                if credit_from_text:
                    current_program['credit_hours'] = credit_from_text
            
            # Collect notes
            if body_text and len(body_text) > 30:
                if not re.match(r'^[\d\s\u00A0]+$', body_text) and not re.match(r'^[A-Z]{2,5}\s+\d{3,4}', body_text):
                    if body_text not in current_program['notes']:
                        current_program['notes'].append(body_text)
    
    # Save last program
    if current_program:
        programs.append(current_program)
    
    # Post-process
    for program in programs:
        term = program['effective_catalog_term']
        catalog = program['effective_catalog']
        program['up_to_date'] = parse_catalog_term(term, catalog)
        
        all_program_text = ' '.join(all_text + [
            program.get('description', ''),
            program.get('prerequisites', ''),
            program.get('prerequisites_picker', '')
        ])
        
        overlap = extract_overlap_info(all_program_text)
        if overlap:
            program['overlap_info'] = overlap
        
        excluded = extract_excluded_majors(all_program_text)
        if excluded:
            program['excluded_majors'] = excluded
        
        program['advisory_approval_required'] = extract_advisory_approval(all_program_text)
        
        prereq_courses = []
        if program.get('prerequisites'):
            prereq_courses.extend(extract_courses(program['prerequisites']))
        if program.get('prerequisites_picker'):
            prereq_courses.extend(extract_courses(program['prerequisites_picker']))
        program['prerequisites_courses'] = list(set(prereq_courses))
    
    return programs

def write_output_csv(programs: List[Dict], output_file: str):
    """Write programs to a refined CSV format."""
    fieldnames = [
        'program_type', 'name', 'code', 'college', 'department', 'credit_hours',
        'required_courses', 'elective_courses', 'prerequisites', 'prerequisites_courses',
        'advisory_approval_required', 'up_to_date', 'effective_catalog_term',
        'effective_catalog', 'overlap_info', 'excluded_majors', 'notes', 'status', 'description'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for program in programs:
            notes = [n for n in program.get('notes', []) if len(n) > 40][:5]
            
            row = {
                'program_type': program.get('program_type', ''),
                'name': program.get('name', ''),
                'code': program.get('code', ''),
                'college': program.get('college', ''),
                'department': program.get('department', ''),
                'credit_hours': program.get('credit_hours', ''),
                'required_courses': '|'.join(sorted(program.get('required_courses', []))),
                'elective_courses': '|'.join(sorted(program.get('elective_courses', []))),
                'prerequisites': program.get('prerequisites', ''),
                'prerequisites_courses': '|'.join(sorted(program.get('prerequisites_courses', []))),
                'advisory_approval_required': 'Yes' if program.get('advisory_approval_required') else 'No',
                'up_to_date': program.get('up_to_date', ''),
                'effective_catalog_term': program.get('effective_catalog_term', ''),
                'effective_catalog': program.get('effective_catalog', ''),
                'overlap_info': program.get('overlap_info', ''),
                'excluded_majors': '|'.join(program.get('excluded_majors', [])),
                'notes': ' | '.join(notes),
                'status': program.get('status', ''),
                'description': program.get('description', '')[:1000]
            }
            writer.writerow(row)

if __name__ == '__main__':
    input_file = 'Programs 2026-01-28.csv'
    output_file = 'Programs_Minors_Certificates_Refined.csv'
    
    print("Parsing programs CSV (improved version)...")
    programs = parse_program_data(input_file)
    print(f"Found {len(programs)} minors/certificates")
    
    print("Writing refined CSV...")
    write_output_csv(programs, output_file)
    print(f"Output written to {output_file}")
    
    print("\nSummary:")
    print(f"  Programs with courses: {sum(1 for p in programs if p.get('required_courses') or p.get('elective_courses'))}")
    print(f"  Programs requiring advisory approval: {sum(1 for p in programs if p.get('advisory_approval_required'))}")
    print(f"  Programs with overlap info: {sum(1 for p in programs if p.get('overlap_info'))}")
