import cse from './cse.json';
import bba from './bba.json';
import custom from './custom.json';

export const CURRICULA = { cse, bba, custom };
export const PROGRAM_LIST = Object.values(CURRICULA);
export const getProgram = (id) => CURRICULA[id] ?? custom;
export const defaultCourses = (id, sem) => getProgram(id).semesters[String(sem)] ?? [];
