import bcrypt from 'bcryptjs';

const COST = 10; // ~100 ms on a serverless CPU: slow enough for attackers, fine for users
export const hashPassword = (password) => bcrypt.hash(password, COST);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
// Compared when the email is unknown, so "no such user" takes as long as "wrong password".
export const DUMMY_HASH = bcrypt.hashSync('lokkho-dummy-password', COST);
