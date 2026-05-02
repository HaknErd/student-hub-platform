export const RESOURCE_SUBJECTS = [
	'Maths',
	'Math AA',
	'Math AI',
	'Sciences',
	'Biology',
	'Chemistry',
	'Physics',
	'English',
	'Geography',
	'History',
	'Foreign Languages',
	'Business/Economics',
	'Psychology',
	'Computer Science',
	'Art',
	'Other'
] as const;

export const RESOURCE_YEAR_GROUPS = [8, 9, 10, 11, 12, 13] as const;

export const RESOURCE_COURSE_OPTIONS = [
	['', 'Any course'],
	['IGCSE', 'IGCSE'],
	['IB', 'IB'],
	['OTHER', 'Other']
] as const;

export const RESOURCE_LEVEL_OPTIONS = [
	['', 'Any level'],
	['HL', 'HL'],
	['SL', 'SL'],
	['OTHER', 'Other']
] as const;

export const RESOURCE_TYPE_OPTIONS = [
	['study_guide', 'Study guide'],
	['notes', 'Notes'],
	['past_paper_link', 'Past paper link'],
	['mark_scheme_link', 'Mark scheme link'],
	['worksheet', 'Worksheet'],
	['textbook', 'Textbook'],
	['syllabus', 'Syllabus'],
	['external_link', 'External link'],
	['video', 'Video'],
	['other', 'Other']
] as const;

export const RESOURCE_TYPE_OPTIONS_WITH_ANY = [
	['', 'Any purpose'],
	...RESOURCE_TYPE_OPTIONS
] as const;

export const RESOURCE_FORMAT_GROUP_OPTIONS = [
	['', 'Any group'],
	['documents', 'Documents'],
	['presentations', 'Presentations'],
	['spreadsheets', 'Spreadsheets'],
	['media', 'Media'],
	['links', 'Links']
] as const;

export const RESOURCE_FORMAT_OPTIONS = [
	['pdf', 'PDF'],
	['docx', 'DOCX'],
	['odt', 'ODT'],
	['txt', 'Text'],
	['rtf', 'RTF'],
	['pptx', 'PowerPoint'],
	['odp', 'OpenDocument presentation'],
	['xlsx', 'Excel'],
	['ods', 'OpenDocument spreadsheet'],
	['image', 'Image'],
	['video', 'Video'],
	['website', 'Website'],
	['youtube', 'YouTube'],
	['other', 'Other']
] as const;

export const RESOURCE_FORMAT_OPTIONS_WITH_ANY = [
	['', 'Any format'],
	...RESOURCE_FORMAT_OPTIONS
] as const;

export const RESOURCE_FORMAT_OPTIONS_WITH_AUTO = [
	['', 'Auto/unknown'],
	...RESOURCE_FORMAT_OPTIONS
] as const;
